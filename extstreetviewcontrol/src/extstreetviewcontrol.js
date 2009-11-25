/**
 * @name ExtStreetviewControl
 * @version 1.0
 * @author Masashi Katsumata
 * @fileoverview 
 * This library creates a collapsible StreetView display in the corner of the main map.
 * And the ExtStreetviewControl adds a marker for reference location on the main map.
 * You can draggble it and change location main map and StreetView display location.
 * Note: Unlike other controls, you can only place this control in the bottom right corner of the map (G_ANCHOR_BOTTOM_RIGHT).
 */

/**
 * @name ExtStreetviewOptions
 * @class This class represents optional arguments to {@link ExtStreetviewControl}. 
 *   It has no constructor, but is instantiated as an object literal.
 * @property {GLatLng} [latlng = null] Specifies latlng of panorama.
 *  If it is not set, then control gets center location of main map.
 * @property {GSize} [size = GSize(300, 210)] Specifies control's size. 
 * @property {GMarker} [marker = PegmanMarker] Specifies a marker for user handling.
 *  See a PegmanMarker into extstreetviewcontrol.js
 * @property {GPov} [pov = {yaw : 0, pitch : 0, panoId : null}] Specifies initialize pov of panorama.
 * @property {Boolean} [hidden = false] Specify visibility when control is
 *  added to the map. If it is set to true, the control is hidden.
 * @property {String} [mainContent = "MAP"] Specify main content into the map div.
 *  You can select strings; "MAP" or "STREETVIEW".
 * @property {String} [controlStatus = "NORMAL"] Specify control status.
 *  You can select string; "NORMAL" or "MINI".
 */

/*global PegmanMarker */


/**
 * @desc
 * Creates a control and a marker with options specified in {@link ExtStreetviewOptions}.
 * @param {ExtStreetviewOptions} [opt_opts] Optional arguments.
 * @constructor
 */
function ExtStreetviewControl(opt_opts) {
  //============================
  // Image and clip rect table
  //============================
  this.arrowBtnTbl_ = {};
  
  this.arrowBtnTbl_.src = "http://maps.gstatic.com/mapfiles/cb/resize_toggles.png";
  this.arrowBtnTbl_.upArrow = {"left" : -1, "top" : -86, "width" : 15, "height" : 15};
  this.arrowBtnTbl_.downArrow = {"left" : -1, "top" : -69, "width" : 15, "height" : 15};
  
  
  //============================
  // Parse options
  //============================
  if (ExtStreetviewControl.prototype.isNull(opt_opts)) {
    opt_opts = {};
  }
  
  this.latlng_ = opt_opts.latlng || null;
  this.ctrlSize_ = opt_opts.size || new GSize(300, 210);
  this.pov_ = opt_opts.pov || {"yaw" : 0, "pitch" : 0, "panoId" : null};
  this.marker_ = opt_opts.marker || null;
  this.isHidden_ = opt_opts.hidden || false;
  this.initStatus_ = opt_opts.controlStatus || "NORMAL";
  this.initContent_ = opt_opts.mainContent || "MAP";
  
  this.controlStatus_ = "NORMAL";
  this.mainContent_ = "MAP";
  this.padding_ = 5;
  this.frameColor_ = "#6784C7";

}

/**
 * @private
 */
ExtStreetviewControl.prototype = new GControl();

/**
 * @desc Initialize the ExtStreetviewControl
 * @private
 */
