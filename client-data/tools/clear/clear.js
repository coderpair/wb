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

(function clear() { //Code isolation


	var msg = {
		"type": "clear"
	};

	function clearBoard(evt) {
		if($("#menu").width()>Tools.menu_width+3)return;
        if(evt)evt.preventDefault();
		Tools.acceptMsgs = false;
		draw(msg, true);
		Tools.send(msg,"Clear");
	};

	function draw(data) {
		var elem;
		switch (data.type) {
			//TODO: add the ability to erase only some points in a line
			case "clear":
				Tools.clearBoard(false);
				break;
			default:
				console.error("Clear: 'clear' instruction with unknown type. ", data);
				break;
		}
	}

	Tools.add({ //The new tool
		"name": "Clear",
		"icon": "🗑",
		"shortcuts": {
            "actions":[{"key":"shift-C","action":clearBoard}]
        },
		"listeners": {},
		"draw": draw,
		"oneTouch":true,
		"onstart":clearBoard,
		"mouseCursor": "crosshair",
	});

})(); //End of code isolation