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
 *  If it is not set, then c gets center location of main map.
 * @property {GSize} [size = GSize(300, 210)] Specifies control's size. 
 * @property {GPov} [pov = {yaw : 0, pitch : 0, panoId : null}] This property specifies 
 */

/*global GStreetviewClient, PegmanMarker, G_ANCHOR_BOTTOM_RIGHT, GStreetviewPanorama, GOverviewMapControl */

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
  this.minBtnTbl_ = {};
  this.minBtnTbl_.btnSize = new GSize(15, 15);
  this.minBtnTbl_.imageSrc = "http://maps.google.com/mapfiles/mapcontrols3d.png";
  this.minBtnTbl_.images = [];
  this.minBtnTbl_.images.push({"left" : 0, "top" : -428});
  this.minBtnTbl_.images.push({"left" : 0, "top" : -443});
  

  this.maxBtnTbl_ = {};
  this.maxBtnTbl_.btnSize = new GSize(15, 15);
  this.maxBtnTbl_.imageSrc = "http://maps.google.com/mapfiles/mapcontrols3d.png";
  this.maxBtnTbl_.images = [];
  this.maxBtnTbl_.images.push({"left" : 0, "top" : -443});
  this.maxBtnTbl_.images.push({"left" : 0, "top" : -428});
  
  this.markerTbl_ = {};
  this.markerTbl_.icon = new GIcon();
  this.markerTbl_.icon.image = "http://maps.gstatic.com/mapfiles/cb/mod_cb_scout/cb_scout_sprite_003.png";
  this.markerTbl_.icon.iconSize = new GSize(49, 52);
  this.markerTbl_.icon.iconAnchor = new GPoint(24, 34);
  this.markerTbl_.icon.infoWindowAnchor = new GPoint(18, 11);
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
  this.markerTbl_.drgImages = [];
  this.markerTbl_.drgImages.push({"left" : 0, "top" : -313});  //enable-left
  this.markerTbl_.drgImages.push({"left" : -49, "top" : -797});  //enable-right
  
  //============================
  // Parse options
  //============================
  if (ExtStreetviewControl.prototype.isNull(opt_opts)) {
    opt_opts = {};
  }
  
  this.latlng_ = opt_opts.latlng || null;
  this.ctrlSize_ = opt_opts.size || new GSize(300, 210);
  this.pov_ = opt_opts.pov || {"yaw" : 0, "pitch" : 0, "panoId" : null};
  this.marker_ = null;

  ExtStreetviewControl.prototype.checkBrowserAgent();
}

/**
 * @private
 */
ExtStreetviewControl.prototype = new GControl();

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
};

/**
 * @desc Initialize the ExtStreetviewControl
 * @private
 */
