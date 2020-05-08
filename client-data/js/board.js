/**
 *                        WHITEBOPHIR
 *********************************************************
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2013  Ophir LOJKINE
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend
 */

 //TODO Isolate this code...Expose one object
 //TODO naming: clean up global vars
 //TODO config file

var Tools = {};
var svgWidth, svgHeight;
var isTouchDevice = 'ontouchstart' in document.documentElement;

Tools.board = document.getElementById("board");
Tools.svg = document.getElementById("canvas");
Tools.group = Tools.svg.getElementById("layer-1");

Tools.compass = document.getElementById("compass");


//Initialization
Tools.curTool = null;
Tools.showMarker = false;
Tools.useLayers = true;
Tools.layer = 1;
Tools.drawingEvent = true;
Tools.pathDataCache = {};
Tools.eraserCache={};
Tools.acceptMsgs=true;
Tools.msgs = [];
Tools.menus = {};

Tools.menu_width=40;
Tools.scaleDefaults=[.4,.75,1,1.5,2,4,8];
Tools.scaleIndex = 2;
Tools.color = "red";
Tools.showOtherPointers = true;
Tools.showMyPointer = true;
Tools.suppressPointerMsg = false;
const MAX_CURSOR_UPDATES_PER_SECOND = 20;
const DISPLAY_ACTIVITY_MONITOR = true;

Tools.socket = null,
Tools.connect = function() {
  var self = this;
  if( self.socket ) {
    self.socket.destroy();
    delete self.socket;
    self.socket = null;
  }
  this.socket = io.connect(':8080', {
	"reconnection" : true,
	"reconnectionDelay": 100, //Make the xhr connections as fast as possible
	"timeout": 1000 * 60 * 20 // Timeout after 20 minutes
  });
  this.socket.on( 'connect', function () {
    console.log( 'connected to server' );
	Tools.clearBoard(true);
	//Get the board as soon as the page is loaded
	Tools.socket.emit("getboard", Tools.boardName);
  } );
  this.socket.on( 'disconnect', function () {
    //console.log( 'disconnected from server' );
    window.setTimeout( 'Tools.connect()', 20 );
  } );
  this.socket.on("broadcast", function (msg) {
	handleMessage(msg).then(function () {
		if(msg.type=='sync' && Tools.acceptMsgs){
			if(Tools.msgs.length>msg.msgCount){
				var msgs =Tools.msgs.slice(msg.msgCount);
				console.log("out of sync: " + JSON.stringify(msgs));
				handleMessage({_children: msgs});
			}
		}

	}).finally(function afterload() {
		var loadingEl = document.getElementById("loadingMessage");
		loadingEl.classList.add("hidden");
	});
  });
  this.socket.on("reconnect", function onReconnection() {
	Tools.clearBoard(true);
	Tools.socket.emit("getboard", Tools.boardName);

  });
}

$('#pleaseWaitDialog').modal();
Tools.connect();


Tools.boardName = (function () {
	var path = window.location.pathname.split("/");
	return path[path.length - 1];
})();


//Turn on the cursor tracking

//if(!isTouchDevice){
	Tools.svg.addEventListener("mousemove", handleMarker, false);
//}else{
	Tools.svg.addEventListener("touchmove", handleMarker,{ 'passive': false });
//}

var lastPointerUpdate = 0;
var cursorLastUse={};
var cursors={};
var transitions = [false,false,false,false];
var directions = [
	document.getElementById("north"),
	document.getElementById("east"),
	document.getElementById("south"),
	document.getElementById("west")];

var ptrMessage = {
	"board": Tools.boardName,
	"data": {
		type:"c"
	}
};

function handleMarker(evt){
	//evt.preventDefault();
	var cur_time = Date.now();
	if(Tools.showMyPointer && !Tools.suppressPointerMsg && lastPointerUpdate < cur_time - (1000/MAX_CURSOR_UPDATES_PER_SECOND) ){
		lastPointerUpdate = cur_time;
		ptrMessage.data.x = evt.pageX / Tools.getScale(),
		ptrMessage.data.y = evt.pageY / Tools.getScale(),
		ptrMessage.data.c = Tools.getColor()
			
		Tools.socket.emit('broadcast', ptrMessage);
	}
	if(Tools.showMarker){
		ptrMessage.data.x = evt.pageX / Tools.getScale(),
		ptrMessage.data.y = evt.pageY / Tools.getScale(),
		moveMarker(ptrMessage.data);
	}
	
};

