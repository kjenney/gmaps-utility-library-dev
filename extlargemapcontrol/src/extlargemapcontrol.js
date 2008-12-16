/**
 * @name ExtLargeMapControl
 * @version 1.0
 * @author Masashi, Bjorn Brala
 * @fileoverview Creates a MapControl like used in maps.google.com (new december 2008) without the streetview control.
 */
 
 
/*global GKeyboardHandler, GDraggableObject*/

/**
 * @desc Custom Map control, for placement on map.
 *
 * @constructor
 */    
function ExtLargeMapControl() {
  this.sliderStep = 9;
  this.imgSrc = "http://maps.google.com/intl/en_ALL/mapfiles/mapcontrols3d.png";
}


/**
*   @private
**/
ExtLargeMapControl.prototype = new GControl();

/**
*   @private
**/
ExtLargeMapControl.prototype._map = null;

/**
*   @private
**/
ExtLargeMapControl.prototype._container = null;

/**
*   @private
**/
ExtLargeMapControl.prototype._slider = null;

/**
*   @private
**/
ExtLargeMapControl.prototype._keyboardhandler = null;


/**
*   @desc Initilialize the map control
*   @private
**/
ExtLargeMapControl.prototype.initialize = function (map) {
  ExtLargeMapControl.prototype._map = map;

  var _handleList = {};
  
  this._keyboardhandler = new GKeyboardHandler(map);
  var agt = navigator.userAgent.toLowerCase();
  
  this._is_ie    = ((agt.indexOf("msie") !== -1) && (agt.indexOf("opera") === -1));
  this._is_gecko = (agt.indexOf('gecko') !== -1);
  this._is_opera = (agt.indexOf("opera") !== -1);

  


  //common image
  var commonImg = new Image();
  commonImg.src = this.imgSrc;

  //===========================================//
  //       calculation of controller size      //
  //===========================================//
  var currentMapType = map.getCurrentMapType();
  var minZoom = parseInt(currentMapType.getMinimumResolution(), 10);
  var maxZoom = 0;
  var maptypes = map.getMapTypes();
  
  for (var i = 0; i < maptypes.length; i++) {
    if (maptypes[i].getMaximumResolution() > maxZoom) {
      maxZoom = maptypes[i].getMaximumResolution();
    }
  }

  ExtLargeMapControl.prototype._maxZoom = parseInt(maxZoom, 10);
  ExtLargeMapControl.prototype._step = this.sliderStep;
  var ctrlHeight = (86 + 5) + (maxZoom - minZoom + 1) * this.sliderStep + 5;

  //===========================================//
  //             create container              //
  //===========================================//
  var container = document.createElement("div");
  
  container.style.width = "59px";
  container.style.height = (ctrlHeight + this.sliderStep + 2) + "px";
  container.style.overflow = "hidden";
  container.style.padding = "0";
  container.style.MozUserSelect = "none";
  container.style.textAlign = "left";

  _handleList.container = container;
  ExtLargeMapControl.prototype._container = container;

  //===========================================//
  //        make position control area         //
  //===========================================//

  //image load
  var imgContainer = document.createElement("div");
  imgContainer.style.width = "59px";
  imgContainer.style.height = "62px";
  imgContainer.style.overflow = "hidden";
  if (this._is_ie) {
    imgContainer.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + this.imgSrc + "')";
  }
  container.appendChild(imgContainer); 

  if (!this._is_ie) {
    var baseImg = commonImg.cloneNode(false);
    baseImg.style.position = "absolute";
    baseImg.style.left = "0px";
    baseImg.style.top = "0px";
    baseImg.style.width = "59px";
    baseImg.style.height = "458px";
    imgContainer.appendChild(baseImg);
  }

  //top arrow button
  var topBtn = document.createElement("div");
  topBtn.style.position = "absolute";
  topBtn.style.left = "20px";
  topBtn.style.top = "0px";
  topBtn.style.width = "18px";
  topBtn.style.height = "18px";
  topBtn.style.cursor = "pointer";
  topBtn.style.overflow = "hidden";
  topBtn.title = "up";
  container.appendChild(topBtn); 


  //left arrow button
  var leftBtn = topBtn.cloneNode(true);
  leftBtn.style.left = "0px";
  leftBtn.style.top = "20px";
  leftBtn.title = "left";
  container.appendChild(leftBtn); 


  //right arrow button
  var rightBtn = topBtn.cloneNode(true);
  rightBtn.style.left = "40px";
  rightBtn.style.top = "20px";
  rightBtn.title = "right";
  container.appendChild(rightBtn); 

  //bottom arrow button
  var bottomBtn = topBtn.cloneNode(true);
  bottomBtn.style.left = "20px";
  bottomBtn.style.top = "40px";
  bottomBtn.title = "bottom";
  container.appendChild(bottomBtn); 

  //center button
  var homeBtn = topBtn.cloneNode(true);
  homeBtn.style.left = "20px";
  homeBtn.style.top = "20px";
  homeBtn.title = "home position";
  container.appendChild(homeBtn); 


  _handleList.topBtn = topBtn;
  _handleList.leftBtn = leftBtn;
  _handleList.rightBtn = rightBtn;
  _handleList.bottomBtn = bottomBtn;
  _handleList.homeBtn = homeBtn;

  //===========================================//
  //            zoom slider Button             //
  //===========================================//

  var zoomSlideBarContainer = document.createElement("div");
  zoomSlideBarContainer.style.position  = "absolute";
  zoomSlideBarContainer.style.left = "19px";
  zoomSlideBarContainer.style.top = "86px";
  zoomSlideBarContainer.style.width = "22px";
  zoomSlideBarContainer.style.height = ((maxZoom - minZoom + 1) * this.sliderStep) + "px";
  zoomSlideBarContainer.style.overflow = "hidden";
  zoomSlideBarContainer.style.cursor = "pointer";
  container.appendChild(zoomSlideBarContainer); 
  _handleList.slideBar = zoomSlideBarContainer;

  var zoomLevel = map.getZoom();
  //zoomOut Btn load
  var zoomSliderContainer = document.createElement("div");
  zoomSliderContainer.style.position  = "absolute";
  zoomSliderContainer.style.left = 0;
  zoomSliderContainer.style.top = ((maxZoom - zoomLevel) * this.sliderStep + 1) + "px";
  zoomSliderContainer.style.width = "22px";
  zoomSliderContainer.style.height = "14px";
  zoomSliderContainer.style.overflow = "hidden";
  zoomSliderContainer.style.cursor = "url(http://maps.google.com/intl/en_ALL/mapfiles/openhand.cur), default";
  zoomSlideBarContainer.appendChild(zoomSliderContainer); 
  _handleList.slideBarContainer = zoomSliderContainer;

  if (this._is_ie) {
    var zoomSliderBtnImg = document.createElement("div");
    zoomSliderBtnImg.style.position = "relative";
    zoomSliderBtnImg.style.left = 0;
    zoomSliderBtnImg.style.top = "-384px";
    zoomSliderBtnImg.style.width = "22px";
    zoomSliderBtnImg.style.height = "14px";
    zoomSliderBtnImg.style.overflow = "hidden";
    zoomSliderBtnImg.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src = '" + this.imgSrc + "')";
    zoomSliderContainer.appendChild(zoomSliderBtnImg);
    _handleList.zoomSlider = zoomSliderBtnImg;
  } else {
    var slideImg = commonImg.cloneNode(false);
    slideImg.style.position = "absolute";
    slideImg.style.left = "0px";
    slideImg.style.top = "-384px";
    slideImg.style.MozUserSelect = "none";
    slideImg.style.border = "0px none";
    slideImg.style.margin = "0px";
    slideImg.style.padding = "0px";
    slideImg.style.width = "59px";
    slideImg.style.height = "458px";
    zoomSliderContainer.appendChild(slideImg);
    _handleList.zoomSlider = slideImg;
  }

  //===========================================//
  //              zoom out Button              //
  //===========================================//
  //zoomOut Btn load
  var zoomOutBtnContainer = document.createElement("div");
  zoomOutBtnContainer.style.position = "absolute";
  zoomOutBtnContainer.style.left = 0;
  zoomOutBtnContainer.style.top = (86 + (maxZoom - minZoom + 1) * this.sliderStep) + "px";
  zoomOutBtnContainer.style.width = "59px";
  zoomOutBtnContainer.style.height = "23px";
  zoomOutBtnContainer.style.overflow = "hidden";
  container.appendChild(zoomOutBtnContainer); 


  if (this._is_ie) {
    var zoomOutBtnImg = document.createElement("div");
    zoomOutBtnImg.style.position = "relative";
    zoomOutBtnImg.style.left = 0;
    zoomOutBtnImg.style.top = "-360px";
    zoomOutBtnImg.style.width = "59px";
    zoomOutBtnImg.style.height = "23px";
    zoomOutBtnImg.style.overflow = "hidden";
    zoomOutBtnImg.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + this.imgSrc + "')";
    zoomOutBtnContainer.appendChild(zoomOutBtnImg);
  } else {
    var btnImg = commonImg.cloneNode(false);
    btnImg.style.position = "absolute";
    btnImg.style.left = "0px";
    btnImg.style.top = "-360px";
    btnImg.style.width = "59px";
    btnImg.style.height = "458px";
    zoomOutBtnContainer.appendChild(btnImg);
  }

  //zoomOut button
  var zoomOutBtn = document.createElement("div");
  zoomOutBtn.style.position = "absolute";
  zoomOutBtn.style.left = "20px";
  zoomOutBtn.style.top = (91 + (maxZoom - minZoom + 1) * this.sliderStep) + "px";
  zoomOutBtn.style.width = "18px";
  zoomOutBtn.style.height = "23px";
  zoomOutBtn.style.cursor = "pointer";
  zoomOutBtn.style.overflow = "hidden";
  zoomOutBtn.title = "zoom out";
  container.appendChild(zoomOutBtn); 
  _handleList.zoomOutBtn = zoomOutBtn;

  //===========================================//
  //              zoom in Button               //
  //===========================================//
  //zoomIn button
  var zoomInBtn = document.createElement("div");
  zoomInBtn.style.position = "absolute";
  zoomInBtn.style.left = "20px";
  zoomInBtn.style.top = "65px";
  zoomInBtn.style.width = "18px";
  zoomInBtn.style.height = "23px";
  zoomInBtn.style.cursor = "pointer";
  zoomInBtn.style.overflow = "hidden";
  zoomInBtn.title = "zoom in";
  container.appendChild(zoomInBtn); 
  _handleList.zoomInBtn = zoomInBtn;


  //===========================================//
  //                  events                   //
  //===========================================//
  GEvent.addDomListener(_handleList.topBtn, "click", this._eventTop);
  GEvent.addDomListener(_handleList.leftBtn, "click", this._eventLeft);
  GEvent.addDomListener(_handleList.rightBtn, "click", this._eventRight);
  GEvent.addDomListener(_handleList.bottomBtn, "click", this._eventBottom);
  GEvent.addDomListener(_handleList.homeBtn, "click", this._eventHome);
  GEvent.addDomListener(_handleList.zoomOutBtn, "click", this._eventZoomOut);
  GEvent.addDomListener(_handleList.zoomInBtn, "click", this._eventZoomIn);
  GEvent.addDomListener(_handleList.slideBar, "click", this._eventSlideBar);
  GEvent.addListener(map, "zoomend", this._eventZoomEnd);

  var drgOpt = {
    container : _handleList.slideBar
  };
  var drgCtrl = new GDraggableObject(_handleList.slideBarContainer, drgOpt);
  GEvent.addDomListener(drgCtrl, "dragend", this._eventSlideDragEnd);
  ExtLargeMapControl.prototype._slider =  drgCtrl;

  //set current slider position
  this._eventZoomEnd(map.getZoom(), map.getZoom());

  map.getContainer().appendChild(container);
  
  return container;
};


