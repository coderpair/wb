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

var Tools = {};
var svgWidth, svgHeight;



Tools.board = document.getElementById("board");
Tools.svg = document.getElementById("canvas");
Tools.group = Tools.svg.getElementById("layer-1");


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

Tools.menu_width=40;
Tools.scaleDefaults=[.4,.75,1,1.5,2,4,8];
Tools.scaleIndex = 2;


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
	//console.log( 'msg' );
	handleMessage(msg).then(function () {
		if(msg.type=='sync'){
			//console.log("sync");
			//console.log(Tools.msgs.length + "  " + msg.msgCount);
			if(Tools.msgs.length>msg.msgCount){
				for(var i = msg.msgCount;i<Tools.msgs.length;i++){
					Tools.msgs[i].curTool.draw(Tools.msgs[i].msg, true);
				}
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
Tools.board.addEventListener("mousemove", function(evt){
	var message = {
		"board": Tools.boardName,
		"data": {
			type:"cursor",
			x : evt.pageX / Tools.getScale(),
			y : evt.pageY / Tools.getScale()
		}
	}
	Tools.socket.emit('broadcast', message);
	if(Tools.showMarker){
		moveMarker(message.data);
	}
	
});



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



function moveCursor(message) {
	var cursor = Tools.svg.getElementById("cursor"+message.socket);
	if(!cursor){ 
		var cursors = Tools.svg.getElementsByClassName("opcursor");
		for(var i = 0; i < cursors.length; i++)
		{
   			cursors[i].remove()
		}
		Tools.svg.getElementById("cursors").innerHTML="<circle class='opcursor' id='cursor"+message.socket+"' cx='100' cy='100' r='10' fill='orange' />";
		cursor = Tools.svg.getElementById("cursor"+message.socket);
		Tools.svg.appendChild(cursor);
	}
	cursor.setAttributeNS(null, "cx", message.x);
     cursor.setAttributeNS(null, "cy", message.y);
};

Tools.clearBoard = function(deleteMsgs){
	Tools.showMarker = false;
	Tools.drawingEvent = true;
	Tools.eraserCache={};
	Tools.pathDataCache = {};
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
	var cursors = document.getElementById("cursors");
	var rect1 = document.getElementById("rect_1");
	Tools.svg.innerHTML="";
	Tools.svg.appendChild(defs);
	Tools.svg.appendChild(rect1);
	Tools.svg.appendChild(cursors);
	var group = Tools.createSVGElement("g");
	group.id="layer-"+Tools.layer;
	group.style.mask = "url(#mask-layer-"+Tools.layer+")"
	Tools.svg.appendChild(group);
	Tools.group = group;
};

Tools.HTML = {
	template: new Minitpl("#tools > .tool"),
	templateExtra: new Minitpl("#tool-list > .tool-extra"),
	addTool: function (toolName, toolIcon, toolIconFA, toolShortcut, isExtra) {
		var callback = function () {
			Tools.change(toolName);
		};
		window.addEventListener("keydown", function (e) {
			if (e.key === toolShortcut && !e.target.matches("input[type=text], textarea")) {
				Tools.change(toolName);
				document.activeElement.blur();
			}
		});
		var tmp = this.template;
		if(isExtra){
			tmp=this.templateExtra;
		}
		return tmp.add(function (elem) {
			elem.addEventListener("click", callback);
			elem.id = "toolID-" + toolName;
			
			if(toolIconFA){
				elem.getElementsByClassName("tool-icon")[0].innerHTML = toolIconFA;
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

	//Add the tool to the GUI
	Tools.HTML.addTool(newTool.name, newTool.icon, newTool.iconFA, newTool.shortcut,newTool.isExtra);

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
	Tools.msgs.push({curTool:Tools.curTool,msg:message});
	Tools.socket.emit('broadcast', message);
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
	if(message.type == "cursor"){
		moveCursor(message);
	}else if(message.type == "sync"){
		if(message.id == Tools.socket.id)Tools.acceptMsgs = true;
		//console.log("socket match:" + (message.id == Tools.socket.id));
		Tools.clearBoard(false);
	}
	if (message.tool) messageForTool(message);
	if (message._children) return batchCall(handleMessage, message._children);
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
			compiled["mousedown"] = compile(listeners.press);
			compiled["touchstart"] = compileTouch(listeners.press);
		}
		if (listeners.move) {
			compiled["mousemove"] = compile(listeners.move);
			compiled["touchmove"] = compileTouch(listeners.move);
		}
		if (listeners.release) {
			var release = compile(listeners.release),
				releaseTouch = compileTouch(listeners.release);
			compiled["mouseup"] = release;
			compiled["mouseleave"] = release;
			compiled["touchleave"] = releaseTouch;
			compiled["touchend"] = releaseTouch;
			compiled["touchcancel"] = releaseTouch;
		}
	}
];

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
	chooser.value = clrs[Math.random() * clrs.length | 0];
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
 	"onstart" : function(oldTool){...},
 	"onquit" : function(newTool){...},
 	"stylesheet" : "style.css",
}
*/