ExtStreetviewControl.prototype.initialize = function (map) {
  GControl.prototype.initialize.apply(this, arguments);
  
  //Release streetview memory
  GEvent.bindDom(window, "unload", this, this.removeControl_);
  
  var _handleList = [];
  
  //initialize
  this.latlng_ = this.latlng_ || map.getCenter();
  this.map_ = map;
  this.bounds_ = map.getBounds();
  this.minimize_ = false;
  this.maximize_ = false;
  this.ctrlSize_ = this.ctrlSize_;
  this.stViewCnt_ = 0;
  
  //make container
  this.container_ = this.createDiv_(this.ctrlSize_);
  this.container_.style.zIndex = 0;
  map.getContainer().appendChild(this.container_);
  
  //make visibleContainer
  var divStyles = {"backgroundColor" : "#e8ecf8",
                   "borderStyle" : "solid none none solid",
                   "borderColor" : "#979797",
                   "borderWidth" : "1px 0 0 1px"};
  var divParams = {"width" : this.ctrlSize_.width,
                   "height" : this.ctrlSize_.height,
                   "style" : divStyles};
  this.visibleContainer_ = this.createDiv_(divParams);
  this.container_.appendChild(this.visibleContainer_);
  
  //streetview panorama container
  divStyles = {"backgroundColor" : "#000000",
               "zIndex" : 0};
  divParams = {"left" : 5,
               "top" : 5,
               "width" : (this.ctrlSize_.width - 5),
               "height" : (this.ctrlSize_.height - 5),
               "style" : divStyles};
  this.flashContainer_ = this.createDiv_(divParams);
  this.visibleContainer_.appendChild(this.flashContainer_);
  
  
  //minmize button
  var btnBaseIFrame;
  var params = this.minBtnTbl_.images[0];
  params.width = this.minBtnTbl_.btnSize.width;
  params.height = this.minBtnTbl_.btnSize.height;
  this.minmizeBtn_ = this.makeImgDiv_(this.minBtnTbl_.imageSrc, params);
  if (!this._is_ie) {
    btnBaseIFrame = document.createElement("iframe");
    btnBaseIFrame.style.position = "absolute";
    btnBaseIFrame.style.right = 0;
    btnBaseIFrame.style.bottom = 0;
    btnBaseIFrame.style.width = this.minBtnTbl_.btnSize.width + "px";
    btnBaseIFrame.style.height = this.minBtnTbl_.btnSize.height + "px";
    btnBaseIFrame.style.zIndex = 1;
    btnBaseIFrame.style.borderStyle = "none";
    btnBaseIFrame.src = "";
    btnBaseIFrame.frameborder = 0;
    this.container_.appendChild(btnBaseIFrame);
  }
  this.minmizeBtn_.style.zIndex = 2;
  this.minmizeBtn_.style.right = 0;
  this.minmizeBtn_.style.bottom = 0;
  this.minmizeBtn_.style.cursor = "pointer";
  this.container_.appendChild(this.minmizeBtn_);
  
  //maximize button
  var parmas = this.maxBtnTbl_.images[0];
  params.width = this.maxBtnTbl_.btnSize.width;
  params.height = this.maxBtnTbl_.btnSize.height;
  this.maximizeBtn_ = this.makeImgDiv_(this.maxBtnTbl_.imageSrc, params);
  if (!this._is_ie) {
    btnBaseIFrame = document.createElement("iframe");
    btnBaseIFrame.style.position = "absolute";
    btnBaseIFrame.style.left = 0;
    btnBaseIFrame.style.top = 0;
    btnBaseIFrame.style.zIndex = 1;
    btnBaseIFrame.style.borderStyle = "none";
    btnBaseIFrame.style.width = this.maxBtnTbl_.btnSize.width + "px";
    btnBaseIFrame.style.height = this.maxBtnTbl_.btnSize.height + "px";
    btnBaseIFrame.src = '';
    btnBaseIFrame.frameborder = 0;
    this.visibleContainer_.appendChild(btnBaseIFrame);
  }
  this.maximizeBtn_.style.zIndex = 2;
  this.maximizeBtn_.style.cursor = "pointer";
  this.visibleContainer_.appendChild(this.maximizeBtn_);
  this.maximizeBtn_.firstChild.style.top = this.maxBtnTbl_.images[0].top + "px";
  this.maximizeBtn_.firstChild.style.left = this.maxBtnTbl_.images[0].left + "px";
  
  //create marker
  var this_ = this;
  var PegmanMarker = function (latlng, opt_opts) {
    this.icon_ = new GIcon(opt_opts.icon);
    opt_opts.icon.image = null;
    GMarker.apply(this, arguments);
  };
  
  PegmanMarker.prototype = new GMarker(new GLatLng(0, 0));
  
  PegmanMarker.prototype.initialize = function (map) {
    GMarker.prototype.initialize.apply(this, arguments);
    this.map_ = map;
    
    this.iconContainer_ = ExtStreetviewControl.prototype.makeImgDiv_(this.icon_.image, this.icon_.iconSize);
    
    map.getPane(G_MAP_MARKER_PANE).appendChild(this.iconContainer_);
  };

  PegmanMarker.prototype.redraw = function (force) {
    GMarker.prototype.redraw.apply(this, arguments);
    
    this.latlng_ = this.getLatLng();
    this.iconContainer_.style.zIndex = GOverlay.getZIndex(this.latlng_.lat() + 1);
    
    var pxPos = this.map_.fromLatLngToDivPixel(this.latlng_);
    this.iconContainer_.style.left = (pxPos.x - this.icon_.iconAnchor.x) + "px";
    this.iconContainer_.style.top = (pxPos.y - this.icon_.iconAnchor.y) + "px";
  };
  PegmanMarker.prototype.getIcon = function () {
    return this.icon_;
  };
  PegmanMarker.prototype.getIconContainer_ = function () {
    return this.iconContainer_;
  };
  this.marker_ = new PegmanMarker(this.latlng_, {"draggable" : true, "icon" : this_.markerTbl_.icon});
  this.marker_.isFirst_ = true;
  
  GEvent.bind(this.marker_, "dragstart", this, this.markerDragStart_);
  GEvent.bind(this.marker_, "drag", this, this.markerDrag_);
  GEvent.bind(this.marker_, "dragend", this, this.markerDragEnd_);
  map.addOverlay(this.marker_);
  this.setMarkerIcon_(0);
  
  
  //streetview panorama
  this.stObj_ = null;
  this.stClient_ = new GStreetviewClient();
  this.createStreetviewPanorama_();
  
/*
  //MyGOverviewMapControl
  var MyGOverviewMapControl = function () {
    GOverviewMapControl.apply(this, arguments);
  };
  
  MyGOverviewMapControl.prototype = new GOverviewMapControl();
  
  MyGOverviewMapControl.prototype.initialize = function (map) {
    this.ctrlDiv_ = GOverviewMapControl.prototype.initialize.apply(this, arguments);
    if (this.ctrlDiv_.childNodes.length) {
      this.ctrlDiv_.lastChild.style.display = "none";
    }
    return this.ctrlDiv_;
  };
  
  MyGOverviewMapControl.prototype.hide = function () {
    GOverviewMapControl.prototype.hide.apply(this, arguments);
    if (!ExtStreetviewControl.prototype.isNull(this.ctrlDiv_)) {
      this.ctrlDiv_.style.visibility = "hidden";
    }
  };
  
  MyGOverviewMapControl.prototype.show = function () {
    GOverviewMapControl.prototype.show.apply(this, arguments);
    if (!ExtStreetviewControl.prototype.isNull(this.ctrlDiv_)) {
      this.ctrlDiv_.style.visibility = "visible";
    }
  };
  
  this.overviewMapControl_ = new MyGOverviewMapControl();
  map.addControl(this.overviewMapControl_);
  this.overviewMapControl_.hide();
*/
  //events
  GEvent.bindDom(this.minmizeBtn_, "click", this, this.toggleMinimize_);
  GEvent.bindDom(this.maximizeBtn_, "click", this, this.toggleMaximize_);
  GEvent.bindDom(window, "resize", this,  this.windowResize_);
  GEvent.bind(map, "moveend", this, this.mapMove_);
  this.removeControlOrg_ = GMap2.prototype.removeControl;
  
  this.setLocationAndPOV(this.latlng_, this.pov_);
  
  return this.container_;
};

