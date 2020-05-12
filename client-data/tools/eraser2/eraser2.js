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

(function () { //Code isolation

	//Indicates the id of the circle the user is currently drawing or an empty string while the user is not drawing
	var curPathId = "",
		lastTime = performance.now(), //The time at which the last point was drawn
		end=false,
		erase=false;
	var curPen = {
		"penSize":4,
		"eraserSize":25
	};
	
	//The data of the message that will be sent for every new point
	function msg(x, y) {
		this.type="child";
		this.parent = curPathId;
		this.x = x-(Tools.showMarker?25:0);
		this.y = y-(Tools.showMarker?25:0);
	}


	function onStart(){
		curPen.penSize=Tools.getSize();
		Tools.setSize(curPen.eraserSize);
		Tools.showMarker=true;
	};

	function onQuit(){
		Tools.setSize(curPen.penSize);
		Tools.showMarker=false;
		var cursor = Tools.svg.getElementById("mycursor");
		if(cursor){
			cursor.remove();
		}
	};


	function startPath(x, y, evt) {

		//Prevent the press from being interpreted by the browser
		evt.preventDefault();

		Tools.suppressPointerMsg = true;
		erase=true;
		
		
		curPathId = Tools.generateUID("p"); //"p" for path
		Tools.drawAndSend({
			'type': 'erase',
			'id': curPathId,
			'size': Tools.getSize()
		});

		//Immediatly add a point to the path of circles
		continuePath(x, y);
		
	}

	function continuePath(x, y, evt) {
		/*Wait 20ms before adding any point to the currently drawing path. This allows the animation to be smother*/
		if (erase&&(performance.now() - lastTime > 100 || end)) {
			Tools.drawAndSend(new msg(x, y));
			lastTime = performance.now();
		}
		if (evt) evt.preventDefault();
	}

	function stopPath(x, y, evt) {
		//Add a last point to the path
		evt.preventDefault();
		end=true;
		continuePath(x, y);
		end=false;
		erase=false;
		curPathId = "";
		Tools.suppressPointerMsg = false;
	}

	function newLayer(){
		if(Tools.drawingEvent){
			Tools.drawingEvent=false;
			

			var newMask = Tools.createSVGElement("mask");
			newMask.id="mask-layer-"+(Tools.layer);
			newMask.setAttribute("class","masks");
			newMask.setAttribute("maskUnits","userSpaceOnUse");
			svg.getElementById("defs").appendChild(newMask);
			var rect = Tools.createSVGElement("rect");
			rect.setAttribute("x", "0");
			rect.setAttribute("y", "0");
			rect.setAttribute("width", "100%");
			rect.setAttribute("height", "100%");
			rect.setAttribute("fill", "white");
			newMask.appendChild(rect);
			Tools.group.style.mask = "url(#mask-layer-"+Tools.layer+")"
			Tools.layer++;
		
			var group = Tools.createSVGElement("g");
			group.id="layer-"+Tools.layer;
			svg.appendChild(group);
			group.appendChild(Tools.group);
			Tools.group=group;
			
			
		};
	};


	var renderPaths = {};
	function draw(data) {
		//deal with eraser records
		//Tools.eraserRecords.push({x:data['x'],y:data['y'],r:Tools.eraserCache[data.parent].size,mask:Tools.eraserCache[data.parent].layer});
		switch (data.type) {
			case "erase":		
				newLayer()
				Tools.eraserCache[data.id]={layer:Tools.layer-1,size:data.size,pts:[]};
				renderPaths[data.id]=createPath(data);
				if(data.pts){
					var pts = getPoints(renderPaths[data.id], data.pts);
					if(pts)renderPaths[data.id].setPathData(pts);
				}
				break;
			case "child":
				
				if(!Tools.eraserCache[data.parent]){
					console.error("Erase: Hmmm... I received a point of a path that has not been created (%s).", data.parent);
					return false;
				}
				var pts = getPoints(renderPaths[data.parent], [[data.x, data.y]], true);
				if(pts)renderPaths[data.parent].setPathData(pts);
				break;
			default:
				console.error("Eraser: Draw instruction with unknown type. ", data);
				break;
		}
	}


	function dist(x1, y1, x2, y2) {
		//Returns the distance between (x1,y1) and (x2,y2)
		return Math.hypot(x2 - x1, y2 - y1);
	}

	//var pathDataCache = {};
	function getPathData(line) {
		var pathData = Tools.eraserCache[line.id].pts;
		if (!pathData) {
			pathData = line.getPathData();
			Tools.eraserCache[line.id].pts = pathData;
		}
		return pathData;
	}

	var svg = Tools.svg;
	function getPoints(line, npts, single) {
		var pts = getPathData(line); //The points that are already in the line as a PathData
		for(var i = 0; i  < npts.length; i++){
			var npoint;
			var x = npts[i][0];
			var y = npts[i][1];
			var nbr = pts.length; //The number of points already in the line
			switch (nbr) {
				case 0: //The first point in the line
					//If there is no point, we have to start the line with a moveTo statement
					npoint = { type: "M", values: [x, y] };
					break;
				case 1: //There is only one point.
					//Draw a curve that is segment between the old point and the new one
					npoint = {
						type: "L", values: [
							x, y
						]
					};
					break;
				default: //There are at least two points in the line
					var prev_values = pts[nbr - 1].values; // Previous point
					var ante_values = pts[nbr - 2].values; // Point before the previous one
					var prev_x = prev_values[prev_values.length - 2];
					var prev_y = prev_values[prev_values.length - 1];
					var ante_x = ante_values[ante_values.length - 2];
					var ante_y = ante_values[ante_values.length - 1];


					//We don't want to add the same point twice consecutively
					if (!((prev_x == x && prev_y == y)
						|| (ante_x == x && ante_y == y))){
						npoint = {
							type: "L", values: [
								x, y
							]
						};
					}else{
						if(single)return false;
					}
			}
			if(npoint)pts.push(npoint);
		}
		return pts;
	}

	function createPath(data) {
		//Creates path on the canvas, one for each sub layer
		//for(var i = Tools.eraserCache[data.id].layer-1;i>0;i--){
			var path = Tools.createSVGElement("path")
			path.id=data.id;
			path.setAttribute("stroke", data.color || "black");
			path.setAttribute("stroke-width", data.size || 16);
			var mask =svg.getElementById("mask-layer-"+(Tools.eraserCache[data.id].layer));
			mask.appendChild(path);
			return path;
		//}
		
	}




	Tools.add({ //The new tool
		 "icon": "E",
		 "iconHTML":"<i style='color: #e75480;margin-top:7px' class='fas fa-eraser'></i>",
        	"name": '"Touch Up" Eraser',
		"listeners": {
			"press": startPath,
			"move": continuePath,
			"release": stopPath,
		},
		"draw": draw,
		"onstart":onStart,
		"onquit":onQuit,
		"isExtra":true,
		"mouseCursor": "crosshair",
		//"stylesheet": "tools/pencil/pencil.css"
	});

})(); //End of code isolation
