/**
* ExtMyMapsControl Class v0.2
*  Copyright (c) 2008, Google 
*  Author: Chris Marx and Pamela Fox and others
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
* This class lets you add a control to the map which mimics the MyMaps controls
* and allows for adding markers, polylines and polygons to the map and for uploading.
*/

/**
 * Global wrapper function for getElementsById()
 * @param {String} id - Element's id
 */
function get$(id) {
  return document.getElementById(id);
  //TODO implement an element cache?
};

/**
 * Creates the parent class for My Maps Controls
 * @constructor
 * @param {Object} opt_opts
 *   @param {Object} controlPositionFloat A GControlAnchor for positioning the parent control container (if used)
 *   @param {Object} controlPosition An array with pixel values for parent control position
 *   @param {String} buttonWidth Button width in pixels
 *   @param {String} buttonHeight Button height in pixels
 *   @param {String} buttonBorder Button border in pixels
 *   @param {String} infoWindowHtmlURL The url if the html template file, containing configurable html and json for control infowindows and options
 *   @param {Object} stylesheets An array of urls of stylesheets to be appended 
 *   @param {Boolean} autoSave Determines whether the autoSave feature (via AOP) is turned on or off
 *   @param {String} cssId The base name for css styles
 *   @param {Boolean} debug Sets debug statements to GLog or turns them off for production
 */
function ExtMyMapsControl(opt_opts){
  var me = this;
  
  //self documenting object with default settings shared by mymaps controls
  me.options = {
    controlPostitionFloat:G_ANCHOR_TOP_RIGHT,
    controlPosition:[0,0],
    buttonWidth:'33',
    buttonHeight:'33',
    buttonBorder:'0',
    buttonCursor:'pointer',
    infoWindowHtmlURL:"data/mymaps_html_template.html",
    stylesheets:["styles/google.maps.2.css","styles/google.maps.ms.css"],
    autoSave:true, //TODO have option to turn on autoSave for individual controls?
    cssId:"emmc-geom", //for generic components shared between multiple controls 
    debug:true   
  }
  
  //overide the default options
  if(opt_opts){
  	for (var o in opt_opts) {
  		me.options[o] = opt_opts[o];
  	}
  } else {
  	//me.debug("??");
  }
  
  me.ie = (navigator.appName.indexOf('Explorer')>-1)?true:false;
  me.map = null;
  me.container = null;
  me.controls = {};
  me.buttons_ = {};
  me.stopDigitizingFuncs_ = {};
  me.infoWindowHtml = {};
  me.bounds = new GLatLngBounds(); //for setting bounds when loading data
  me.autoSaveListener = null;  //external handle for aop
  
  //call functions that need to load content when object is instantiated
  me.getInfoWindowHtml();  
  me.addGoogleMapsCSS();
  if(me.options.autoSave){
    me.addAutoSaveAspect();
  }
};

//inherits from GControl only to make it convenient to use map.addControl()
ExtMyMapsControl.prototype = new GControl();

/**
 * Required by GMaps API for controls.
 * @param {Object} opt_opts  
 *   @param {Object} controlPosition An array with top/left offset for control
 * @return {GControlPosition} Default location for control
 */
ExtMyMapsControl.prototype.getDefaultPosition = function(opt_opts) {
  var me = this, opt = me.options;
  return (opt_opts) ? new GControlPosition(opt_opts.controlPositionFloat,new GSize(opt_opts.controlPosition[0],opt_opts.controlPosition[1]))
                     : new GControlPosition(opt.controlPositionFloat, new GSize(opt.controlPosition[0],opt.controlPosition[1]));
};

/**
 * Is called by GMap2's addOverlay method. Creates the button 
 *  and appends to the map div.
 * @param {GMap2} map The map that has had this ExtMapTypeControl added to it.
 * @return {DOM Object} Div that holds the control
 */ 
ExtMyMapsControl.prototype.initialize = function(map){
  var me = this;
  me.map = map;
  
  //could be used to group all controls. currently controls are set to position themselves in their own containers
  me.container = document.createElement("div"); 
  map.getContainer().appendChild(me.container);
  
  //initialize the controls added with #addControl
  for(name in me.controls){
    map.addControl(me.controls[name]);
  }
  
  return me.container;
};

/**
 * Creates a button, and attaches listeners
 * @param {Object} required All parameters are required!!
 *   @param {String} controlName Name of control
 *   @param {Object} button_opts 
 *     @param {String} img_up_url Url of up image
 *     @param {String} img_down_url Url of down image
 *     @param {String} tooltip Text of tooltip
 *   @param {Function} startDigitizing Function for turning on this digitizer control
 *   @param {Function} stopDigitizing Function for turnong off this digitizer control
 */
