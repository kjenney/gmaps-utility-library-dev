/*
*  ExtMapTypeControl  v1.4
*  Copyright (c) 2007, Google
*  Author: Pamela Fox, others
* 
* Added More button and buttons to save and restore position functionality.
* This version of ExtMapTypeControl can also be used together with
* GMapTypeControl, GHierarchicalMapTypeControl, GMenuMapTypeControl,
* setUIToDefault and all self created map type buttons.
*  Copyright (c) 2009, Wolfgang Pichler (Pil) wolfpil@gmail.com
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* 
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* This class lets you add a control to the map which mimics GMapTypeControl
* and allows for the addition of a traffic button/traffic key
* plus a more button to display additional layers
* and buttons to save the map position and return to it.
*/

/*
 * Constructor for ExtMapTypeControl uses an option hash
 * to decide which controls to load.
 * Either the option 'useMapTypes' or 'posRight' should be used.
 * @param {opt_opts} Named optional arguments:
 *  opt_opts.useMapTypes {Boolean} Controls whether map type buttons are shown
 *  opt_opts.posRight {Integer} Defines the spacing in pixels of the button from the right map border
 *  opt_opts.showTraffic {Boolean} Controls whether traffic button is shown
 *  opt_opts.showTrafficKey {Boolean} Controls whether traffic key is shown
 *  opt_opts.showMore {Boolean} Controls whether more button is shown
 *  opt_opts.showSave {Boolean} Controls whether save/return buttons are shown
 */
function ExtMapTypeControl(opt_opts) {
  this.options = opt_opts || {};
};

/*
 * Extends GOverlay class from the Google Maps API
 */
ExtMapTypeControl.prototype = new GControl();

/*
 * Is called by GMap2's addOverlay method. Creates the buttons
 * for the map types and appends them to the map.
 * @param {GMap2} map The map that has had this ExtMapTypeControl added to it.
 * @return {DOM Object} Div that holds the map types buttons
 */
ExtMapTypeControl.prototype.initialize = function(map) {
 var me = this;
 var extDiv = document.createElement("div");

 if (me.options.useMapTypes) {
  var mapTypes = map.getMapTypes();
  var mapTypeDivs = me.addMapTypeButtons_(map);

  GEvent.addListener(map, "addmaptype", function() {
    var newMapTypes = map.getMapTypes();
    var newMapType = newMapTypes.pop();
    var newMapTypeDiv = me.createButton_(newMapType.getName());
    newMapTypeDiv.setAttribute('title', newMapType.getAlt());
    mapTypes.push(newMapType);
    mapTypeDivs.push(newMapTypeDiv);
    me.resetButtonEvents_(map, mapTypeDivs);
    extDiv.appendChild(newMapTypeDiv);
  });
  GEvent.addListener(map, "removemaptype", function() {
    for (var i = 0; i < mapTypeDivs.length; i++) {
      GEvent.clearListeners(mapTypeDivs[i], "click");
      extDiv.removeChild(mapTypeDivs[i]);
    }
    mapTypeDivs = me.addMapTypeButtons_(map);
    me.resetButtonEvents_(map, mapTypeDivs);
    for (var i = 0; i < mapTypeDivs.length; i++) {
      extDiv.appendChild(mapTypeDivs[i]);
    }
  });

   for (var i = 0; i < mapTypeDivs.length; i++) {
    me.toggleButton_(mapTypeDivs[i].firstChild, false);
    extDiv.appendChild(mapTypeDivs[i]);
    if(map.getCurrentMapType().getName() == mapTypeDivs[i].name) {
     me.toggleButton_(mapTypeDivs[i].firstChild, true);
    }
   }
   map.getContainer().appendChild(extDiv);
   // Sets the proper spaces between the buttons
   var posX = 98;
   switch (mapTypes.length) {
    case 2: posX += 72; break;
    case 3: posX += 144; break;
    case 4: posX += 216; break;
   }
 }
  else {
  // If no options were defined, 'posRight: 220' is assumed.
   var posX = me.options.posRight || 220;
  }

 /*
  *  Loads SavePosControl when specified as option
  */
  if (me.options.showSave) {
   map.addControl(new SavePosControl(),
    new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(7, 31)));
  }

  /*
  *  Loads MoreControl when specified as option
  */
  if (me.options.showMore) {
   var layers = [
    { name: "Photos", obj: new GLayer("com.panoramio.all") },
    { name: "Videos", obj: new GLayer("com.youtube.all") },
    { name: "Wikipedia", obj: new GLayer("org.wikipedia.en") }
   ];

   map.addControl(new MoreControl(layers, posX),
    new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(posX, 7)));
  }

  /*
  *  Loads TrafficControl when specified as option
  */
  if (me.options.showTraffic) {
    // Moves traffic button to the left if more button should also be displayed
    if(me.options.showMore)
     posX += 94;
    map.addControl(new TrafficControl(me.options),
     new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(posX, 7)));
  }
  return extDiv;
};

