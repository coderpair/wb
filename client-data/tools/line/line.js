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
		curLine = "line",
		size = 4
		lastTime = performance.now(); //The time at which the last point was drawn
	
		var dashmode = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"  viewBox="-47 -57 250 250" style="enable-background:new -47 -57 250 250;"><g><path id="submenu-rect-path" fill="';
		
		var dashmode2 = '" d="M60.669,89.331l35.592-35.592l10.606,10.608L71.276,99.938L60.669,89.331z M131.944,39.27l28.663-28.662L150.001,0 l-28.663,28.662L131.944,39.27z M35.593,114.407L0.001,150l10.606,10.607l35.592-35.593L35.593,114.407z"/></g></svg>';
		 
		var icons = {
			"line":{
				icon:"☇",
				isHTML:false,
				isSVG:false
			},
			"arrw":{
					icon:"→",
					isHTML:true,
					isSVG:false
			},
			"dashline":{
				icon: `<span><img style = 'margin-top:-7px;' draggable="false" src='data:image/svg+xml;utf8,` + dashmode + `black` + dashmode2 + `' ></span>`,
				menuIcon:`<span><img style = 'margin-top:-7px;' draggable="false" src='data:image/svg+xml;utf8,` + dashmode + `gray` + dashmode2 + `' ></span>`,
				menuIconActive:`<span><img style = 'margin-top:-7px;' draggable="false" src='data:image/svg+xml;utf8,` + dashmode + `green` + dashmode2 + `' ></span>`,
				isHTML:true,
				isSVG:true
			}
	 };

	function startLine(x, y, evt) {

		//Prevent the press from being interpreted by the browser
		evt.preventDefault();
		Tools.suppressPointerMsg = true;
		curLineId = Tools.generateUID("s"); //"s" for straight line
		startX= x;
		startY=y;
		size = Tools.getSize();
		Tools.drawAndSend({
			'type': 'straight',
			'id': curLineId,
			'line':curLine,
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
			var curUpdate = { //The data of the message that will be sent for every new point
				'type': 'update',
				'id': curLineId,
				'line':curLine,
				'x2': x,
				'y2': y
			}
			if (performance.now() - lastTime > 70 || end) {
				
				Tools.drawAndSend(curUpdate);
				lastTime = performance.now();
				if(wb_comp.list["Measurement"]){
					var arg = {
						type:"line",
						x:x,
						y:y,
						x2:startX,
						y2:startY};
					if(curLine=="arrw"){
						var d = Math.hypot(x-arg.x2,y-arg.y2)
						var r = (d+5.5*size)/d;
						arg.x2 = x + (arg.x2-x)*r;
						arg.y2 = y + (arg.y2-y)*r;
					}
					wb_comp.list["Measurement"].update(
						arg
					)
				}
			} else {
				draw(curUpdate);
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
				if(data.line=='arrw'){
					createPolyLine(data);
				}else{
					createLine(data);
				}
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
				if(data.line=='arrw'){
					updatePolyLine(line, data);
				}else{
					updateLine(line, data);
				}
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
		if(lineData.line=="dashline"){
			line.setAttribute("stroke-dasharray", "10 10" || "10 10");
		}
		line.setAttribute("opacity", Math.max(0.1, Math.min(1, lineData.opacity)) || 1);
		if(lineData.data){
			line.setAttribute("data-lock",lineData.data);
		}
		if(lineData.transform)
			line.setAttribute("transform",lineData.transform);
		if(lineData.marker){
			
			var marker = Tools.createSVGElement("marker", {
				id: "arrw_"+lineData.id,
				markerWidth: "6",
				markerHeight: "4",
				refX: "0",
				refY: "2",
				orient:"auto"
			});
			var polygon = Tools.createSVGElement("polygon", {
					id:"arrw_poly_"+lineData.id,
					points:"0 0, 6 2, 0 4",
					fill: lineData.color || "black"
			});
			marker.appendChild(polygon);
			document.getElementById("defs").appendChild(marker);
			line.setAttribute("marker-end", "url(#arrw_"+lineData.id+")");
		}
		Tools.group.appendChild(line);
		return line;
	}

	function updateLine(line, data) {
		line.x2.baseVal.value = data['x2'];
		line.y2.baseVal.value = data['y2'];
	}


	function createPolyLine(lineData) {
		//Creates a new line on the canvas, or update a line that already exists with new information
		var line = svg.getElementById(lineData.id) || Tools.createSVGElement("polyline");
		line.id = lineData.id;
		var x2 = (lineData['x2']!==undefined?lineData['x2'] : lineData['x'])-0;
		var y2 = (lineData['y2']!==undefined?lineData['y2'] : lineData['y'])-0;

		line.setAttribute("points",  lineData['x'] + "," + lineData['y'] + " " + x2 + "," +y2
		+ buildArrow((lineData.size || 10)/2, x2, y2, Math.atan2(y2-(lineData['y']-0), x2-(lineData['x']-0))));
		//If some data is not provided, choose default value. The line may be updated later
		if(Tools.useLayers)
		line.setAttribute("class","layer-"+Tools.layer);
		line.setAttribute("stroke", lineData.color || "black");
		line.setAttribute("stroke-width", lineData.size || 10);
		line.setAttribute("fill", lineData.color || "black");
		line.setAttribute("opacity", Math.max(0.1, Math.min(1, lineData.opacity)) || 1);
		if(lineData.data){
			line.setAttribute("data-lock",lineData.data);
		}
		if(lineData.transform)
			line.setAttribute("transform",lineData.transform);
		if(lineData.marker){
			
			var marker = Tools.createSVGElement("marker", {
				id: "arrw_"+lineData.id,
				markerWidth: "6",
				markerHeight: "4",
				refX: "0",
				refY: "2",
				orient:"auto"
			});
			var polygon = Tools.createSVGElement("polygon", {
					id:"arrw_poly_"+lineData.id,
					points:"0 0, 6 2, 0 4",
					fill: lineData.color || "black"
			});
			marker.appendChild(polygon);
			document.getElementById("defs").appendChild(marker);
			line.setAttribute("marker-end", "url(#arrw_"+lineData.id+")");
		}
		Tools.group.appendChild(line);
		return line;
	}

	function updatePolyLine(line, data) {
		var pts = line.getAttributeNS(null,"points").split(/[\s,]+/);
		var sz = line.getAttributeNS(null, "stroke-width");
		line.setAttribute("points",pts[0] + "," + pts[1] + ' ' + data['x2'] + ',' + data['y2']
		+ buildArrow(sz/2, data['x2']-0, data['y2']-0,Math.atan2(data['y2']-pts[1], data['x2']-pts[0])));
	};

	function buildArrow(w,x0,y0,theta){
		var x = 11*w - w*Math.sqrt(10);
		var y = x/3;
		var a1 = x0 - y*Math.sin(theta);
		var a2 = y0 + y*Math.cos(theta);
		var b1 = x0 + x*Math.cos(theta);
		var b2 = y0 + x*Math.sin(theta);
		var c1 = x0 + y*Math.sin(theta);
		var c2 = y0 - y*Math.cos(theta);
		return " "+a1+","+a2+" "+b1+","+b2+" "+c1+","+c2 + " " +x0+","+y0;
	}

	function toggle(elem){
		if(Tools.menus["Line"].menuOpen()){
			Tools.menus["Line"].show(false);
		}else{
			Tools.menus["Line"].show(true);
		}
		if(!menuInitialized)initMenu(elem);
	};

	var menuInitialized = false;
	var anglelock = false;

	var menuSelected = "Line";
	var button;

	function initMenu(elem){
		button = elem;
		var btns = document.getElementsByClassName("submenu-line");
		for(var i = 0; i < btns.length; i++){
			btns[i].addEventListener("click", menuButtonClicked);
		}
		var elem = document.getElementById("angle-lock");
		elem.addEventListener("click",anglelockClicked);
		updateMenu("line")
		menuInitialized = true;
	};

	var menuButtonClicked = function(){
			menuSelected = this.id.substr(13);
			curLine = menuSelected;
			updateMenu(menuSelected);
			changeButtonIcon();
	};

	var changeButtonIcon = function(){
		if(icons[curLine].isHTML){
			button.getElementsByClassName("tool-icon")[0].innerHTML = icons[curLine].icon;
		}else{
			button.getElementsByClassName("tool-icon")[0].textContent = icons[curLine].icon;
		}
	};

	var updateMenu = function(line){
		var btns = document.getElementsByClassName("submenu-line");
		for(var i = 0; i < btns.length; i++){
			if(icons[btns[i].id.substr(13)].isSVG){
				btns[i].getElementsByClassName("tool-icon")[0].innerHTML = icons[btns[i].id.substr(13)].menuIcon;
			}
			btns[i].style.backgroundColor = "#fff";
			btns[i].style.color = "gray";
			btns[i].style.borderRadius = "8px";
		}
		/*if(shape=="Ellipse"){
			var extender = document.getElementById("submenu-line-extend")
			extender.style.display = 'block';
			$(extender).animate({width:250,height:200});
		}*/
		var btn = document.getElementById("submenu-line-" + line);
		if(icons[btn.id.substr(13)].isSVG){
			btn.getElementsByClassName("tool-icon")[0].innerHTML = icons[btn.id.substr(13)].menuIconActive;
		}
		btn.style.backgroundColor = "#eeeeff";
		btn.style.color = "green";
		btn.style.borderRadius = "8px";
		
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
		 "title":"Lines",
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
			"content":`<div class="tool-extra submenu-line" id="submenu-line-line">
							<span title="solid line" class="tool-icon">☇</span>
						</div>
						<div class="tool-extra submenu-line" id="submenu-line-arrw">
							<span title="solid arrow" class="tool-icon">` + icons["arrw"].icon + `</span>
						</div>
						<div class="tool-extra submenu-line" id="submenu-line-dashline">
							<span title="dashed line" class="tool-icon">` + icons["dashline"].icon + `</span>
						</div>
						<div style="width:143px;display:block" class="tool-extra"  id="submenu-line-angleLock">
							<div style="margin-top:5px;padding:5px;font-size:.8rem;color: gray"><i style="font-size:1rem;margin-left:5px" id="angle-lock" class="fas fa-unlock"></i> &nbsp;0-30-45-60-90°</div>
						</div>`,
			"listener": menuListener
		},
		"draw": draw,
		"mouseCursor": "crosshair",
		"stylesheet": "tools/line/line.css"
	});

})(); //End of code isolation