ExtStreetviewControl.prototype.initialize = function (map) {
  var this_ = this;
  GControl.prototype.initialize.apply(this, arguments);
  
  this.checkBrowserAgent();

  //Release streetview memory
  GEvent.bindDom(window, "unload", this, this.removeControl_);

  //==============================================
  //  Initialize
  //==============================================
  this.latlng_ = this.latlng_ || map.getCenter();
  this.map_ = map;
  this.mapContainer_ = map.getContainer();
  this.bounds_ = map.getBounds();
  this.stViewCnt_ = 0;

  this.swapMapContainer_ = this.mapContainer_.cloneNode(false);

  this.swapFlashContainer_ = document.createElement("div");
  this.swapFlashContainer_.style.position = "absolute";
  this.swapFlashContainer_.style.left = 0;
  this.swapFlashContainer_.style.right = 0;
  this.swapFlashContainer_.style.top = 0;
  this.swapFlashContainer_.style.bottom = 0;
  this.swapMapContainer_.appendChild(this.swapFlashContainer_);

  this.swapiframeBase_ = this.createEle_(this.ctrlSize_, "iframe");
  this.swapiframeBase_.style.bottom = 0;
  this.swapiframeBase_.style.right = 0;
  this.swapiframeBase_.style.borderStyle = "none";
  this.swapiframeBase_.src = "";
  this.swapiframeBase_.frameborder = 0;
  this.swapMapContainer_.appendChild(this.swapiframeBase_);

  this.mapContainer_.parentNode.replaceChild(this.swapMapContainer_, this.mapContainer_);
  this.mapContainer_.setAttribute("id", null);
  this.mapContainer_.setAttribute("class", null);
  this.setElementStyle_(this.mapContainer_, "width", "100%", null);
  this.setElementStyle_(this.mapContainer_, "height", "100%", null);
  this.swapMapContainer_.appendChild(this.mapContainer_);


  //==============================================
  //  Create a window likes the GOverviewControl
  //==============================================

  //Create a streetview window
  var result = this.createContainer_(this.ctrlSize_);
  this.cornerInfo_ = result;
  this.mainWindow_ = result.mainWindow;
  this.container_ = result.container;
  this.container_.style.right = 0;
  this.container_.style.bottom = 0;
  this.container_.style.backgroundColor = this.frameColor_;//"#a8acb8";  

  this.cornerInfo_.containerIframe = this.swapiframeBase_;
  this.swapMainWindow_ = this.mainWindow_.cloneNode(false);

  //Append the container_
  var mapParentEle = this.mapContainer_.parentNode;
  if (this.isNull(mapParentEle)) {
    mapParentEle = document.getElementsByTagName("body")[0];
  }
  
  if (this.isHidden_ === true) {
    this.hide();
  }
  map.getContainer().appendChild(this.container_);


  //Listening buttons click event
  GEvent.bindDom(result.downArrowBtn, "click", this, function () {
    if (this_.controlStatus_ === "NORMAL") {
      //normal -> mini
      this_.setCtrlStauts("MINI");
    }
  });
  GEvent.bindDom(result.upArrowBtn, "click", this, function () {
    if (this_.controlStatus_ === "MINI") {
      //mini -> normal
      this_.setCtrlStauts("NORMAL");
    } else {
      //swap container map and streetview
      this_.swapMap2CornerWindow_();
    }
  });
  
  GEvent.bindDom(window, "resize", this, function () {
    if (this_.mainContent_ === "STREETVIEW") {
      this_.swapFlashContainer_.style.width = this_.swapMapContainer_.clientWidth + "px";
      this_.swapFlashContainer_.style.height = this_.swapMapContainer_.clientHeight + "px";
      this_.stObj_.checkResize();
    }
  });

  GEvent.bind(map, "moveend", this, this.mapMove_);

  if (this.isNull(this.marker_)) {
    this.marker_ = new PegmanMarker(this.latlng_, {"draggable" : true});
  }
  this.map_.addOverlay(this.marker_);
  this.marker_.redraw(false, "ANGLE", 0);

  GEvent.bind(this.marker_, "dragstart", this, this.markerDragStart_);
  GEvent.bind(this.marker_, "drag", this, this.markerDrag_);
  GEvent.bind(this.marker_, "dragend", this, this.markerDragEnd_);


  //==============================================
  //  initialize streetview
  //==============================================
  
  //streetview panorama
  this.flashContainer_ = this.mainWindow_;
  this.stClient_ = new GStreetviewClient();
  this.createStreetviewPanorama_(this.latlng_, this.pov_);
  

  //==============================================
  //  initialize main content and window status
  //==============================================
  this.setCtrlStauts(this.initStatus_);
  this.setMainContent(this.initContent_);

  //return dummy div element to map.
  var dummyDiv = this.createEle_({"width" : 0, "height" : 0});
  dummyDiv.style.display = "none";
  return dummyDiv;
};

