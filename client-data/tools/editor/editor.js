/**
 *                        WB
 *********************************************************
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2020  Robert Beach
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

(function editor() { //Code isolation

	var win = {
		toggle : 0,
		opened : false,
		max:false
	 };

	 // All this so the current word doesn't get highlighted by the spell checker
	 var startline = 0;
	 var linenum = 0;
	 var changeCalled = false;
	 var cursorLock = false;
	 var changeLock = false;


	 var initialized = false;
	 var input_init;
	 var overlay_initialized = false;

	 var codeMirror;

	 var typoOverlay;
	 var spellCheck=false;
	 var live = false;
	
	 var img1 = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" height="30" width="30" viewBox="0 0 100 125" enable-background="new 0 0 100 100" xml:space="preserve"><g><g><path fill="gray" d="M74.999,61.237c-0.43-0.276-0.966-0.313-1.477-0.342c-1.167-0.067-2.334-0.134-3.501-0.201    c-1.205-0.069-2.441-0.135-3.591,0.231c-1.308,0.415-2.174,1.321-2.397,2.638c-0.046,0.274,0.153,3.136,0.015,3.136    c0,2.977-0.419,4.33,2.976,4.271c1.564-0.027,3.141-0.213,4.699-0.047c0.07,0.008,0.144,0.017,0.22,0.028    c0.996,0.141,2.478,0.513,3.229-0.304c1.589-1.73,0.902-4.706,0.8-6.847C75.926,62.848,75.8,61.75,74.999,61.237z"/><path d="M74.999,45.338c-0.43-0.276-0.966-0.313-1.477-0.342c-1.167-0.067-2.334-0.134-3.501-0.201    c-1.205-0.069-2.441-0.135-3.591,0.231c-1.308,0.415-2.174,1.321-2.397,2.638c-0.046,0.274,0.153,3.136,0.015,3.136    c0,2.977-0.419,4.33,2.976,4.271c1.564-0.027,3.141-0.213,4.699-0.047c0.07,0.007,0.144,0.017,0.22,0.028    c0.996,0.141,2.478,0.513,3.229-0.304c1.589-1.73,0.902-4.706,0.8-6.847C75.926,46.949,75.8,45.851,74.999,45.338z"/><path d="M64.049,34.901c0,2.977-0.419,4.33,2.976,4.271c1.564-0.027,3.141-0.213,4.699-0.047c0.07,0.007,0.144,0.017,0.22,0.028    c0.996,0.141,2.478,0.513,3.229-0.304c1.589-1.73,0.902-4.706,0.8-6.847c-0.045-0.951-0.172-2.049-0.973-2.562    c-0.43-0.276-0.966-0.313-1.477-0.342c-1.167-0.067-2.334-0.134-3.501-0.201c-1.205-0.069-2.441-0.135-3.591,0.231    c-1.308,0.415-2.174,1.321-2.397,2.638C63.987,32.039,64.187,34.901,64.049,34.901z"/><path d="M54.766,61.237c-0.43-0.276-0.966-0.313-1.477-0.342c-1.167-0.067-2.334-0.134-3.501-0.201    c-1.205-0.069-2.441-0.135-3.591,0.231c-1.308,0.415-2.174,1.321-2.397,2.638c-0.046,0.274,0.153,3.136,0.015,3.136    c0,2.977-0.419,4.33,2.976,4.271c1.564-0.027,3.141-0.213,4.699-0.047c0.07,0.008,0.144,0.017,0.22,0.028    c0.996,0.141,2.478,0.513,3.229-0.304c1.589-1.73,0.902-4.706,0.8-6.847C55.693,62.848,55.567,61.75,54.766,61.237z"/><path d="M54.766,45.338c-0.43-0.276-0.966-0.313-1.477-0.342c-1.167-0.067-2.334-0.134-3.501-0.201    c-1.205-0.069-2.441-0.135-3.591,0.231c-1.308,0.415-2.174,1.321-2.397,2.638c-0.046,0.274,0.153,3.136,0.015,3.136    c0,2.977-0.419,4.33,2.976,4.271c1.564-0.027,3.141-0.213,4.699-0.047c0.07,0.007,0.144,0.017,0.22,0.028    c0.996,0.141,2.478,0.513,3.229-0.304c1.589-1.73,0.902-4.706,0.8-6.847C55.693,46.949,55.567,45.851,54.766,45.338z"/><path d="M34.766,61.237c-0.43-0.276-0.966-0.313-1.477-0.342c-1.167-0.067-2.334-0.134-3.501-0.201    c-1.205-0.069-2.441-0.135-3.591,0.231c-1.308,0.415-2.174,1.321-2.397,2.638c-0.046,0.274,0.153,3.136,0.015,3.136    c0,2.977-0.419,4.33,2.976,4.271c1.564-0.027,3.141-0.213,4.699-0.047c0.07,0.008,0.144,0.017,0.22,0.028    c0.996,0.141,2.478,0.513,3.229-0.304c1.589-1.73,0.902-4.706,0.8-6.847C35.693,62.848,35.567,61.75,34.766,61.237z"/></g></g></svg>`
	 var resize = ["<span style='margin-top:-3px;margin-left:-3px;opacity:.5;'>"+`<img style="pointer-events:none;" draggable="false" src='data:image/svg+xml;utf8,`+img1+`' >`+"</span>"];
	 var resizer;
	 var modeIndex = 0;
	 var mode = [{
		 	name:"Text",
			klipse:'eval-javascript',
			codeMirror:'null',
			defaultText:'Hello there!'
		},
		{
			name:"Js",
			klipse:'eval-javascript',
			codeMirror:'javascript',
			defaultText:'Hello there!',
			template1:`var str = "BEGIN:\\n";
function print(arg){
	str += arg + "\\n";
}
// Begin Workspace

for(var i = 0;i < 5;i++){
	print("Hello there world!")
}

var canvas = document.getElementById("wb-canvas");
canvas.innerHTML = \`<div style="width:100px;height:
100px;position:absolute;top:50px;left:50px;
background-color:red"></div>\`

// End Workspace
str +="END";`
		},
		{
			"name":"Py",
		 	klipse:'eval-python-client',
		 	codeMirror:'python',
			 defaultText:'Hello there!',
			 template1:`import turtle

print "Hello world!"
			 
t = turtle.Turtle()
			 
for c in ['red', 'green', 'yellow', 'blue']:
	t.color(c)
	t.forward(75)
	t.left(90)`
		},
		{
			name:"C++",
			klipse:'eval-cpp',
			codeMirror:'text/x-c++src',
			defaultText:'Hello there!',
			template1:`#include <iostream>
using namespace std;
int main() {
	int a = 10;
	//cin >> a;
	cout << a*10 << endl;
	cout << "Hello World!";
	return 0;
}`
		}];

	var container = document.getElementById('wb-editor-container');
	var eval_code = Tools.debounce(Tools.eval_editor,250)
	
	function toggleEditor() {
		var btn = document.getElementById("toolID-Editor");
		if(win.toggle){
			container.style.display = "none";
			btn.style.backgroundColor = "";
			btn.style.borderRadius = "";
			win.toggle=0;
		}else{
			Tools.focusWindow(container);
			if(win.max)max_win()
			else unmax_win()
			btn.style.backgroundColor = "#eeeeff";
			btn.style.borderRadius = "8px";
			container.style.display = "block";
			win.toggle=1;
			if(win.opened) return;
			win.opened = true;
			init_texteditor();
			init_window();
		}
	};

	function load_klipse(){
		var e = document.getElementById('wb-editor-result-container');
		klipse.plugin.klipsify(e, window.klipse_settings, mode[modeIndex].klipse);
	};
	
	Tools.init_editor = function() {
		Tools.editor = {};
		init_texteditor();
	};

	function change_editor(i){
		if(modeIndex==i)return;
		codeMirror.off("change",change);
		codeMirror.off("cursorActivity",cursorActivity);
		delete Tools.editor;

		modeIndex = i;
		live = false;
		var _run = document.getElementById('wb-editor-run');
		var _live = document.getElementById('wb-editor-live');

		var live_icon = document.getElementById('wb-editor-live-icon');	
		var textoptions = document.getElementById("wb-textoptions");
		$(live_icon).removeClass('fa-spin');
		var editor = document.getElementsByClassName('wb-editor')[0];
		document.getElementById('wb-editor-curmode').textContent = mode[modeIndex].name;
		if(i!=0){
			var sp = document.getElementById("wb-spell-check");
			sp.style.color='';
			sp.style.display = 'none';
			document.getElementById("wb-code-template").style.display='inline-block';
			codeMirror.removeOverlay(typoOverlay);
			spellCheck=false;
			
			_run.style.display = "inline-block";
			_live.style.display = "inline-block";
			resizer.style.backgroundColor = '#efefef';
			editor.innerHTML =`<div class="col-sm-6" id="wb-editor-input">
			</div>
			<div class="col-sm-6" id="wb-editor-result">
				<div id="wb-editor-result-container"></div>
				<div id="wb-canvas"></div>
			</div>`
			load_klipse();
		}else{
			document.getElementById("wb-spell-check").style.display = 'inline-block';
			document.getElementById("wb-code-template").style.display='none';
			textoptions.style.display = 'inline-block'
			_run.style.display = "none";
			_live.style.display = "none";
			resizer.style.backgroundColor = 'white';
			editor.innerHTML =`<div class="col-sm-12" id="wb-editor-input">
			</div>`
			init_texteditor();
		}
		
	};

	var change = function(cMirror,obj){
		//console.info("change called");
		changeCalled = true;
		if(modeIndex!=0&&(!input_init||live)){
			eval_code();
			input_init=true;
		}
		if(spellCheck)
		setLines((changeLock?-1000000:obj.from.line));		
	};

	//Hack for the spell checker
	var cursor = {line:0,ch:0};
	var cursorActivity = function(cMirror){
		//console.info("cursorActivity called")
		if(spellCheck&&!changeCalled&&!cursorLock&&cursor.ch!=0){
			//console.info("replaceRange called: cursorLock and changelock true");
			cursorLock=true;
			changeLock=true;
			codeMirror.replaceRange(
				codeMirror.getRange({line:cursor.line,ch:cursor.ch-1},cursor),
				{line:cursor.line,ch:cursor.ch-1},
				cursor);
		}
		cursor = codeMirror.getCursor()
	}

	function init_texteditor(){
		//// Initialize Firebase.

		if(!initialized){
			firebase.initializeApp(firepad_config);
		}
		
		var firepadRef = getExampleRef();
		//// Create CodeMirror (with line numbers).

		codeMirror = CodeMirror(document.getElementById('wb-editor-input'), {
			lineNumbers: true,
			mode: mode[modeIndex].codeMirror,
			lineWrapping:(modeIndex==0?true:false)
		});

		// Spelling
		if(!initialized){
			loadLanguage(typo => initSpellCheck(typo),"en_US");
		}else if(overlay_initialized&&spellCheck&&modeIndex==0){
			setLines(-1000000);
			codeMirror.addOverlay(typoOverlay);
		}

		initialized = true;

		input_init=false;
		
		codeMirror.on('change',change);
		codeMirror.on('cursorActivity',cursorActivity);

		//// Create Firepad.
		Firepad.fromCodeMirror(firepadRef, codeMirror, {
		defaultText: mode[modeIndex].defaultText
		});

		if(modeIndex!=0)
		Tools.editor.get = function(){return codeMirror.getValue()};

		// Helper to get hash from end of URL or generate a random one.
		function getExampleRef() {
			var ref = firebase.database().ref();
			if(firepad_config.childref)
				ref = ref.child(firepad_config.childref);

			if (typeof console !== 'undefined') {
				console.log('Firebase data: ', ref.toString());
			}
			return ref;
		}
	}

	function init_window(){
		document.getElementById("wb-options").addEventListener("click", toggleOptionsBar);
		document.getElementById("wb-close-options").addEventListener("click", toggleOptionsBar);
		document.getElementById("wb-textoptions").addEventListener("click", toggleToolbar);
		document.getElementById("wb-close-edit").addEventListener("click", toggleToolbar);
		document.getElementById("wb-editor-run").addEventListener("click", run);
		document.getElementById("wb-editor-live").addEventListener("click", live_eval);
		document.getElementById("close-editor").addEventListener("click", toggleEditor);
		document.getElementById("max-editor").addEventListener("click", toggleMax);
		document.getElementById("wb-spell-check").addEventListener("click", toggleSpelling);
		document.getElementById("wb-code-template").addEventListener("click", openInsertDialog);
		document.getElementById("wb-ed-insert-template").addEventListener("click", insertTemplate);
		document.getElementById("wb-code-template").addEventListener("click", openInsertDialog);
		document.getElementById("wb-ed-insert-template").addEventListener("click", insertTemplate);
		document.getElementById("wb-ed-undo").addEventListener("click", undo);
		document.getElementById("wb-ed-redo").addEventListener("click", redo);
		document.getElementById("wb-text").addEventListener("click", function(){
			change_editor(0);
		}, false);
		document.getElementById("wb-js").addEventListener("click", function(){
			change_editor(1);
		}, false);
		document.getElementById("wb-python").addEventListener("click", function(){
			change_editor(2);
		}, false);
		document.getElementById("wb-cpp").addEventListener("click", function(){
			change_editor(3);
		}, false);
		var element = document.getElementById('wb-editor');
		resizer = document.createElement('div');
		resizer.className = 'resizer';
		resizer.style.display = (win.max?"none":"block");
		resizer.style.width = '20px';
		resizer.style.height = '20px';
		resizer.style.background = 'white';
		resizer.style.position = 'absolute';
		resizer.style.right = 0;
		resizer.style.bottom = 0;
		resizer.style.cursor = 'se-resize';
		element.appendChild(resizer);
		resizer.innerHTML = resize[0];
		resizer.addEventListener('mousedown', initResize, false);
		resizer.addEventListener("touchstart",initResize,{ 'passive': false });

		function initResize() {
			$(container).css({'-webkit-user-select':'none',/* and add the CSS class here instead */
           'user-select':'none'
    		 });
			window.addEventListener('mousemove', Resize, false);
			window.addEventListener('mouseup', stopResize, false);
			window.addEventListener("touchmove",Resize,{ 'passive': false });
			window.addEventListener("touchend",stopResize,{ 'passive': false });
		}

		function Resize(e) {
			e = e || window.event;
			e.preventDefault();
			if (document.selection) {
				document.selection.empty()
			} else {
				window.getSelection().removeAllRanges()
			}
			win.w =  Math.max(280,(e.pageX - container.offsetLeft));
			win.h = Math.max(250,(e.pageY - container.offsetTop-(40 +(options_open?45:0) + (toolbar_open?30:0))));
			element.style.width = win.w + 'px';
			element.style.height = win.h + 'px';
		}

		function stopResize(e) {
			$(container).css({'-webkit-user-select':'',/* and add the CSS class here instead */
           'user-select':''
    		 })
			window.removeEventListener('mousemove', Resize, false);
			window.removeEventListener('mouseup', stopResize, false);
			window.removeEventListener("touchmove",Resize,false);
			window.removeEventListener("touchend",stopResize,false);
		}

		dragElement(document.getElementById("wb-editor-container"));
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

	}

	// max-min window
	function toggleMax() {
		if(win.max){
			unmax_win();
			win.max=false;
		}else{
			max_win()
			win.max=true;
		}
	};

	// max-min window
	function unmax_win(){
		container.style.position = "";
		container.style.zIndex= "";
		container.style.left =  (win.l? win.l - document.documentElement.scrollLeft: (65+document.documentElement.scrollLeft)) + "px";
		container.style.top =   (win.t? win.t - document.documentElement.scrollTop: (19+document.documentElement.scrollTop)) + "px"; 
		container.style.width = ''; 
		container.style.height = '';
		container.style.paddingBottom ='';
		var elem = document.getElementById('wb-editor');
		elem.style.width = (win.w ? win.w + 'px':''); 
		elem.style.height =(win.h ? win.h + 'px':'');
		if(resizer)resizer.style.display = "block";
	};

	function max_win(){
		container.style.position = "fixed";
		container.style.zIndex=100;
		win.l = $(container).offset().left;
		win.t = $(container).offset().top;
		container.style.left =  '0px'; 
		container.style.top =  '0px'; 
		container.style.width = '100%'; 
		container.style.height = '100%';
		container.style.paddingBottom =(45 +(options_open?45:0) + (toolbar_open?30:0)) + 'px';
		var elem = document.getElementById('wb-editor');
		win.w = $(elem).width();
		win.h =$(elem).height();
		elem.style.width = '100%'; 
		elem.style.height = '100%';
		if(resizer)resizer.style.display = "none";
	};

	//Options Bar (modes)
	var options_open = false;
	function toggleOptionsBar() {
		var elem = document.getElementById("wb-editor-container-modes");
		var main = document.getElementById('wb-editor');
		if(options_open){
			elem.style.display = 'none';
			main.style.height = ($(main).height()+45)+'px';
			options_open=false;
		}else{
			elem.style.display = 'block';
			main.style.height = ($(main).height()-45)+'px'
			options_open=true;
		}
		
	};

	// run code
	function run() {
		eval_code();
	};

	// real-time evaluation
	function live_eval() {
		var el = document.getElementById('wb-editor-live-icon');
		if(live){
			$(el).removeClass('fa-spin');
			live = false;
		}else{
			live = true;
			$(el).addClass('fa-spin');
			eval_code();
		}
	};

	//Text toolbar
	var toolbar_open = true;
	function toggleToolbar() {
		var elem = document.getElementById("wb-editor-container-toolbar");
		var main = document.getElementById('wb-editor');
		if(toolbar_open){
			elem.style.display = 'none';
			main.style.height = ($(main).height()+30)+'px';
			toolbar_open=false;
		}else{
			elem.style.display = 'block';
			main.style.height = ($(main).height()-30)+'px'
			toolbar_open=true;
		}
		
	};

	//Spelling
	function loadLanguage(done,lang) {
		//console.log('loading aff');
		  var xhr_aff = new XMLHttpRequest();
		  xhr_aff.open("GET", "https://rawgit.com/ropensci/hunspell/master/inst/dict/"+lang+".aff", true);
		  xhr_aff.onload = function() {
			  if (xhr_aff.readyState === 4 && xhr_aff.status === 200) {
				  //console.log('aff loaded');
				var xhr_dic = new XMLHttpRequest();
				xhr_dic.open("GET", "https://rawgit.com/ropensci/hunspell/master/inst/dict/"+lang+".dic", true);
				xhr_dic.onload = function() {
					if (xhr_dic.readyState === 4 && xhr_dic.status === 200) {
					  //console.log('dic loaded');
					  done(new Typo(lang, xhr_aff.responseText, xhr_dic.responseText, { platform: "any" }));
					} else {
					  console.log('failed loading aff');
					  done(false);
					}
				};
				xhr_dic.send(null);
			  } else {
				console.log('failed loading aff');
				done(false);
			  }
		  };
		  xhr_aff.send(null);
	}
	
	//Spelling
	function initSpellCheck(typo) {
		if (!typo) return;
		
		// Define what separates a word
		var rx_word = "!\"#$%&()*+,-./:;<=>?@[\\]^_`{|}~ ";
	
		// Ignore words that are just numbers
		var rx_ignore = /^[0-9]+$/;

		typoOverlay = {
			token: function(stream) {
				if(stream.sol()){
					linenum++;
					if(changeCalled){
						if(!changeLock){
							//console.info("cursorlock false");
							cursorLock=false;
						}
						//console.info("changeLock false");
						changeLock=false;
					}
					//console.info("changeCalled false");
					changeCalled=false;
				}
				
				var ch = stream.peek();
				var word = "";
	
				if (rx_word.includes(ch)) {
					stream.next();
					return null;
				}
	
				while ((ch = stream.peek()) && !rx_word.includes(ch)) {
					word += ch;
					stream.next();
				}
				var c = codeMirror.getCursor();
				if(!(linenum==c.line&&stream.column()<c.ch&&c.ch-(stream.column()+word.length)<1))
					if (!typo.check(word)&&!word.match(rx_ignore)) return "spell-error"; // CSS class: cm-spell-error
			}
		};
		overlay_initialized=true;
		if(spellCheck&&modeIndex==0){
			setLines(-1000000);
			codeMirror.addOverlay(typoOverlay);
		}
	}

	//Spelling
	function setLines(start){
		startline = start;
		linenum = startline - 1;
	}
	
	//Spelling
	function toggleSpelling() {
		if(!overlay_initialized)return;
		if(spellCheck){
			document.getElementById("wb-spell-check").style.color='';
			codeMirror.removeOverlay(typoOverlay);
			spellCheck=false;
		}else{
			document.getElementById("wb-spell-check").style.color='green';
			setLines(-1000000);
			codeMirror.addOverlay(typoOverlay);
			spellCheck=true;
		}
	};

	//Code Template
	function openInsertDialog() {
		$("#myModal").modal();
	};

	//Code Template
	function insertTemplate() {
		codeMirror.setValue(mode[modeIndex].template1);
		run();
	};
	
	//Undo
	function undo() {
		codeMirror.undo();
	};

	//Redo
	function redo() {
		codeMirror.redo();
	};

	function draw() {
	}


	Tools.add({ //The new tool
		"name": "Editor",
		"icon": "E",
		"iconHTML":"<i id='edit-icon' style='color: #FF8C00;margin-top:7px' class='fa fa-pencil-square'></i>",
		//"shortcut": "e",
		"listeners": {},
		"draw": draw,
		"oneTouch":true,
		"onstart":toggleEditor,
		"mouseCursor": "crosshair",
		"stylesheet": "tools/editor/editor.css"
	});

})(); //End of code isolation