/*
 * Creates buttons for map types.
 * @param {GMap2} Map object for which to create buttons.
 * @return {Array} Divs containing the buttons.
 */
ExtMapTypeControl.prototype.addMapTypeButtons_ = function(map) {
  var me = this;
  var mapTypes = map.getMapTypes();
  var mapTypeDivs = [];
  for (var i = 0; i < mapTypes.length; i++) {
    mapTypeDivs[i] = me.createButton_(mapTypes[i].getName());
    mapTypeDivs[i].name = mapTypes[i].getName();
    mapTypeDivs[i].setAttribute('title', mapTypes[i].getAlt());
  }
  me.resetButtonEvents_(map, mapTypeDivs);
  return mapTypeDivs;
};

/*
 * Ensures that map type button events are assigned correctly.
 * @param {GMap2} Map object for which to reset events.
 * @param {Array} mapTypeDivs Divs containing map type buttons.
 */
ExtMapTypeControl.prototype.resetButtonEvents_ = function(map, mapTypeDivs) {
  var me = this;
  var mapTypes = map.getMapTypes();
  for (var i = 0; i < mapTypeDivs.length; i++) {
    var otherDivs = [];
    for (var j = 0; j < mapTypes.length; j++) {
      if (j != i) {
        otherDivs.push(mapTypeDivs[j]);
      }
    }
    me.assignButtonEvent_(mapTypeDivs[i], map, mapTypes[i], otherDivs);
  }
  GEvent.addListener(map, "maptypechanged", function() {
    var divIndex = 0;
    var mapType = map.getCurrentMapType();
    for (var i = 0; i < mapTypes.length; i++) {
      if (mapTypes[i] == mapType) {
        divIndex = i;
      }
    }
    GEvent.trigger(mapTypeDivs[divIndex], "click");
  });
};

/*
 * Creates buttons with text nodes. 
 * @param {String} text Text to display in button
 * @return {DOM Object} The div for the button.
 */
ExtMapTypeControl.prototype.createButton_ = function(text) {
  var buttonDiv = document.createElement("div");
  this.setButtonStyle_(buttonDiv);
  buttonDiv.style.cssFloat = "left";
  buttonDiv.style.styleFloat = "left";
  var textDiv = document.createElement("div");
  textDiv.appendChild(document.createTextNode(text));
  textDiv.style.width = "6em";
  buttonDiv.appendChild(textDiv);
  return buttonDiv;
};

/*
 * Assigns events to MapType buttons to change maptype
 * and toggle button styles correctly for all buttons
 * when button is clicked.
 * @param {DOM Object} div Button's div to assign click to
 * @param {GMap2} Map object to change maptype of.
 * @param {Object} mapType GMapType to change map to when clicked
 * @param {Array} otherDivs Array of other button divs to toggle off
 */  
