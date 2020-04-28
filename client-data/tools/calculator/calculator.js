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
	var msg = {
		"type": "e",
		"state":"",
	};

    var elt = document.getElementById('calculator');
	var calculator = Desmos.GraphingCalculator(elt);
	calculator.observeEvent('change', relayChanges);
	

    //elt.style.width = '600px';
	//elt.style.height = '400px';
	//calculator.resize();

	function toggleCalc(evt) {
		evt.preventDefault();
		var btn = document.getElementById("toolID-Calculator");
		if(toggle){
			elt.style.display = "none";
			btn.style.backgroundColor = "";
			btn.style.borderRadius = "";
			toggle=0;
		}else{
			elt.style.left =   (65+document.documentElement.scrollLeft)+"px";
			elt.style.top =  (19+document.documentElement.scrollTop)+"px";
			btn.style.backgroundColor = "#eeeeff";
			btn.style.borderRadius = "8px";
			elt.style.display = "block";
			toggle=1;
		}
	};

	function relayChanges() {
		msg.state = calculator.getState();
		Tools.send(msg,"Calculator");
		//console.log(msg.state);
	};

	function draw(data) {
		var elem;
		switch (data.type) {
			case "e":
				calculator.unobserveEvent('change');
				calculator.setState(data.state);
				calculator.observeEvent('change', relayChanges);
				break;
			default:
				console.error("Clear: 'calc' instruction with unknown type. ", data);
				break;
		}
	}


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