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

(function measurement() { //Code isolation

	var open=false; //grid on by default
	var curobj;
	var size=0;

	function onStart(){
		document.getElementById("msr-pod").addEventListener("click", toggleDialog);
		var podup = document.getElementById("msr-pod-up");
		podup.style.display = 'block';
		podup.addEventListener("click", toggleDialog);
	};

	function update(obj){
		if(!open)return;
		updateHTML(elemHTML(obj));	
	}

	function resize(sz){
		var dialog = document.getElementById("msr-dialog");
		if(sz=="small"){
			size=0
			$(dialog).removeClass('msr-big-dialog')
			document.getElementById("msr-main").innerHTML = "<br>Ready";
		}else{
			size=1
			$(dialog).addClass('msr-big-dialog')
		}
	}

	function initTransform(svgType,elem,shape){
		resize();
		curobj = {
			elem:elem
		};
		switch ( svgType ) {
			case "group": 
				curobj.type="Group";
				curobj.x=shape.points[0].x;
				curobj.y=shape.points[0].y;
				curobj.x2=shape.points[2].x;
				curobj.y2=shape.points[2].y;  
				break;
			case "text": 
				curobj.type="Rectangle";
				curobj.x = elem.getAttributeNS(null,"x")-0;
				curobj.y =  elem.getAttributeNS(null,"y")-0;
				curobj.x2 = curobj.x + elem.getComputedTextLength();
				curobj.y2 = curobj.y +  (elem.getAttributeNS(null,"font-size")-0);
				break;
			case "rect": 
				curobj.type="Rectangle";
				curobj.x=elem.x.baseVal.value;
				curobj.y=elem.y.baseVal.value;
				curobj.x2=elem.x.baseVal.value+elem.width.baseVal.value;
				curobj.y2=elem.y.baseVal.value+elem.height.baseVal.value;  
				break;
			case "polyline":
				var pts = elem.getAttributeNS(null,"points").split(/[\s,]+/);
				var size = elem.getAttributeNS(null,"stroke-width")-0;
				curobj.type="line";
				curobj.x=pts[0]-0;
				curobj.y=pts[1]-0;
				curobj.x2=pts[2]-0;
				curobj.y2= pts[3]-0;
				var d = Math.hypot(curobj.x-curobj.x2,curobj.x-curobj.y2)
				var r = (d+5.5*size)/d;
				curobj.x2 = curobj.x + (curobj.x2-curobj.x)*r;
				curobj.y2 = curobj.y + (curobj.y2-curobj.y)*r;
				break;
			case "line": 
				curobj.type="line";
				curobj.x=elem.x1.baseVal.value;
				curobj.y=elem.y1.baseVal.value;
				curobj.x2=elem.x2.baseVal.value;
				curobj.y2=elem.y2.baseVal.value;  
				break;
			case "circle":  
				curobj.type="Circle";
				curobj.x = elem.cx.baseVal.value-elem.r.baseVal.value;
				curobj.y = elem.cy.baseVal.value;
				curobj.x2 = elem.cx.baseVal.value+elem.r.baseVal.value;
				curobj.y2 =  elem.cy.baseVal.value;
				break;
			case "ellipse":  
				curobj.type="Ellipse";
				curobj.x = elem.cx.baseVal.value-elem.rx.baseVal.value;
				curobj.y = elem.cy.baseVal.value-elem.ry.baseVal.value;
				curobj.x2 = elem.cx.baseVal.value+elem.rx.baseVal.value;
				curobj.y2 =  elem.cy.baseVal.value+elem.ry.baseVal.value;
				break;
			case "image":  
				curobj.type="Rectangle";
				curobj.x = elem.x.baseVal.value;
				curobj.y = elem.y.baseVal.value;
				curobj.x2 = elem.x.baseVal.value + (elem.getAttributeNS(null,"width")-0);
				curobj.y2 = elem.y.baseVal.value + (elem.getAttributeNS(null,"height")-0);
				break;
			case "path":
				curobj.type="Path";
				var pts = elem.getPathData(); //The points that are already in the line as a PathData
				curobj.x = pts[0].values[0];
				curobj.y = pts[0].values[1];
				curobj.x2 = curobj.x;
				curobj.y2 = curobj.y;
				if(pts.length>1){
					curobj.x2 = pts[pts.length-1].values[4];
					curobj.y2 = pts[pts.length-1].values[5];
				}
				break;
			default:
				return;
		}	
		updateTransform();
	}

	function updateTransform(rect){
		if(!open)return;
		if(size==0){
			resize();
		}
		var matrix = {
			a:1,
			c:0,
			b:0,
			d:1,
			e:0,
			f:0
		};
		var el;
		var transform = (curobj.elem?curobj.elem.getAttributeNS(null,"transform"):null);
		if(transform){
			el = transform.substr(7, transform.length-2).split(/[\s,]+/);
		}
		if(rect){
			transform = rect.generateTransformMatrix();
			el =  [transform[0][0] , transform[1][0] , transform[0][1] , transform[1][1] , transform[0][2] , transform[1][2]];
		}
		var results;
		if(el){
			matrix = {
				a:parseFloat( el[0] ),
				c:parseFloat( el[2] ),
				b:parseFloat( el[1] ),
				d:parseFloat( el[3] ),
			};
			matrix.e = matrix.a*(curobj.x+curobj.x2)/2 + matrix.c*(curobj.y+curobj.y2)/2+parseFloat( el[4] )-(curobj.x+curobj.x2)/2;
			matrix.f = matrix.b*(curobj.x+curobj.x2)/2 + matrix.d*(curobj.y+curobj.y2)/2+parseFloat( el[5] )-(curobj.y+curobj.y2)/2;
		}
		var results = Tools.decomposeMatrix(matrix);
		updateHTML(transformHTML(results,elemHTML(curobj)));
	}

	function elemHTML(obj){
		var html="";
		if(obj.type == "pointer"){
			html =
				"<br><span>x:" + Math.round(obj.x) 
				+ " &nbsp;y:" + Math.round(obj.y) 
				+ "</span>";
		}
		if(obj.type == "line"){
			var angle =  Math.round(Math.atan(Math.abs((obj.y-obj.y2)/(obj.x-obj.x2)))*180/Math.PI);
			if(isNaN(angle))angle = 0;
			html =
				"<span>x:" + Math.round(obj.x2) 
				+ " &nbsp;y:" + Math.round(obj.y2) 
				+ "<br>x2:" + Math.round(obj.x)  
				+ " &nbsp;y2:" + Math.round(obj.y)  
				+ "<br>angle: " + angle 
				+ "°<br>length: " + Math.round(Math.sqrt((obj.y-obj.y2)*(obj.y-obj.y2)+(obj.x-obj.x2)*(obj.x-obj.x2))) + "</span>";
		}
		if(obj.type == "Path"){
			html =
				`<span>start: (${Math.round(obj.x)},${Math.round(obj.y)})<br>end: (${Math.round(obj.x2)},${Math.round(obj.y2)})</span>`;
		}
		if(obj.type == "Rectangle"){
				html =
					"<span>x:" + Math.round(obj.x) 
					+ " &nbsp;y:" + Math.round(obj.y) 
					+ "<br>x2:" + Math.round(obj.x2)  
					+ " &nbsp;y2:" + Math.round(obj.y2) 
					+ "<br>width: " + Math.abs(Math.round(obj.x-obj.x2))
					+ "<br>height: " + Math.abs(Math.round(obj.y-obj.y2)) + "</span>";
		}
		if(obj.type == "Circle"){
			html =
				"<span><br>ctr: (" + Math.round((obj.x+obj.x2)/2) 
				+ "," +  Math.round((obj.y+obj.y2)/2) 
				+ ")<br>radius: " + Math.max(1,Math.round(Math.sqrt(Math.pow(obj.x2 - obj.x,2)+Math.pow(obj.y2 - obj.y,2))/2))
				+ "</span>";
		}
		if(obj.type == "Ellipse"){
			html = "<span>ctr: (" + Math.round((obj.x2 + obj.x)/2)
				+ "," +  Math.round((obj.y2 + obj.y)/2)
				+ ")<br>x radius: " + Math.max(1,Math.abs(Math.round((obj.x2 - obj.x)/2)))
				+ "<br>y radius: " + Math.max(1,Math.abs(Math.round((obj.y2 - obj.y)/2)))
				+ "</span>";
		}
		if(obj.type == "Group"){
			html =
				`<span>Group<br>top: (${Math.round(obj.x)},${Math.round(obj.y)})<br>btm: (${Math.round(obj.x2)},${Math.round(obj.y2)})</span>`;
		}
		return html;
	};

	function transformHTML(transform,col1){
		var html = "";
		var col2 = "<span>tx:" + Math.round(transform.translation[0]) 
			+ " &nbsp;ty:" + Math.round(transform.translation[1]) 
			+ "<br>sx:" + (transform.scale[0]).toFixed(2)
			+ " &nbsp;sy:" + (transform.scale[1]).toFixed(2)
			+ "<br>skewX: " + Math.round(transform.skew[0])
			+ "° &nbsp;skewY: " + Math.round(transform.skew[1]) 
			+ "°<br>rot: " + Math.round(transform.rotation) + "°</span>";

		html =`<table style="width:100%">
		<tr>
			<td style='color:#bbbbcc'>` + col1 + `</td>
			<td>` + col2 + `</td>
		</tr>
		</table>`;
		return html;
	};

	function updateHTML(html){
		document.getElementById("msr-main").innerHTML = html
	};

	

	//Dialog Box
	function toggleDialog() {
		var elem = document.getElementById("msr-dialog");
		if(open){
			$(elem).animate({height: "36px"}).fadeOut();
			//elem.style.height = "36px";
			open=false;
		}else{
			$(elem).fadeIn("fast").animate({height: "120px"})
			//elem.style.height = "112px";
			open=true;
		}
		
	};

	function isOpen(){
		return open;
	}

	wb_comp.add({ //The new tool
		"name": "Measurement",
		"listeners": {},
		"onstart":onStart,
		"update":update,
		"init":initTransform,
		"updateTransform":updateTransform,
		"resize":resize,
		"isOpen":isOpen,
		"stylesheet": "components/measurement/measurement.css"
	});

})(); //End of code isolation