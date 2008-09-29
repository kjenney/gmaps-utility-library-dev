/**
* MarkerControl Class v0.2
*  Copyright (c) 2008 
*  Author: Chris Marx
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* 
*       http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* This class lets you add a marker control to the ExtMyMapsControl framework.
*/

function MarkerControl(opt_opts) {
  var me = this;
  me.name = "markerControl"; //inheriting from GControl overrides the default constructor name, so we need this instead. Do Not Override
  me.zuper; //is set when passed to ExtMyMapsControl.addControl()  
  me.clickHandler = null;
  me.icons = {
    standard:new GIcon(G_DEFAULT_ICON,"images/blue-dot.png")
  }
  me.infoWindowHtml = "";
  
  /**
  * Arrays are used for storage.
  * Remember to check for nulls when exporting data
  * Markers are tied to their index, so entries are cleared, not deleted
  * titles/descriptions are stored as [][0,1] with 0,1 entries for current/previous values
  */
  me.storage = {
    markerArray:[],
    markerTitles:[],
    markerDescriptions:[]
  }
  
  //self documenting object with default settings specific for MarkerControl
  me.markerOptions = {
    button_opts:{
      img_up_url:'http://www.google.com/intl/en_us/mapfiles/ms/t/Bmu.png',
      img_down_url:'http://www.google.com/intl/en_us/mapfiles/ms/t/Bmd.png',
      name:'point', //TODO still need this?
      tooltip:'Add a placemark'
    },
    position:{
      controlPosition:[175,3]
    },
    tooltip:{
      anchor:[-30,-8],
      cursor_on:"url(http://maps.google.com/mapfiles/ms/micons/blue-dot.png) 16 38,default",
      cursor_off:"url(http://maps.google.com/intl/en_us/mapfiles/openhand.cur),default",
      title:"Click on the map to create a new marker"
    },
    newMarker:{ //rename to newMarkerOptions??
      icon:me.icons.standard,
      dragCrossMove:false,
      title:"Drag to move this placemark",
      clickable:true,
      draggable:true,
      bouncy:false,
      bounceGravity:1,
      autoPan:true
      //zIndexProcess 
    },
    multiEdit:false,
    cssId:"emmc-marker",
    optionalGeometryListeners:null, /*GEvent.addListener(marker,"dragend", function(){});*/ //save position?
    autoSave:false 
  }
  
  //overide the default marker options
  if(typeof(opt_opts)!="undefined"){
  	for (var o in opt_opts) {
      if(typeof(opt_opts[o]) === "object"){
        for (var p in opt_opts[o]){
          me.markerOptions[o][p] = opt_opts[o][p]; //if deeper cloning is needed, rewrite with recursion
        }  
      } else {
        me.markerOptions[o] = opt_opts[o];  
      }  		
  	}
  } else {
  	//me.zuper.debug("??");
  }
  
};

MarkerControl.prototype = new GControl();

/**
 * Expected by GControl
 */
MarkerControl.prototype.getDefaultPosition = function(){
  var me = this;
  return me.zuper.getDefaultPosition(me.markerOptions.position);
};

/**
 * Extend for marker specific implementation
 * @param {GMap2} map The map that has had this ExtMapTypeControl added to it.
 * @return {DOM Object} Div that holds the control
 */ 
MarkerControl.prototype.initialize = function(map){
  var me = this;  
  me.container = document.createElement("div");
  me.container.id = "mymaps-control-"+me.markerOptions.button_opts.name;
  var button = me.zuper.createButton({
      controlName:me.name,
      button_opts:me.markerOptions.button_opts,
      startDigitizing:function(){
        me.startDigitizing();
      },
      stopDigitizing:function(t){
        me.stopDigitizing(t);
      }
  });
  me.container.appendChild(button.img);
  map.getContainer().appendChild(me.container);
  
  //custom initializations
  me.tooltip();
  //construct the infowindowhtml
  me.assembleInfoWindowHtml();
  
  return me.container;
};

MarkerControl.prototype.startDigitizing = function() {
  var me = this, zuper = me.zuper, map = zuper.map;
  me.tooltip.on(me.markerOptions.tooltip.title);
  me.clickHandler = GEvent.addListener(map, "click", function(overlay,latlng){
    var marker = me.createMarker(latlng,me.infoWindowHtml);
    map.addOverlay(marker);
            
    //TODO would allow for multiple additions of markers
    if (!me.markerOptions.multiEdit) {
      me.stopDigitizing();
      GEvent.trigger(marker,"click"); //open the infowindow
      //need hook here for custom callbacks?
    } else {
      //TODO default behavior for multi edits??
    }
    
  });
};

MarkerControl.prototype.stopDigitizing = function(toggleButtons) {
  var me = this;
  try{GEvent.removeListener(me.clickHandler);}catch(e){};
  me.tooltip.off();
  if (toggleButtons !== false) {
    me.zuper.toggleButtons();
  }
};

/**
 * Creates instance of tooltips for MarkerControl, which replaces the function below
 * @see ExtMyMapsControl#tooltipFactory
 */