ExtMyMapsControl.prototype.createButton = function(required_opts){
  var me = this, opts = required_opts;
  
  //make sure a digitizing function is present
  if((typeof(opts.startDigitizing) && typeof(opts.stopDigitizing)) !== "function"){
    me.debug("Digitizing functions for #createButton are required");
    return;
  }
  
  var button = {};
  button.opts = opts.button_opts;  
  var button_img = document.createElement('img');
  button_img.style.cursor = button.opts.buttonCursor || me.options.buttonCursor;
  button_img.width = button.opts.buttonWidth || me.options.buttonWidth;
  button_img.height = button.opts.buttonHeight || me.options.buttonHeight;
  button_img.border = button.opts.buttonBorder || me.options.buttonBorder;
  button_img.src = button.opts.img_up_url;
  button_img.title = button.opts.tooltip;
    
  button.img = button_img;
 
  //Button toggle. First click turns it on (and other buttons off), triggers bound events. Second click turns it off
  GEvent.addDomListener(button.img, "click", function() { 
    if(button.img.getAttribute("src") === button.opts.img_up_url){
      me.toggleButtons(opts.controlName);
      opts.startDigitizing();
    } else {
      me.toggleButtons(opts.controlName);
      opts.stopDigitizing();
    }    
  });  

  me.buttons_[opts.controlName] = button;
  me.stopDigitizingFuncs_[opts.controlName] = opts.stopDigitizing;
  return button;
};

/**
 * Turns on selected digitizer, turns off the others
 * At the moment, name reference is passed rather than object, is this necessary?
 * @param {Object} button_name
 */
ExtMyMapsControl.prototype.toggleButtons = function(button_name){
  var me = this;
  
  //Calls with no name will turn everything off. Calls with a name will turn all off except the named button
  for (var button in me.buttons_) {
      me.buttons_[button].img.src = me.buttons_[button].opts.img_up_url;
  }  
  if(button_name){
      me.buttons_[button_name].img.src = me.buttons_[button_name].opts.img_down_url;  
  }
  
  //turn off other digitizing listeners. Note: to avoid recursion, external calls to this function should always be made
  //without parameters!!!
  if (button_name) {
    for (var func in me.stopDigitizingFuncs_) {
      if (func != button_name) {
        me.stopDigitizingFuncs_[func](false);
      }
    }
  }
};

/**
 * Would like to use the constructor name of control, so that name is not hard-coded
 * but inheriting from GControl overrides the original constructor name :(
 * @param {Object} control
 */
ExtMyMapsControl.prototype.addControl = function(control){
  var me = this;
  
  //thanks Ates Goral
  //inheriting from GControl overrides original constructor so we use a final variable from the control(name)
  /*var controlName = function getObjectClass(obj) {  
    if (obj && obj.constructor && obj.constructor.toString) {  
      var arr = obj.constructor.toString().match(/function\s*(\w+)/);    
      if (arr && arr.length == 2) {  
           return arr[1];  
       }  
    }   
    me.debug("Can't find constructor name of control");
    return null;  
  }(control);*/ 
  
  control.zuper = me;
  me.controls[control.name] = control;
  
  //TODO turn on auto-save?
};

ExtMyMapsControl.prototype.tooltipFactory = function(tooltip_opts){
  var me = this;
  
  //One time setup (memoization)
  var tooltipContainer = document.createElement("div");
  tooltipContainer.id = "tooltipContainer";
  tooltipContainer.className = "emmc-tooltip"
  me.map.getContainer().appendChild(tooltipContainer);
  
  var calculatePosition = function(latlng,tooltipContainer) {
		var offset=map.getCurrentMapType().getProjection().fromLatLngToPixel(map.getBounds().getSouthWest(),map.getZoom());
		var point=map.getCurrentMapType().getProjection().fromLatLngToPixel(latlng,map.getZoom());
		var anchor= new GPoint(tooltip_opts.anchor[0],tooltip_opts.anchor[1]);
		var width = -12;
		var position = new GControlPosition(G_ANCHOR_BOTTOM_LEFT, new GSize(point.x - offset.x - anchor.x + width,- point.y + offset.y +anchor.y)); 
		position.apply(tooltipContainer);
	}
  
  //Returns custom tooltip function/object
  var tooltipFunc = {
    me:me,
    tooltip_opts:tooltip_opts,
    tooltipHandler:null,
    tooltipContainer:tooltipContainer,
    on:function(message,callback){
      this.me.map.getDragObject().setDraggableCursor(this.tooltip_opts.cursor_on); 
      console.log(this.tooltip_opts.cursor_on);
      tooltipContainer.innerHTML = message;
      tooltipContainer.style.display = "block";
      //TODO add listener for map drag
      this.tooltipHandler = GEvent.addListener(this.me.map,"mousemove", function(latlng){
        calculatePosition(latlng,tooltipContainer);
        if(typeof(callback)==="function"){
          callback(tooltipContainer);
        }
      });
    },
    off:function(){
      console.log("off");
      this.me.map.getDragObject().setDraggableCursor(this.tooltip_opts.cursor_off);
      tooltipContainer.style.display = "none";
      try{GEvent.removeListener(this.tooltipHandler);}catch(e){};
    }
  }
  me.tooltip = function(tooltip_opts){
    tooltipFunc.tooltip_opts = tooltip_opts;
    return tooltipFunc;
  }
  return tooltipFunc;
};