/**
 * @private
 * @desc pegman-marker drag start
 */
ExtStreetviewControl.prototype.markerDragStart_ = function () {
  var img = this.marker_.getIconContainer_().firstChild;
  this.saveMarkerPosition_ = {"left" : img.style.left, "top" : img.style.top};
  this.lng_ = this.latlng_.lng();
};

/**
 * @private
 * @desc pegman-marker dragging
 */
ExtStreetviewControl.prototype.markerDrag_ = function () {
  var beforeLng = this.lng_;
  var currentLng = this.marker_.getLatLng().lng();
  this.lng_ = currentLng;
  
  var dragDirection = beforeLng - currentLng;
  var imgIdx;
  if (dragDirection > 0) {
    imgIdx = 0;
  } else {
    imgIdx = 1;
  }
  var img = this.marker_.getIconContainer_().firstChild;
  img.style.left = this.markerTbl_.drgImages[imgIdx].left + "px";
  img.style.top = this.markerTbl_.drgImages[imgIdx].top + "px";
  
};

/**
 * @private
 * @desc pegman-marker drag end
 */
ExtStreetviewControl.prototype.markerDragEnd_ = function () {
  var latlng = this.marker_.getLatLng();
  var img = this.marker_.getIconContainer_().firstChild;
  img.style.left = this.saveMarkerPosition_.left;
  img.style.top = this.saveMarkerPosition_.top;
  this.map_.panTo(latlng);
  this.setLocationAndPOV(latlng);
};