/**
 * @desc Sets control status
 * @param {status} "MINI" : The control is minimized.<br>
 * "NORMAL" : The control is normal size.<br>
 */
ExtStreetviewControl.prototype.setCtrlStauts = function (status) {
  switch (status) {
  case "MINI":
    //normal -> mini
    this.resizeCornerWindow_({endSize : this.arrowBtnTbl_.downArrow, sizeDirection : -1}, "MINI");
    break;
    
  case "NORMAL":
    //mini - > normal 
    if (this.controlStatus_ === "MINI") {
      this.resizeCornerWindow_({endSize : this.ctrlSize_, sizeDirection : 1}, "NORMAL");
    }
    break;
  }
};

/**
 * @private
 * @desc map move
 */
ExtStreetviewControl.prototype.mapMove_ = function () {
  this.bounds_ = this.map_.getBounds();
};

/**
 * @private
 * @desc pegman-marker drag start
 */
ExtStreetviewControl.prototype.markerDragStart_ = function () {
  this.map_.closeInfoWindow();
  this.isDragging_ = true;
  this.lng_ = this.latlng_.lng();
};

/**
 * @private
 * @desc pegman-marker dragging
 */
ExtStreetviewControl.prototype.markerDrag_ = function (latlng) {
  var beforeLng = this.lng_;
  var currentLng = latlng.lng();
  this.lng_ = currentLng;
  
  var dragDirection = beforeLng - currentLng;
  var imgIdx;
  if (dragDirection > 0) {
    imgIdx = "LEFT";
  } else {
    imgIdx = "RIGHT";
  }
  var prefix = "ENABLE";
  var this_ = this;
  this.stClient_.getNearestPanorama(latlng, function (panoData) {
    if (panoData.code !== 200) {
      prefix = "DISABLE";
    }
    if (this_.isDragging_ === true) {
      this_.marker_.redraw(false, "DRAG", prefix + "_" + imgIdx);
    }
  });
  
};

/**
 * @private
 * @desc pegman-marker drag end
 */
ExtStreetviewControl.prototype.markerDragEnd_ = function (latlng) {
  this.isDragging_ = false;
  this.map_.panTo(latlng);  
  this.setLocationAndPOV(latlng);
};

/**
 * @desc Get current Panorama View
 * @return {GPov}
 */
ExtStreetviewControl.prototype.getPov = function () {
  if (!this.isNull(this.pov_)) {
    return this.stObj_.getPOV();
  } else {
    return null;
  }
};

/**
 * @desc Set current Panorama View
c */
ExtStreetviewControl.prototype.setPov = function (pov) {
  if (!this.isNull(pov)) {
    this.pov_ = pov;
    this.stObj_.setPOV(pov);
  }
};

/**
 * @desc Get marker for StreetviewControl
 * @return {GMarker}
 */
ExtStreetviewControl.prototype.getMarker = function () {
  return this.marker_;
};


/**
 * @desc Set location of panorama and marker, and view of panorama.
 * @param {GLatLng} latlng location
 * @param {GPov} [pov] View of panorama
 */
ExtStreetviewControl.prototype.setLocationAndPOV = function (latlng, pov) {
  if (this.isNull(pov)) {
    this.pov_ = this.stObj_.getPOV();
  } else {
    this.pov_ = pov;
  }
  

  this.marker_.setLatLng(latlng);
  var this_ = this;
  this.stClient_.getNearestPanorama(latlng, function (panoData) {
    if (panoData.code === 200) {
      if (this_.isNull(pov)) {
        this_.pov_.yaw = this_.computeAngle_(latlng, panoData.location.latlng);
        this_.marker_.redraw(false, "ANGLE", this_.pov_.yaw);
      } else {
        this_.marker_.redraw(false, "ANGLE", 0);
      }
      this_.setCtrlStauts("NORMAL");
    } else {
      this_.setCtrlStauts("MINI");
      this_.marker_.redraw(false, "ANGLE", 0);
    }
    this_.stClientEnum_(this_, panoData, this_.pov_);
  });
};