function moveMarker(message) {
	var cursor = Tools.svg.getElementById("mycursor");
	if(!cursor){ 
		Tools.svg.getElementById("cursors").innerHTML="<circle class='opcursor' id='mycursor' cx='100' cy='100' r='10' fill='#e75480' />";
		cursor = Tools.svg.getElementById("mycursor");
	}
	
	Tools.svg.appendChild(cursor);
	//cursor.setAttributeNS(null, "r", Tools.getSize());
	cursor.r.baseVal.value=Tools.getSize()/2;
	cursor.setAttributeNS(null, "cx", message.x-25);
        cursor.setAttributeNS(null, "cy", message.y-25);
};

setInterval(function(){ 
	for(var i in cursors){
		if(Date.now()-cursorLastUse[cursors[i].id]>3000 && cursors[i].style.opacity!=.2){
			$(cursors[i]).fadeTo( 1500, .2 )
		}
	}
 }, 2000);

function movePointer(message) {
	var cursor = cursors["cursor"+message.socket];
	//var cursor = document.getElementById("cursor"+message.socket);
	if(!cursor){ 
		var cursorList = Tools.svg.getElementsByClassName("opcursor");
		//var cursors = document.getElementsByClassName("opcursor");
		for(var i = 0; i < cursorList.length; i++)
		{
			if(Date.now()-cursorLastUse["cursor"+message.socket]>180000){
				cursors[cursorList[i].id].remove();
				delete cursors[cursorList[i].id];
			}else{
				cursorList[i].setAttributeNS(null, "visibility", "hidden");
			}
		}
		Tools.svg.getElementById("cursors").innerHTML="<circle class='opcursor' id='cursor"+message.socket+"' cx='0' cy='0' r='10' fill='orange' />";
		//$(Tools.board).append("<div style='width:20px;height:20px' class='opcursor' id='cursor"+message.socket+"'><svg><circle cx='10' cy='10' r='10' fill='orange'></circle></svg></div>");
		//cursor = document.getElementById("cursor"+message.socket)
		
		cursor = Tools.svg.getElementById("cursor"+message.socket);
		Tools.svg.appendChild(cursor);
		cursors["cursor"+message.socket]= cursor;
	}
	if(message.c)
		cursor.setAttributeNS(null, "fill", message.c);
	cursor.setAttributeNS(null, "visibility", "visible");
	$(cursor).stop(true);
	cursor.style.opacity = .75;
	//cursor.style.visibility = "visible"
	//cursor.style.transform = "translate(" + (message.tx || message.x2 || message.x) + "px, " +  (message.ty || message.y2 || message.y) + "px)";
	cursor.setAttributeNS(null, "cx", message.tx || message.x2 || message.x);
	cursor.setAttributeNS(null, "cy", message.ty || message.y2 || message.y);

	// Activity monitor
	if(DISPLAY_ACTIVITY_MONITOR){
		updateActivityMonitor(cursor);
	}
	cursorLastUse["cursor"+message.socket]=Date.now()
};

function updateActivityMonitor(cursor){
	var bounding = cursor.getBoundingClientRect();
	var region = [0,0,0,0]; //t r b l
	if (bounding.top < -20){
		region[0] = 1;
		region[2] = 0;
	}else if(bounding.bottom > 20 + (window.innerHeight || document.documentElement.clientHeight)){
		region[2] = 1;
		region[0] = 0;
	}
	
	if(bounding.left < -20){
		region[3] = 1;
		region[1] = 0;
	}else if(bounding.right > 20 + (window.innerWidth || document.documentElement.clientWidth)){
		region[3] = 0;
		region[1] = 1;
	}
	
	if(region[0]+region[1]+region[2]+region[3]) {
		$(Tools.compass).fadeIn();
		for(var i = 0; i < 4; i++){
			if(!region[i]){
				$(directions[i]).css({'opacity' : '0.15'});
			}
			if(!transitions[i]&&region[i]){
				$(directions[i]).css({'opacity' : '1'});
				transitions[i] = true;
				((elem,i) => {
					elem.fadeTo(100,.4,function(){
						elem.fadeTo(100,1,function(){
								transitions[i] = false;
						})
					});
				})($(directions[i]),i);
			}
		}
		//console.log('Not in the viewport..');
	} else {
		//console.log('In the viewport!');
		$(Tools.compass).stop(true);
		$(Tools.compass).fadeOut();
	}
}