/**
*   @private
**/
ExtLargeMapControl.prototype._eventTop = function () {
  ExtLargeMapControl.prototype._map.panDirection(0, 1);
};

/**
*   @private
**/
ExtLargeMapControl.prototype._eventLeft = function () {
  ExtLargeMapControl.prototype._map.panDirection(1, 0);
};

/**
*   @private
**/
ExtLargeMapControl.prototype._eventRight = function () {
  ExtLargeMapControl.prototype._map.panDirection(-1, 0);
};

/**
*   @private
**/
ExtLargeMapControl.prototype._eventBottom = function () {
  ExtLargeMapControl.prototype._map.panDirection(0, -1);
};

/**
*   @private
**/
ExtLargeMapControl.prototype._eventZoomOut = function () {
  ExtLargeMapControl.prototype._map.zoomOut();
};

/**
*   @private
**/
ExtLargeMapControl.prototype._eventZoomIn = function () {
  ExtLargeMapControl.prototype._map.zoomIn();
};


/**
*   @private
**/
ExtLargeMapControl.prototype._eventSlideBar = function (e) {
  var map = ExtLargeMapControl.prototype._map;
  //calculate of zoomlevel
  var mouseY = e.clientY;
  var slideStep = ExtLargeMapControl.prototype._step;
  var maxZoom = ExtLargeMapControl.prototype._maxZoom;
  var container = ExtLargeMapControl.prototype._container;

  
  //set new zoomLevel
  var ctrlPos = ExtLargeMapControl.prototype._getDomPosition(container);
  mouseY -= (ctrlPos.y + 91);
  var zoomLevel = Math.floor(maxZoom - (mouseY / slideStep));
  zoomLevel = zoomLevel < 0 ? 0 : zoomLevel;
  map.setZoom(zoomLevel);
  
};