/**
 * @desc Compute the yaw between 2 points.
 * taken from http://gmaps-samples.googlecode.com/svn/trunk/streetview/angletowardsbuilding.html
 * @param {GLatLng} [endLatLng] end location
 * @param {GLatLng} [startLatLng] start location
 */
ExtStreetviewControl.prototype.computeAngle_ = function (endLatLng, startLatLng) {
  var DEGREE_PER_RADIAN = 57.2957795;
  var RADIAN_PER_DEGREE = 0.017453;
  var dlat = endLatLng.lat() - startLatLng.lat();
  var dlng = endLatLng.lng() - startLatLng.lng();
  // We multiply dlng with cos(endLat), since the two points are very closeby,
  // so we assume their cos values are approximately equal.
  var yaw = Math.atan2(dlng * Math.cos(endLatLng.lat() * RADIAN_PER_DEGREE), dlat) * DEGREE_PER_RADIAN;
  if (yaw >= 360) {
    yaw -= 360;
  } else if (yaw < 0) {
    yaw += 360;
  }
  return yaw;
};


/**
 * @private
 * @ignore
 */
ExtStreetviewControl.prototype.getDefaultPosition = function () {
  return new GControlPosition(G_ANCHOR_BOTTOM_RIGHT, new GSize(0, 0));
};

/**
 * @private
 * @ignore
 */
ExtStreetviewControl.prototype.selectable = function () {
  return false;
};

/**
 * @private
 * @ignore
 */
ExtStreetviewControl.prototype.printable = function () {
  return true;
};

/**
 * @private
 */
ExtStreetviewControl.prototype.removeControl_ = function () {
  this.stObj_.remove();
  GEvent.clearInstanceListeners(this.stObj_);
};

/**
 * @private
 * @desc changed the position on streetview
 */
ExtStreetviewControl.prototype.stInitialized_ = function (location) {
  if (this.isNull(location.pov)) {
    return;
  }

  if (!this.isNull(location.pov.yaw) || this.isNull(this.pov_.yaw)) {
    this.pov_ = location.pov;
  }
  
  if (this.isNull(location.latlng)) {
    return;
  }
  this.latlng_ = location.latlng;
  this.marker_.setLatLng(location.latlng);
  if (!this.bounds_.containsLatLng(location.latlng)) {
    this.map_.panTo(location.latlng);
  }
};

/**
 * @private
 * @desc      create new Streetview Panorama
 *            leak memory to avoid.
 */
ExtStreetviewControl.prototype.createStreetviewPanorama_ = function (latlng, pov) {
  var flag = false;
  if (!this.isNull(this.stObj_)) {
    GEvent.clearInstanceListeners(this.stObj_);
    this.stObj_.remove();
    flag = true;
  }
  
  var opts = {};
  if (latlng) {
    opts.latlng = latlng;
  }
  if (pov) {
    opts.pov = pov;
  }
  
  this.stObj_ = new GStreetviewPanorama(this.flashContainer_, opts);
  this.stViewCnt_ = 0;
  
  GEvent.bind(this.stObj_, "initialized", this, this.stInitialized_);
  GEvent.bindDom(this.stObj_, "yawchanged", this, this.yawChanged_);
  GEvent.bindDom(this.stObj_, "pitchchanged", this,  this.pitChchanged_);
  
};

/**
 * @private
 * @desc      callback for GStreetviewClient
 */
ExtStreetviewControl.prototype.stClientEnum_ = function (this_, gstreetviewdata, pov) {
  if (gstreetviewdata.code !== 200) {
    this_.marker_.redraw(false, "ANGLE", 0);
    return;
  }
  if (!this_.isNull(pov)) {
    gstreetviewdata.location.pov = pov;
  }
  
  this_.stObj_.setLocationAndPOV(gstreetviewdata.location.latlng, gstreetviewdata.location.pov);
  this_.marker_.isFirst_ = false;

};


/**
 * @private
 * @desc yawchanged on streetview
 */
ExtStreetviewControl.prototype.yawChanged_ = function (yaw) {
  this.pov_.yaw = yaw;

  this.marker_.redraw(false, "ANGLE", yaw);
};

/**
 * @private
 * @desc pitchchanged on streetview
 */
ExtStreetviewControl.prototype.pitChchanged_ = function (pitch) {
  this.pov_.pitch = pitch;
};



