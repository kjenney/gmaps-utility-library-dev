/**
* PolygonControl Class v0.1
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
* This class lets you add a polygon control for digitizing polygons to the ExtMyMapsControl framework.
*/

function PolygonControl(opt_opts) {
  var me = this;
  me.name = "polygonControl";
  me.zuper;
  me.digitizerShape;
  me.editLineHandler = null;
  me.endLineHandler = null;
  me.styles = {
    standard:{}//TODO
  }
  
  /**
  * Array used for storage. Remember to check for nulls when exporting data
  * Geometries are tied to their index, so entries are cleared, not deleted
  * titles/descriptions are stored as [][0,1] with 0,1 entries for current/previous values
  */
  me.storage = [];
  
  //self documenting object with default settings specific for PolygonControl
  me.polygonOptions = {
    button_opts:{
      img_up_url:'http://www.google.com/intl/en_us/mapfiles/ms/t/Bpu.png',
      img_down_url:'http://www.google.com/intl/en_us/mapfiles/ms/t/Bpd.png',
      name:'polygon',
      tooltip:'Draw a shape'
    },
    position:{
      controlPosition:[210,3]
    },
    tooltip:{
      anchor:[-30,-8],
      cursor_on:"", //only for overriding default digitizing cursor
      cursor_off:"",
      titles:{
         start:"Click to start drawing a shape",
         middle:"Click to continue drawing a shape",
         end:"Click a vertex once, or double click on the map to end this shape"
      }
    },
    newPolygonOptions: { 
      strokeColor:"#000000",
      strokeWeight:3,
      strokeOpacity:0.25,
      fillColor:"#0000FF",
      fillOpacity:0.45,
      opts:{
        clickable:true
      }
    },
    multiEdit:false, //need this for polys?
    cssId:"emmc-polygon",
    optionalGeometryListeners:null,
    autoSave:false     
  }
  
  //overide the default marker options
  if(typeof(opt_opts)!="undefined"){
  	for (var o in opt_opts) {
      if(typeof(opt_opts[o]) === "object"){
        for (var p in opt_opts[o]){
          me.polygonOptions[o][p] = opt_opts[o][p];
        }  
      } else {
        me.polygonOptions[o] = opt_opts[o];  
      }  		
  	}
  } else {
  	//me.zuper.debug("??");
  }  
};

PolygonControl.prototype = new GControl();

/**
 * Expected by GControl, sets control position 
 */
PolygonControl.prototype.getDefaultPosition = function(){
  var me = this;
  return me.zuper.getDefaultPosition(me.polygonOptions.position);
};

/**
 * Extend for polygon specific implementation
 * @param {GMap2} map The map that has had this ExtMapTypeControl added to it.
 * @return {DOM Object} Div that holds the control
 */ 
