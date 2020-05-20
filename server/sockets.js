var iolib = require('socket.io')
	, BoardData = require("./boardData.js").BoardData
	, config = require("./configuration.js");


// Map from name to *promises* of BoardData
var boards = {};
var io;

function noFail(fn) {
	return function noFailWrapped(arg) {
		try {
			return fn(arg);
		} catch (e) {
			console.trace(e);
		}
	}
}

function startIO(app) {
	io = iolib(app);
	io.on('connection', noFail(socketConnection));
	return io;
}

/** Returns a promise to a BoardData with the given name*/
function getBoard(name) {
	if (boards.hasOwnProperty(name)) {
		return boards[name];
	} else {
		var board = BoardData.load(name);
		boards[name] = board;
		return board;
	}
}


function getConnectedSockets() {
	return Object.values(io.of("/").connected);
}

function socketConnection(socket) {

	function joinBoard(name) {
		// Default to the public board
		if (!name) name = "anonymous";

		// Join the board
		socket.join(name);

		return getBoard(name).then(board => {
			board.users.add(socket.id);
			console.log(new Date() + ": " + board.users.size + " users in " + board.name + ". Socket ID: "+socket.id);
			return board;
		});
	}

	socket.on("getboard", noFail(function onGetBoard(name) {
		joinBoard(name).then(board => {
			//Send all the board's data as soon as it's loaded
			var batches = board.getAll();
			socket.emit("broadcast", { _children: (batches[0] || []),_more:(batches.length>1),userCount:board.users.size});
			for(var i = 1; i < batches.length; i++){
				socket.emit("broadcast", { _children: batches[i],_more:(i!=batches.length-1) });
			}
			socket.broadcast.to(board.name).emit('broadcast', {userCount:board.users.size});
		});
	}));

	socket.on("joinboard", noFail(joinBoard));

	var lastEmitSecond = Date.now() / config.MAX_EMIT_COUNT_PERIOD | 0;
	var emitCount = 0;
	socket.on('broadcast', noFail(function onBroadcast(message) {
		var currentSecond = Date.now() / config.MAX_EMIT_COUNT_PERIOD | 0;
		if (currentSecond === lastEmitSecond) {
			emitCount++;
			if (emitCount > config.MAX_EMIT_COUNT) {
				var request = socket.client.request;
				console.log(JSON.stringify({
					event: 'banned',
					user_agent: request.headers['user-agent'],
					original_ip: request.headers['x-forwarded-for'] || request.headers['forwarded'],
					time: currentSecond,
					emit_count: emitCount
				}));
				socket.disconnect(true);
				return;
			}
		} else {
			emitCount = 0;
			lastEmitSecond = currentSecond;
		}

		var boardName = message.board || "anonymous";
		if (!socket.rooms.hasOwnProperty(boardName)) socket.join(boardName);

		getBoard(boardName).then(board => {
			
			var data = message.data;
			if (!data) {
				console.warn("Received invalid message: %s.", JSON.stringify(message));
				return;
			}
			handleMsg(board,data,socket)
		})
	}));

	socket.on('disconnecting', function onDisconnecting(reason) {
		Object.keys(socket.rooms).forEach(function disconnectFrom(room) {
			if (boards.hasOwnProperty(room)) {
				boards[room].then(board => {
					board.users.delete(socket.id);
					var userCount = board.users.size;
					console.log(userCount + " users in " + room + " Socket ID: " + socket.id);
					if (userCount === 0) {
						board.save();
						delete boards[room];
					}else{
						socket.broadcast.to(board.name).emit('broadcast', {userCount:board.users.size});
					}
				});
			}
		});
	});
}

function handleMsg(board, message, socket) {

	if(message.type != "c" && message.type != "e"){
		board.updateMsgCount(socket.id);
	}

	//Broadcast socket Id when displaying pointer so we know whose pointer it is.
	//Update and child events will also broadcast pointer location
	if(config.DISPLAY_POINTERS && (message.type == "c" || 
			(message.type == "update" && message.txt === undefined && message.data === undefined) || message.type == "child")){
				message.socket=socket.id;
	}

	if(message.type == "clear" || message.type == "undo" || message.type == "redo"){ 
		
		/*Actions requiring sync. There is no way to enforce order of events with a broadcast
		* system. Thus, it is possible that clients sometimes may see an inconsistent picture. 
		* The server itself, though, should maintain a consistent environment. When a client
		* calls "clear", "undo", or "redo", the server broadcasts its current state to all clients,
		* essentially causing a page refresh. This is done in an effort to maintain a degree of 
		* consistency between the clients that would be difficult to acheive by other means; 
		* however, it may, at least in the case of "undo" and "redo", be an expensive operation, 
		* especially for large boards with many users.
		*/

		var success = true;
		if(message.type == "clear"){
			success = board.clear();
		}else if(message.type == "undo"){
			success = board.undo();
		}else{
			success = board.redo();
		}
		if(success){
			var sockets = getConnectedSockets();
			sockets.forEach(function(s,i) {
				var batches = board.getAll();
				s.emit('broadcast', {type:'sync', id: socket.id, _children: (batches[0] || []),_more:(batches.length>1),msgCount:board.getMsgCount(s.id)});
				for(var i = 1; i < batches.length; i++){
					s.emit("broadcast", { _children: batches[i], subtype: 'sync', _more:(i!=batches.length-1),msgCount:board.getMsgCount(s.id)});
				}
			});
		}else if(message.type == "clear"){
			socket.emit("broadcast", {type: 'sync', id: socket.id,msgCount:board.getMsgCount(socket.id)});
		}
		
	}else{

		//Send message to all other users connected on the same board
		socket.broadcast.to(board.name).emit('broadcast', message);

		//Not going to save the socket
		delete message.socket;
		switch (message.type) {
			case "c":  //cursor
				break;
			case "e":  //echo
				break;
			case "delete":
				if (message.id) board.delete(message.id, socket.id);
				break;
			case "update":
				if (message.id) board.update(message.id, message, socket.id);
				break;
			case "child":
				board.addChild(message.parent, message, socket.id);
				break;
			default: //Add message
				if (!message.id) throw new Error("Invalid message: ", message);
				board.set(message.id, message, socket.id);

		}
	}
}

function generateUID(prefix, suffix) {
	var uid = Date.now().toString(36); //Create the uids in chronological order
	uid += (Math.round(Math.random() * 36)).toString(36); //Add a random character at the end
	if (prefix) uid = prefix + uid;
	if (suffix) uid = uid + suffix;
	return uid;
}


if (exports) {
	exports.start = startIO;
}