Tools.clearBoard = function(deleteMsgs){
	Tools.showMarker = false;
	Tools.drawingEvent = true;
	Tools.eraserCache={};
	Tools.pathDataCache = {};
	lastPointerUpdate = 0;
	cursorLastUse={};
	cursors={};
	if(deleteMsgs){
		Tools.msgs = [];
		Tools.acceptMsgs=true;
	}
	Tools.layer = 1;
	var masks = document.getElementsByClassName('masks');
	while(masks[0]) {
    		masks[0].parentNode.removeChild(masks[0])
	};
	var defs = document.getElementById("defs");
	var cursorGroup = document.getElementById("cursors");
	var rect1 = document.getElementById("rect_1");
	Tools.svg.innerHTML="";
	Tools.svg.appendChild(defs);
	Tools.svg.appendChild(rect1);
	Tools.svg.appendChild(cursorGroup);
	var group = Tools.createSVGElement("g");
	group.id="layer-"+Tools.layer;
	//group.style.mask = "url(#mask-layer-"+Tools.layer+")"
	Tools.svg.appendChild(group);
	Tools.group = group;
};

Tools.HTML = {
	template: new Minitpl("#tools > .tool"),
	templateExtra: new Minitpl("#tool-list > .tool-extra"),
	addTool: function (toolName, toolIcon, toolIconHTML, isExtra, oneTouch, menu) {
		var callback;
		
		if(oneTouch){
			callback = function (evt) {
				Tools.onClick(toolName,evt);
			};
		}else{
			callback = function () {
				Tools.change(toolName);
			};
		}
		var tmp = this.template;
		if(isExtra){
			tmp=this.templateExtra;
		}
		return tmp.add(function (elem) {
			elem.addEventListener("click", callback);
			elem.id = "toolID-" + toolName;
			if(oneTouch) elem.classList.add("oneTouch");
			if(menu) {
				Tools.menus[toolName]={};
				var container = `<div class="popover menu fade show bs-popover-right" 
					id="popover-` + toolName + `" 
					x-placement="right" 
					style="position: fixed; display:none; will-change: transform; top: 0px; left: 0px; transform: translate3d(0px, 0px, 0px);">` +
						(menu.title?`<h3 class="popover-header">` + menu.title + `</h3>`:``) +
						`<div class="popover-body">`
					 		+ menu.content +
						`</div>
					</div>`;
				document.getElementById("template").innerHTML = container;
				Tools.menus[toolName].menu = document.getElementById("popover-"+toolName);
				document.body.appendChild(Tools.menus[toolName].menu);
				
				 (function(){

					var hidden = true;

					//TOGGLE MENU
					Tools.menus[toolName].show = function(show) {
						if(!show){
								$(Tools.menus[toolName].menu).hide();
								hidden = true;
								document.getElementById("menu").removeEventListener(
									'scroll',
									handleScroll,
									false
								);
								document.removeEventListener("mousedown", listen, true);
								document.removeEventListener("touchstart", listen, true);
							
						}else{
							var scrollTop = document.getElementById("menu").scrollTop;
							Tools.menus[toolName].y = Math.max(10, $(elem).position().top +scrollTop - $(Tools.menus[toolName].menu).height()/2 + 30);
							Tools.menus[toolName].menu.style.transform = "translate3d(50px,  "+ (-scrollTop + Tools.menus[toolName].y) + "px, 0px)";
							$(Tools.menus[toolName].menu).show();
							hidden = false;
							document.getElementById("menu").addEventListener(
								'scroll',
								handleScroll,
								false
							);
							//if(!isTouchDevice){
								document.addEventListener("mousedown", listen , true);
							//}else{
								document.addEventListener("touchstart", listen , true);
							//}
						}
					};

					Tools.menus[toolName].menuOpen = function(){return !hidden};

					//HANDLE SCROLLING
					var handleScroll = function(){
						Tools.menus[toolName].menu.style.transform = "translate3d(50px,  "+ (-this.scrollTop + Tools.menus[toolName].y) + "px, 0px)";
					};

					 // Hide menu
			 		var listen  = function(e) {
						 var onButton = true;
						 var onMenu = true;
						if (e.target.id != elem.id && !$(elem).find(e.target).length) 
							onButton = false;
						if(!(e.target.id && e.target.id == 'popover-'+toolName) && !$('#popover-'+toolName).find(e.target).length)
							onMenu = false;
							//console.log(onMenu + ' ' + onButton);
						if(menu.listener(elem, onButton, onMenu, e)){
							Tools.menus[toolName].show(false);
							document.removeEventListener("mousedown", listen , true);
							document.removeEventListener("touchstart", listen ,true);
							hidden = true;
						}
					};
				}());

			}
			if(toolIconHTML){
				elem.getElementsByClassName("tool-icon")[0].innerHTML = toolIconHTML;
			}else{
				elem.getElementsByClassName("tool-icon")[0].textContent = toolIcon;
			}
			elem.title =
				Tools.i18n.t(toolName) + (Tools.list[toolName].toggle?"  Click to toggle":"");
		});
	},
	changeTool: function (oldToolName, newToolName) {
		var oldTool = document.getElementById("toolID-" + oldToolName);
		var newTool = document.getElementById("toolID-" + newToolName);
		if (oldTool) oldTool.classList.remove("curTool");
		if (newTool) newTool.classList.add("curTool");
	},
	addStylesheet: function (href) {
		//Adds a css stylesheet to the html or svg document
		var link = document.createElement("link");
		link.href = href;
		link.rel = "stylesheet";
		link.type = "text/css";
		document.head.appendChild(link);
	}
};