ExtMapTypeControl.prototype.assignButtonEvent_ = function(div, map, mapType, otherDivs) {
  var me = this;
  GEvent.addDomListener(div, "click", function() {
    for (var i = 0; i < otherDivs.length; i++) {
      me.toggleButton_(otherDivs[i].firstChild, false);
    }
    me.toggleButton_(div.firstChild, true);
    map.setMapType(mapType);
  });
};

/*
 * Changes style of button to appear on/off depending on boolean passed in.
 * @param {DOM Object} div inner button div to change style of
 * @param {Boolean} boolCheck Used to decide to use on style or off style
 */
ExtMapTypeControl.prototype.toggleButton_ = function(div, boolCheck) {
  div.style.fontWeight = boolCheck ? "bold" : "normal";
  div.style.border = "1px solid #fff";
   var shadows = boolCheck ? ["Top", "Left"] : ["Bottom"];
   for (var j = 0; j < shadows.length; j++) {
     div.style["border" + shadows[j]] = "1px solid #b0b0b0";
   }
};

/*
 * Required by GMaps API for controls. 
 * @return {GControlPosition} Default location for map types buttons
 */
ExtMapTypeControl.prototype.getDefaultPosition = function() {
  return new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(7, 7));
};

/*
 * Sets the proper CSS for the given button element.
 * @param {DOM Object} button Button div to set style for
 */
ExtMapTypeControl.prototype.setButtonStyle_ = function(button) {
  button.style.color = "#000000";
  button.style.backgroundColor = "white";
  button.style.font = "small Arial";
  button.style.border = "1px solid black";
  button.style.padding = "0px";
  button.style.margin= "0px";
  button.style.textAlign = "center";
  button.style.fontSize = "12px"; 
  button.style.cursor = "pointer";
};

/*
 * Constructor for TrafficControl.
 * Option hash to decide whether traffic key is shown.
 */
function TrafficControl(opt_opts) {
  this.options = opt_opts;
};

/*
 * It's more efficient to inherit ExtMapTypeControl's prototypes only
 */
function Inherit() {};
Inherit.prototype = ExtMapTypeControl.prototype;
TrafficControl.prototype = new Inherit();

/*
 * Creates the div that holds the traffic button
 * and - if specified - appends the div that holds the traffic key.
 * @param {GMap2} map The map that has had this Control added to it.
 * @return {DOM Object} Div that holds the button.
 */
TrafficControl.prototype.initialize = function(map) {
  var me = this;
  var trafficDiv = me.createButton_("Traffic");
  trafficDiv.setAttribute("title", "Show Traffic");
  trafficDiv.style.visibility = "hidden";
  trafficDiv.style.width = "6em";
  trafficDiv.firstChild.style.cssFloat = "left";
  trafficDiv.firstChild.style.styleFloat = "left";
  me.toggleButton_(trafficDiv.firstChild, false);

  // Sending true makes traffic overlay hidden by default
  var trafficInfo = new GTrafficOverlay({hide: true});
  trafficInfo.hidden = true;

  // Checks whether traffic data is available in viewport,
  // shows and hides the traffic button accordingly.
  GEvent.addListener(trafficInfo, "changed", function(hasTrafficInView) {
   if (hasTrafficInView) {
      trafficDiv.style.visibility = "visible";
   } else {
      trafficDiv.style.visibility = "hidden";
     }
  });
  map.addOverlay(trafficInfo);

  GEvent.addDomListener(trafficDiv.firstChild, "click", function() {
    if (trafficInfo.hidden) {
     trafficInfo.hidden = false;
     trafficInfo.show();
    } else {
     trafficInfo.hidden = true;
     trafficInfo.hide();
    }
    me.toggleButton_(trafficDiv.firstChild, !trafficInfo.hidden);
  });

  /*
  *  Appends traffic key when defined as option
  */
  if(me.options.showTrafficKey) {
   trafficDiv.style.width = "7.8em";
   var keyDiv = document.createElement("div");
   keyDiv.style.width = "1.3em";
   keyDiv.style.cssFloat = "left";
   keyDiv.style.styleFloat = "left";
   keyDiv.innerHTML = "?";

   var keyExpandedDiv = document.createElement("div");
   keyExpandedDiv.style.clear = "both";
   keyExpandedDiv.style.padding = "2px";
   var keyInfo = [{"color": "#30ac3e", "text": "&gt; 50 MPH"},
                  {"color": "#ffcf00", "text": "25-50 MPH"},
                  {"color": "#ff0000", "text": "&lt; 25 MPH"},
                  {"color": "#c0c0c0", "text": "No data"}];
    for (var i = 0; i < keyInfo.length; i++) {
      keyExpandedDiv.innerHTML += "<div style='text-align: left'><span style='background-color: " + keyInfo[i].color + "'>&nbsp;&nbsp;</span>"
    +  "<span style='color: " + keyInfo[i].color + "'> " + keyInfo[i].text + " </span>" + "</div>";
    }
    keyExpandedDiv.style.display = "none";

    GEvent.addDomListener(keyDiv, "click", function() {
      if (me.keyExpanded) {
        me.keyExpanded = false;
        keyExpandedDiv.style.display = "none";
      }
       else {
        me.keyExpanded = true;
        keyExpandedDiv.style.display = "block";
       }
       me.toggleButton_(keyDiv, me.keyExpanded);
    });
    me.toggleButton_(keyDiv, me.keyExpanded);
    trafficDiv.appendChild(keyDiv);
    trafficDiv.appendChild(keyExpandedDiv);
  }
  map.getContainer().appendChild(trafficDiv);
  return trafficDiv;
};


