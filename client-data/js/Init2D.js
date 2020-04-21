

/*****
*
*   globals
*
*****/
var svgns  = "http://www.w3.org/2000/svg";
var azap, mouser;
var points = new Array();
var shapes = new Array();
var info;


/*****
*
*   init
*
*****/
function init(e) {
    if ( window.svgDocument == null )
        svgDocument = e.target.ownerDocument;
    azap   = new AntiZoomAndPan();
    mouser = new Mouser();

    var background = svgDocument.getElementById("rect_1");


    azap.appendNode(mouser.svgNode);
    azap.appendNode(background);
}
