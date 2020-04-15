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
		"eraserSize":16
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
	};


	function startPath(x, y, evt) {

		//Prevent the press from being interpreted by the browser
		evt.preventDefault();

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
		if (erase&&(performance.now() - lastTime > 20 || end)) {
			Tools.drawAndSend(new msg(x, y));
			lastTime = performance.now();
		}
		if (evt) evt.preventDefault();
	}

	function stopPath(x, y) {
		//Add a last point to the path
		end=true;
		continuePath(x, y);
		end=false;
		erase=false;
		curPathId = "";
	}
	
	function newLayer(){
		if(Tools.drawingEvent){
			Tools.drawingEvent=false;
			Tools.layer++;
			
			mask = Tools.createSVGElement("mask");
			mask.id="mask-layer-"+(Tools.layer-1);
			mask.setAttribute("class","masks");
			mask.setAttribute("maskUnits","userSpaceOnUse");
			svg.getElementById("defs").appendChild(mask);
			var rect = Tools.createSVGElement("rect");
			rect.setAttribute("x", "0");
			rect.setAttribute("y", "0");
			rect.setAttribute("width", "100%");
			rect.setAttribute("height", "100%");
			rect.setAttribute("fill", "white");
			mask.appendChild(rect);
		
			var group = Tools.createSVGElement("g");
			group.id="layer-"+Tools.layer;
			group.style.mask = "url(#mask-layer-"+Tools.layer+")"
			svg.appendChild(group);
			group.appendChild(Tools.group);
			Tools.group=group;
			
			
		};
	};


	function draw(data) {
		//deal with eraser records
		//Tools.eraserRecords.push({x:data['x'],y:data['y'],r:Tools.eraserCache[data.parent].size,mask:Tools.eraserCache[data.parent].layer});
		switch (data.type) {
			case "erase":		
				newLayer()
				Tools.eraserCache[data.id]={layer:Tools.layer,size:data.size};
				break;
			case "child":
				
				if(!Tools.eraserCache[data.parent]){
					console.error("Erase: Hmmm... I received a point of a path that has not been created (%s).", data.parent);
					newLayer();
					Tools.eraserCache[data.parent]={layer:Tools.layer,size:16};
					
				}
				createEraseCircle(data);
				break;
			default:
				console.error("Eraser: Draw instruction with unknown type. ", data);
				break;
		}
	}

	var svg = Tools.svg;
	var mask;
	
	function createEraseCircle(data) {
		Tools.eraserRecords.push({x:data['x'],y:data['y'],r:Tools.eraserCache[data.parent].size,layer:Tools.eraserCache[data.parent].layer-1});
		//Creates new circles on the canvas, one for each sub layer
		var circle = Tools.createSVGElement("circle")
		circle.cx.baseVal.value = data['x'];
		circle.cy.baseVal.value = data['y'];
		circle.r.baseVal.value = Tools.eraserCache[data.parent].size;
		circle.setAttribute("fill", "black");
		circle.setAttribute("stroke", "none");
		mask.appendChild(circle);
	}



	Tools.add({ //The new tool
		 "icon": "E",
        	"name": "Eraser2",
		"listeners": {
			"press": startPath,
			"move": continuePath,
			"release": stopPath,
		},
		"draw": draw,
		"onstart":onStart,
		"onquit":onQuit,
		"mouseCursor": "crosshair",
		//"stylesheet": "tools/pencil/pencil.css"
	});

})(); //End of code isolation
