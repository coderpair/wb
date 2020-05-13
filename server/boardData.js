/**
 *                  WHITEBOPHIR SERVER
 *********************************************************
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2013-2014  Ophir LOJKINE
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
 * @module boardData
 */

var fs = require('fs')
, path = require("path")
, config = require("./configuration.js");


/**
 * Represents a board.
 * @constructor
 */
var BoardData = function (name) {
	this.name = name;
	this.size = 0;
	this.elements = {};
	this.file = path.join(config.HISTORY_DIR, "board-" + encodeURIComponent(name) + ".json");
	this.lastSaveDate = Date.now();
	this.actionHistory = [];
	this.actionHistory.push = function (){
		if (this.length >= config.MAX_UNDO_HISTORY) {
			this.shift();
		}
		return Array.prototype.push.apply(this,arguments);
	}
	this.undoHistory = [];
	this.userState = {};
	this.users = new Set();
	this.counter = 0;
};


/** Adds an element to the board 
 * @param {string} id - Element Identifier.
 * @param {object} data - Element data.
*/

BoardData.prototype.set = function (id, data) {
	//KISS
	var size;
	if(!(size = this.isValid(data, "data"))) return;
	this.elements[id]={size:size,data:data};
	this.size += size;
	this.actionHistory.push({type:'A',elem:this.elements[id]});
	this.undoHistory = [];
	this.stampAndSave(this.elements[id],true);
};

/** Adds a child to an element that is already in the board
 * @param {string} parentId - Identifier of the parent element.
 * @param {object} child - Object containing the the values to update.
*/
BoardData.prototype.addChild = function (parentId, child) {
	var parent = this.elements[parentId];
	if (typeof parent !== "object"){
		return;
	}
	var size;
	if(!(size = this.isValid(child, "child"))) return;
	parent.size += size;
	this.size += size;
	var data = parent.data
	if(data.type=="line"){
		if (Array.isArray(data.pts)) data.pts.push([child.x,child.y]);
		else data.pts = [[child.x,child.y]];
	}else{
		if (Array.isArray(data._children)) data._children.push(child);
		else data._children = [child];
	}
	this.stampAndSave(parent,(data.type != "erase"));
};


/** Update the data in the board
 *  When doing a bulk update, store an array of object id's to update in the id parameter.
 *  The function expects the updates for each object to be stored in an array called
 *  "updates". Attach a field called "gid" to message to identify the group operation.
 * 
 * If id is not an array, the function assumes you are updating a single object. In that
 * case, the fields to update will be attached directly to "message". //TODO maybe rework this
 * 
 * Attach a field called "undo" to message if you want your update to be undoable.
 * 
 * @param {string} id - Identifier of the data to update.
 * @param {object} message - Object containing the the values to update.
*/
BoardData.prototype.update = function (id, message) {

	var gid = message.gid;
	var undo = message.undo;
	var nostamp = message.nostamp || false;

	// get rid of some attributes that we don't want updated.
	delete message.id;
	delete message.gid;
	delete message.undo;
	delete message.nostamp;
				
	delete message.type;
	delete message.tool;
	delete message.tx;
	delete message.ty;
			
	if(Array.isArray(id)){ //Handle bulk update
		var newData = message.updates  
		var save = false;
		var oldData = [];
		var diff = [];
		var size = this.size;
		var ids = this.sortIds(id);
		for(var i = 0;i<ids.length;i++){
			var elem = this.elements[ids[i]];
			diff[i] = 0;
			oldData[i]={}
			if (typeof elem == "object"){
				var data = elem.data
				for (var j in newData[i]) {
					var sz;
					if(!(sz = this.isValid(message, "bulk-update", j, newData[i][j]))) return;
					diff[i] += sz - memorySizeOf( data[j] );
					if(data[j])
						oldData[i][j]=data[j];
				}
				save=true;
				if(size+diff[i]>config.MAX_BOARD_BYTES) return;
				size += diff[i];
			}
		}
		
		if(save){
			if(undo)
				this.updateActionList(ids, gid, newData,oldData, diff);
			for(var i = 0;i<ids.length;i++){
				var elem = this.elements[ids[i]];
				if (typeof elem == "object"){
					var data = elem.data;
					for (var j in newData[i]) {
						data[j]=newData[i][j];
					}
					elem.size += diff[i];
					this.size += diff[i];
					this.stampAndSave(elem,true)
				}
				
			}
		}
	}else{
		var newData=message;
		var elem = this.elements[id];
		if (typeof elem !== "object"){
			return;
		}
		var data = elem.data;
		var diff = 0;
		var oldData = {};
		for (var i in newData) {
			var sz;
			if(!(sz = this.isValid(message, "update", i, newData[i]))) return;
			diff += sz - memorySizeOf( data[i] )
			if(data[i])
				oldData[i]=data[i]
		}
		if(this.size+diff>config.MAX_BOARD_BYTES) return;
		if(undo)
			this.updateActionList(id, gid, newData, oldData, diff);
		for (var i in newData) {
			data[i] = newData[i];
		}
		elem.size += diff;
		this.size += diff;
		this.stampAndSave(elem,!nostamp);
	}

};