/**
 * @private
 * @desc yawchanged on streetview
 */
ExtStreetviewControl.prototype.yawChanged_ = function (yaw) {
  this.pov_.yaw = yaw;

  var imgIdx = Math.floor(yaw / this.markerTbl_.angle);
  this.setMarkerIcon_(imgIdx);
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
 * @desc window resize
 */
ExtStreetviewControl.prototype.windowResize_ = function () {
  if (!this.isNull(this.maximize_)) {
    var mapSize = this.map_.getSize();
    mapSize.height = Math.floor(mapSize.height);
    this.container_.style.left = null;
    this.container_.style.top = null;
    this.container_.style.width = mapSize.width + "px";
    this.container_.style.height = mapSize.height + "px";
    
    this.visibleContainer_.style.width = mapSize.width + "px";
    this.visibleContainer_.style.height = mapSize.height + "px";
    
    this.flashContainer_.style.width = (mapSize.width - 5) + "px";
    this.flashContainer_.style.height = (mapSize.height - 5) + "px";
    
    this.stObj_.checkResize();
  }
};


/**
 * @private
 * @desc click maximize button
 */
ExtStreetviewControl.prototype.toggleMaximize_ = function () {
  var mapSize = this.map_.getSize();
  var param = {};
  param.x = this.container_.offsetLeft;
  param.y = this.container_.offsetTop;
  param.width = this.container_.offsetWidth;
  param.height = this.container_.offsetHeight;
  param.maxWidth = mapSize.width;
  param.maxHeight = mapSize.height;
  param.xStep = (param.maxWidth - this.ctrlSize_.width)  / 10;
  param.yStep = (param.maxHeight - this.ctrlSize_.height) / 10;
  
  param.cnt = 0;
  var callback = null;
  var this_ = this;

  if (!this.isNull(this.maximize_)) {
    this.maximize_ = false;
    param.aniPosDirection = 1;
    param.aniSizeDirection = -1;
    param.maximizeImgPos = this.maxBtnTbl_.images[0];
    this.container_.style.width = this.ctrlSize_.width + "px";
    this.container_.style.height = this.ctrlSize_.height + "px";
    param.maxWidth = this.ctrlSize_.width;
    param.maxHeight = this.ctrlSize_.height;
    this.minmizeBtn_.style.visibility = "visible";
    
    callback = function () {
      //this_.overviewMapControl_.hide();
    };
  } else {
    this.maximize_ = true;
    param.aniPosDirection = -1;
    param.aniSizeDirection = 1;
    param.maximizeImgPos = this.maxBtnTbl_.images[1];
    this.container_.style.width = mapSize.width + "px";
    this.container_.style.height = mapSize.height + "px";
    
    this.minmizeBtn_.style.visibility = "hidden";
    
    callback = function () {
      //this_.overviewMapControl_.show();
    };
  }
  
  this.flashContainer_.style.visibility = "hidden";

  var max_resizeAnimation = function (param) {
    param.x = param.x + param.aniPosDirection * param.xStep;
    param.x = param.x < 0  ? 0 : param.x;
    param.y = param.y + param.aniPosDirection * param.yStep;
    param.y = param.y < 0  ? 0 : param.y;
    param.width = param.width + param.aniSizeDirection * param.xStep;
    param.height = param.height + param.aniSizeDirection * param.yStep;
    
    this_.container_.style.left = param.x + "px";
    this_.container_.style.top = param.y + "px";
    this_.container_.style.width = param.width + "px";
    this_.container_.style.height = param.height + "px";
    
    this_.visibleContainer_.style.width = param.width + "px";
    this_.visibleContainer_.style.height = param.height + "px";
    
    this_.flashContainer_.style.width = (param.width - 5) + "px";
    this_.flashContainer_.style.height = (param.height - 5) + "px";
    
    param.cnt++;
    if (param.cnt < 10) {
      var arg = arguments;
      setTimeout(function () {
        arg.callee.apply(null, arg);
      }, 10);
      
    } else {
      this_.container_.style.width = param.maxWidth + "px";
      this_.container_.style.height = param.maxHeight + "px";
      this_.container_.style.left = null;
      this_.container_.style.top = null;
      this_.maximizeBtn_.firstChild.style.top = param.maximizeImgPos.top + "px";
      this_.maximizeBtn_.firstChild.style.left = param.maximizeImgPos.left + "px";
      
      this_.flashContainer_.style.visibility = "visible";
      this_.stObj_.checkResize();
      callback();
    }
  };
  max_resizeAnimation(param);
};

/**
 * @private
 * @desc click minimize button
 */
ExtStreetviewControl.prototype.toggleMinimize_ = function () {
  var param = {};
  param.x = this.container_.offsetLeft;
  param.y = this.container_.offsetTop;
  param.width = this.container_.offsetWidth;
  param.height = this.container_.offsetHeight;
  param.xStep = (this.ctrlSize_.width - 15) / 10;
  param.yStep = (this.ctrlSize_.height - 15) / 10;
  param.cnt = 0;
  if (this.minimize_) {
    this.minimize_ = false;
    param.aniPosDirection = -1;
    param.aniSizeDirection = 1;
    param.minimizeImgPos = this.minBtnTbl_.images[0];
    
    param.maxWidth = this.ctrlSize_.width;
    param.maxHeight = this.ctrlSize_.height;
    
  } else {
    this.minimize_ = true;
    param.aniPosDirection = 1;
    param.aniSizeDirection = -1;
    param.minimizeImgPos = this.minBtnTbl_.images[1];
    param.maxWidth = this.minBtnTbl_.btnSize.width;
    param.maxHeight = this.minBtnTbl_.btnSize.height;
  }
  
  this.flashContainer_.style.visibility = "hidden";
  
  var this_ = this;
  var min_resizeAnimation = function (param) {
    param.x = param.x + param.aniPosDirection * param.xStep;
    param.x = param.x < 0  ? 0 : param.x;
    param.y = param.y + param.aniPosDirection * param.yStep;
    param.y = param.y < 0  ? 0 : param.y;
    param.width = param.width + param.aniSizeDirection * param.xStep;
    param.height = param.height + param.aniSizeDirection * param.yStep;
    
    this_.container_.style.left = param.x + "px";
    this_.container_.style.top = param.y + "px";
    this_.container_.style.width = param.width + "px";
    this_.container_.style.height = param.height + "px";
    
    param.cnt++;
    if (param.cnt < 10) {
      var arg = arguments;
      setTimeout(function () {
        arg.callee.apply(null, arg);
      }, 10);
      
    } else {
      this_.minmizeBtn_.firstChild.style.top = param.minimizeImgPos.top + "px";
      this_.minmizeBtn_.firstChild.style.left = param.minimizeImgPos.left + "px";
      this_.container_.style.width = param.maxWidth + "px";
      this_.container_.style.height = param.maxHeight + "px";
      this_.container_.style.left = null;
      this_.container_.style.top = null;
      this_.container_.style.right = 0;
      this_.container_.style.bottom = 0;
      
      if (!this_.minimize_) {
        this_.flashContainer_.style.visibility = "visible";
      }
    }
  };
  min_resizeAnimation(param);
};


/**
 * @private
 * @desc map move
 */
ExtStreetviewControl.prototype.mapMove_ = function () {
  this.bounds_ = this.map_.getBounds();
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
  if (!this.isNull(pov)) {
    this.pov_ = this.stObj_.getPOV();
  }
  this.marker_.setLatLng(latlng);
  var this_ = this;
  this.stClient_.getNearestPanorama(latlng, function () {
    this_.stClientEnum_(this_, arguments[0]);
  });
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
};

/**
 * @private
 * @desc      changed the position on streetview
 */
ExtStreetviewControl.prototype.stInitialized_ = function (location, force) {
  if (this.isNull(location.pov)) {
    return;
  }
  
  if (!this.isNull(location.pov.yaw) || this.isNull(this.pov_.yaw)) {
    this.pov_ = location.pov;
  }
  
  this.latlng_ = location.latlng;
  this.marker_.setLatLng(location.latlng);
  if (!this.bounds_.containsLatLng(location.latlng)) {
    this.map_.panTo(location.latlng);
  }
  
  this.stViewCnt_++;
  if (this.stViewCnt_ > 10) {
    this.removeControl_();
    this.map_.panTo(location.latlng);
    var this_ = this;
    setTimeout(function () {
      this_.createStreetviewPanorama_();
    }, 10);
    return;
  }

  if (force === true) {
    this.stObj_.setLocationAndPOV(location.latlng, this.pov_);
  }
};


/**
 * @private
 * @desc      callback for GStreetviewClient
 */
ExtStreetviewControl.prototype.stClientEnum_ = function (this_, gstreetviewdata) {
  if (gstreetviewdata.code !== 200) {
    this_.setMarkerIcon_(0);
    return;
  }
  
  this_.stInitialized_(gstreetviewdata.location, true);
  this_.marker_.isFirst_ = false;

};

/**
 * @private
 * @desc      set marker's icon
 */
ExtStreetviewControl.prototype.setMarkerIcon_ = function (imgIdx) {
  var markerImg = this.marker_.getIconContainer_().firstChild;
  markerImg.style.left = this.markerTbl_.images[imgIdx].left + "px";
  markerImg.style.top = this.markerTbl_.images[imgIdx].top + "px";
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
 * @desc      create new Streetview Panorama
 *            leak memory to avoid.
 */
ExtStreetviewControl.prototype.createStreetviewPanorama_ = function () {
  var flag = false;
  if (!this.isNull(this.stObj_)) {
    GEvent.clearInstanceListeners(this.stObj_);
    this.stObj_.remove();
    flag = true;
  }
  
  var stObj = new GStreetviewPanorama(this.flashContainer_);
  this.stViewCnt_ = 0;
  this.stObj_ = stObj;
  
  GEvent.bind(stObj, "initialized", this, this.stInitialized_);
  GEvent.bindDom(stObj, "yawchanged", this, this.yawChanged_);
  GEvent.bindDom(stObj, "pitchchanged", this,  this.pitChchanged_);
};

/**
 * @private
 * @desc      create div element with PNG image
 */
ExtStreetviewControl.prototype.makeImgDiv_ = function (imgSrc, params) {
  ExtStreetviewControl.prototype.checkBrowserAgent();
  
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
 * @desc Return this control's name
 * @return {String}
 */
ExtStreetviewControl.prototype.toString = function () {
  return "extstreetviewcontrol";
};

/**
 * @private
 * @desc      create div element
 */
ExtStreetviewControl.prototype.createDiv_ = function (params, specifyTagName) {

  var divEle = document.createElement(this.isNull(specifyTagName) ? "div" : specifyTagName);
  
  
  for (var s in params.style) {
    if (s in divEle.style) {
      divEle.style[s] = params.style[s];
    }
  }
  
  divEle.style.position = "absolute";
  divEle.style.fontSize = 0;
  divEle.style.lineHeight = 0;
  divEle.style.overflow = "hidden";
  if (!this.isNull(params.left)) {
    divEle.style.left = params.left + "px";
  }
  if (!this.isNull(params.right)) {
    divEle.style.right = params.right + "px";
  }
  if (!this.isNull(params.top)) {
    divEle.style.top = params.top + "px";
  }
  if (!this.isNull(params.bottom)) {
    divEle.style.bottom = params.bottom + "px";
  }
  if (!this.isNull(params.width)) {
    divEle.style.width = params.width + "px";
  }
  if (!this.isNull(params.height)) {
    divEle.style.height = params.height + "px";
  }
  return divEle;
};