/**
 * @private
 * @desc make container for ExtStreetviewControl
 * @ignore
 */
ExtStreetviewControl.prototype.createContainer_ = function (ctrlPosSize) {
  var x, y, w, h;

  //make container
  var container = this.createEle_(ctrlPosSize);
  var containerIframe = this.createEle_(ctrlPosSize, "iframe");
  containerIframe.style.bottom = 0;
  containerIframe.style.right = 0;
  containerIframe.style.borderStyle = "none";
  containerIframe.src = "";
  containerIframe.frameborder = 0;
  containerIframe.style.visibility = "hidden";
  container.appendChild(containerIframe);

  //make container for overview map.
  var mainContainerFrameSize = {};
  mainContainerFrameSize.left = this.padding_;
  mainContainerFrameSize.top = this.padding_;
  mainContainerFrameSize.width = ctrlPosSize.width - this.padding_ - (this._is_ie ? 2 : 0);
  mainContainerFrameSize.height = ctrlPosSize.height - this.padding_ - (this._is_ie ? 2 : 0);
  
  var mainFrame = this.createEle_(mainContainerFrameSize);
  mainFrame.style.borderStyle = "solid";
  mainFrame.style.borderColor = "#888";
  mainFrame.style.borderWidth = "1px 0 0 1px";
  mainFrame.style.backgroundColor = "#e8ecf8";
  container.appendChild(mainFrame);
  
  var mainContainerSize = {};
  mainContainerSize.left = 0;
  mainContainerSize.top = 0;
  mainContainerSize.width = ctrlPosSize.width - this.padding_ - (this._is_ie ? 2 : 0);
  mainContainerSize.height = ctrlPosSize.height - this.padding_ - (this._is_ie ? 2 : 0);
  var mainWindow = this.createEle_(mainContainerSize);
  mainFrame.appendChild(mainWindow);



  //Down arrow button
  x = ctrlPosSize.width - (this._is_ie ? 1 : 0) - this.arrowBtnTbl_.downArrow.width;
  y = ctrlPosSize.height -  (this._is_ie ? 1 : 0) - this.arrowBtnTbl_.downArrow.height;
  
  var btnBase1 = this.createEle_(this.arrowBtnTbl_.downArrow, "iframe");
  btnBase1.style.left = x + "px";
  btnBase1.style.top = y + "px";
  btnBase1.style.borderStyle = "none";
  btnBase1.src = "";
  btnBase1.frameborder = 0;
  btnBase1.border = 0;
  btnBase1.allowtransparency = true;
  container.appendChild(btnBase1);
  
  var downArrowBtn = this.makeImgDiv_(this.arrowBtnTbl_.src, this.arrowBtnTbl_.downArrow);
  downArrowBtn.style.cursor = "pointer";
  downArrowBtn.style.left = x + "px";
  downArrowBtn.style.top = y + "px";
  container.appendChild(downArrowBtn);

  //Up arrow button
  x = 0;
  y = 0;
  var btnBase2 = this.createEle_(this.arrowBtnTbl_.upArrow, "iframe");
  btnBase2.style.top = x + "px";
  btnBase2.style.left = y + "px";
  btnBase2.style.borderStyle = "none";
  btnBase2.src = "";
  btnBase2.frameborder = 0;
  btnBase2.border = 0;
  btnBase2.allowtransparency = true;
  container.appendChild(btnBase2);
  
  var upArrowBtn = this.makeImgDiv_(this.arrowBtnTbl_.src, this.arrowBtnTbl_.upArrow);
  upArrowBtn.style.cursor = "pointer";
  upArrowBtn.style.left = x + "px";
  upArrowBtn.style.top = y + "px";
  container.appendChild(upArrowBtn);

  return {container : container,
          containerIframe : containerIframe,
          downArrowBtn : downArrowBtn,
          upArrowBtn : upArrowBtn,
          mainWindow : mainWindow};
};

/**
 * @desc Specify main content into the map div.
 *  You can select strings; "MAP" or "STREETVIEW".
 * @param {String} contentType
 */
