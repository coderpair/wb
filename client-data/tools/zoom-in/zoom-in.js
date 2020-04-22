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
    var origin = {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        x: 0.0,
        y: 0.0,
        clientY: 0,
        scale: 1.0
    };
    var moved = false, pressed = false;

    function zoom(origin, scale) {
        var oldScale = origin.scale;
        var newScale = Tools.setScale(scale);
        window.scrollTo(
            origin.scrollX + origin.x * (newScale - oldScale),
            origin.scrollY + origin.y * (newScale - oldScale)
        );
    }

    

    function setOrigin(x, y, evt, isTouchEvent) {
        origin.scrollX = window.scrollX;
        origin.scrollY = window.scrollY;
        origin.x = x;
        origin.y = y;
        origin.clientY = getClientY(evt, isTouchEvent);
        origin.scale = Tools.getScale();
    }

    function setHashScale(){
	var coords = window.location.hash.slice(1).split(',');
	var x = coords[0] | 0;
	var y = coords[1] | 0;
	var scale = Tools.getScale().toFixed(2);
	var hash = '#' + (x | 0) + ',' + (y | 0) + ',' + scale;
	window.history.pushState({}, "", hash);
    }

    function press(x, y, evt, isTouchEvent) {
        if($("#menu").width()>Tools.menu_width+3)return;
        evt.preventDefault();
        setOrigin(x, y, evt, isTouchEvent);
        moved = false;
        pressed = true;
    }

    Tools.board.addEventListener("wheel", onwheel,{ 'passive': false });

    function release(x, y, evt, isTouchEvent) {
        if (pressed && !moved) {
	    Tools.scaleIndex=Math.min(Tools.scaleIndex+1,Tools.scaleDefaults.length-1);
            var scale = Tools.scaleDefaults[Tools.scaleIndex];
            zoom(origin, scale);
	    setHashScale();	
        }
        pressed = false;
    }

    function key(down) {
        return function (evt) {
            if (evt.key === "Shift") {
                Tools.svg.style.cursor = "zoom-" + (down ? "out" : "in");
            }
        }
    }

    function getClientY(evt, isTouchEvent) {
        return isTouchEvent ? evt.changedTouches[0].clientY : evt.clientY;
    }

    var keydown = key(true);
    var keyup = key(false);

    function onstart() {
        window.addEventListener("keydown", keydown);
        window.addEventListener("keyup", keyup);
    }
    function onquit() {
        window.removeEventListener("keydown", keydown);
        window.removeEventListener("keyup", keyup);
    }

    Tools.add({ //The new tool
         "icon": "🔎",
	"iconHTML":"<i style='color: #B10DC9;margin-top:7px' class='fas fa-search-plus'></i>",
        "name": "Zoom In",
        //"icon": "",
        "listeners": {
            "press": press,
	    "release": release,
        },
        "onstart": onstart,
        "onquit": onquit,
        "mouseCursor": "zoom-in",
	"isExtra":true
    });
})(); //End of code isolation