/**
 * Create, then store and show/hide an event bound color picker
 * @param opts
 *   @param {DOMElement} target - element to receive the selected color
 *   @param {Function} callback - callback function
 */
ExtMyMapsControl.prototype.showColorPicker = function(opts){
  var me = this, row, cell;
  
  //one time setup
  var colors = eval(me.infoWindowHtml["colorTable"]);
  var div = document.createElement("div");
  document.getElementsByTagName("body")[0].appendChild(div);
  div.innerHTML = me.infoWindowHtml["colorTableHtml"];
  var colorPicker = get$("emmc-menu-color");
  var colorPickerTable = get$("emmc-color-table");
  row = colorPickerTable.insertRow(0);
  for(var i in colors){
    if(i%7 == 0 && i!=0){ row = colorPickerTable.insertRow(i/7);}
    cell = row.insertCell(i%7)
    cell.innerHTML = '<div id="menu_cp_'+colors[i]+'" bgcolor="'+colors[i]+'" style="border: 1px solid rgb(187, 187, 187); margin: 0px;' 
                     + 'padding: 0px; width: 15px; height: 15px; background-color:'+colors[i]+'" unselectable="on"><img height="1" width="1"/></div>';
  }
  
  //private scope variables for use by stored function
  var target, color, callback;//DOM node
  
  //hide the color picker (better way??)
  var colorPickerHandler = GEvent.addDomListener(colorPicker,"mouseover",function(){
    var tempHandler = GEvent.addDomListener(me.map.getInfoWindow().getContentContainers()[0],"mouseover",function(){
      colorPicker.style.display = "none"; 
      GEvent.removeListener(tempHandler);
    });
    var tempHandler2 = GEvent.addListener(me.map,"infowindowclose",function(){
      colorPicker.style.display = "none"; 
      GEvent.removeListener(tempHandler2);
    })  
  });
  //attach listeners for color picker behaviors
  var cells = colorPickerTable.getElementsByTagName("div");
  for(var i=0; i<cells.length; i++){
    var td = cells[i]; 
    //add hover effect
    GEvent.addDomListener(td,"mouseover",function(){
      this.style.borderColor = "#FFFFFF";
    });
    GEvent.addDomListener(td,"mouseout",function(){
      this.style.borderColor = "#BBBBBB";
    });    
    //return the color
    GEvent.addDomListener(td,"click",function(){
      color = this.getAttribute("bgColor");
      target.setAttribute("bgColor",color);
      target.style.backgroundColor = color;
      colorPicker.style.display = "none";
      callback(color);
    });
  }
  
  //new function
  var newFunc = function(opts){
    var position = me.getAbsolutePosition(opts.target);
    colorPicker.style.left = position.x+1 + "px";
    colorPicker.style.top = position.y + "px";
    colorPicker.style.display = "block";
    colorPicker.focus();    
    target = opts.target;
    callback = opts.callback;
    return colorPicker;
  }
  
  //avoid memory leaks
  colors = colorPickerTable = rows = cells = null;
  
  me.showColorPicker = newFunc;   //override itself
  return newFunc(opts);   //one time execution
}

ExtMyMapsControl.prototype.addGoogleMapsCSS = function(){
  var me = this;
  
  //attempt to add the css and then keep trying till it happens
  var appendCSS = function(css) {
    try {
      document.getElementsByTagName("head")[0].appendChild(css);
    } catch(e) {
      me.debug("Having trouble adding stylesheets, trying again....");
      setTimeout(function(){appendCSS(css)}, 100);
    }
  }
   
  for(var i=0; i<me.options.stylesheets.length; i++){
    var css = document.createElement("link");
    css.setAttribute("href",me.options.stylesheets[i]);
    css.setAttribute("rel","stylesheet");
    css.setAttribute("type","text/css");
    appendCSS(css);
  }
  
  css = null;
};