/*
 * Constructor for MoreControl.
 * Immutable shared properties are moved to prototype.
 */
function MoreControl(layers, posX) {
  MoreControl.prototype.layers = layers;
  MoreControl.prototype.posX = posX - 42;
  this.chosen = [];
  this.boxes = [];
};

/*
* Inherits ExtMapTypeControl's prototypes only
*/
MoreControl.prototype = new Inherit();

/*
 * Primarily creates the div that holds the more button.
 * @param {GMap2} map The map that has had this Control added to it.
 * @return {DOM Object} Div that holds the button.
 */
MoreControl.prototype.initialize = function(map) {
  var me = this;
  me.moreDiv = me.createButton_("More...");
  me.moreDiv.setAttribute("title", "Show/Hide Layers");
  me.moreDiv.firstChild.style.width = "7em";
  me.toggleButton_(me.moreDiv.firstChild, false);
  me.map_ = map;
  me.createLayerBox_();

  GEvent.addDomListener(me.moreDiv, "mouseover", function() {
   if(window.timer) clearTimeout(timer);
   me.layerboxDiv.style.display = "block";
  });
  GEvent.addDomListener(me.moreDiv, "mouseout", function(e) {
   me.setClose(e);
  });
  GEvent.addDomListener(me.moreDiv, "click", function() {
   if(me.chosen.length > 0 ) {
    /* Makes an independent copy of chosen array since it will be
    *  reset by switchLayer, which might not be useful here
    */
    var copy = me.chosen.slice();
    for(var i = 0; i < copy.length; i++) {
     var index = parseInt(copy[i]);
     me.switchLayer(true, me.layers[index].obj);
     me.boxes[index].checked = true;
    }
   }
   else {
    me.hideAll();
   }
 });
 map.getContainer().appendChild(me.moreDiv);
 return me.moreDiv;
};

/*
 * Primarily creates the outer div that holds the checkboxes.
 */
