/**
 * Main Map Script
 */
var map;
var myMapsControl; //for testing, give firebug access
var markerControl; //ditto
var polygonControl;
var temp;

GEvent.addDomListener(window,"load",function(){
  if (GBrowserIsCompatible()) {
  
    map = new GMap2(document.getElementById("map_canvas"));
    map.setCenter(new GLatLng(37.88, -122.442626), 10);
    map.addControl(new GLargeMapControl());
    map.addControl(new GHierarchicalMapTypeControl());
    map.addMapType(G_PHYSICAL_MAP);
    map.addMapType(G_SATELLITE_3D_MAP);
    map.enableScrollWheelZoom();
		
    myMapsControl = new ExtMyMapsControl();
    markerControl = new MarkerControl();
    polygonControl = new PolygonControl();
    myMapsControl.addControl(markerControl);
    myMapsControl.addControl(polygonControl);
    map.addControl(myMapsControl);
    
    myMapsControl.loadData({
      type:"json",
      url:"data/testdata.js"
    });
    
    myMapsControl.loadData({
      type:"kml",
      url:"data/example.xml"
    });
    
    //for testing
    myMapsControl.options.autoSave = false;
    
  }
});

GEvent.addDomListener(window,"unload",function(){
	GUnload();
});