PolygonControl.prototype.initialize = function(map){
  var me = this;  
  me.container = document.createElement("div");
  me.container.id = "mymaps-control-"+me.polygonOptions.button_opts.name;
  var button = me.zuper.createButton({
      controlName:me.name,
      button_opts:me.polygonOptions.button_opts,
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

/**
 * 
 * @see #newGPolygon
 */
PolygonControl.prototype.startDigitizing = function() {
  var me = this, zuper = me.zuper, map = zuper.map;
  me.tooltip.on(me.polygonOptions.tooltip.titles["start"]);
  me.digitizerShape = me.newGPolygon([], me.polygonOptions.newPolygonOptions);  
  map.addOverlay(me.digitizerShape);
  me.digitizerShape.enableDrawing({});
  
  //change the tooltip text while digitizing
  me.editLineHandler = GEvent.addListener(me.digitizerShape,"lineupdated",function(){
    switch(me.digitizerShape.getVertexCount()){
      case 2: me.tooltip.tooltipContainer.innerHTML = me.polygonOptions.tooltip.titles["middle"];
      break;
      case 3: me.tooltip.tooltipContainer.innerHTML = me.polygonOptions.tooltip.titles["end"];
      break;
    }
  });
  
  //listen for cancel events
  GEvent.addListener(me.digitizerShape,"cancelline",function(){
    me.stopDigitizing();
  });
  
  //create permanent polygon
  me.endLineHandler = GEvent.addListener(me.digitizerShape,"endline",function(latlng){
    var coords = [];
    for(var i=0;i<me.digitizerShape.getVertexCount();i++){
      coords[i] = me.digitizerShape.getVertex(i);
    }
    var polygon = me.createPolygon(coords, me.infoWindowHtml); 
    map.addOverlay(polygon);    
            
    //TODO would allow for multiple additions of polygons (need this??)
    if (!me.polygonOptions.multiEdit) {
      me.stopDigitizing();
      GEvent.trigger(polygon,"click"); //open the infowindow
    } else {
      //TODO default behavior for multi edits??
    }    
  });
};

PolygonControl.prototype.stopDigitizing = function(toggleButtons) {
  var me = this, zuper = me.zuper;
  try{GEvent.removeListener(me.endLineHandler);}catch(e){};
  me.tooltip.off();
  if (toggleButtons !== false) {
    zuper.toggleButtons();
  }
  //calling removeOverlay on an editable shape before it has been completely finalized prevents the overlay from being removed
  zuper.setLocalTimeout(function(){
    if (me.digitizerShape) {
      me.digitizerShape.disableEditing(); //shapes removed while still being edited need to have editing disabled in order to be removed completely
      zuper.map.removeOverlay(me.digitizerShape);
      me.digitizerShape = null
    }
  },500)
};

/**
 * Creates instance of tooltips for PolygonControl, which replaces the function below
 * @see ExtMyMapsControl#tooltipFactory
 */
PolygonControl.prototype.tooltip = function(){ 
  var me = this;  
  var tooltip = me.zuper.tooltipFactory(me.polygonOptions.tooltip);  
  //note this function is being redefined by the tooltip object from zuper
  me.tooltip = tooltip;
  return tooltip;
};

/**
 * Assembles html fragments from mymaps html template file at initialization
 * TODO - candidate for adding to zuper
 */
PolygonControl.prototype.assembleInfoWindowHtml = function(){
  var me = this, zuperHtml = me.zuper.infoWindowHtml;
  //add generic template parts and insert markerControl parts
  me.infoWindowHtml = zuperHtml["template_1"] + zuperHtml["polygon_1"] + zuperHtml["template_2"] + zuperHtml["polygon_2"];
}

/**
 * Creates (and recreates) polygons
 * @param {GLatLng} latlng 
 * @param {String} html 
 * @param {Number} opt_currentIndex Override automatic index increment for recreating an existing marker
 * @param {GIcon} opt_currentIcon Override current icon for recreating existing marker
 */
PolygonControl.prototype.createPolygon = function(coords, html, opt_currentIndex, opt_currentStyle){
  var me = this, opts = me.polygonOptions;
  var isNewPolygon = (typeof(opt_currentIndex) === "number") ? false : true;
  var index = (isNewPolygon) ? me.storage.length : opt_currentIndex;
  var savedStyle = opt_currentStyle || opts.newPolygonOptions;
  var polygon = me.newGPolygon(coords, savedStyle);
  polygon.index = index;
  polygon.savedStyle = savedStyle;
  polygon.unsavedStyle = {};
  //add getters and setters
  me.addGetterSetter(polygon); 
  
  me.addGeometryListeners(polygon, html);
 
  //store marker and if its a new marker, create an array to store marker info
  if (isNewPolygon) {
    me.storage[index] = {type:"polygon",geometry:polygon,title:["",""],description:["",""]};
  } else {
    me.storage[index].geometry = polygon;
  }
  return polygon;
};

/**
 * Add's listeners to a geometry. Separated from geometry creation function for easier extension and overriding
 * @param {Object} marker
 * @param {Object} html
 */
PolygonControl.prototype.addGeometryListeners = function(polygon, html){
  var me = this;
  
  polygon.enableEditing({onEvent: "mouseover"});
  polygon.disableEditing({onEvent: "mouseout"});
  GEvent.addListener(polygon,"click",function(para) {
    var latlng = para || polygon.getBounds().getCenter();
    map.openInfoWindowHtml(latlng,html);
    me.bindInfoWindow(polygon);
  });
  GEvent.addListener(polygon,"mouseover",function(){
    polygon.setFillStyle({
      opacity:(polygon.unsavedStyle.fillOpacity || polygon.savedStyle.fillOpacity) + 0.3
    });
  });
  GEvent.addListener(polygon,"mouseout",function(){
    polygon.setFillStyle({
      opacity:(polygon.unsavedStyle.fillOpacity || polygon.savedStyle.fillOpacity)
    });
  });
  
  if(me.polygonOptions.optionalGeometryListeners){
    me.polygonOptions.optionalGeometryListeners();
  }
}

/**
 * TODO, a mouseover/out implementation for better tooltips (on the polygons)
 * @param {Object} index
 */
PolygonControl.prototype.markerTooltip = function(){
 //
}

/**
 * BindInfoWindow - implement any specific behaviors, then invoke super bindIndoWindow for behaviors in infoWindow
 * @param {Number} index
 * @see ExtMyMapsControl#bindInfoWindow
 */
PolygonControl.prototype.bindInfoWindow = function(polygon){
  var me = this, opts = me.polygonOptions, index = polygon.index;
  
  //update the style link display
  var styleLink = (me.zuper.ie) ? get$("msiwsi").childNodes[0] : get$("msiwsi").childNodes[1];  //IE wants 0, firefox wants 1??
  styleLink.style.backgroundColor = polygon.savedStyle.fillColor;
  
  //TODO standardize
  var geometry = polygon;
      
  //call super method
  me.zuper.bindInfoWindow({
    type:"polygon",
    index:index,
    //cssId:opts.cssId, //not needed
    geometry:me.storage, //TODO standardize with MarkerControl
    //title:{},
    //description:{},
    geometryStyleFunc:function(){
      me.bindStyleInfoWindow(index);
    },
    //stores value for an undo
    undoStyling:function(){
      me.changeStyling(index,geometry.savedStyle);
      geometry.unsavedStyle = {};
    },
    commitStyling:function(){
      polygon.savedStyle = (polygon.unsavedStyle.strokeColor) ? polygon.unsavedStyle : polygon.savedStyle; //check for not empty unsavedStyle
      polygon.unsavedStyle = {};
      //update global current style //TODO have option for this??
      for(var o in polygon.savedStyle){
        me.polygonOptions.newPolygonOptions[o] = polygon.savedStyle[o];
      }
    }
  });
};

/**
 * Binds Info Window for Marker Styling (change icons, etc)
 * @see #bindInfoWindow
 */
PolygonControl.prototype.bindStyleInfoWindow = function(index){
  var me = this, cssId = me.zuper.options.cssId;
  
  //reference to the shape styles
  var geometry = me.storage[index].geometry;
  var savedStyle = geometry.savedStyle;
  var unsavedStyle = geometry.unsavedStyle;
  var lineColor = get$(cssId + "-line-color");
  var lineWidth = get$(cssId + "-line-width");
  var lineOpacity = get$(cssId + "-line-opacity");
  var fillColor = get$(cssId + "-fill-color");
  var fillOpacity = get$(cssId + "-fill-opacity");
  var geomStyleDiv = get$(cssId + "-style");
  
  //set colors and values for shape style
  lineColor.style.backgroundColor = unsavedStyle.strokeColor || savedStyle.strokeColor;
  lineWidth.value = geometry.getStrokeWeight();
  lineOpacity.value = geometry.getStrokeOpacity();
  fillColor.style.backgroundColor = unsavedStyle.fillColor || savedStyle.fillColor;
  fillOpacity.value = geometry.getFillOpacity();
    
  //bind inputs
  GEvent.addDomListener(lineColor,"click",function(){
    me.zuper.showColorPicker({
      target:lineColor,
      callback:function(color){
        me.changeStyling(index,{strokeColor:color});
      }
    });
  });
  GEvent.addDomListener(fillColor,"click",function(){
    me.zuper.showColorPicker({
      target:fillColor,
      callback:function(color){
        me.changeStyling(index,{fillColor: color});
      }
    });
  });
  
  //bind ok, add binding for back links
  GEvent.addDomListener(get$("emmc-geom-style-back"),"click",function(){  
    //revert to stored style
    me.changeStyling(index,{
      stroke:{color:savedStyle.strokeColor},
      fill:{color:savedStyle.fillColor}
    });
    geomStyleDiv.style.display = "none";   
  }); 
  GEvent.addDomListener(get$("emmc-msls-ok"),"click",function(){
    me.changeStyling(index,{
      strokeWeight:geometry.setStrokeWeight(lineWidth.value),
      strokeOpacity:geometry.setStrokeOpacity(lineOpacity.value),
      fillOpacity:geometry.setFillOpacity(fillOpacity.value),
      strokeColor:lineColor.style.backgroundColor,
      fillColor:fillColor.style.backgroundColor
    });
    //update the style link display
    var styleLink = (me.zuper.ie) ? get$("msiwsi").childNodes[0] : get$("msiwsi").childNodes[1]; //ie wants 0, firefox wants 1
    styleLink.style.backgroundColor = fillColor.style.backgroundColor;
    geomStyleDiv.style.display = "none";
  }); 
};

/**
 * Function that changes style of poly.
 * @see #bindStyleInfoWindow
 * @required
 */
PolygonControl.prototype.changeStyling = function(index,styles){
  var me = this;
  var geometry = me.storage[index].geometry;   
  
  //serialize from standard shape options to short names
  if(styles){
    var stroke = {}, strokeFlag = false, fill = {}, fillFlag = false;
    for(var style in styles){
      if(style.indexOf("stroke") > -1){
        var shortName = style.replace("stroke","").toLowerCase();
        stroke[shortName] = strokeFlag = styles[style];
      }
      if(style.indexOf("fill") > -1){
        var shortName = style.replace("fill","").toLowerCase();
        fill[shortName] = fillFlag = styles[style];
      }
    }
    if(strokeFlag){
      geometry.setStrokeStyle(stroke);
    }
    if(fillFlag){
      geometry.setFillStyle(fill);
    }
    
    //update unsavedStyles
    for(var o in styles){
      geometry.unsavedStyle[o] = styles[o];
    }
        
  }
  
  //style.replace(/\b[a-z]/g,style[0].toUpperCase()); //capitalizes first letter
};

/**
 * LoadPolygons - loads polygons from json
 * @param {record} - json representation of polygon
 */
PolygonControl.prototype.loadPolygons = function(record){
  var me = this;
  var polygon = me.createPolygon(record.coordinates,me.infoWindowHtml,false,record.style);
  me.storage[polygon.index].title = [record.title,record.title];
  me.storage[polygon.index].description = [record.description,record.description];
  me.zuper.map.addOverlay(polygon); 
  return polygon;
};

/**
 * Convenience method to be able to pass in options as an object
 * @param {Object} coords
 * @param {Object} opts
 */
PolygonControl.prototype.newGPolygon = function(coords, opts){
  return new GPolygon(coords, opts.strokeColor, opts.strokeWeight, opts.strokeOpacity, opts.fillColor, opts.fillOpacity, opts.opts);
}

/**
 * Convenience add getter/setters for objects that need translation between stored and displayed value
 * And do basic input validation (and revert to stored values if values are invalid)
 */
PolygonControl.prototype.addGetterSetter = function(geometry){
  var newObj = {
    getStrokeWeight:function(){
      return (geometry.unsavedStyle.strokeWeight || geometry.savedStyle.strokeWeight);
    },
    setStrokeWeight:function(weight){
      if(!isNaN(weight)){
        geometry.unsavedStyle.strokeWeight = (weight > 20) ? 20 : (weight < 1) ? 1 : weight;
      } else {
        geometry.unsavedStyle.strokeWeight= geometry.savedStyle.strokeWeight;
      }
      return geometry.unsavedStyle.strokeWeight || geometry.savedStyle.strokeWeight;
    },
    getStrokeOpacity:function(){
      return (geometry.unsavedStyle.strokeOpacity || geometry.savedStyle.strokeOpacity) * 100;
    },
    setStrokeOpacity:function(opacity){
      if(!isNaN(opacity)){
        var storedOpacity = (opacity > 100) ? 100 : (opacity < 0) ? 0 : opacity;
        geometry.unsavedStyle.strokeOpacity = storedOpacity / 100;
      } else {
        geometry.unsavedStyle.strokeOpacity = geometry.savedStyle.strokeOpacity;
      }
      return geometry.unsavedStyle.strokeOpacity || geometry.savedStyle.strokeOpacity;
    },
    getFillOpacity:function(){
      return (geometry.unsavedStyle.fillOpacity || geometry.savedStyle.fillOpacity) * 100;
    },
    setFillOpacity:function(opacity){
      if(!isNaN(opacity)){
       var storedOpacity = (opacity > 100) ? 100 : (opacity < 0) ? 0 : opacity;
       geometry.unsavedStyle.fillOpacity = storedOpacity / 100; 
      } else {
        geometry.unsavedStyle.fillOpacity = geometry.savedStyle.fillOpacity;
      }
      return geometry.unsavedStyle.fillOpacity || geometry.savedStyle.fillOpacity; 
    }    
  }
  for(var o in newObj){
    geometry[o] = newObj[o];
  }
}