MoreControl.prototype.createLayerBox_ = function() {
  var me = this;
  me.layerboxDiv = document.createElement("div");
  me.layerboxDiv.style.textAlign = "left";
  me.layerboxDiv.style.font = "small Arial";
  me.layerboxDiv.style.fontSize = "12px";
  me.layerboxDiv.style.padding = "4px";
  me.layerboxDiv.style.width = "120px";
  me.layerboxDiv.style.backgroundColor = "#fff";
  me.layerboxDiv.style.border = "1px solid gray";
  me.layerboxDiv.style.cursor = "default";

  var input = [];
  for (var i = 0; i < me.layers.length; i++) {
   input[i] = me.createCheckbox_(i, me.layers[i].name);
   me.layerboxDiv.appendChild(input[i] );
  }

  var ruler = document.createElement("hr");
  ruler.style.width = "92%";
  ruler.style.height = "1px";
  ruler.style.textAlign = "center";
  ruler.style.border = "1px";
  ruler.style.color = "#e2e2e2";
  ruler.style.backgroundColor = "#e2e2e2";
  var hidelink = document.createElement("a");
  hidelink.setAttribute("href", "javascript:void(0)");
  hidelink.style.color = "#a5a5a5";
  hidelink.style.textDecoration = "none";
  hidelink.style.cursor = "default";
  hidelink.style.marginLeft = "33px";
  var linktext = document.createTextNode("Hide all");
  hidelink.appendChild(linktext);

  me.layerboxDiv.appendChild(ruler);
  me.layerboxDiv.appendChild(hidelink);

  GEvent.addDomListener(hidelink, "click", function() {
   me.hideAll();
  });
  GEvent.addDomListener(me.layerboxDiv, "mouseout", function(e) {
   me.setClose(e);
  });
  // Defines the position
  var lpos = new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(me.posX, 25));
  lpos.apply(me.layerboxDiv);
  me.layerboxDiv.style.display = "none";

  me.map_.getContainer().appendChild(me.layerboxDiv);
  return me.layerboxDiv;
};

/*
 * Creates checkboxes with a click event inside of a div element.
 * @param {Number} nr The array index of the layers array
 * @param {String} name The name of the layer the checkbox belongs to
 * @return {DOM Object} Div that holds the checkbox and its related text node
 */
MoreControl.prototype.createCheckbox_ = function(nr, name) {
  var me = this;
  var innerDiv = document.createElement("div");
  var checkbox = document.createElement("input");
  checkbox.setAttribute("type", "checkbox");
  var textSpan = document.createElement("span");
  textSpan.style.marginLeft = "2px";
  textSpan.appendChild(document.createTextNode(name));
  innerDiv.appendChild(checkbox);
  innerDiv.appendChild(textSpan);
  innerDiv.appendChild(document.createElement("br"));
  me.boxes.push(checkbox);

  GEvent.addDomListener(checkbox, "click", function() {
   me.switchLayer(this.checked, me.layers[nr].obj);
  });
  return innerDiv;
};

/*
 *  Hides the outer div that holds the checkboxes.
 */
MoreControl.prototype.setClose = function(e) {
  var me = this;
  if(!e) e = window.event;
  if(me.checkMouseLeave(me.layerboxDiv, e))
   timer = window.setTimeout(function() {
    me.layerboxDiv.style.display = "none"; }, 300);
};

/* Avoids firing a mouseout event when the mouse moves over a child element.
 *  This will be caused by event bubbling.
 *  Borrowed from: http://www.faqts.com/knowledge_base/view.phtml/aid/1606/fid/145
 *  @param {DOM Object} element Parent div
 *  @param {event} evt The passed mouse event
 *  @return {Boolean}
 */
MoreControl.prototype.checkMouseLeave = function(element, evt) {
  if(element.contains && evt.toElement) {
   return !element.contains(evt.toElement);
  }
  else if(evt.relatedTarget) {
   return !this.containsDOM(element, evt.relatedTarget);
  }
};

/* Checks if the mouse leaves the parent element.
 *  @param {DOM Object} container Parent div
 *  @param {event} containee Event of node that the mouse entered when leaving the target
 *  @return {Boolean}
 */
MoreControl.prototype.containsDOM = function(container, containee) {
  var isParent = false;
  do {
   if((isParent = container == containee))
    break;
    containee = containee.parentNode;
  }
  while(containee != null);
  return isParent;
};

