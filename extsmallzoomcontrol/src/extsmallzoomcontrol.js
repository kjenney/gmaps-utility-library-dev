/**
 * @name ExtSmallZoomControl
 * @version 1.0
 */


/*global GKeyboardHandler*/

/**
 * @constructor
 */    
function ExtSmallZoomControl(opt_opts_) {
  this.sliderStep = 9;
  this.imgSrc = "http://maps.google.com/mapfiles/szc3d.png";
  if(this.isNull(opt_opts_)){opt_opts_=new Object();};
  this.zoomInBtnTitle = opt_opts_.zoomUpBtnTitle || "zoom in";
  this.zoomOutBtnTitle = opt_opts_.zoomDownBtnTitle || "zoom out";
  
  this.opt_opts_ = opt_opts_;
  
  this.divTbl = {};
  this.divTbl.container = { "left" : 0, "top" : 0, "width" : 19, "height":42};
  this.divTbl.zoomInBtn = { "left" : 0, "top" : 0, "width" : 19, "height" : 21};
  this.divTbl.zoomOutBtnImg = { "left" : 0, "top" : -21, "width" : 19, "height" : 21};
  this.divTbl.zoomOutBtn = { "left" : 0, "top" : 21, "width" : 19, "height" : 21};

}


/**
 * @private
 */
ExtSmallZoomControl.prototype = new GControl();


/**
 * @desc Initialize the map control
 * @private
 */
ExtSmallZoomControl.prototype.initialize = function (map) {

  this._map = map;

  var _handleList = {};
  
  this._keyboardhandler = new GKeyboardHandler(map);
  var agt = navigator.userAgent.toLowerCase();
  
  this._is_ie    = ((agt.indexOf("msie") !== -1) && (agt.indexOf("opera") === -1));
  this._is_gecko = (agt.indexOf('gecko') !== -1);
  this._is_opera = (agt.indexOf("opera") !== -1);

  // create container
  var container = document.createElement("div");
  with(container.style){
    left=this.divTbl.container.left+"px";
    top=this.divTbl.container.top+"px";
    width=this.divTbl.container.width+"px";
    height=this.divTbl.container.height+"px";
    position="absolute";
    overflow="hidden";
  };
  this._container = container;
  
  //zoom up button
  var zoomInBtn = this.makeImgDiv_(this.imgSrc, this.divTbl.zoomInBtn);
  zoomInBtn.style.cursor = "pointer";
  zoomInBtn.title = this.zoomInBtnTitle;
  container.appendChild(zoomInBtn); 

  //zoom down button
  var zoomOutBtn = this.makeImgDiv_(this.imgSrc, this.divTbl.zoomOutBtnImg);
  with(zoomOutBtn.style){
    cursor="pointer";
    overflow="hidden";
    position="absolute";
    left=this.divTbl.zoomOutBtn.left+"px";
    top=this.divTbl.zoomOutBtn.top+"px";
    width=this.divTbl.zoomOutBtn.width+"px";
    height=this.divTbl.zoomOutBtn.height+"px";
  };
  zoomOutBtn.title = this.zoomOutBtnTitle;
  container.appendChild(zoomOutBtn); 

  // events
  GEvent.bindDom(zoomOutBtn, "click", this, this._eventZoomOut);
  GEvent.bindDom(zoomInBtn, "click", this, this._eventZoomIn);

  // Save DOM element reference in the object.
  this._handleList = _handleList;

  map.getContainer().appendChild(container);
  
  return container;
};

/**
 * @private
 */
ExtSmallZoomControl.prototype._eventZoomOut = function () {
  this._map.zoomOut();
};

/**
 * @private
 */
ExtSmallZoomControl.prototype._eventZoomIn = function () {
  this._map.zoomIn();
};


/**
 * @private
 * @ignore
 */
ExtSmallZoomControl.prototype.copy = function () {
  return new ExtSmallZoomControl(this.latlng_, this.opt_opts_);
};


/**
 * @private
 * @ignore
 */
ExtSmallZoomControl.prototype.getDefaultPosition = function () {
  return new GControlPosition(G_ANCHOR_TOP_LEFT, new GSize(10, 10));
};


/**
 * @private
 * @ignore
 */
ExtSmallZoomControl.prototype.selectable = function () {
  return false;
};

/**
 * @private
 * @ignore
 */
ExtSmallZoomControl.prototype.printable = function () {
  return true;
};

/**
 * @private
 * @desc      detect null,null string and undefined
 * @param     value
 * @return    true  :  value is nothing
 *            false :  value is not nothing
 */
ExtSmallZoomControl.prototype.isNull = function (value) {
  if (!value && value !== 0 ||
     value === undefined ||
     value === "" ||
     value === null ||
     typeof value === "undefined") {
    return true;
  }
  return false;
};

/**
 * @private
 * @desc      create div element with PNG image
 */
ExtSmallZoomControl.prototype.makeImgDiv_ = function (imgSrc, params) {
  var imgDiv = document.createElement("div");
  imgDiv.style.position = "absolute";
  imgDiv.style.overflow = "hidden";
  
  if (params.width) {
    imgDiv.style.width = params.width + "px";
  }
  if (params.height) {
    imgDiv.style.height = params.height + "px";
  }
  
  
  var img = null;
  if (!this._is_ie) {
    img = new Image();
    img.src = imgSrc;
  } else {
    img = document.createElement("div");
    if (params.width) {
      img.style.width = params.width + "px";
    }
    if (params.height) {
      img.style.height = params.height + "px";
    }
  }
  img.style.position = "relative";
  img.style.left = params.left + "px";
  img.style.top =  params.top + "px";
  img.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + imgSrc + "')";
  imgDiv.appendChild(img);
  return imgDiv;
};

