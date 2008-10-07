/**
* @name SnapToRoute
* @version 1.0
* @author Bjorn Brala (www.geostart.nl), Marcelo (maps.forum.nu), Bill Chadwick
* @copyright (c) 2008 SWIS BV - www.geostart.nl
* @fileoverview Snap marker to closest point on a line
   Based on Distance to line example by Marcelo, maps.forum.nu
   http://maps.forum.nu/gm_mouse_dist_to_line.html
   Then 
    @ work of Björn Brala - Swis BV who wrapped the algorithm in a class operating on GMap Objects
   And now 
    Bill Chadwick who factored the basic algorithm out of the class (removing much intermediate storage of results)
       and added distance along line to nearest point calculation
*
*
*   Usage:
*
*   Create the class
*       var snapToRoute = new SnapToRoute(map, marker, polyline);
*
*   If needed change the marker or polyline subjects. use null when no update
*       Change Both:
*           snapToRoute.updateTargets(marker, polyline); 
*       Change marker:
*           snapToRoute.updateTargets(marker, null); 
*       Change polyline:
*           snapToRoute.updateTargets(null, polyline); 
*
*
*   Distance along route for point
*       snapToRoute.getDistAlongRoute(latlng);
**/



/**
*   @constructor
*   @desc Create SnapToRoute
*   @param map {GMap2} object to move along the route
*   @param startMarker {GMarker} object to move along the route
*   @param polyline {GPolyline} object - the line to snap to
**/
function SnapToRoute(map, startMarker, polyline) {
      
  this.routePoints    = [];
  this.routePixels    = [];
  this.routeOverlay   = null;
  this.normalProj     = G_NORMAL_MAP.getProjection();    
  this.map_           = map;
  this.marker_        = startMarker;
  this.polyline_     = polyline;

  this.init();

}


/**
*   @desc Initialize the objects.
*   @private
**/ 
SnapToRoute.prototype.init = function () {
  this.loadLineData();
  this.loadMapListener();    
}   

/**
*   @desc Change the marker or polyline the class looks at.
*   @param marker {GMarker} Optional object to move along the route, or null if you do not want to change the target
*   @param polyline {GPolyline} Optional GPolyline to snap to, or null if you do not want to change the target
**/
SnapToRoute.prototype.updateTargets = function (marker, polyline) {
  this.marker_   = marker   || this.marker_;
  this.polyline_ = polyline || this.polyline_;
  this.loadLineData();
}
  
/**
*   @desc internal use only, Load map listeners to calculate and update this.marker position.
*   @private
**/
SnapToRoute.prototype.loadMapListener = function () {
  var self = this;
  GEvent.addListener(self.map_, 'mousemove', GEvent.callback(self, self.updateMarkerLocation));
  GEvent.addListener(self.map_, 'zoomend', GEvent.callback(self, self.loadLineData));
}
    
/**
*   @desc internal use only, Load route points into RoutePixel array for calculations, do this whenever zoom changes 
*   @private
**/
SnapToRoute.prototype.loadLineData = function () {
  var zoom = this.map_.getZoom();
  this.routePixels = [];
  for (var i = 0; i < this.polyline_.getVertexCount(); i++) {
    var Px = this.normalProj.fromLatLngToPixel(this.polyline_.getVertex(i), zoom);
    this.routePixels.push(Px);
  }
}

/**
*   @desc internal use only, Handle the move listeners output and move the given marker.
*   @param GLatLng()
*   @private
**/
SnapToRoute.prototype.updateMarkerLocation = function (mouseLatLng) {
  var markerLatLng = this.getClosestLatLng(mouseLatLng);
  this.marker_.setPoint(markerLatLng);
}

/**
*   @desc Get closest point on route to test point
*   @param latlng {GLatLng} The point to test
*   @return {GLatLng};
**/
SnapToRoute.prototype.getClosestLatLng = function (latlng) {
  var r = this.distanceToLines(latlng);
  return this.normalProj.fromPixelToLatLng(new GPoint(r.x, r.y), this.map_.getZoom());
}