Tools.list = {}; // An array of all known tools. {"toolName" : {toolObject}}

Tools.add = function (newTool) {
	if (newTool.name in Tools.list) {
		console.log("Tools.add: The tool '" + newTool.name + "' is already" +
			"in the list. Updating it...");
	}

	//Format the new tool correctly
	Tools.applyHooks(Tools.toolHooks, newTool);

	//Add the tool to the list
	Tools.list[newTool.name] = newTool;

	if (newTool.stylesheet) {
		Tools.HTML.addStylesheet(newTool.stylesheet);
	}

	if(newTool.shortcuts){
		Tools.applyShortcuts(newTool.shortcuts,newTool.name);
	}

	//Add the tool to the GUI
	Tools.HTML.addTool(newTool.name, 
		newTool.icon, 
		newTool.iconHTML, 
		newTool.isExtra,
		newTool.oneTouch,
		newTool.menu);

	//There may be pending messages for the tool
	var pending = Tools.pendingMessages[newTool.name];
	if (pending) {
		console.log("Drawing pending messages for '%s'.", newTool.name);
		var msg;
		while (msg = pending.shift()) {
			//Transmit the message to the tool (precising that it comes from the network)
			newTool.draw(msg, false);
		}
	}
};

Tools.onClick = function (toolName,evt) {

	if (!(toolName in Tools.list)) {
		throw new Error("Trying to select a tool that has never been added!");
	}

	var tool = Tools.list[toolName];

	//Do something with the GUI

	//Call the start callback of the new tool 
	tool.onstart(evt);
};

Tools.change = function (toolName) {
	if (!(toolName in Tools.list)) {
		throw new Error("Trying to select a tool that has never been added!");
	}

	var newtool = Tools.list[toolName];

	//Update the GUI
	var curToolName = (Tools.curTool) ? Tools.curTool.name : "";
	try {
		Tools.HTML.changeTool(curToolName, toolName);
	} catch (e) {
		console.error("Unable to update the GUI with the new tool. " + e);
	}
	Tools.svg.style.cursor = newtool.mouseCursor || "auto";
	Tools.board.title = Tools.i18n.t(newtool.helpText || "");

	//There is not necessarily already a curTool
	if (Tools.curTool !== null) {
		//It's useless to do anything if the new tool is already selected
		if (newtool === Tools.curTool){
			if(newtool.toggle){
				var elem = document.getElementById("toolID-" + newtool.name);
				newtool.toggle(elem);
			}
			return;
		}
		//Remove the old event listeners
		for (var event in Tools.curTool.compiledListeners) {
			var listener = Tools.curTool.compiledListeners[event];
			Tools.svg.removeEventListener(event, listener);
		}

		//Call the callbacks of the old tool
		Tools.curTool.onquit(newtool);
	}

	//Add the new event listeners
	for (var event in newtool.compiledListeners) {
		var listener = newtool.compiledListeners[event];
		Tools.svg.addEventListener(event, listener, { 'passive': false });
	}

	//Call the start callback of the new tool 
	newtool.onstart(Tools.curTool);
	Tools.curTool = newtool;
};