MarkerControl.prototype.tooltip = function(){
  var me = this;  
  var tooltip = me.zuper.tooltipFactory(me.markerOptions.tooltip);  
  //note this function is being redefined by the tooltip object from zuper
  me.tooltip = tooltip;
  return tooltip;
};

/**
 * Assembles html fragments from mymaps html template file at initialization
 */
MarkerControl.prototype.assembleInfoWindowHtml = function(){
  var me = this, zuperHtml = me.zuper.infoWindowHtml;
  //add generic template parts and insert markerControl parts
  me.infoWindowHtml = zuperHtml["template_1"] + zuperHtml["marker_1"] + zuperHtml["template_2"] + zuperHtml["marker_2"];
}

/**
 * Creates (and recreates) markers
 * @param {GLatLng} latlng 
 * @param {String} html 
 * @param {Number} opt_currentIndex Override automatic index increment for recreating an existing marker
 * @param {GIcon} opt_currentIcon Override current icon for recreating existing marker
 */
MarkerControl.prototype.createMarker = function(latlng, html, opt_currentIndex, opt_currentIcon){
  var me = this, opts = me.markerOptions;
  var isNewMarker = (typeof(opt_currentIndex) === "number") ? false : true;
  var index = (isNewMarker) ? me.storage.markerArray.length : opt_currentIndex;
  var marker = new GMarker(latlng, opts.newMarker);   //option to set title or other info when used to create markers can be set in opts.newMarker
  marker.index = index;
  //TODO - refactor using a full storedOptions object
  //marker.storedOptions = opts.newMarker;
  //marker.storedOptions.icon = opt_currentIcon || opts.newMarker.icon;
  marker.storedIcon = opt_currentIcon || opts.newMarker.icon;
  me.addGeometryListeners(marker,html); 
 
  //store marker and if its a new marker, create an array to store marker info
  me.storage.markerArray[index] = marker;
  if (isNewMarker) {
    me.storage.markerTitles[index] = [];
    me.storage.markerDescriptions[index] = [];
  }  
  return marker;
};

/**
 * Add's listeners to a geometry. Separated from geometry creation function for easier extension and overriding
 * @param {Object} marker
 * @param {Object} html
 */
MarkerControl.prototype.addGeometryListeners = function(marker, html){
  var me = this;
  GEvent.addListener(marker, "click", function() {
    marker.openInfoWindowHtml(html);
    me.bindInfoWindow(marker);
  });
  
  if(me.markerOptions.optionalGeometryListeners){
    me.markerOptions.optionalGeometryListeners();
  }
}

/**
 * TODO, a mouseover/out implementation for better tooltips (on the markers)
 * @param {Object} index
 */
MarkerControl.prototype.markerTooltip = function(){
  //
}

/**
 * update too???
 * @param {Number} index
 * @see ExtMyMapsControl#bindInfoWindow
 */
MarkerControl.prototype.bindInfoWindow = function(marker){
  var me = this, opts = me.markerOptions, index = marker.index;
  
  //update the style link display
  var styleLink = (me.zuper.ie) ? get$("msiwsi").childNodes[0] : get$("msiwsi").childNodes[1];
  var markerIcon = marker.getIcon();
  styleLink.setAttribute("src",markerIcon.image);
  styleLink.style.width = markerIcon.iconSize.width + "px";     //TODO scale these values?
  styleLink.style.height = markerIcon.iconSize.height + "px"; 
      
  //call super method
  me.zuper.bindInfoWindow({
    type:"point",
    index:index,
    //cssId:opts.cssId,  //no longer needed
    geometry:me.storage.markerArray,
    title:me.storage.markerTitles,
    description:me.storage.markerDescriptions,
    geometryStyleFunc:function(){
      me.bindStyleInfoWindow(index);
    },
    //stores value for an undo
    undoStyling:function(){
      me.changeStyling(index,marker.storedIcon);
    },
    commitStyling:function(){
      marker.storedIcon = new GIcon(opts.newMarker.icon);
    }
  });
};

/**
 * Binds Info Window for Marker Styling (change icons, etc)
 * @see #bindInfoWindow
 */
MarkerControl.prototype.bindStyleInfoWindow = function(index){
  var me = this;
  
  //dom node traversal for marker icons
  var iconImages = get$("msim-icons").getElementsByTagName("img");
  
  //reference to the marker
  var marker = me.storage.markerArray[index];
  
  for(var i=0; i<iconImages.length; i++){
    var iconImage = iconImages[i];
    
    //add hover effect
    GEvent.addDomListener(iconImage,"mouseover",function(){
      this.style.borderColor = "#3D69B1";
    });
    GEvent.addDomListener(iconImage,"mouseout",function(){
      this.style.borderColor = "#FFFFFF";
    });
    
    //change marker's icon
    GEvent.addDomListener(iconImage,"click",function(){
      //determine icon from markerIcon multidimensional array
      var position = this.style.backgroundPosition.split(" ");
      var x = Math.abs(position[0].split("px")[0]) / 32;
      var y = Math.abs(position[1].split("px")[0]) / 32;        
      
      var markerIcon = me.checkIconStatus(x,y);         
      
      me.changeStyling(index,me.icons[markerIcon.name]);       

      //TODO use setImage for existing icons instead of recreate in #changeStyling?
      //me.storage.markerArray[index].setImage(url?+markerIcon.images[x]);              
    });
  }
};