/** Removes data from the board
 * @param {string} id - Identifier of the data to delete.
 */
BoardData.prototype.delete = function (id) {
	//KISS
	if(Array.isArray(id)){  //Bulk delete
		var removed = [];
		for(var i = 0;i<id.length;i++){
			if(this.elements[id[i]]){
				removed.push(this.elements[id[i]]);
				this.size -= this.elements[id[i]].size;
				delete this.elements[id[i]];
			}
		}
		if(removed.length>0){
			this.actionHistory.push({type:'BR',elems:removed});
			this.undoHistory = [];
			this.delaySave();
		}
	}else{
		if(this.elements[id]){
			this.actionHistory.push({type:'R',elem:this.elements[id]});
			this.undoHistory = [];
			this.size -= this.elements[id].size;
			delete this.elements[id];
			this.delaySave();
		}
	}
};

/** Clears the board
 * @param none
 */
BoardData.prototype.clear = function () {
	//KISS
	if(Object.keys(this.elements).length === 0){
		return false;
	}else{
		this.actionHistory.push({type:'C',size: this.size, elems:this.elements});
		this.undoHistory = [];
		this.size=0;
		this.elements={};
		this.delaySave();
		return true;
	}
};

/** Undo 
 * @param none
 */
BoardData.prototype.undo = function () {
	//KISS
	if(this.actionHistory.length>0){
		var lastEvent = this.actionHistory.pop();
		this.undoHistory.push(lastEvent);
		switch(lastEvent.type){
			case "C":
				this.elements=lastEvent.elems;
				this.size = lastEvent.size;
				break;
			case "R":
				this.elements[lastEvent.elem.data.id]=lastEvent.elem;
				this.size += lastEvent.elem.size;
				break;
			case "A":
				delete this.elements[lastEvent.elem.data.id];
				this.size -= lastEvent.elem.size;
				break;
			case "BR":
				for(var i = 0;i<lastEvent.elems.length;i++){
					this.elements[lastEvent.elems[i].data.id]=lastEvent.elems[i];
					this.size += lastEvent.elems[i].size;
				}
				break;
			case "U":
				if(Array.isArray(lastEvent.id)){
					for(var i = 0;i<lastEvent.id.length;i++){
						var elem = this.elements[lastEvent.id[i]];
						if (typeof elem == "object"){
							elem.size -= lastEvent.diff[i];
							this.size -= lastEvent.diff[i];
							var data = elem.data;
							for (var j in lastEvent.newData[i]) {
								delete this.elements[lastEvent.id[i]].data[j]
							}
							for (var j in lastEvent.oldData[i]) {
								this.elements[lastEvent.id[i]].data[j]=lastEvent.oldData[i][j]
							}
						}
					}
				}else{
					this.elements[lastEvent.id].size -= lastEvent.diff;
					this.size -= lastEvent.diff;
					for (var i in lastEvent.newData) {
						delete this.elements[lastEvent.id].data[i]
					}
					for (var i in lastEvent.oldData) {
						this.elements[lastEvent.id].data[i]=lastEvent.oldData[i]
					}
				}
				break;
			default:
				break;
		}
			this.delaySave();
			return true;
	}
	return false;
};