Tools.send = function (data, toolName) {
	toolName = toolName || Tools.curTool.name;
	var d = data;
	d.tool = toolName;
	Tools.applyHooks(Tools.messageHooks, d);
	var message = {
		"board": Tools.boardName,
		"data": d
	}
	Tools.socket.emit('broadcast', message);
	// dont save cursor or echo messages
	if(message.data.type != "c" && message.data.type != "e"){
		//Dont save multiple updates for the same id or group
		if(message.data.type == "update" && Tools.msgs.length && Tools.msgs[Tools.msgs.length-1].type =="update"){
			if((message.data.gid &&
				(Tools.msgs[Tools.msgs.length-1].gid == message.data.gid)) ||
				(message.data.id && !Array.isArray(message.data.id) &&
					(Tools.msgs[Tools.msgs.length-1].id == message.data.id))){
						Tools.msgs.pop();
						Tools.msgs.push(0);
						Tools.msgs.push(message.data);
						return;
			}
		}
		Tools.msgs.push(message.data);
	}
	
};

Tools.drawAndSend = function (data) {
	Tools.curTool.draw(data, true);
	Tools.send(data);
};

//Object containing the messages that have been received before the corresponding tool
//is loaded. keys : the name of the tool, values : array of messages for this tool
Tools.pendingMessages = {};

// Send a message to the corresponding tool
function messageForTool(message) {
	var name = message.tool,
		tool = Tools.list[name];
	if (tool) {
		Tools.applyHooks(Tools.messageHooks, message);
		tool.draw(message, false);
	} else {
		///We received a message destinated to a tool that we don't have
		//So we add it to the pending messages
		if (!Tools.pendingMessages[name]) Tools.pendingMessages[name] = [message];
		else Tools.pendingMessages[name].push(message);
	}
}

// Apply the function to all arguments by batches
function batchCall(fn, args) {
	var BATCH_SIZE = 1024;
	if (args.length === 0) {
		return Promise.resolve();
	} else {
		var batch = args.slice(0, BATCH_SIZE);
		var rest = args.slice(BATCH_SIZE);
		return Promise.all(batch.map(fn))
			.then(function () {
				return new Promise(requestAnimationFrame);
			}).then(batchCall.bind(null, fn, rest));
	}
}

// Call messageForTool recursively on the message and its children
function handleMessage(message) {
	//Check if the message is in the expected format
	if(!message)return;
	//TODO: Right now if you are sending the socket id it is to identify the cursor
	//and move it. CHange later
	if((message.type == "c" || message.socket) && Tools.showOtherPointers){
		movePointer(message);
	}
	if(message.type == "sync"){
		if(message.id == Tools.socket.id)Tools.acceptMsgs = true;
		if (Tools.acceptMsgs)Tools.clearBoard(false);
	}
	if (message.tool && Tools.acceptMsgs) messageForTool(message);
	if (message._children && Tools.acceptMsgs) return batchCall(handleMessage, message._children);
	else return Promise.resolve();
}
/*
//Receive draw instructions from the server
Tools.socket.on("broadcast", function (msg) {
	handleMessage(msg).finally(function afterload() {
		var loadingEl = document.getElementById("loadingMessage");
		loadingEl.classList.add("hidden");
		if(msg.type=='sync'){
			if(Tools.msgs.length>msg.msgCount){
				for(var i = msg.msgCount;i<Tools.msgs.length;i++){
					Tools.msgs[i].curTool.draw(Tools.msgs[i].msg, true);
				}
			}
		}
	});
});

Tools.socket.on("disconnect", function onDisconnection() {
	Tools.socket = io.connect('', {
	"reconnection" : true,
    	"forceNew" : true,
	"reconnectionDelay": 100, //Make the xhr connections as fast as possible
	"timeout": 1000 * 60 * 20 // Timeout after 20 minutes
	});
	//Get the board as soon as the page is loaded
	Tools.socket.emit("getboard", Tools.boardName);
});

*/
Tools.unreadMessagesCount = 0;
Tools.newUnreadMessage = function () {
	Tools.unreadMessagesCount++;
	updateDocumentTitle();
};