ExtMyMapsControl.prototype.getInfoWindowHtml = function(){
  var me = this;
  
  //clean-up content from html file
  var trim = function(stringToTrim) {
    return stringToTrim.replace(/^\s+|\s+$/g,"");
  }
  
  var processHtml = function(doc) {
    sections = doc.split("<!-- DELIMITER -->");
    if (sections.length > 1) {
      for (var i=0; i<sections.length; i++) {      
        parts = sections[i].split("|");
        //requires eval? eval is evil....
        if(parts[1] === "true"){
          parts[2] = eval(parts[2]); //evaled objects should probably be in their object (not infoWindowHtml)
        }
        me.infoWindowHtml[trim(parts[0])] = parts[2];
      } 
    } else {
      me.debug("failed to get infowindowhtml??"); 
    }
  }          
  
  try{      
    //note: a synchonous call is made, because other functions depend on this data being available
    var request = GXmlHttp.create();
    request.open("GET", me.options.infoWindowHtmlURL, false);
    /*request.onreadystatechange = function() { //doesnt work synchronously
      alert(request.responseText);
      if (request.readyState == 4) {
        processHtml(request.responseText);
      }
    }*/
    request.send(null);
    processHtml(request.responseText);    //workaround, dont check for readyState
  } catch(e) {
    me.debug("Looks like you provided an invalid URL. The URL is "+ me.options.infoWindowHtmlURL + "The error is: " + e);
  }
};

/**
 * Assumes common id naming between different geometry infowindows 
 * Rich text editor might need to be some kind of pre-packaged javascript library
 * @param geomInfo
 *   @param {String} type - Type of geometry
 *   @param {Integer} index - Index of geometry in storage arrays
 *   @param {String} cssId - Id of css styles
 *   ....etc //TODO
 */
ExtMyMapsControl.prototype.bindInfoWindow = function(geomInfo){
  var me = this, map = me.map, index = geomInfo.index;
  
  var cssId = geomInfo.cssId || me.options.cssId;   
  
  //TODO resolves differences in marker and shape storages
  if(geomInfo.type === "point"){
    var geometry = geomInfo.geometry[index];
    var title = geomInfo.title[index]; 
    var description = geomInfo.description[index];
  } else {
    var record = geomInfo.geometry[index]; //TODO
    var geometry = record.geometry;
    var title = record.title; 
    var description = record.description;
  }
    
  //store references to id's that can be called multiple times
  var geomStyleLink = get$("msiwsi");
  var geomStyleDiv = get$(cssId + "-style");
  var titleInput = get$(cssId + "-title");
  var descriptionInput = get$(cssId + "-description");
  
  //flag - indicates whether the styleInfoWindow window has already been bound
  var styleInfoWindowBound = false;
  
  //bind geometry style links and "back" link
  GEvent.addDomListener(geomStyleLink,"click", function(){
    geomStyleDiv.style.display = "block";
    if(styleInfoWindowBound === false){
      //call controls's custom styling functions, and update the flag
      geomInfo.geometryStyleFunc();
      styleInfoWindowBound = true;
    }    
  });
  GEvent.addDomListener(get$("emmc-geom-style-back"),"click",function(){
    geomStyleDiv.style.display = "none";
  });
  
  //Update & Bind Text Entry  
  titleInput.value = (title[1]) ? ((title[0] === title[1]) ? title[0] : title[1]) : ""; //return the saved data or most recent edit
  descriptionInput.value = (description[1]) ? ((description[0] === description[1]) ? description[0] : description[1]) : "";
  GEvent.addDomListener(titleInput,"change", function(){
    title[1] = titleInput.value;
  });
  GEvent.addDomListener(descriptionInput,"change", function(){
    description[1] = descriptionInput.value;
  });
  //onchange doesnt fire when infowindow is closed by clicking on the map, so add a listener for that too
  //have to add to map, because polys dont have the event, so make it garbage collect itself
  var windowOnCloseHandler = GEvent.addListener(map,"infowindowbeforeclose",function(){
    title[1] = titleInput.value;
    description[1] = descriptionInput.value;
    GEvent.removeListener(windowOnCloseHandler);
  });  
  
  //Bind Delete/Cancel/OK buttons
  //TODO -- remove entries when geometeries are not passed in as arrays!!!!!!
  GEvent.addDomListener(get$(cssId + "-delete"),"click",function(){
    if(confirm("Are You Sure You Want To Delete This?")){
      map.removeOverlay(geometry);
      if(record){ //TODO standard storage formats
        geomInfo.geometry[index] = null;
      } else {
        geomInfo.geometry[index] = null;
        geomInfo.title[index] = null;
        geomInfo.description[index] = null;
      }
      map.closeInfoWindow();
    } 
  });
  GEvent.addDomListener(get$(cssId + "-cancel"),"click", function(){
    geomInfo.undoStyling();
    title[1] = title[0];
    description[1] = description[0];
    GEvent.removeListener(windowOnCloseHandler); //dont save on cancel
    map.closeInfoWindow();
  });
  GEvent.addDomListener(get$(cssId + "-ok"),"click",function(){
    //update permanent values
    title[0] = title[1];
    description[0] = description[1];
    geomInfo.commitStyling();
    map.closeInfoWindow();
  });   
  //TODO callbacks? additional user provided methods?
};