/**
*   @private
**/
ExtLargeMapControl.prototype._getDomPosition = function (that) {
  var targetEle = that;
  var pos = { x : 0, y : 0 };
  
  while (targetEle) {
    pos.x += targetEle.offsetLeft; 
    pos.y += targetEle.offsetTop; 
    targetEle = targetEle.offsetParent;

    if (targetEle && this._is_ie) {
      pos.x += (parseInt(ExtLargeMapControl.prototype.getElementStyle(targetEle, "borderLeftWidth", "border-left-width"), 10) || 0);
      pos.y += (parseInt(ExtLargeMapControl.prototype.getElementStyle(targetEle, "borderTopWidth", "border-top-width"), 10) || 0);
    }
  }

  if (this._is_gecko) {
    var bd = document.getElementsByTagName("BODY")[0];
    pos.x += 2 * (parseInt(ExtLargeMapControl.prototype.getElementStyle(bd, "borderLeftWidth", "border-left-width"), 10) || 0);
    pos.y += 2 * (parseInt(ExtLargeMapControl.prototype.getElementStyle(bd, "borderTopWidth", "border-top-width"), 10) || 0);
  }
  return pos;
};

/**
*   @private
**/
ExtLargeMapControl.prototype.getElementStyle = function (targetElm, IEStyleProp, CSSStyleProp) {
  var elem = targetElm;
  if (elem.currentStyle) {
    return elem.currentStyle[IEStyleProp];
  } else if (window.getComputedStyle) {
    var compStyle = window.getComputedStyle(elem, "");
    return compStyle.getPropertyValue(CSSStyleProp);
  }
};