window.addEventListener("focus", function () {
	Tools.unreadMessagesCount = 0;
	updateDocumentTitle();
});

function updateDocumentTitle() {
	
}

(function () {
	// Scroll and hash handling
	var scrollTimeout, lastStateUpdate = Date.now();

	window.addEventListener("scroll", function onScroll() {
		var x = window.scrollX / Tools.getScale(),
			y = window.scrollY / Tools.getScale();

		clearTimeout(scrollTimeout);
		scrollTimeout = setTimeout(function updateHistory() {
			var hash = '#' + (x | 0) + ',' + (y | 0) + ',' + Tools.getScale().toFixed(2);
			if (Date.now() - lastStateUpdate > 5000 && hash != window.location.hash) {
				window.history.pushState({}, "", hash);
				lastStateUpdate = Date.now();
			} else {
				window.history.replaceState({}, "", hash);
			}
		}, 100);
	});

	function setScrollFromHash() {
		var coords = window.location.hash.slice(1).split(',');
		var x = coords[0] | 0;
		var y = coords[1] | 0;
		var scale = parseFloat(coords[2]);
		resizeCanvas({ x: x, y: y });
		if (Tools.list["Zoom In"]) {
			Tools.scaleIndex = 2;
			for(var i = 0; i < Tools.scaleDefaults.length;i++){
				if(Tools.scaleDefaults[i]==scale)Tools.scaleIndex = i;
			}
			scale=Tools.scaleDefaults[Tools.scaleIndex]
		}
		Tools.setScale(scale);
		window.scrollTo(x * scale, y * scale);
	}

	window.addEventListener("hashchange", setScrollFromHash, false);
	window.addEventListener("popstate", setScrollFromHash, false);
	window.addEventListener("DOMContentLoaded", setScrollFromHash, false);
})();

//List of hook functions that will be applied to messages before sending or drawing them
function resizeCanvas(m) {
	//Enlarge the canvas whenever something is drawn near its border
	var x = m.x | 0, y = m.y | 0
	var MAX_BOARD_SIZE = 65536; // Maximum value for any x or y on the board
	if (x > Tools.svg.width.baseVal.value - 2000) {
		//Tools.svg.width.baseVal.value = Math.min(x + 2000, MAX_BOARD_SIZE);
	}
	if (y > Tools.svg.height.baseVal.value - 2000) {
		//Tools.svg.height.baseVal.value = Math.min(y + 2000, MAX_BOARD_SIZE);
	}
}

function updateUnreadCount(m) {
	if (document.hidden && ["child", "update"].indexOf(m.type) === -1) {
		Tools.newUnreadMessage();
	}
}

Tools.messageHooks = [updateUnreadCount];

Tools.scale = 1.0;
var scaleTimeout = null;
Tools.setScale = function setScale(scale) {
	if (isNaN(scale)) scale = 1;
	scale = Math.max(0.4, Math.min(10, scale));
	Tools.svg.style.willChange = 'transform';
	//Tools.svg.style.transform = 'scale(' + scale + ')';
	//svg.setAttributeNS(null, "width", svgWidth * percent);
	//svg.setAttributeNS(null, "height", svgHeight * percent);
	
	
        Tools.svg.width.baseVal.value = svgWidth*scale;// Tools.svg.width.baseVal.value/scale;
	Tools.svg.height.baseVal.value = svgHeight*scale;//Tools.svg.height.baseVal.value/scale;
	Tools.svg.setAttributeNS(null, "viewBox", "0 0 " + svgWidth + " " + svgHeight);
	clearTimeout(scaleTimeout);
	scaleTimeout = setTimeout(function () {
		Tools.svg.style.willChange = 'auto';
	}, 1000);
	Tools.scale = scale; 
	return scale;
}
Tools.getScale = function getScale() {
	return Tools.scale;
}

