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

    var animation = null;
    function animate(scale) {
        cancelAnimationFrame(animation);
        animation = requestAnimationFrame(function () {
            zoom(origin, scale);
        });
    }

    function setOrigin(x, y, evt, isTouchEvent) {
        origin.scrollX = window.scrollX;
        origin.scrollY = window.scrollY;
        origin.x = x;
        origin.y = y;
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

    //Tools.board.addEventListener("wheel", onwheel,{ 'passive': false });

    function release(x, y, evt, isTouchEvent) {
        if (evt) evt.preventDefault();
        if (pressed && !moved) {
	    Tools.scaleIndex=Math.max(Tools.scaleIndex-1,0);
            var scale = Tools.scaleDefaults[Tools.scaleIndex];
            zoom(origin, scale);
	    setHashScale();	
        }
        pressed = false;
    }

    var timer;
    var curscale;
    var inc = 0;
    var inc2 = 0;
    var zoomScale = Tools.scaleDefaults[0];

    function animate_out() {
        inc+=10;
        var size = curscale - (curscale-zoomScale)/(60)*inc;
        animate(size);
        if(inc!=60){
            setTimeout(animate_out, 20);
        }else{
            inc = 0;
            setHashScale();
        }
    };

    function animate_in(){
        inc2+=10;
        var size = zoomScale - (zoomScale-curscale)/(60)*inc2;
        animate(size);
        if(inc2!=60){
            setTimeout(animate_in, 20);
        }else{
            inc2 = 0;
            setHashScale();
            Tools.zoomComplete = true;
        }
    };

    function homeIn(e) {
        e.preventDefault();
        e.stopPropagation();
        clearTimeout(timer);
        var x,y;
        var scale = Tools.getScale();

        if(e.type.startsWith("touch")){
            if (e.changedTouches.length === 1) {
                x = touch.pageX/scale;
                y = touch.pageY/scale;
            }
        }else if(e.type.startsWith("mouse")){
                x = e.pageX/scale
                y = e.pageY/scale
        }
        setOrigin(x, y);
        timer = setTimeout(animate_in, 20);
        Tools.svg.removeEventListener('mousedown',homeIn, true);
        Tools.svg.removeEventListener('touchstart',homeIn, false);
    };

    function wideout(){
        if(!Tools.zoomComplete)return;
        Tools.zoomComplete = false;
        var scale = Tools.getScale();
        //find middle of page
        var pageX =  window.scrollX + Math.max(document.documentElement.clientWidth, window.innerWidth || 0)/2;
        var pageY =   window.scrollY + Math.max(document.documentElement.clientHeight, window.innerHeight || 0)/2;
        var x = pageX / scale;
        var y = pageY / scale;
        setOrigin(x, y);
        curscale = Tools.scaleDefaults[Tools.scaleIndex];
        timer = setTimeout(animate_out, 20);
        Tools.svg.addEventListener('mousedown',homeIn,true);
        Tools.svg.addEventListener('touchstart',homeIn,false);
     }

     function keyZoomOut(){
        if(!Tools.zoomComplete)return;
        var scale = Tools.getScale();
        //find middle of page
        var pageX =  window.scrollX + Math.max(document.documentElement.clientWidth, window.innerWidth || 0)/2;
        var pageY =   window.scrollY + Math.max(document.documentElement.clientHeight, window.innerHeight || 0)/2;
        var x = pageX / scale;
        var y = pageY / scale;
        setOrigin(x, y);
        Tools.scaleIndex=Math.max(Tools.scaleIndex-1,0);
        var scale = Tools.scaleDefaults[Tools.scaleIndex];
        zoom(origin, scale);
        setHashScale();
     }


    Tools.add({ //The new tool
         "icon": "🔎",
	"iconHTML":"<i style='color: #B10DC9;margin-top:7px' class='fas fa-search-minus'></i>",
        "name": "Zoom Out",
        //"icon": "",
        "shortcuts": {
            "actions":[{"key":"z","action":wideout},{"key":"shift-X","action":keyZoomOut}]
        },
        "listeners": {
            "press": press,
	    "release": release,
        },
        "mouseCursor": "zoom-out",
	"isExtra":true
    });
})(); //End of code isolation