/**
*   @private
**/
ExtLargeMapControl.prototype.stopDefaultAndPropagation = function (e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  if (window.event) {
    window.event.cancelBubble = true;
  }
  if (e.preventDefault) {
    e.preventDefault();
  }
  if (window.event) {
    window.event.returnValue = false;
  }
};

/**
*   @private
**/
ExtLargeMapControl.prototype._eventSlideDragEnd = function (e) {
  //calculate of zoomlevel
  var maxZoom = ExtLargeMapControl.prototype._maxZoom;
  var mouseY = ExtLargeMapControl.prototype._slider.top;
  var step = ExtLargeMapControl.prototype._step;

  //set new zoomLevel
  var zoomLevel = Math.floor(maxZoom - (mouseY / step));
  zoomLevel = zoomLevel < 0 ? 0 : zoomLevel;
  ExtLargeMapControl.prototype._map.setZoom(zoomLevel);
};

/**
*   @private
**/
ExtLargeMapControl.prototype._eventHome = function () {
  ExtLargeMapControl.prototype._map.returnToSavedPosition();
};

/**
*   @private
**/
ExtLargeMapControl.prototype._eventZoomEnd = function (oldZoom, newZoom) {
  var maxZoom = ExtLargeMapControl.prototype._maxZoom;
  var step = ExtLargeMapControl.prototype._step;
  ExtLargeMapControl.prototype._slider.moveTo(new GPoint(0, (maxZoom - newZoom) * step));
};

/**
*   @private
**/
ExtLargeMapControl.prototype.getDefaultPosition = function () {
  return new GControlPosition(G_ANCHOR_TOP_LEFT, new GSize(10, 10));
};

/**
*   @private
**/
ExtLargeMapControl.prototype.selectable = function () {
  return false;
};

/**
*   @private
**/
ExtLargeMapControl.prototype.printable = function () {
  return true;
};