//List of hook functions that will be applied to tools before adding them
Tools.toolHooks = [
	function checkToolAttributes(tool) {
		if (typeof (tool.name) !== "string") throw "A tool must have a name";
		if (typeof (tool.listeners) !== "object") {
			tool.listeners = {};
		}
		if (typeof (tool.onstart) !== "function") {
			tool.onstart = function () { };
		}
		if (typeof (tool.onquit) !== "function") {
			tool.onquit = function () { };
		}
		if (tool.menu && typeof (tool.menu.listener) !== "function") {
			tool.menu.listener = function () { };
		}
	},
	function compileListeners(tool) {
		//compile listeners into compiledListeners
		var listeners = tool.listeners;
		//A tool may provide precompiled listeners
		var compiled = tool.compiledListeners || {};
		tool.compiledListeners = compiled;

		function compile(listener) { //closure
			return (function listen(evt) {
				var x = evt.pageX / Tools.getScale(),
					y = evt.pageY / Tools.getScale();
				return listener(x, y, evt, false);
			});
		}

		function compileTouch(listener) { //closure
			return (function touchListen(evt) {
				//Currently, we don't handle multitouch
				if (evt.changedTouches.length === 1) {
					//evt.preventDefault();
					var touch = evt.changedTouches[0];
					var x = touch.pageX / Tools.getScale(),
						y = touch.pageY / Tools.getScale();
					return listener(x, y, evt, true);
				}
				return true;
			});
		}

		if (listeners.press) {
			//if(!isTouchDevice){
				compiled["mousedown"] = compile(listeners.press);
			//}else{
				compiled["touchstart"] = compileTouch(listeners.press);
			//}
		}
		if (listeners.move) {
			//if(!isTouchDevice){
				compiled["mousemove"] = compile(listeners.move);
			//}else{
				compiled["touchmove"] = compileTouch(listeners.move);
			//}
		}
		if (listeners.release) {
			var release = compile(listeners.release),
				releaseTouch = compileTouch(listeners.release);
			//if(!isTouchDevice){
				compiled["mouseup"] = release;
				compiled["mouseleave"] = release;
			//}else{
				compiled["touchleave"] = releaseTouch;
				compiled["touchend"] = releaseTouch;
				compiled["touchcancel"] = releaseTouch;
			//}
		}
	}
];

var shortcutsInit = false;
Tools.applyShortcuts = function(shortcuts,toolName){
	if(!shortcutsInit){
		Tools.shortcuts = {
			changeToolList : [],
			actionList : []
		}
		window.addEventListener("keydown", function (e) {
			for(var i = 0; i < Tools.shortcuts.changeToolList.length; i++){
				if (e.key === Tools.shortcuts.changeToolList[i].key && !$(e.target).is("textarea,input[type=text]")) {
					Tools.change(Tools.shortcuts.changeToolList[i].toolName);
					document.activeElement.blur();
				}
			}
			for(var i = 0; i<Tools.shortcuts.actionList.length;i++){
				var keys = Tools.shortcuts.actionList[i].key.split("-");
				var key = "";
				var pass = true;
				if(keys[0]=="shift"){
					key = keys[1];
					pass = event.shiftKey;
				}else{
					key = keys[0];
				}
				if (pass && e.key === key && !$(e.target).is("textarea,input[type=text]")) {
					Tools.shortcuts.actionList[i].action();
				}
			}
		})
		
		shortcutsInit = true;
	}
	if(shortcuts.changeTool)
		Tools.shortcuts.changeToolList.push({"toolName":toolName,"key":shortcuts.changeTool});
	if(shortcuts.actions){
		for(var i = 0;i<shortcuts.actions.length;i++){
			Tools.shortcuts.actionList.push(shortcuts.actions[i]);
		}
	}
};

Tools.applyHooks = function (hooks, object) {
	//Apply every hooks on the object
	hooks.forEach(function (hook) {
		hook(object);
	});
};


// Utility functions

Tools.generateUID = function (prefix, suffix) {
	var uid = Date.now().toString(36); //Create the uids in chronological order
	uid += (Math.round(Math.random() * 36)).toString(36); //Add a random character at the end
	if (prefix) uid = prefix + uid;
	if (suffix) uid = uid + suffix;
	return uid;
};