ExtStreetviewControl.prototype.setMainContent = function (contentType) {
  var refreshStreetview = false;
  
  if (contentType === "STREETVIEW" && this.mainContent_ === "MAP") {
    // map -> streetview
    this.removeControl_();
    
    this.mapContainer_.removeChild(this.container_);
    this.swapMapContainer_.removeChild(this.mapContainer_);
    
    this.swapFlashContainer_.style.width =  this.swapMapContainer_.clientWidth + "px";
    this.swapFlashContainer_.style.height = this.swapMapContainer_.clientHeight + "px";
    
    this.flashContainer_ = this.swapFlashContainer_;

    this.mainWindow_.parentNode.replaceChild(this.swapMainWindow_, this.mainWindow_);
    this.swapMapContainer_.appendChild(this.container_);
    this.swapMainWindow_.appendChild(this.mapContainer_);
    this.mainContent_ = "STREETVIEW";
    
    refreshStreetview = true;
    
  } else if (contentType === "MAP" && this.mainContent_ === "STREETVIEW") {
    // streetview -> map
    this.removeControl_();
    
    this.swapMainWindow_.removeChild(this.mapContainer_);
    this.swapMapContainer_.removeChild(this.container_);
    this.swapMainWindow_.parentNode.replaceChild(this.mainWindow_, this.swapMainWindow_);

    this.flashContainer_ = this.mainWindow_;

    this.swapMapContainer_.appendChild(this.mapContainer_);
    this.mapContainer_.appendChild(this.container_);
    this.mainContent_ = "MAP";
    
    refreshStreetview = true;
  }
  
  if (refreshStreetview === true) {
    this.createStreetviewPanorama_(this.latlng_, this.pov_);

    this.map_.checkResize();
    this.map_.setCenter(this.latlng_);
  }
};

/**
 * @private
 */
ExtStreetviewControl.prototype.swapMap2CornerWindow_ = function () {
  if (this.mainContent_ === "MAP") {
    this.setMainContent("STREETVIEW");
  } else {
    this.setMainContent("MAP");
  }
  GEvent.trigger(this, "onSwapWindow", this.mainContent_);
};

/**
 * @private
 */
ExtStreetviewControl.prototype.resizeCornerWindow_ = function (param, finishStatus) {
  param.width = this.container_.offsetWidth;
  param.height = this.container_.offsetHeight;
  
  param.xStep = Math.abs((param.endSize.width - param.width) / 5);
  param.yStep = Math.abs((param.endSize.height - param.height) / 5);
  param.cnt = 0;
  
  var this_ = this;
  var resizeAnimation = function (param) {
    param.width = param.width + param.xStep * param.sizeDirection;
    param.width = param.width < 0  ? 0 : param.width;
    param.height = param.height + param.yStep * param.sizeDirection;
    param.height = param.height < 0  ? 0 : param.height;
    
    this_.container_.style.width = param.width + "px";
    this_.container_.style.height = param.height + "px";
    
    this_.cornerInfo_.containerIframe.style.width = param.width + "px";
    this_.cornerInfo_.containerIframe.style.height = param.height + "px";
    
    param.cnt++;
    if (param.cnt < 5) {
      var arg = arguments;
      setTimeout(function () {
        arg.callee.apply(null, arg);
      }, 10);
      
    } else {
      this_.container_.style.width = param.endSize.width + "px";
      this_.container_.style.height = param.endSize.height + "px";

      this_.cornerInfo_.containerIframe.style.width = param.endSize.width + "px";
      this_.cornerInfo_.containerIframe.style.height = param.endSize.height + "px";

      this_.controlStatus_ = finishStatus;
    }
  };
  resizeAnimation(param);
};



/**
 * @private
 * @desc      create div element with PNG image
 */
ExtStreetviewControl.prototype.makeImgDiv_ = function (imgSrc, params) {
  this.checkBrowserAgent();
  
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
  if (this._is_ie67) {
    img = document.createElement("div");
    if (!this.isNull(params.width)) {
      img.style.width = params.width + "px";
    }
    if (!this.isNull(params.height)) {
      img.style.height = params.height + "px";
    }
    img.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + imgSrc + "')";
  } else {
    img = new Image();
    img.src = imgSrc;
  }
  img.style.position = "relative";
  if (!this.isNull(params.left)) {
    img.style.left = params.left + "px";
  }
  if (!this.isNull(params.top)) {
    img.style.top = params.top + "px";
  }
  imgDiv.appendChild(img);
  return imgDiv;
};


