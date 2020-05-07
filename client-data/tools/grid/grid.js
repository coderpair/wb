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

(function grid() { //Code isolation

	var toggle=1; //grid on by default
	var msg = {
		"type": "grid",
		"id":"",
		"toggle":toggle
	};

	function toggleGrid(evt) {
		if($("#menu").width()>Tools.menu_width+3)return;
        	if(evt)evt.preventDefault();
		if(toggle){
			toggle=0;
		}else{
			toggle=1;
		}
		msg.id = Tools.generateUID("g");   //g for grid
		msg.toggle=toggle;
		draw(msg);
	};

	function draw(data) {
		switch (data.type) {
			//TODO: add the ability to erase only some points in a line
			case "grid":
				var elem = Tools.svg.getElementById("rect_1");
				elem.setAttribute("fill",(data.toggle?"url(#grid)":"white"));
				break;
			default:
				console.error("Clear: 'clear' instruction with unknown type. ", data);
				break;
		}
	}


	var svg = Tools.svg;

	Tools.add({ //The new tool
		"name": "Grid",
		"icon": "🗑",
		"iconHTML":"<i style='color:gray;margin-top:7px'  class='fas fa-th'></i>",
		"shortcuts": {
            "actions":[{"key":"9","action":toggleGrid}],
        },
		"listeners": {},
		"draw": draw,
		"oneTouch":true,
		"onstart":toggleGrid,
		"mouseCursor": "crosshair",
	});

})(); //End of code isolation