Tools.createSVGElement = function (name) {
	return document.createElementNS(Tools.svg.namespaceURI, name);
};

Tools.positionElement = function (elem, x, y) {
	elem.style.top = y + "px";
	elem.style.left = x + "px";
};

Tools.getColor = (function color() {
	var chooser = document.getElementById("chooseColor");
	// Init with a random color
	var clrs = ["#001f3f", "#0074D9", "#7FDBFF", "#39CCCC", "#3D9970",
		"#2ECC40", "#01FF70", "#FFDC00", "#FF851B", "#FF4136",
		"#85144b", "#F012BE", "#B10DC9", "#111111", "#AAAAAA"];
	var value = chooser.value = clrs[Math.random() * clrs.length | 0];
	return function () { return chooser.value; };
})();

Tools.setSize = (function size() {
	var chooser = document.getElementById("chooseSize");
	var sizeIndicator = document.getElementById("sizeIndicator");

	function update() {
		chooser.value = Math.max(1, Math.min(50, chooser.value | 0));
		sizeIndicator.r.baseVal.value = chooser.value;
	}
	update();

	chooser.onchange = chooser.oninput = update;
	return function (value) { chooser.value=value; update()};
})();

Tools.getSize = (function size() {
	var chooser = document.getElementById("chooseSize");
	return function () { return chooser.value; };
})();

Tools.getOpacity = (function opacity() {
	var chooser = document.getElementById("chooseOpacity");
	var opacityIndicator = document.getElementById("opacityIndicator");

	function update() {
		opacityIndicator.setAttribute("opacity", chooser.value);
	}
	update();

	chooser.onchange = chooser.oninput = update;
	return function () {
		return Math.max(0.1, Math.min(1, chooser.value));
	};
})();

Tools.i18n = (function i18n() {
	var translations = JSON.parse(document.getElementById("translations").text);
	return {
		"t": function translate(s) {
			return translations[s] || s;
		}
	};
})();


//Scale the canvas on load
var screenWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
var screenHeight =  Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
svgWidth = Tools.svg.width.baseVal.value = Math.max(screenWidth + 2000, screenWidth * 2.5);
svgHeight = Tools.svg.height.baseVal.value =  Math.max(screenHeight + 2000, screenHeight * 2.5);

Tools.svg.setAttributeNS(null, "viewBox", "0 0 " + svgWidth + " " + svgHeight);


/***********  Polyfills  ***********/
if (!window.performance || !window.performance.now) {
	window.performance = {
		"now": Date.now
	}
}
if (!Math.hypot) {
	Math.hypot = function (x, y) {
		//The true Math.hypot accepts any number of parameters
		return Math.sqrt(x * x + y * y);
	}
}

if (typeof Array.isArray === 'undefined') {
	Array.isArray = function(obj) {
	  return Object.prototype.toString.call(obj) === '[object Array]';
	}
};

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}

function arrayContains(arr, searchFor){
    if(typeof arr.includes == 'undefined'){
        var arrLength = arr.length;
        for (var i = 0; i < arrLength; i++) {
            if (arr[i] === searchFor) {
                return true;
            }
        }
        return false;
    }
    return arr.includes(searchFor);
}


/**
 What does a "tool" object look like?
 newtool = {
 	"name" : "SuperTool",
 	"listeners" : {
 		"press" : function(x,y,evt){...},
 		"move" : function(x,y,evt){...},
  		"release" : function(x,y,evt){...},
 	},
 	"draw" : function(data, isLocal){
 		//Print the data on Tools.svg
	 },
	 "shortcuts": {
		"changeTool":"c",
		"actions":[{"key":"z","action":keyZoomIn}]
	},
	"menu":{
		"title": 'Shapes',
		"content": `<div class="tool-extra submenu-rect" id="submenu-rect-Circle">
						<span class="tool-icon">◯</span>
					</div>
					<div class="tool-extra submenu-rect" id="submenu-rect-Ellipse">
						<span class="tool-icon">` + icons["Ellipse"].icon + `</span>
					</div>`,
		"listener": menuListener
	},
 	"onstart" : function(oldTool){...},
 	"onquit" : function(newTool){...},
 	"stylesheet" : "style.css",
}
*/