/**
 * @desc Change visibility of the control to hidden.
 */
ExtStreetviewControl.prototype.hide = function () {
  this.container_.style.visibility = "hidden";
  //this.swapMapContainer_.style.visibility = "hidden";
  this.isHidden_ = true;
};

/**
 * @desc Change visibility of the control to visible.
 */
ExtStreetviewControl.prototype.show = function () {
  this.container_.style.visibility = "visible";
  //this.swapMapContainer_.style.visibility = "visible";
  this.isHidden_ = false;
};

/**
 * @desc Returns true when the control is hidden.
 * @return {Boolean}
 */
ExtStreetviewControl.prototype.isHidden = function () {
  return this.isHidden_;
};


/**
 * @private
 * @desc      create div element
 */
ExtStreetviewControl.prototype.createEle_ = function (params, specifyTagName) {

  var element = document.createElement(this.isNull(specifyTagName) ? "div" : specifyTagName);
  
  if (!this.isNull(params)) {
    for (var s in params.style) {
      if (s in element.style) {
        element.style[s] = params.style[s];
      }
    }
    if (!this.isNull(params.left)) {
      element.style.left = params.left + "px";
    }
    if (!this.isNull(params.right)) {
      element.style.right = params.right + "px";
    }
    if (!this.isNull(params.top)) {
      element.style.top = params.top + "px";
    }
    if (!this.isNull(params.bottom)) {
      element.style.bottom = params.bottom + "px";
    }
    if (!this.isNull(params.width)) {
      element.style.width = params.width + "px";
    }
    if (!this.isNull(params.height)) {
      element.style.height = params.height + "px";
    }    
    element.style.position = "absolute";
    element.style.overflow = "hidden";
  }
  return element;
};

/**
 * @desc Check browser agent
 * @private
 */
ExtStreetviewControl.prototype.checkBrowserAgent = function () {
  var agt = navigator.userAgent.toLowerCase();
  this._is_ie    = ((agt.indexOf("msie") !== -1) && (agt.indexOf("opera") === -1));
  this._is_ie67  = (agt.indexOf("msie 6") !== -1 || agt.indexOf("msie 7") !== -1);
  this._is_ie8   = (this._is_ie === true && this._is_ie67 === false);
  this._is_gecko = (agt.indexOf("gecko") !== -1);
  this._is_opera = (agt.indexOf("opera") !== -1);
  this._is_chrome = (agt.indexOf("chrome") !== -1);
  this._is_safari = (agt.indexOf("safari") !== -1);
};

/**
 * @private
 * @desc      detect null,null string and undefined
 * @param     value
 * @return    true  :  value is nothing
 *            false :  value is not nothing
 */
