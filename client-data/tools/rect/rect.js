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
	//Indicates the id of the shape the user is currently drawing or an empty string while the user is not drawing
	var ellipse = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"  viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;"><g><path id="submenu-rect-path" fill="';
	var ellipse2 = '" d="M435.204,126.967C387.398,94.1,324.11,76,257,76c-67.206,0-130.824,18.084-179.138,50.922C27.652,161.048,0,206.889,0,256c0,49.111,27.652,94.952,77.862,129.078C126.176,417.916,189.794,436,257,436c67.11,0,130.398-18.1,178.204-50.967C484.727,350.986,512,305.161,512,256S484.727,161.014,435.204,126.967z M418.208,360.312C375.354,389.774,318.103,406,257,406 c-61.254,0-118.884-16.242-162.273-45.733C52.986,331.898,30,294.868,30,256s22.986-75.898,64.727-104.267C138.116,122.242,195.746,106,257,106c61.103,0,118.354,16.226,161.208,45.688C459.345,179.97,482,217.015,482,256S459.345,332.03,418.208,360.312z"/></g></svg>';
		
	 var icons = {
			"Rectangle":{
				icon:"▢",
				isHTML:false,
				isSVG:false
			},
			"Circle":{
					icon:"◯",
					isHTML:false,
					isSVG:false
			},
			"Ellipse":{
				icon: `<span><img style = 'margin-top:-7px;' draggable="false" src='data:image/svg+xml;utf8,` + ellipse + `black` + ellipse2 + `' ></span>`,
				menuIcon:`<span><img style = 'margin-top:-7px;' draggable="false" src='data:image/svg+xml;utf8,` + ellipse + `gray` + ellipse2 + `' ></span>`,
				menuIconActive:`<span><img style = 'margin-top:-7px;' draggable="false" src='data:image/svg+xml;utf8,` + ellipse + `green` + ellipse2 + `' ></span>`,
				isHTML:true,
				isSVG:true
			}
	 };
	
	var curshape="Rectangle",
	end=false,
	curId = "",
	lastX = 0,
	lastY = 0,
	dashed = false,
	lastTime = performance.now(); //The time at which the last point was drawn

	function start(x, y, evt) {

		//Prevent the press from being interpreted by the browser
		evt.preventDefault();
		Tools.suppressPointerMsg = true;
		curId = Tools.generateUID("r"); //"r" for rectangle
		Tools.drawAndSend({
			'type': 'rect',
			'id': curId,
			'shape':curshape,
			'color': Tools.getColor(),
			'size': Tools.getSize(),
			'opacity': Tools.getOpacity(),
			'dashed': (dashed?true:false),
			'x': x,
			'y': y,
			'x2': x,
			'y2': y
		});

		lastX = x;
		lastY = y;
	}

	function move(x, y, evt) {
		/*Wait 20ms before adding any point to the currently drawing shape.
		This allows the animation to be smother*/
		if (curId !== "") {
			var curUpdate = { //The data of the message that will be sent for every new point
				'type': 'update',
				'id': curId,
				'shape':curshape,
				'x': lastX,
				'y': lastY
			}
			curUpdate['x2'] = x; curUpdate['y2'] = y;
			if (performance.now() - lastTime > 70 || end) {
				Tools.drawAndSend(curUpdate);
				lastTime = performance.now();
			
				if(wb_comp.list["Measurement"]){
					wb_comp.list["Measurement"].update(
						{type:curshape,
						x:lastX,
						y:lastY,
						x2:x,
						y2:y}
					)
				}
			}
		}
		if (evt) evt.preventDefault();
	}

	function stop(x, y, evt) {
		evt.preventDefault();
		//Add a last point to the shape
		end=true;
		move(x, y);
		end=false;
		Tools.suppressPointerMsg = false;
		curId = "";
	}

	function draw(data) {
		Tools.drawingEvent=true;
		switch (data.type) {
			case "rect":
				createShape(data);
				break;
			case "update":
				var shape = svg.getElementById(data['id']);
				if (!shape) {
					console.error("Shape: Hmmm... I received a point of a shape that has not been created (%s).", data['id']);
					return false;
				}else{
					if(Tools.useLayers){
						if(shape.getAttribute("class")!="layer"+Tools.layer){
							shape.setAttribute("class","layer-"+Tools.layer);
							Tools.group.appendChild(shape);
						}
					}
				};
				
				if(data.shape=="Circle"){
					updateCircle(shape, data);
				}else if(data.shape=="Ellipse"){
					updateEllipse(shape, data);
				}else{
					updateRect(shape, data);
				}
				break;
			default:
				console.error("Straight shape: Draw instruction with unknown type. ", data);
				break;
		}
	}

	var svg = Tools.svg;
	function createShape(data) {
		//Creates a new shape on the canvas, or update a shape that already exists with new information
		var shape = svg.getElementById(data.id); 
		if(data.shape=="Circle"){
			if(!shape) shape = Tools.createSVGElement("circle");
			updateCircle(shape, data);
		}else if(data.shape=="Ellipse"){
			if(!shape) shape = Tools.createSVGElement("ellipse");
			updateEllipse(shape, data);
		}else{
			if(!shape) shape = Tools.createSVGElement("rect");
			updateRect(shape, data);
		}
		shape.id = data.id;
		//If some data is not provided, choose default value. The shape may be updated later
		if(Tools.useLayers)
		shape.setAttribute("class","layer-"+Tools.layer);
		shape.setAttribute("stroke", data.color || "black");
		shape.setAttribute("stroke-width", data.size || 10);
		if(data.dashed==true){
			shape.setAttribute("stroke-dasharray", "10 10" || "10 10");
		}
		shape.setAttribute("opacity", Math.max(0.1, Math.min(1, data.opacity)) || 1);
		Tools.group.appendChild(shape);
		return shape;
	}

	function updateRect(shape, data) {
		shape.x.baseVal.value = Math.min(data['x2'], data['x']);
		shape.y.baseVal.value = Math.min(data['y2'], data['y']);
		shape.width.baseVal.value = Math.max(1,Math.abs(data['x2'] - data['x']));
		shape.height.baseVal.value = Math.max(1,Math.abs(data['y2'] - data['y']));
		shape.setAttribute("fill", "none");
		if(data.data){
			shape.setAttribute("data-lock",data.data);
		}
		if(data.transform)
			shape.setAttribute("transform",data.transform);
	}

	function updateCircle(shape, data) {		
		shape.cx.baseVal.value = Math.round((data['x2'] + data['x'])/2);
		shape.cy.baseVal.value = Math.round((data['y2'] + data['y'])/2);
		shape.r.baseVal.value = Math.max(1,Math.round(Math.sqrt(Math.pow(data['x2'] - data['x'],2)+Math.pow(data['y2'] - data['y'],2))/2));
		shape.setAttribute("fill", "none");
		if(data.data){
			shape.setAttribute("data-lock",data.data);
		}
		if(data.transform)
			shape.setAttribute("transform",data.transform);
	}

	function updateEllipse(shape, data) {		
		shape.cx.baseVal.value = Math.round((data['x2'] + data['x'])/2);
		shape.cy.baseVal.value = Math.round((data['y2'] + data['y'])/2);
		shape.rx.baseVal.value = Math.max(1,Math.abs(Math.round((data['x2'] - data['x'])/2)));
		shape.ry.baseVal.value = Math.max(1,Math.abs(Math.round((data['y2'] - data['y'])/2)));
		shape.setAttribute("fill", "none");
		if(data.data){
			shape.setAttribute("data-lock",data.data);
		}
		if(data.transform)
			shape.setAttribute("transform",data.transform);
	}

	function toggle(elem){
		if(Tools.menus["Rectangle"].menuOpen()){
			Tools.menus["Rectangle"].show(false);
		}else{
			Tools.menus["Rectangle"].show(true);
		}
		if(!menuInitialized)initMenu(elem);
	};
	

	var menuInitialized = false;
	var menuShape = "Circle";
	var button;

	function initMenu(elem){
		button = elem;
		var btns = document.getElementsByClassName("submenu-rect");
		for(var i = 0; i < btns.length; i++){
			btns[i].addEventListener("click", menuButtonClicked);
		}
		var elem = document.getElementById("rect-dashed");
		elem.addEventListener("click",dashedClicked);
		updateMenu("Rectangle")
		menuInitialized = true;
	};

	var menuButtonClicked = function(){
			menuShape = this.id.substr(13);
			curshape = menuShape;
			updateMenu(menuShape);
			changeButtonIcon();
	};

	var changeButtonIcon = function(){
		if(icons[curshape].isHTML){
			button.getElementsByClassName("tool-icon")[0].innerHTML = icons[curshape].icon;
		}else{
			button.getElementsByClassName("tool-icon")[0].textContent = icons[curshape].icon;
		}
	};

	var updateMenu = function(shape){
		var btns = document.getElementsByClassName("submenu-rect");
		for(var i = 0; i < btns.length; i++){
			if(icons[btns[i].id.substr(13)].isSVG){
				btns[i].getElementsByClassName("tool-icon")[0].innerHTML = icons[btns[i].id.substr(13)].menuIcon;
			}
			btns[i].style.backgroundColor = "#fff";
			btns[i].style.color = "gray";
			btns[i].style.borderRadius = "8px";
		}
		/*if(shape=="Ellipse"){
			var extender = document.getElementById("submenu-rect-extend")
			extender.style.display = 'block';
			$(extender).animate({width:250,height:200});
		}*/
		var btn = document.getElementById("submenu-rect-" + shape);
		if(icons[btn.id.substr(13)].isSVG){
			btn.getElementsByClassName("tool-icon")[0].innerHTML = icons[btn.id.substr(13)].menuIconActive;
		}
		btn.style.backgroundColor = "#eeeeff";
		btn.style.color = "green";
		btn.style.borderRadius = "8px";
		
	};

	function dashedClicked(){
		var elem = document.getElementById("rect-dashed");
		if(dashed){
			dashed = false;
			elem.setAttribute("class","far fa-square");
		}else{
			elem.setAttribute("class","far fa-check-square");
			dashed = true;
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
		// "name": "Rectangle",
		 "icon": "▢",
		"name": "Rectangle",
		"title": "Shapes",
		"listeners": {
			"press": start,
			"move": move,
			"release": stop,
		},
		"draw": draw,
		"toggle":toggle,
		"shortcuts": {
            "changeTool":"3"
        },
		"menu":{
			"title": 'Shapes',
			"content": `<div class="tool-extra submenu-rect" id="submenu-rect-Rectangle">
							<span title = "rectangle" class="tool-icon">▢</span>
						</div>
						<div class="tool-extra submenu-rect" id="submenu-rect-Circle">
							<span title = "circle" class="tool-icon">◯</span>
						</div>
						<div class="tool-extra submenu-rect" id="submenu-rect-Ellipse">
							<span title = "ellipse" class="tool-icon">` + icons["Ellipse"].icon + `</span>
						</div>
						<div style="width:143px;display:block" class="tool-extra"  id="submenu-rect-dashed">
							<div style="margin-top:5px;padding:5px;font-size:.8rem;color: gray"><i style="font-size:.8rem;margin-left:5px" id="rect-dashed" class="far fa-square"></i> &nbsp;dashed</div>
						</div>`,
			"listener": menuListener
		},
		"mouseCursor": "crosshair",
		"stylesheet": "tools/rect/rect.css"
	});

})(); //End of code isolation
