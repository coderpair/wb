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

(function undo() { //Code isolation


	var msg = {
		"type": "undo"
	};

	function undo(evt) {
		if(evt)evt.preventDefault();
		draw(msg);
		Tools.send(msg,"Undo");
	};

	function draw(data) {
		var elem;
		switch (data.type) {
			//TODO: add the ability to erase only some points in a line
			case "undo":
				break;
			default:
				console.error("Clear: 'clear' instruction with unknown type. ", data);
				break;
		}
	}


	Tools.add({ //The new tool
		"name": "Undo",
		"icon": "🗑",
		"iconHTML":"<i style='color: #39CCCC;margin-top:7px' class='fas fa-undo-alt'></i>",
		"shortcuts": {
            "actions":[{"key":"shift-U","action":undo}]
        },
		"listeners": {},
		"draw": draw,
		"isExtra":true,
		"oneTouch":true,
		"onstart":undo,
		"mouseCursor": "crosshair",
	});

})(); //End of code isolation