/**
 * Data Services
 * @param {Object} opts
 *   @param {String} type - json or kml
 *   @param {String} url - url of the resource
 */
ExtMyMapsControl.prototype.loadData = function(opts){
  var me = this;
  GDownloadUrl(opts.url, function(data, responseCode){
    (opts.type === "kml") ? me.handleKmlDataResponse_(data, responseCode) : me.handleJsonDataResponse_(data, responseCode);  
  });
};

/**
 * EGeoXml Kml Processing (modified)
 * http://econym.googlepages.com/egeoxml.htm (Thanks Mike!)
 * @param {XMLDocument} data - data from #loadData
 * @param {String} responseCode - response code from ajax GDownloadUrl
 */
ExtMyMapsControl.prototype.handleKmlDataResponse_ = function(data, responseCode){
  var me = this;
  
  //Helper functions
  var EGeoXml = {
    value: function(e){
      a = GXml.value(e);
      a = a.replace(/^\s*/, "");
      a = a.replace(/\s*$/, "");
      return a;
    },
    styles:{}
  }  
  
  if (responseCode == 200) {
    try{
      var xmlDoc = GXml.parse(data);
      // Read through the Styles
      var styles = xmlDoc.documentElement.getElementsByTagName("Style");
      for (var i = 0; i < styles.length; i++) {
        var styleID = styles[i].getAttribute("id");
        
        //is it a marker style? (the following logic corresponds to predefined icons in the mymaps_html_template)
        //TODO move these to individual overridable functions? 
        var icons = styles[i].getElementsByTagName("Icon");
        if (icons.length > 0) {
          var href=EGeoXml.value(icons[0].getElementsByTagName("href")[0]);
          if (!!href) {
            var icon = {name:styleID};
            //get names of defined icons 
            var markerIcons = {}
            for(var j in me.infoWindowHtml.markerIcons){
              markerIcons[me.infoWindowHtml.markerIcons[j].name] = me.infoWindowHtml.markerIcons[j];                   
            }
            switch(true){
              case(href.indexOf("kml") > -1):             
                icon.y = parseInt(href[href.indexOf("pal")+3])+1; //TODO to match with MarkerControl.checkIconStatus
                icon.x = parseInt(href.substring(href.indexOf("icon")+4,href.indexOf(".png")));
              break;
              case(href.indexOf("dot") > -1):
                icon.y = 0;
                if (markerIcons["dot"]) {
                  var images = markerIcons["dot"].images;
                  var image = href.split("/").pop();
                  for (var k in images) {
                    if (image === images[k]) {
                      icon.x = k;
                    }
                  }
                } else {
                  me.debug("Cannot Load Kml - There is no icon defined for markers with images like *-dot.png");
                }
              break;
            }
            //TODO add rest of markers or improve marker detection
            /*if (me.opts.printgif) {
              var bits = href.split("/");
              var gif = bits[bits.length-1];
              gif = me.opts.printgifpath + gif.replace(/.png/i,".gif");
              me.styles["#"+styleID].printImage = gif;
              me.styles["#"+styleID].mozPrintImage = gif;
            }*/
          }
          EGeoXml.styles["#"+icon.name] = icon;
        }
        
        // is it a LineStyle ?
        var linestyles=styles[i].getElementsByTagName("LineStyle");
        if (linestyles.length > 0) {
          var width = parseInt(GXml.value(linestyles[0].getElementsByTagName("width")[0]));
          if (width < 1) {width = 5;}
          var color = EGeoXml.value(linestyles[0].getElementsByTagName("color")[0]);
          var aa = color.substr(0,2);
          var bb = color.substr(2,2);
          var gg = color.substr(4,2);
          var rr = color.substr(6,2);
          color = "#" + rr + gg + bb;
          var opacity = parseInt(aa,16)/256;
          if (!EGeoXml.styles["#"+styleID]) {
            EGeoXml.styles["#"+styleID] = {};
          }
          EGeoXml.styles["#"+styleID].color=color;
          EGeoXml.styles["#"+styleID].width=width;
          EGeoXml.styles["#"+styleID].opacity=opacity;
        }
        
        // is it a PolyStyle ?
        var polystyles=styles[i].getElementsByTagName("PolyStyle");
        if (polystyles.length > 0) {
          var fill = parseInt(GXml.value(polystyles[0].getElementsByTagName("fill")[0]));
          var outline = parseInt(GXml.value(polystyles[0].getElementsByTagName("outline")[0]));
          var color = EGeoXml.value(polystyles[0].getElementsByTagName("color")[0]);
  
          if (polystyles[0].getElementsByTagName("fill").length == 0) {fill = 1;}
          if (polystyles[0].getElementsByTagName("outline").length == 0) {outline = 1;}
          var aa = color.substr(0,2);
          var bb = color.substr(2,2);
          var gg = color.substr(4,2);
          var rr = color.substr(6,2);
          color = "#" + rr + gg + bb;
  
          var opacity = Math.round((parseInt(aa,16)/256)*100)/100; //round to 2 decimals
          if (!EGeoXml.styles["#"+styleID]) {
            EGeoXml.styles["#"+styleID] = {};
          }
          EGeoXml.styles["#"+styleID].fillcolor=color;
          EGeoXml.styles["#"+styleID].fillopacity=opacity;
          if (!fill) EGeoXml.styles["#"+styleID].fillopacity = 0; 
          if (!outline) EGeoXml.styles["#"+styleID].opacity = 0; 
        }
      }

      // Read through the Placemarks
      var placemarks = xmlDoc.documentElement.getElementsByTagName("Placemark");
      for (var i = 0; i < placemarks.length; i++) {
        var name = EGeoXml.value(placemarks[i].getElementsByTagName("name")[0]);
        var desc = EGeoXml.value(placemarks[i].getElementsByTagName("description")[0]);
        if (desc.match(/^http:\/\//i)) {
          desc = '<a href="' + desc + '">' + desc + '</a>';
        }
        if (desc.match(/^https:\/\//i)) {
          desc = '<a href="' + desc + '">' + desc + '</a>';
        }
        var style = EGeoXml.styles[EGeoXml.value(placemarks[i].getElementsByTagName("styleUrl")[0])] || {}; 
        var coords=GXml.value(placemarks[i].getElementsByTagName("coordinates")[0]); //TODO what about inner boundaries?
        coords=coords.replace(/\s+/g," "); // tidy the whitespace
        coords=coords.replace(/^ /,"");    // remove possible leading whitespace
        coords=coords.replace(/ $/,"");    // remove possible trailing whitespace
        coords=coords.replace(/, /,",");   // tidy the commas
        var path = coords.split(" ");
  
        // Is this a polyline/polygon?
        if (path.length > 1) {
          // Build the list of points
          var points = [];
          //var pbounds = new GLatLngBounds(); //TODO what does this do?
          for (var p=0; p<path.length; p++) {
            var bits = path[p].split(",");
            var point = new GLatLng(parseFloat(bits[1]),parseFloat(bits[0]));
            points.push(point);
            me.bounds.extend(point);
            //pbounds.extend(point);
          }
          var linestring=placemarks[i].getElementsByTagName("LineString");
          if (linestring.length) {
            // it's a polyline grab the info from the style
            if (style.width) {
              style.width = 5;
              style.color = "#0000ff";
              style.opacity = 0.45;
            }
            // Does the user have their own createmarker function?
            /*if (!!me.opts.createpolyline) {
              me.opts.createpolyline(points,color,width,opacity,pbounds,name,desc);
            } else {*/
              me.createPolyline(points,color,width,opacity,pbounds,name,desc);
            //}
          }
  
          var polygons=placemarks[i].getElementsByTagName("Polygon");
          if (polygons.length) {
            // it's a polygon grab the info from the style or provide defaults
            if (style.width) {
              style.width = 5;
              style.color = "#0000ff";
              style.opacity = 0.45;
              style.fillopacity = 0.25; 
              style.fillcolor = "#0055ff";
            }
            // Does the user have their own createmarker function?
            /*if (!!me.opts.createpolygon) {
              me.opts.createpolygon(points,color,width,opacity,fillcolor,fillopacity,pbounds,name,desc);
            } else {*/
              me.createGeometry_({
                type:"poly",
                coordinates:points,
                title:name,
                description:desc,
                style: {
                  strokeColor:style.fillcolor,
                  strokeWeight:3,
                  strokeOpacity:style.fillopacity,
                  fillColor:style.fillcolor,
                  fillOpacity:style.fillopacity ,
                  opts:{
                    clickable:true //TODO make option configurable
                  } 
                }
              });
            //}
          }  
        } else {
        // It's not a poly, so I guess it must be a marker
          var bits = path[0].split(",");
          // Does the user have their own createmarker function?
          /*if (!!me.opts.createmarker) {
            me.opts.createmarker(point, name, desc, style);
          } else {*/
          
          var geometry = me.createGeometry_({
            type:"point",
            coordinates:[{lat:parseFloat(bits[1]),lng:parseFloat(bits[0])}],
            title:name,
            description:desc,
            style:{
              icon:style
            }
          });
          
          me.bounds.extend(geometry.getLatLng());
          
          //}
        }
      }
      
      me.zoomToBounds();
  
      //TODO should sidebar be included?
      // Is this the last file to be processed?
      /*me.progress--;
      if (me.progress == 0) {
        // Shall we zoom to the bounds?
        if (!me.opts.nozoom) {
          me.map.setZoom(me.map.getBoundsZoomLevel(me.bounds));
          me.map.setCenter(me.bounds.getCenter());
        }
        // Shall we display the sidebar?
        if (me.opts.sortbyname) {
          me.side_bar_list.sort();
        }
        if (me.opts.sidebarid) {
          for (var i=0; i<me.side_bar_list.length; i++) {
            var bits = me.side_bar_list[i].split("$$$",4);
            me.side_bar_html += me.sidebarfn(me.myvar,bits[0],bits[1],bits[2],bits[3]); 
          }
          document.getElementById(me.opts.sidebarid).innerHTML += me.side_bar_html;
        }
        if (me.opts.dropboxid) {
          for (var i=0; i<me.side_bar_list.length; i++) {
            var bits = me.side_bar_list[i].split("$$$",4);
            if (bits[1] == "marker") {
              me.side_bar_html += me.dropboxfn(me.myvar,bits[0],bits[1],bits[2],bits[3]); 
            }
          }
          document.getElementById(me.opts.dropboxid).innerHTML = '<select onChange="var I=this.value;if(I>-1){GEvent.trigger('+me.myvar+'.gmarkers[I],\'click\'); }">'
            + '<option selected> - Select a location - </option>'
            + me.side_bar_html
            + '</select>';
        }
  
        //GEvent.trigger(me,"parsed");*/
      //}      
    } catch(e){
     error(e); 
    }
  } else {
    error();
  }
  
  function error(e){
    me.debug("Looks like you provided an invalid URL or parameters or invalid xml. The URL is  ____ ."+
               "The error is:"+e+" at line "+e.lineNumber+" in file "+e.fileName); //TODO
  }
}

/**
 * Create geometries from JSON
 * @param {Object} data 
 * @param {Integer} responseCode
 */
ExtMyMapsControl.prototype.handleJsonDataResponse_ = function(data, responseCode){
  var me = this;
  
  if (responseCode == 200) {
    var json_data = eval('(' + data + ')');
    json_data = json_data[0];
    if (json_data.status != 'success') {
      me.debug("The JSON was invalid");
      return;
    }
    
    //TODO why is operation here?
    switch (json_data.operation) {
      case 'get':
        var geometries = json_data.result.geometries;
        for (var i=0; i < geometries.records.length; i++) {
          var record = geometries.records[i];
          if (record.type === 'point') {
            var geometry = me.createGeometry_(record);
            me.bounds.extend(geometry.getLatLng());
          } else if (record.type === 'line' || record.type == 'poly') {
            var latlng, latlngArray = [];
            record.coordinates = function(){
              for(var i in record.coordinates){
                latlng = new GLatLng(record.coordinates[i].lat,record.coordinates[i].lng);
                latlngArray[i] = latlng;
              } return latlngArray;
            }();
            var geometry = me.createGeometry_(record);
            me.bounds.extend(geometry.getBounds().getCenter()); //need to extend with all points?
          }  
        }
        me.zoomToBounds();
    }
  } else {
    me.debug("Looks like you provided an invalid URL or parameters. The URL is ___"); //TODO
  }
}

/**
 * Set map center and zoom to a GBounds
 * @param {Object} record - see #createGeometry_
 */
ExtMyMapsControl.prototype.zoomToBounds = function(record){
  var me = this, bounds = me.bounds;
  
  if  (!bounds.isEmpty()) {
    me.map.setCenter(bounds.getCenter());
    me.map.setZoom(me.map.getBoundsZoomLevel(bounds)-1);
  }
}

/**
 * Delegate object creation to appropriate geometry control
 * @param {Object} record
 *   @param {String} type - the type of geometry
 *   @param {Object} coordinates - an array of objects {lat,lng}
 *   @param {S
 */
ExtMyMapsControl.prototype.createGeometry_ = function(record){
  var me = this;
  
  try {
    switch (record.type) {
      case "point":
        return me.controls["markerControl"].loadMarkers(record);
        break;
      case "line":
        return me.controls["lineControl"].loadLines(record);
        break;
      case "poly":
        return me.controls["polygonControl"].loadPolygons(record);
        break;
    }
  } 
  catch (e) {
    me.debug("A geometry Control has not been added for the geometry type you are trying to load or there is an error." +
             "Your error is: " + e + " at line " + e.lineNumber + " in file " + e.fileName);
  }
}

/**
 * Add aspects that listen for "Ok" button clicks, triggering an upload to the db
 */
ExtMyMapsControl.prototype.addAutoSaveAspect = function(){
  var me = this;
  
  me.aop.addBefore(me, 'bindInfoWindow', function(args){
    var geomInfo = args[0];
    //expose the function 
    me.autoSaveListener = geomInfo.commitStyling;
    geomInfo.commitStyling = function(){
      me.autoSaveListener();
    }
    //attach the listener
    me.aop.addAfter(me, 'autoSaveListener', function(){
      if(me.options.autoSave){
        me.saveData({
          allData:false,
          geomInfo:geomInfo
        }); 
      }
    }); 
    return args;
  });
}

/**
 * Post data for storage to a db. Options to send all information or just one object?
 * @see #addAutoSaveAspect
 * @param {Object} opts
 *   @param {Object} geomInfo - @see #bindInfoWindow
 */
ExtMyMapsControl.prototype.saveData = function(opts){
  var me = this;
  if(opts.allData === true){
    //TODO
  } else {
    //construct a json data record
    var geomInfo = opts.geomInfo, index = opts.geomInfo.index;    
    var record = {};
    record.type = geomInfo.type;
    record.coordinates = [];
    if(geomInfo.type === "point"){
      record.coordinates.push({lat:geomInfo.geometry[index].getLatLng().lat(),lng:geomInfo.geometry[index].getLatLng().lng()});
      record.title = geomInfo.title[index][0];
      record.description = geomInfo.description[index][0];
    } else {
      var geometry = geomInfo.geometry[index].geometry, vertex;
      for(var i=0;i<geometry.getVertexCount();i++){
        vertex = geometry.getVertex(i);
        record.coordinates.push({lat:vertex.lat(),lng:vertex.lng()});
      }
      //TODO standardize storage names
      record.title = geomInfo.geometry[index].title[0];
      record.description = geomInfo.geometry[index].description[0];
    }
    //TODO add styles 
    record.style = ""; //TODO
  }  
  
  function postData(data){
    //TODO 
    me.debug(data);
  };
  
  postData(me.serialize(record));
};

//================================================================= Utility Methods ========================================================//

/**
 * Utility function for executing functions not in global scope
 * @param {Object} milliseconds
 * @param {Object} func
 */
ExtMyMapsControl.prototype.setLocalTimeout = function(func,milliseconds){
  function delayedFunction(){
    func();
  }
  setTimeout(delayedFunction, milliseconds);
}

/**
 * Utility fnction for getting the absolute position of an element
 * @see http://www.faqts.com/knowledge_base/view.phtml/aid/9095
 */
ExtMyMapsControl.prototype.getAbsolutePosition = function(el){
	for (var lx=0,ly=0;el!=null;lx+=el.offsetLeft,ly+=el.offsetTop,el=el.offsetParent);
	return {x:lx,y:ly};
}

/**
 * Wrapper function for GLog.write, allows debugging to be turned on/off globally
 * Note: debugging mode is set at instantiation, so that production mode does not incur processing
 * @param {Object} msg
 */
ExtMyMapsControl.prototype.debug = function(msg){
  var me = this, tempFunc;
  if(me.options.debug){
    tempFunc = function(msg){
      GLog.write(msg);
    }
  } else {
    tempFunc = function(){};
  }
  me.debug = tempFunc;
  return tempFunc(msg);
}

/**
 * Serialize JSON to parameters
 */
ExtMyMapsControl.prototype.serialize = function(obj){
  var me = this;
  var params = [];
  for(var prop in obj){
    if(typeof(obj[prop]) === "object"){
      obj[prop] = (!me.ie) ? obj[prop].toSource() : obj[prop].toString(); //TODO fix for ie  
    }
    params.push(prop + "=" + obj[prop]);
  }
  return params.join("&");
}

/**
 * Ajaxpect 0.9.0 (AOP)
 * http://code.google.com/p/ajaxpect
 * With slight formatting modifications (switched "_process" -> "process_", etc.)
 */
ExtMyMapsControl.prototype.aop = {
  addBefore: function(obj, filter, before) {
    var link = function(orig) {
      return function() {
        return orig.apply(this, before(arguments, orig, this));
      }
    }
    this.process_(obj, filter, link);
  },
  addAfter: function(obj, filter, after) {
    var link = function(orig) {
      return function() {
        return after(orig.apply(this, arguments), arguments, orig, this);
      }
    }
    this.process_(obj, filter, link);
  },
  addAround: function(obj, filter, around) {
    var link = function(orig) {
      return function() {
        return around(arguments, orig, this);
      }
    }
    this.process_(obj, filter, link);
  },  
  process_: function(obj, filter, link) {
    var check;
    if (filter.exec) {
      check = function(str) { return filter.exec(str) }
    } else if (filter.call) {
      check = function(str) { return filter.call(this, str) }
    }
    if (check) {
      for (var member in obj) {
        if (check(member)) {
          this.attach_(obj, member, link);
        }
      }
    } else {
      this.attach_(obj, filter, link);
    }
  },
  attach_: function(obj, member, link) {
    var orig = obj[member];
    obj[member] = link(orig);
  }  
};