/*
 *  Adds and removes the chosen layers to/from the map.
 *  Styles the link inside the layer box and the more button accordingly.
 *  @param {Boolean} checked Value of checked or unchecked checkbox
 *  @param {Object} layer The GLayer object to add or to remove
 */
MoreControl.prototype.switchLayer = function(checked, layer) {
  var me = this;
  var link = me.layerboxDiv.lastChild;
  var button = me.moreDiv.firstChild;
  if(checked) {
   me.map_.addOverlay(layer);
   // Resets chosen array
   me.chosen.length = 0;
   /* Highlights the link and
   *  toggles the button
   */
   link.style.color = "#0000cd";
   link.style.textDecoration = "underline";
   link.style.cursor = "pointer";
   me.toggleButton_(button, true);
  }
  else {
   me.map_.removeOverlay(layer);
   /*  Resets the link and the button
    * if all checkboxes were unchecked
   */
   if(!me.checkChecked()) {
    link.style.color = "#a5a5a5";
    link.style.textDecoration = "none";
    link.style.cursor = "default";
    me.toggleButton_(button, false);
   }
  }
};

/*
 *  Calls switchLayer to remove all displayed layers.
 *  Stores index of removed layers in chosen array.
 */
MoreControl.prototype.hideAll = function() {
  var me = this;
  for(var i = 0; i < me.boxes.length; i++) {
   if(me.boxes[i].checked) {
    me.boxes[i].checked = false;
    me.switchLayer(false, me.layers[i].obj);
    me.chosen.push(i);
   }
  }
};

/*
 * Returns true if a checkbox is still checked, otherwise false.
 * @return {Boolean}
 */
MoreControl.prototype.checkChecked = function() {
  var me = this;
  for(var i = 0; i < me.boxes.length; i++) {
   if(me.boxes[i].checked) return true;
  }
  return false;
};


function SavePosControl() {};

/*
* Inherits ExtMapTypeControl's prototypes only
*/
SavePosControl.prototype = new Inherit();

/*
 * Creates the buttons for saving position and the back button.
 * @param {GMap2} map The map that has had this Control added to it.
 * @return {DOM Object} Div that holds both buttons.
 */
SavePosControl.prototype.initialize = function(map) {
  var me = this;
  var saved = [];
  var saveDiv = document.createElement("div");
  var saveButtonDiv = document.createElement("div");
 
  saveButtonDiv.setAttribute("title", "Save actual position and zoomlevel");
  me.setButtonStyle_(saveButtonDiv);
  // Overwrites a few 'normal' styles of these buttons
  saveButtonDiv.style.width = "7em";
  saveButtonDiv.style.padding = "1px";
  saveButtonDiv.style.marginBottom = "4px";
  saveButtonDiv.style.whiteSpace = "nowrap";
  saveButtonDiv.appendChild(document.createTextNode("Save Position"));
  saveDiv.appendChild(saveButtonDiv);
  var backButtonDiv = document.createElement("div");
  backButtonDiv.setAttribute("title", "Back to saved position");
  me.setButtonStyle_(backButtonDiv);
  backButtonDiv.style.width = "7em";
  backButtonDiv.style.padding = "1px";
  backButtonDiv.appendChild(document.createTextNode("To Saved"));
  saveDiv.appendChild(backButtonDiv);

  GEvent.addDomListener(saveButtonDiv, "click", function() {
   var center = map.getCenter();
   var zoom = map.getZoom();
   saved.splice(0, 2, center, zoom);
   alert("Saved Position: "+ center.toUrlValue()+ "\nZoomlevel: "+ zoom);
  });
  GEvent.addDomListener(backButtonDiv, "click", function() {
   if (saved.length > 0) {
    map.setZoom(saved[1]);
    map.panTo(saved[0]);
   }
  });
 map.getContainer().appendChild(saveDiv);
 return saveDiv;
};