/** Redo 
 * @param none
 */
BoardData.prototype.redo = function () {
	//KISS
	if(this.undoHistory.length>0){
		var lastEvent = this.undoHistory.pop();
		this.actionHistory.push(lastEvent);
		switch(lastEvent.type){
			case "C":
				this.elements = {};
				this.size = 0;
				break;
			case "A":
				this.elements[lastEvent.elem.data.id]=lastEvent.elem;
				this.size += lastEvent.elem.size;
				break;
			case "R":
				delete this.elements[lastEvent.elem.data.id];
				this.size -= lastEvent.elem.size;
				break;
			case "BR":
				for(var i = 0;i<lastEvent.elems.length;i++){
					delete this.elements[lastEvent.elems[i].data.id];
					this.size -= lastEvent.elems[i].size;
				}
				break;
			case "U":
				if(Array.isArray(lastEvent.id)){
					for(var i = 0;i<lastEvent.id.length;i++){
						var elem = this.elements[lastEvent.id[i]];
						if (typeof elem == "object"){
							elem.size += lastEvent.diff[i];
							this.size += lastEvent.diff[i];
							var data = elem.data;
							for (var j in lastEvent.newData[i]) {
								this.elements[lastEvent.id[i]].data[j]=lastEvent.newData[i][j]
							}
						}
					}
				}else{
					this.elements[lastEvent.id].size += lastEvent.diff;
					this.size += lastEvent.diff;
					for (var i in lastEvent.newData) {
						this.elements[lastEvent.id].data[i]=lastEvent.newData[i]
					}
				}
				break;
			default:
				break;
		}
		this.delaySave();
		return true;
	}
	return false;
};

/** Update action list
 * @param {string} id - Identifier of the element(s).
 * @param {string} gid- Group operation identifier
 * @param {object} newData - Object containing the the values to update.
 * @param {object} newData - Object containing the elements previous values.
 * @param {number} diff differne in size between new and old
 */
BoardData.prototype.updateActionList = function (id, gid, newData, oldData, diff) {

		var lastEvent = null
		for(var i = 0;i<this.actionHistory.length;i++){
			if(this.actionHistory[i].gid&&this.actionHistory[i].gid==gid){
				lastEvent=this.actionHistory[i];
				this.actionHistory.splice(i, 1);
				this.actionHistory.push(lastEvent);
			}
		}
		if(lastEvent){
			//Merge the changes
			if(Array.isArray(id)){
				for(var i = 0; i<id.length;i++){
					Object.assign(lastEvent.newData[i],newData[i]);
					Object.assign(oldData[i],lastEvent.oldData[i]);
					lastEvent.oldData[i] = oldData[i];
					lastEvent.diff[i]+=diff[i];
				}
			}else{
				Object.assign(lastEvent.newData,newData);
				Object.assign(oldData,lastEvent.oldData);
				lastEvent.oldData = oldData;
				lastEvent.diff+=diff;
			}
		}else{
			this.actionHistory.push({type:'U',id:id,gid:gid,newData:newData,oldData:oldData,diff:diff});
			this.undoHistory = [];
		}	

};


/**updateMsgCount
 * @param {string} id - Identifier of the socket id.
 */
BoardData.prototype.updateMsgCount = function (id) {
	//KISS
	if(!this.userState[id]){
		this.userState[id]={};
		this.userState[id].msgCount=1;
	}else{
		this.userState[id].msgCount++;
	}
};

/**getMsgCount
 * @param {string} id - Identifier of the socket id.
 */
BoardData.prototype.getMsgCount = function (id) {
	//KISS
	if(this.userState[id]&&this.userState[id].msgCount)
		return this.userState[id].msgCount;
	return 0;
};

/** Reads data from the board
 * @param {string} id - Identifier of the element to get.
 * @returns {object} The element with the given id, or undefined if no element has this id
 */
BoardData.prototype.get = function (id, children) {
	return this.elements[id].data;
};