ExtStreetviewControl.prototype.isNull = function (value) {
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
 * @desc      calculate dom position
 * @param     targetEle : target DOM element
 * @return    GPoint
 */
ExtStreetviewControl.prototype.setElementStyle_ = function (ele, cssProperty, value, priority) {
  if (this._is_ie) {
    ele.style[cssProperty] = value;
  } else {
    ele.style.setProperty(cssProperty, value, priority);
  }
};


/**************************************************
 * @desc Creates a pegman marker.
 *
 * @param {MarkerOptions} [opts] Named optional arguments.
 * @constructor
 **************************************************/
function PegmanMarker(latlng, opt_opts) {

  if (ExtStreetviewControl.prototype.isNull(opt_opts)) {
    opt_opts = {};
  }
  this.map_ = null;

  this.icon_ = new GIcon();
  this.icon_.image = "http://maps.gstatic.com/mapfiles/cb/mod_cb_scout/cb_scout_sprite_003.png";
  this.icon_.iconSize = new GSize(49, 52);
  this.icon_.iconAnchor = new GPoint(24, 34);
  this.icon_.infoWindowAnchor = new GPoint(18, 11);

  this.markerTbl_ = {};
  this.markerTbl_.images = [];
  this.markerTbl_.images.push({"left" : -49, "top" : -711});
  this.markerTbl_.images.push({"left" : 0,   "top" : -34});
  this.markerTbl_.images.push({"left" : -98, "top" : -711});
  this.markerTbl_.images.push({"left" : -98, "top" : -365});
  this.markerTbl_.images.push({"left" : 0,   "top" : -365});
  this.markerTbl_.images.push({"left" : -98, "top" : -417});
  this.markerTbl_.images.push({"left" : -98, "top" : -313});
  this.markerTbl_.images.push({"left" : -98, "top" : -797});
  this.markerTbl_.images.push({"left" : -98, "top" : -150});
  this.markerTbl_.images.push({"left" : 0,   "top" : -711});
  this.markerTbl_.images.push({"left" : 0,   "top" : -417});
  this.markerTbl_.images.push({"left" : -98,   "top" : 0});
  this.markerTbl_.images.push({"left" : -49, "top" : -365});
  this.markerTbl_.images.push({"left" : -49, "top" : -417});
  this.markerTbl_.images.push({"left" : -49, "top" : -849});
  this.markerTbl_.images.push({"left" : 0,   "top" : -849});
  this.markerTbl_.angle = 360 / this.markerTbl_.images.length;

  this.markerTbl_.drgImages = {};
  this.markerTbl_.drgImages.ENABLE_LEFT = {"left" : 0, "top" : -313};
  this.markerTbl_.drgImages.ENABLE_RIGHT = {"left" : -49, "top" : -797};
  this.markerTbl_.drgImages.DISABLE_LEFT = {"left" : -56, "top" : -184};
  this.markerTbl_.drgImages.DISABLE_RIGHT = {"left" : 0, "top" : -797};


  opt_opts.icon = new GIcon(this.icon_);
  opt_opts.icon.image = null;
  GMarker.apply(this, arguments);
}

/**
 * @private
*/
PegmanMarker.prototype = new GMarker(new GLatLng(0, 0));

/**
 * @private
*/
PegmanMarker.prototype.initialize = function (map) {
  GMarker.prototype.initialize.apply(this, arguments);
  this.map_ = map;
  
  this.iconContainer_ = ExtStreetviewControl.prototype.makeImgDiv_(this.icon_.image, this.icon_.iconSize);
  this.iconContainer_.unselectable = "on";
  this.iconContainer_.style.MozUserSelect = "none";
  this.iconContainer_.style.KhtmlUserSelect = "none";
  this.iconContainer_.style.WebkitUserSelect = "none";
  this.iconContainer_.style.userSelect = "none";
  
  map.getPane(G_MAP_MARKER_PANE).appendChild(this.iconContainer_);
};

/**
 * @desc Redraw marker.
 * This method is extended GMarker.redraw() method.
 * This method will be called from ExtStreetviewControl with angle parameter.
 * The icon should be change the icon image.
*/
PegmanMarker.prototype.redraw = function (force, type, value) {
  if (force === true) {
    GMarker.prototype.redraw.apply(this, arguments);
  }
  
  var pxPos = this.map_.fromLatLngToDivPixel(this.getLatLng());
  this.iconContainer_.style.left = (pxPos.x - this.icon_.iconAnchor.x) + "px";
  this.iconContainer_.style.top = (pxPos.y - this.icon_.iconAnchor.y) + "px";
  
  if (type === undefined) {
    return;
  }
  
  var iconPos, imgIdx;
  var img = this.iconContainer_.firstChild;
  if (type === "DRAG") {
    iconPos = this.markerTbl_.drgImages[value];
  } else {
    //ANGLE
    imgIdx = Math.floor(value / this.markerTbl_.angle);
    iconPos = this.markerTbl_.images[imgIdx];
  }

  img.style.left = iconPos.left + "px";
  img.style.top = iconPos.top + "px";

  this.iconContainer_.style.zIndex = GOverlay.getZIndex(this.getLatLng().lat() + 1);
  
};

/**
 * @desc   Returns the icon
 * @return {GIcon}
*/
PegmanMarker.prototype.getIcon = function () {
  return this.icon_;
};