/**
 * Check if named icon from html(data) download exists. 
 * If not create a new icon, else change its image
 * TODO support for used created icons
 * @param {Integer} x
 * @param {Integer} y
 * @param {String} spriteImage
 */
MarkerControl.prototype.checkIconStatus = function(x,y){
  var me = this; 
  
  //check if "y" position in loaded icons is defined, otherwise, take the last defined icon (should be kml) 
  var markerIcon = me.zuper.infoWindowHtml["markerIcons"][y] || me.zuper.infoWindowHtml["markerIcons"][me.zuper.infoWindowHtml["markerIcons"].length-1];

  //determine source of icons, then switch icon image or create icon
  switch(true){
    case (markerIcon.name !== "kml") :
      if(typeof(me.icons[markerIcon.name]) === "undefined"){
        me.createIcon(markerIcon,x);
      } else {
        me.icons[markerIcon.name].image = markerIcon.imageUrl + markerIcon.images[x];
      }        
    break;
    case (markerIcon.name === "kml") :     
      var imageUrl = markerIcon.imageUrl + "pal" + (y-1) + "/icon" + x;
      if(typeof(me.icons[markerIcon.name]) === "undefined"){
        markerIcon.shadow = imageUrl + "s.png";
        me.createIcon(markerIcon, imageUrl + ".png");
      } else {
        me.icons[markerIcon.name].image = imageUrl + ".png";
      }
    break;
  } 
    
  return markerIcon;  
  //TODO extend for custom sprite-based icons?
}

/**
 * Function that changes style of marker
 * @see #bindInfoWindow
 * @see #bindStyleInfoWindow
 * @required
 */
MarkerControl.prototype.changeStyling = function(index,icon){
  var me = this;
  var marker = me.storage.markerArray[index];     
  
  //reset global current icon (and without referencing original icon)
  me.markerOptions.newMarker.icon = new GIcon(icon); 
  
  //recreate with new icon
  map.removeOverlay(marker);       
  map.addOverlay(me.createMarker(marker.getLatLng(),me.infoWindowHtml,index,marker.getIcon())); 
  GEvent.trigger(me.storage.markerArray[index],"click");
};

/**
 * createIcon - an Icon factory method for creating new icons, which are automatically stored in #MarkerControl.icons object
 * @param {Object} opts
 *   @param {String} name - name of the icon
 *   @param {Array} iconSize - icon width and height, respectively
 *   @param {String} shadow - url of the shadow image
 *   @param {Array} shadowSize - shadow width and height, respectively
 *   @param {Array} anchor - x and y position of icon anchor
 *   @param {Array} wAnchor - x and y postition of infoWindow anchor
 *   @param {Array} images - array of alternate images for icon
 *   @param {String} imageRef - image url, either the numeric position in "images" array or a full url
 */
MarkerControl.prototype.createIcon = function(opts,imageRef){
	var me = this;
	var icon = new GIcon();
  icon.image = (!isNaN(parseInt(imageRef))) ? opts.imageUrl+opts.images[imageRef] : imageRef;
  if(opts.shadow){
		icon.shadow = opts.shadow;
		icon.shadowSize = new GSize(opts.shadowSize[0],opts.shadowSize[1])
	}
	icon.iconSize = new GSize(opts.iconSize[0], opts.iconSize[1]);
	icon.iconAnchor = new GPoint(opts.anchor[0], opts.anchor[1]);
	icon.infoWindowAnchor = new GPoint(opts.wAnchor[0], opts.wAnchor[1]);
  icon.dragCrossAnchor = (typeof(opts.dragCrossAnchor)!=="undefined")?new GPoint(opts.dragCrossAnchor[0],opts.dragCrossAnchor[1]):new GPoint(2,8);
	icon.transparent = opts.transparent || "";
	//TODO doesn't work for version 2.x at the moment. (havent checked lately)
	//icon.imageMap = opts.imageMap;
  //custom property
  icon.name = opts.name;
	me.icons[opts.name] = icon;
};

/**
 * LoadMarkers - loads markers from kml or json, tries to resolve style to existing icon
 * @param {record} - json representation of marker
 */
MarkerControl.prototype.loadMarkers = function(record){
  var me = this;
   
  var markerIcon = me.checkIconStatus(record.style.icon.x,record.style.icon.y)
  me.markerOptions.newMarker.icon = new GIcon(me.icons[markerIcon.name]); //could this be combined with MarkerControl#checkIconStatus?
  
  //override other markerOptions?
  var marker = me.createMarker(new GLatLng(record.coordinates[0].lat,record.coordinates[0].lng),me.infoWindowHtml);
  me.storage.markerTitles[marker.index] = [record.title,record.title];
  me.storage.markerDescriptions[marker.index] = [record.description,record.description];
  me.zuper.map.addOverlay(marker); 
  return marker;   
};

