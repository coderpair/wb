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
	//Indicates the id of the line the user is currently drawing or an empty string while the user is not drawing
	var curLineId = "",
		end = false,
		startX,
		startY,
		lastTime = performance.now(); //The time at which the last point was drawn

	//The data of the message that will be sent for every update
	function UpdateMessage(x, y) {
		this.type = 'update';
		this.id = curLineId;
		this.x2 = x;
		this.y2 = y;
	}

	function startLine(x, y, evt) {

		//Prevent the press from being interpreted by the browser
		evt.preventDefault();
		Tools.suppressPointerMsg = true;
		curLineId = Tools.generateUID("s"); //"s" for straight line
		startX= x;
		startY=y;
		Tools.drawAndSend({
			'type': 'straight',
			'id': curLineId,
			'color': Tools.getColor(),
			'size': Tools.getSize(),
			'opacity': Tools.getOpacity(),
			'x': x,
			'y': y
		});
	}

	function continueLine(x, y, evt) {
		/*Wait 70ms before adding any point to the currently drawing line.
		This allows the animation to be smother*/
		if (curLineId !== "") {
			if (anglelock) {
				var alpha = Math.atan2(y - startY, x - startX);
				var d = Math.hypot(y - startY, x - startX);
				var increment = 2 * Math.PI / 12;
				var r = alpha / increment;
				r = ((Math.abs(Math.abs(r%3)-1.5))<.25?
					Math.floor(r)+.5
					:
					Math.round(r)
					);
				alpha = r * increment;
				x = startX + d * Math.cos(alpha);
				y = startY + d * Math.sin(alpha);
			}
			if (performance.now() - lastTime > 70 || end) {
				Tools.drawAndSend(new UpdateMessage(x, y));
				lastTime = performance.now();
				if(wb_comp.list["Measurement"]){
					wb_comp.list["Measurement"].update(
						{type:"line",
						x:x,
						y:y,
						x2:startX,
						y2:startY}
					)
				}
			} else {
				draw(new UpdateMessage(x, y));
			}
			
		}
		if (evt) evt.preventDefault();
	}

	function stopLine(x, y, evt) {
		evt.preventDefault();
		//Add a last point to the line
		end = false;
		continueLine(x, y);
		end = true;
		Tools.suppressPointerMsg = false;
		curLineId = "";
	}

	function draw(data) {
		Tools.drawingEvent=true;
		switch (data.type) {
			case "straight":
				createLine(data);
				break;
			case "update":
				var line = svg.getElementById(data['id']);
				if (!line) {
					console.error("Straight line: Hmmm... I received a point of a line that has not been created (%s).", data['id']);
					return false;
				}else{
					if(Tools.useLayers){
						if(line.getAttribute("class")!="layer"+Tools.layer){
							line.setAttribute("class","layer-"+Tools.layer);
							Tools.group.appendChild(line);
						}
					}
				}
				updateLine(line, data);
				break;
			default:
				console.error("Straight Line: Draw instruction with unknown type. ", data);
				break;
		}
	}

	var svg = Tools.svg;
	function createLine(lineData) {
		//Creates a new line on the canvas, or update a line that already exists with new information
		var line = svg.getElementById(lineData.id) || Tools.createSVGElement("line");
		line.id = lineData.id;
		line.x1.baseVal.value = lineData['x'];
		line.y1.baseVal.value = lineData['y'];
		line.x2.baseVal.value = lineData['x2'] || lineData['x'];
		line.y2.baseVal.value = lineData['y2'] || lineData['y'];
		//If some data is not provided, choose default value. The line may be updated later
		if(Tools.useLayers)
		line.setAttribute("class","layer-"+Tools.layer);
		line.setAttribute("stroke", lineData.color || "black");
		line.setAttribute("stroke-width", lineData.size || 10);
		line.setAttribute("opacity", Math.max(0.1, Math.min(1, lineData.opacity)) || 1);
		if(lineData.data){
			line.setAttribute("data-lock",lineData.data);
		}
		if(lineData.transform)
			line.setAttribute("transform",lineData.transform);
		Tools.group.appendChild(line);
		return line;
	}

	function updateLine(line, data) {
		line.x2.baseVal.value = data['x2'];
		line.y2.baseVal.value = data['y2'];
	}

	function toggle(elem){
		if(Tools.menus["Line"].menuOpen()){
			Tools.menus["Line"].show(false);
		}else{
			Tools.menus["Line"].show(true);
		}
		if(!menuInitialized)initMenu();
	};

	var menuInitialized = false;
	var anglelock = false;

	function initMenu(){
		var elem = document.getElementById("angle-lock");
		elem.addEventListener("click",anglelockClicked);
		menuInitialized = true;
	};
   
	function anglelockClicked(){
		var elem = document.getElementById("angle-lock");
		if(anglelock){
			elem.style.color = "gray";
			anglelock = false;
			elem.setAttribute("class","fas fa-unlock");
		}else{
			elem.setAttribute("class","fas fa-lock");
			elem.style.color = "orange";
			anglelock = true;
		}
	};

	function menuListener(elem, onButton, onMenu, e) {
		if(!onMenu&&!onButton){
			e.stopPropagation();
			return true;
		}
		return false;
	};

	Tools.add({ //The new tool
		// "name": "Straight line",
		 "icon": "☇",
        "name": "Line",
        //"icon": "",
		"listeners": {
			"press": startLine,
			"move": continueLine,
			"release": stopLine,
		},
		"shortcuts": {
            "changeTool":"2"
		},
		"toggle":toggle,
		"menu":{
			"title": 'Lines',
			"content": `<div style="width:143px;" class="tool-extra submenu-line"  id="submenu-rect-angleLock">
							<div id="submenu-line-extend" style="padding:5px;font-size:.8rem;color: gray"><i style="font-size:1rem;margin-left:5px" id="angle-lock" class="fas fa-unlock"></i> &nbsp;0-30-45-60-90°</div>
						</div>`,
			"listener": menuListener
		},
		"draw": draw,
		"mouseCursor": "crosshair",
		"stylesheet": "tools/line/line.css"
	});

})(); //End of code isolation
