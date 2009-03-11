/**
 * @fileoverview This demo is used for Marker Cluster. It will show 100 markers.
 * @author Xiaoxi Wu
 */

(function() {
   var map = null;
   var pics = null;
   var mgr = null;
   var markers = [];

   function $(element) {
     return document.getElementById(element);
   }

   var SMC = {
     init: function() {
       if(GBrowserIsCompatible()) {
         map = new GMap2($('map'));
         map.setCenter(new GLatLng(39.91, 116.38), 2);
         map.addControl(new GLargeMapControl());

         var markers = [];
         for (var i = 0; i < 100; ++i) {
           var latlng = new GLatLng(data.photos[i].latitude, data.photos[i].longitude);
           var marker = new GMarker(latlng);
           markers.push(marker);
         }
         var markerCluster = new MarkerCluster(map, markers);
       }

     }
   };
   window.SMC = SMC || window.SMC;
 })();