/**
*   @desc Get distance along route in meters of closest point on route to test point
*   @param latlng {GLatLng} Optional test point, if no point is given the marker set in the object is used.
*   @return {Number} Distance in meters;
**/
SnapToRoute.prototype.getDistAlongRoute = function (latlng) {
  if ( latlng == null ) {
    var latlng = this.marker_.getLatLng();
  }
  
  var r = this.distanceToLines(latlng);
  return this.getDistToLine(r.i, r.to);
} 

/**
*   @desc internal use only, gets test point xy and then calls fundamental algorithm
*   @private
**/
SnapToRoute.prototype.distanceToLines = function (mouseLatLng) {
  var zoom        = this.map_.getZoom();
  var mousePx     = this.normalProj.fromLatLngToPixel(mouseLatLng, zoom);
  var routePixels = this.routePixels;                
  return getClosestPointOnLines(mousePx,routePixels);
}  
  
/**
*   @desc internal use only, find distance along route to point nearest test point
*   @private
**/
SnapToRoute.prototype.getDistToLine = function (line, to) {
  var routeOverlay = this.polyline_;
  var d = 0;
  for (var n = 1; n < line; n++) {
    d += routeOverlay.getVertex(n - 1).distanceFrom(routeOverlay.getVertex(n));
  }
  d += routeOverlay.getVertex(line - 1).distanceFrom(routeOverlay.getVertex(line)) * to;
  
  return d;
}

  



/**
*   @desc Static function. Find point on lines nearest test point
*   test point pXy with properties .x and .y
*   lines defined by array aXys with nodes having properties .x and .y 
*   return is object with .x and .y properties and property i indicating nearest segment in aXys 
*   and property from the fractional distance of the returned point from aXy[i-1]
*   and property to the fractional distance of the returned point from aXy[i]    
*   @param object pXy 
*   @param array aXys
*   @private
**/
function getClosestPointOnLines (pXy,aXys) {
  var minDist;       
  var to;
  var from;
  var x;
  var y;
  var i;
  var dist;
      
  if (aXys.length > 1) {
    for (var n = 1; n < aXys.length ; n++) {
      if (aXys[n].x != aXys[n - 1].x) {
        var a = (aXys[n].y - aXys[n - 1].y) / (aXys[n].x - aXys[n - 1].x);
        var b = aXys[n].y - a * aXys[n].x;
        dist = Math.abs(a * pXy.x + b - pXy.y) / Math.sqrt(a * a + 1);
      } else {
        dist = Math.abs(pXy.x - aXys[n].x);
      }
      
      // length^2 of line segment 
      var rl2 = Math.pow(aXys[n].y - aXys[n - 1].y, 2) + Math.pow(aXys[n].x - aXys[n - 1].x, 2);
      
      // distance^2 of pt to end line segment
      var ln2 = Math.pow(aXys[n].y - pXy.y, 2) + Math.pow(aXys[n].x - pXy.x, 2);

      // distance^2 of pt to begin line segment
      var lnm12 = Math.pow(aXys[n - 1].y - pXy.y, 2) + Math.pow(aXys[n - 1].x - pXy.x, 2);

      // minimum distance^2 of pt to infinite line
      var dist2 = Math.pow(dist, 2);
      
      // calculated length^2 of line segment
      var calcrl2 = ln2 - dist2 + lnm12 - dist2;

      // redefine minimum distance to line segment (not infinite line) if necessary
      if (calcrl2 > rl2) {
        dist = Math.sqrt(Math.min(ln2, lnm12));
      }
      
      if ((minDist == null) || (minDist > dist)) {
        to  = Math.sqrt(lnm12 - dist2) / Math.sqrt(rl2);
        from = Math.sqrt(ln2 - dist2) / Math.sqrt(rl2);
        minDist = dist;
        i = n;               
      }            
    }
        
    if (to > 1) {
      to = 1;        
    }

    if (from > 1) {
      to = 0;
      from = 1;
    }

    var dx = aXys[i - 1].x - aXys[i].x;
    var dy = aXys[i - 1].y - aXys[i].y;

    x = aXys[i - 1].x - (dx * to);
    y = aXys[i - 1].y - (dy * to);

  }    

  return {'x': x, 'y': y, 'i': i, 'to': to, 'from': from};
}