/** Reads data from the board
 * @param {string} [id] - Identifier of the first element to get.
 * @param {BoardData~processData} callback - Function to be called with each piece of data read
 */
BoardData.prototype.getAll = function (id) {
	var batches = [];
	var elems = this.elements;
	var ids = Object.keys(elems);
	var sorted = this.sortIds(ids);
	while(sorted.length !== 0){
		var results = [];
		var batch = sorted.slice(0, config.BATCH_SIZE);
		sorted = sorted.slice(config.BATCH_SIZE);
		for (var i = 0; i < batch.length; i++){
			results.push(elems[batch[i]].data);
		}
		batches.push(results)
	}
	return batches;
};

/** Adds a user
 * @param {string} [userId] - Identifier of the user.
 */
BoardData.prototype.addUser = function addUser(userId) {

}

/**
 * This callback is displayed as part of the BoardData class.
 * Describes a function that processes data that comes from the board
 * @callback BoardData~processData
 * @param {object} data
 */

 /** Prepares for the saving of board data
 * @param {object} [data] - board data
 * .@param {boolean} [stamp] - should update the timestamp
 */
BoardData.prototype.stampAndSave = function(elem,stamp){
	//this.validate(data);
	if(stamp){
		elem.time = Date.now();
		elem.counter = this.counter++;
	}
	this.delaySave();
};


/** Delays the triggering of auto-save by SAVE_INTERVAL seconds
*/
BoardData.prototype.delaySave = function (file) {
	if (this.saveTimeoutId !== undefined) clearTimeout(this.saveTimeoutId);
	this.saveTimeoutId = setTimeout(this.save.bind(this), config.SAVE_INTERVAL);
	 if (Date.now() - this.lastSaveDate > config.MAX_SAVE_DELAY) setTimeout(this.save.bind(this), 0);		 	
	 if (Date.now() - this.lastSaveDate > config.MAX_SAVE_DELAY) setTimeout(this.save.bind(this), 0);
};

/** Saves the data in the board to a file.
 * @param {string} [file=this.file] - Path to the file where the board data will be saved.
*/
BoardData.prototype.save = function (file) {
	this.lastSaveDate = Date.now();
	this.clean();
	if(config.SAVE_BOARDS){  //TODO Need to updat this
		if (!file) file = this.file;
		var board_txt = JSON.stringify(this.elements);
		var that = this;
		fs.writeFile(file, board_txt, function onBoardSaved(err) {
			if (err) {
				console.trace(new Error("Unable to save the board: " + err));
			} else {
				console.log("Successfully saved board: " + that.name);
			}
		})
	}
};

/** Remove old elements from the board */
BoardData.prototype.clean = function cleanBoard() {
	var elems = this.elements;
	var ids = Object.keys(elems);
	//console.log("Objects in board: " + ids.length);
	if (ids.length > config.MAX_ITEM_COUNT) {
		var toDestroy = this.sortIds(ids).slice(0, -config.MAX_ITEM_COUNT);
		for (var i = 0; i < toDestroy.length; i++) delete elems[toDestroy[i]];
		console.log("Cleaned " + toDestroy.length + " items in " + this.name);
	}
}




/** isValid
 * @param {object} data Message data
 *  @param {string} type Message type
 * @param {string} key Key for field validation
 *  @param {object} value Obj for field validation
*/
BoardData.prototype.isValid = function isValid(data,type,key, value) {
	//console.log("Board Stats: Current size " + this.size);
	if(config.ENFORCE_BOARD_TEMPLATE){
		//TODO validate data based on Template
	}
	//For now...
	if(type=="data"){
		var size =  memorySizeOf(data);
		if(this.size + size > config.MAX_BOARD_BYTES){
			return 0;
		}else{
			return size;
		}
	}else if(type=="child"){
		var item = this.elements[data.parent];
		if (item.hasOwnProperty("_children")) {
			if (!Array.isArray(item._children)) item._children = [];
			if (item._children.length > config.MAX_CHILDREN) return 0;
		}
		if (item.hasOwnProperty("pts")) {
			if (item.pts.length > config.MAX_CHILDREN) return 0;
		}
		if(item.type=="line"){
			return memorySizeOf([data.x,data.y]);
		}else{
			return memorySizeOf(data);
		}
		
	}else{
		return memorySizeOf(value);
	}
}


