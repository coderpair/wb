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


(function calculator() { //Code isolation

	var toggle = 0;
	var opened = false;
	var msg = {
		"type": "e",
		"state":"",
	};
	var win = {
		toggle : 0,
		max:false
	 };

	var elt = document.getElementById('calculator');
	var container = document.getElementById('calc-container');
	var calculator = Desmos.GraphingCalculator(elt);
	var lastState;
	calculator.observeEvent('change', relayChanges);
	

    //elt.style.width = '600px';
	//elt.style.height = '400px';
	//calculator.resize();

	function toggleCalc() {
		var btn = document.getElementById("toolID-Calculator");
		if(toggle){
			container.style.display = "none";
			btn.style.backgroundColor = "";
			btn.style.borderRadius = "";
			toggle=0;
		}else{
			Tools.focusWindow(container);
			if(win.max)pos_max_win()
			else pos_win()
			btn.style.backgroundColor = "#eeeeff";
			btn.style.borderRadius = "8px";
			container.style.display = "block";
			toggle=1;
			if(opened) return;
			opened = true;
			init_window();
			
		}
	};

	function relayChanges() {
		msg.state = calculator.getState();
		diff(msg,lastState,msg.state);
		lastState = msg.state;
		Tools.send(msg,"Calculator");
	};

	//diff and merge "should" allow people to work on different expressions without interrupting each other
	function diff(state){
		const [olist,nlist] = getLists(lastState,state);
		let prevExpressions = {};
		let ids = new Set();
		olist.forEach(
			expression => {
				prevExpressions[expression.id]=expression
				ids.add(expression.id);
			}
		);
		nlist.forEach(
			expression => {
				if(JSON.stringify(expression)==JSON.stringify(prevExpressions[expression.id])){
					ids.delete(expression.id);
				}else{
					ids.add(expression.id);
				}
			}
		);
		msg.diff = Array.from(ids);
	};

	function merge(state,newDiff){
		const [olist,nlist] = getLists(lastState,state);
		let newExpressions = {};
		olist.forEach(
			expression => {
				if(!newDiff.includes(expression.id)){
					newExpressions[expression.id]=expression
				}
			}
		);
		nlist.forEach(
			expression => {
				if(newDiff.includes(expression.id) || !newExpressions[expression.id]){
					newExpressions[expression.id]=expression
				}
			}
		);
		if(!state.expressions)state.expressions = {};
		state.expressions.list = [];
		for (const id in newExpressions) {
			state.expressions.list.push(newExpressions[id])
		}
	};

	function getLists(
		{
			expressions: {
				list: olist = []
			} = {}
		} = {},
		{
			expressions: {
				list: nlist = []
			} = {}
		}
	){
		return [olist,nlist]
	};

	function draw(data) {
		var elem;
		switch (data.type) {
			case "e":
				calculator.unobserveEvent('change');
				merge(data.state,data.diff);
				calculator.setState(data.state);
				lastState = data.state;
				calculator.observeEvent('change', relayChanges);
				break;
			default:
				console.error("Clear: 'calc' instruction with unknown type. ", data);
				break;
		}
	}

	function init_window(){
		document.getElementById("close-calc").addEventListener("click", toggleCalc);
		document.getElementById("max-calc").addEventListener("click", toggleMax);
		dragElement(document.getElementById("calc-container"));
		function dragElement(elmnt) {

			var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
			var header = document.getElementById(elmnt.id + "-header")
			if (document.getElementById(header)) {
			/* if present, the header is where you move the DIV from:*/
			//	if(!isTouchDevice){
					header.addEventListener("mousedown",dragMouseDown,false);
				//}else{
					header.addEventListener("touchstart",dragMouseDown,{ 'passive': false });
				//}
			} else {
				/* otherwise, move the DIV from anywhere inside the DIV:*/
				//if(!isTouchDevice){
					header.addEventListener("mousedown",dragMouseDown,false);
				//}else{
					header.addEventListener("touchstart",dragMouseDown,{ 'passive': false });
				//}
			}
		
			function dragMouseDown(e) {
				e = e || window.event;
				if(win.max)return;
				//e.preventDefault();
				// get the mouse cursor position at startup:
				if(e.type.startsWith("touch")){
					if (e.changedTouches.length === 1) {
						var touch = e.changedTouches[0];
						pos3 = touch.pageX
						pos4 = touch.pageY
					}
				}else{
					pos3 = e.clientX;
					pos4 = e.clientY;
				}
				Tools.focusWindow(elmnt);
				// call a function whenever the cursor moves:
				//if(!isTouchDevice){
					document.addEventListener("mouseup",closeDragElement,false);
					document.addEventListener("mousemove",elementDrag,false);
				//}else{
					document.addEventListener("touchend",closeDragElement,{ 'passive': false });
					document.addEventListener("touchmove",elementDrag,{ 'passive': false });
				//}
			
			}
		
			function elementDrag(e) {
				e = e || window.event;
				e.preventDefault();
				// calculate the new cursor position:
				if(e.type.startsWith("touch")){
					if (e.changedTouches.length === 1) {
						var touch = e.changedTouches[0];
						pos1 = pos3 - touch.pageX;
						pos2 = pos4 - touch.pageY;
						pos3 = touch.pageX
						pos4 = touch.pageY
					}
				}else{
					pos1 = pos3 - e.clientX;
					pos2 = pos4 - e.clientY;
					pos3 = e.clientX;
					pos4 = e.clientY;
				}
				
				// set the element's new position:
				elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
				elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
			}
		
			function closeDragElement(e) {
				//e.preventDefault();
			/* stop moving when mouse button is released:*/
				document.removeEventListener("mouseup",closeDragElement,false);
				document.removeEventListener("mousemove",elementDrag,false);
				document.removeEventListener("touchend",closeDragElement,false);
				document.removeEventListener("touchmove",elementDrag,false);
			}
		}
	};

	function toggleMax() {
		if(win.max){
			pos_win();
			win.max=false;
		}else{
			pos_max_win()
			win.max=true;
		}
	};

	function pos_win(){
		container.style.position = "";
		container.style.zIndex= "";
		container.style.left =  (win.l? win.l - document.documentElement.scrollLeft: (65+document.documentElement.scrollLeft)) + "px";
		container.style.top =   (win.t? win.t - document.documentElement.scrollTop: (19+document.documentElement.scrollTop)) + "px"; 
		container.style.width = ''; 
		container.style.height = '';
	};
	function pos_max_win(){
		container.style.position = "fixed";
		container.style.zIndex=100;
		win.l = $(container).offset().left;
		win.t = $(container).offset().top;
		container.style.left =  '0px'; 
		container.style.top =  '0px'; 
		container.style.width = '100%'; 
		container.style.height = '100%';
	};


	Tools.add({ //The new tool
		"name": "Calculator",
		"icon": "🗑",
		"iconHTML":"<i id='calc-icon' style='color: #FF8C00;margin-top:7px' class='fas fa-calculator'></i>",
		//"shortcut": "e",
		"listeners": {},
		"draw": draw,
		"oneTouch":true,
		"isExtra":true,
		"onstart":toggleCalc,
		"mouseCursor": "crosshair",
		"stylesheet": "tools/calculator/calculator.css"
	});

})(); //End of code isolation