// Seems unnecessary since most of these parameters are constrained at the client
/** Reformats an item if necessary in order to make it follow the boards' policy 
 * @param {object} item The object to edit
 * @param {object} parent The parent of the object to edit
*/
/*
BoardData.prototype.validate = function validate(item, parent) {
	if (item.hasOwnProperty("size")) {
		item.size = parseInt(item.size) || 1;
		item.size = Math.min(Math.max(item.size, 1), config.MAX_ITEM_SIZE);
	}
	if (item.hasOwnProperty("x") || item.hasOwnProperty("y")) {
		item.x = parseFloat(item.x) || 0;
		item.x = Math.min(Math.max(item.x, 0), config.MAX_BOARD_SIZE);
		item.x = Math.round(10 * item.x) / 10;
		item.y = parseFloat(item.y) || 0;
		item.y = Math.min(Math.max(item.y, 0), config.MAX_BOARD_SIZE);
		item.y = Math.round(10 * item.y) / 10;
	}
	if (item.hasOwnProperty("opacity")) {
		item.opacity = Math.min(Math.max(item.opacity, 0.1), 1) || 1;
		if (item.opacity === 1) delete item.opacity;
	}
	if (item.hasOwnProperty("_children")) {
		if (!Array.isArray(item._children)) item._children = [];
		if (item._children.length > config.MAX_CHILDREN) item._children.length = config.MAX_CHILDREN;
		for (var i = 0; i < item._children.length; i++) {
			this.validate(item._children[i]);
		}
	}
}
*/

/** Load the data in the board from a file.
 * @param {string} file - Path to the file where the board data will be read.
*/
BoardData.load = function loadBoard(name) {  //TODO need to update
	var boardData = new BoardData(name);
	return new Promise((accept) => {
		fs.readFile(boardData.file, function (err, data) {
			try {
				if (err) throw err;
				boardData.elements = JSON.parse(data);
				//for (id in boardData.elements) boardData.validate(boardData.board[id]);
				console.log(boardData.name + " loaded from file.");
			} catch (e) {
				if(config.SAVE_BOARDS)
				console.error("Unable to read history from " + boardData.file + ". The following error occured: " + e);
				console.log("Creating an empty board.");
				boardData.elements = {}
			}
			accept(boardData);
		});
	});
};

BoardData.prototype.sortIds = function sortIds(ids){
	var elems = this.elements;
	return ids.sort(function (x, y) {
		var a=0,b=0,c=0,d=0;
		if(elems[x]){
			a = elems[x].time | 0;
			c =  elems[x].counter | 0;
		}
		if(elems[y]){
			b = elems[y].time | 0;
			d =  elems[y].counter | 0;
		}
		return ( a == b && a > 0  ? c - d : a - b)
	})
};

function memorySizeOf(obj) {
    var bytes = 0;

    function sizeOf(obj) {
        if(obj !== null && obj !== undefined) {
            switch(typeof obj) {
            case 'number':
                bytes += 8;
                break;
            case 'string':
                bytes += obj.length * 2;
                break;
            case 'boolean':
                bytes += 4;
                break;
            case 'object':
                var objClass = Object.prototype.toString.call(obj).slice(8, -1);
                if(objClass === 'Object' || objClass === 'Array') {
                    for(var key in obj) {
                        if(!obj.hasOwnProperty(key)) continue;
                        sizeOf(obj[key]);
                    }
                } else bytes += obj.toString().length * 2;
                break;
            }
        }
        return bytes;
    };

    function formatByteSize(bytes) {
        return bytes;
        //else if(bytes < 1048576) return(bytes / 1024).toFixed(3) + " KiB";
        //else if(bytes < 1073741824) return(bytes / 1048576).toFixed(3) + " MiB";
        //else return(bytes / 1073741824).toFixed(3) + " GiB";
    };

    return formatByteSize(sizeOf(obj));
};

module.exports.BoardData = BoardData;
