/**
 * @name ExtOverviewMapControl
 * @version 1.0
 * @author Masashi Katsumata
 * @fileoverview
 * A ExtOverviewMapControl provides an control as like similar GOverviewMapControl.
 */
/*global ExtOverviewMapControl, G_ANCHOR_BOTTOM_RIGHT, GDraggableObject*/

/**
 * @desc create an ExtOverviewMapControl
 * @param {GSize} opt_size specifies the size of this control
 * but it will be updated to reflect the copyright for the overview map.
 * @constructor
 */
function ExtOverviewMapControl(opt_size) {
  this.ctrlSize_ = opt_size || new GSize(120, 120);
  
  //internal parameters for div elements
  this.divTbl_ = {};
  this.divTbl_.container = {width : this.ctrlSize_.width, height : this.ctrlSize_.height, padding : 7};
  this.toggleImgSrc_ = "http://maps.google.com/mapfiles/mapcontrols3d.png";
  this.divTbl_.arrowBtnImg = {width : 15, height : 14};
  this.divTbl_.arrowBtnImgMinimize = {left : 0, top : -428};
  this.divTbl_.arrowBtnImgMaximize = {left : 0, top : -443};

  this.overviewMapOffset_ = 40;
  
  var this_ = this;
  this.rectAngle_ = function (bounds, opacity) {
    this.bounds_ = bounds;
    this.opacity_ = opacity;
    this.constructorCopy_ = arguments.callee;
  };
  this.rectAngle_.prototype.initialize = function (map) {
    this.hidden_ = false;
    this.GMapObj_ = map;
    var base = this_.createDiv_({left : 0, top : 0, width : 0, height : 0});
    base.style.backgroundColor = "#6666CC";
    
    var boxBorder = this_.createDiv_({left : 0, top : 0, width : 0, height : 0});
    boxBorder.style.borderColor = "#4444BB";
    boxBorder.style.borderWidth = "1px";
    boxBorder.style.borderStyle = "solid";
    boxBorder.appendChild(base);
    
    var box = this_.createDiv_({left : 0, top : 0, width : 0, height : 0});
    box.style.borderColor = "#8888FF #111155 #111155 #8888FF";
    box.style.borderWidth = "1px";
    box.style.borderStyle = "solid";
    box.appendChild(boxBorder);
    box.style.zIndex = GOverlay.getZIndex(this.bounds_.getCenter().lat());

    //bounds area box
    this.boundsAreaDiv_ =  box;
    this.setOpacity(this.opacity_);
    
    this.GMapObj_.getPane(G_MAP_MARKER_PANE).appendChild(this.boundsAreaDiv_);
  };
  
  this.rectAngle_.prototype.getDivElement = function () {
    return this.boundsAreaDiv_;
  };
  
  this.rectAngle_.prototype.getLeftTop = function () {
    var pos = new GPoint(this.boundsAreaDiv_.offsetLeft, this.boundsAreaDiv_.offsetTop);
    return pos;
  };
  
  this.rectAngle_.prototype.setLeftTop = function (pos) {
    this.boundsAreaDiv_.style.left = pos.x + "px";
    this.boundsAreaDiv_.style.top = pos.y + "px";
  };
  
  this.rectAngle_.prototype.setCenter = function (latlng) {
    var centerPx = this.GMapObj_.fromLatLngToDivPixel(latlng);
    var leftTopPx = new GPoint(centerPx.x - this.size_.width / 2, centerPx.y - this.size_.height / 2);
    this.setLeftTop(leftTopPx);
  };
  
  this.rectAngle_.prototype.setSize = function (size) {
    this.size_ = size;
    
    this.boundsAreaDiv_.style.width = size.width + "px";
    this.boundsAreaDiv_.style.height = size.height + "px";
    if (size.width > 2) {
      this.boundsAreaDiv_.firstChild.style.width = (size.width - 2) + "px";
      this.boundsAreaDiv_.firstChild.firstChild.style.width = (size.width - 2) + "px";
    }
    if (size.height > 2) {
      this.boundsAreaDiv_.firstChild.style.height = (size.height - 2) + "px";
      this.boundsAreaDiv_.firstChild.firstChild.style.height = (size.height - 2) + "px";
    }
  };
  
  this.rectAngle_.prototype.getSize = function () {
    return this.size_;
  };
  
  this.rectAngle_.prototype.setOpacity = function (opacity) {
    this.opacity_ = opacity;
    this.boundsAreaDiv_.firstChild.firstChild.style.filter = "alpha(opacity=" + this.opacity_ + ")";
    this.boundsAreaDiv_.firstChild.firstChild.style.MozOpacity = this.opacity_ / 100;
    this.boundsAreaDiv_.firstChild.firstChild.style.opacity = this.opacity_ / 100;
  };
  
  this.rectAngle_.prototype.redraw = function (force) {
    var sw = this.bounds_.getSouthWest();
    var ne = this.bounds_.getNorthEast();
    var pxRightBottom = this.GMapObj_.fromLatLngToDivPixel(new GLatLng(sw.lat(), ne.lng()));
    var pxLeftTop = this.GMapObj_.fromLatLngToDivPixel(new GLatLng(ne.lat(), sw.lng()));
    
    if (force) {
      this.setLeftTop(pxLeftTop);
      this.setSize(new GSize(Math.abs(pxRightBottom.x - pxLeftTop.x), Math.abs(pxRightBottom.y - pxLeftTop.y)));
      this.boundsAreaDiv_.style.zIndex = GOverlay.getZIndex(this.bounds_.getCenter().lat());
    }
  };
  
  this.rectAngle_.prototype.setBounds = function (bounds) {
    this.bounds_ = bounds;
    this.redraw(true);
  };
  
  this.rectAngle_.prototype.getBounds = function () {
    return this.bounds_;
  };
  
  this.rectAngle_.prototype.isHidden = function () {
    return this.hidden_;
  };
  
  this.rectAngle_.prototype.show = function () {
    if (this.isHidden() === true) {
      this.boundsAreaDiv_.style.visibility = "visible";
      this.hidden_ = false;
    }
  };
  
  this.rectAngle_.prototype.hide = function () {
    this.hidden_ = true;
    this.boundsAreaDiv_.style.visibility = "hidden";
  };
  
  this.rectAngle_.prototype.remove = function () {
    GEvent.clearInstanceListeners(this.boundsAreaDiv_);
    while (this.boundsAreaDiv_.firstChild) {
      this.boundsAreaDiv_.removeChild(this.boundsAreaDiv_.firstChild);
    }
    this.boundsAreaDiv_.parentNode.removeChild(this.boundsAreaDiv_);
    delete arguments.callee;
  };
  
  this.rectAngle_.prototype.copy = function () {
    return new this_.rectAngle_(this.bounds_, this.opacity_);
  };
  
}

/**
 * @private
 */
ExtOverviewMapControl.prototype = new GControl();

/**
 * @desc Initialize the control
 * @private
 */
ExtOverviewMapControl.prototype.initialize = function (map) {
  this.map_ = map;
  
  //detect browser
  var agt = navigator.userAgent.toLowerCase();
  this._is_ie    = ((agt.indexOf("msie") !== -1) && (agt.indexOf("opera") === -1));
  this._is_ie8    = (agt.indexOf("msie 8") !== -1);
  this._is_gecko = (agt.indexOf('gecko') !== -1);
  this._is_opera = (agt.indexOf("opera") !== -1);
  
  //create container for control
  var btnImgPosSize = this.divTbl_.arrowBtnImg;
  btnImgPosSize.left = this.divTbl_.arrowBtnImgMinimize.left;
  btnImgPosSize.top = this.divTbl_.arrowBtnImgMinimize.top;
  var result = this.createContainer_(this.divTbl_.container, this.toggleImgSrc_, btnImgPosSize);
  this.container_ = result.container;
  this.arrowBtn_ = result.arrowBtn;
  this.mapContainer_ = result.mapContainer;
  this.map_.getContainer().appendChild(this.container_);
  
  //initialize
  this.moveEventOwner_ = null;
  this.minimize_ = false;
  this.overviewMap_ = this.createOverviewMap_(this.map_, this.mapContainer_);
  
  //bounds area (for dragging)
  this.boundsArea_ = new this.rectAngle_(map.getBounds(), 30);
  this.overviewMap_.addOverlay(this.boundsArea_);
  this.boundsAreaCtrl_ = new GDraggableObject(this.boundsArea_.getDivElement());
  
  //bounds area frame
  this.boundsFrame_ = new this.rectAngle_(map.getBounds(), 0);
  this.overviewMap_.addOverlay(this.boundsFrame_);
  this.boundsFrame_.hide();
  this.boundsFrameCtrl_ = new GDraggableObject(this.boundsFrame_.getDivElement());
  this.boundsFrameCtrl_.disable();
  
  //bounds area (for dragging redraw)
  this.boundsDragFrame_ = new this.rectAngle_(map.getBounds(), 0);
  this.overviewMap_.addOverlay(this.boundsDragFrame_);
  this.boundsDragFrame_.hide();

  this.setCenterQue_ = [];
  GEvent.bindDom(this.arrowBtn_, "click", this, this.clickArrowBtn_);
  GEvent.bind(this.map_, "movestart", this, this.onMapMoveStart_);
  GEvent.bind(this.map_, "moveend", this, this.onMapMoveEnd_);
  GEvent.bind(this.map_, "zoomend", this, this.onMapZoomEnd_);
  GEvent.bind(this.map_, "addmaptype", this, this.onMapAddMapType_);
  GEvent.bind(this.map_, "removemaptype", this, this.onMapRemoveMapType_);
  GEvent.bind(this.map_, "maptypechanged", this, this.onMapTypeChanged_);
  GEvent.bind(this.overviewMap_, "movestart", this, this.onOverviewMapMoveStart_);
  GEvent.bind(this.overviewMap_, "moveend", this, this.onOverviewMapMoveEnd_);
  GEvent.bind(this.overviewMap_, "dblclick", this, this.onOverviewMapDblClick_);
  GEvent.bind(this.overviewMap_, "zoomend", this, this.onOverviewMapZoomEnd_);
  GEvent.bind(this.boundsAreaCtrl_, "dragstart", this, this.onBoundsAreaDragStart_);
  GEvent.bind(this.boundsAreaCtrl_, "drag", this, this.onBoundsAreaDrag_);
  GEvent.bind(this.boundsAreaCtrl_, "dragend", this, this.onBoundsAreaDragEnd_);

  //display overview map
  this.overviewMap_.setMapType(map.getCurrentMapType());
  this.onMapZoomEnd_();
  return this.container_;
};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.onMapAddMapType_ = function (type) {
  this.overviewMap_.addMapType(type);
};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.onMapRemoveMapType_ = function (type) {
  this.overviewMap_.removeMapType(type);
};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.onMapTypeChanged_ = function () {
  this.overviewMap_.setMapType(this.map_.getCurrentMapType());
};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.onBoundsAreaDragStart_ = function () {
  //this.moveEventOwner_ = this.overviewMap_;
  var pos = new GPoint(this.boundsAreaCtrl_.left, this.boundsAreaCtrl_.top);
  this.boundsFrameCtrl_.moveTo(pos);
  this.isBoundsDragging_ = true;
  this.boundsFrame_.setBounds(this.boundsArea_.getBounds());
  this.boundsDragFrame_.setBounds(this.boundsArea_.getBounds());
  this.boundsDragFrame_.setLeftTop(pos);
  
  this.boundsFrame_.setOpacity(30);
  this.boundsFrame_.show();
  this.boundsArea_.hide();
  this.boundsDragFrame_.show();
};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.onBoundsAreaDrag_ = function () {
  if (this.rectangleDragTimer_ || this.isBoundsDragging_ === false) {
    return;
  }

  var size = this.boundsArea_.getSize();
  var currentPos = new GPoint(this.boundsAreaCtrl_.left, this.boundsAreaCtrl_.top);
  var dx = 0;
  var dy = 0;
  if (currentPos.x < this.overviewMapOffset_ - 1) {
    dx = -1;
  } else if (currentPos.x > this.divTbl_.container.width + this.overviewMapOffset_ - this.divTbl_.container.padding - size.width - 3) {
    dx = 1;
  }
  if (currentPos.y < this.overviewMapOffset_ - 1) {
    dy = 1;
  } else if (currentPos.y > this.divTbl_.container.height + this.overviewMapOffset_ - this.divTbl_.container.padding - size.height - 3) {
    dy = -1;
  }

  if (dx !== 0 || dy !== 0) {
    var span = this.overviewMap_.getBounds().toSpan();
    var currentLatLng = this.overviewMap_.getCenter();
    var centerLatLng = new GLatLng(currentLatLng.lat() + span.lat() * 0.04 * dy, currentLatLng.lng() + span.lng() * 0.04 * dx);
    this.moveEventOwner_ = "dragging";
    this.overviewMap_.setCenter(centerLatLng);
    
    var this_ = this;
    var arguments_ = arguments;
    this.rectangleDragTimer_ = setTimeout(function () {
      this_.rectangleDragTimer_ = null;
      arguments_.callee.apply(this_, arguments_);
    }, 30);

  } else {
    this.rectangleDragTimer_ = null;
  }
  this.boundsDragFrame_.setLeftTop(new GPoint(this.boundsAreaCtrl_.left, this.boundsAreaCtrl_.top));

};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.onBoundsAreaDragEnd_ = function () {
  var this_ = this;
  this.boundsDragFrame_.hide();
  this.boundsArea_.setLeftTop(new GPoint(this.boundsAreaCtrl_.left, this.boundsAreaCtrl_.top));
  this.boundsArea_.show();
  
  this.isBoundsDragging_ = false;
  this.rectangleDragTimer_ = null;
  var sPos = new GPoint(this.boundsFrameCtrl_.left, this.boundsFrameCtrl_.top);
  var ePos = new GPoint(this.boundsAreaCtrl_.left, this.boundsAreaCtrl_.top);
  this.boundsAnimation_(this.boundsFrameCtrl_, sPos, ePos, function () {
    this_.boundsFrame_.hide();
    this_.boundsFrame_.setOpacity(0);
  });

  this.moveEventOwner_ = this.overviewMap_;
  var size = this.boundsArea_.getSize();
  var centerPos = new GPoint(ePos.x + size.width / 2, ePos.y + size.height / 2);
  var latlng = this.overviewMap_.fromDivPixelToLatLng(centerPos);
  this.overviewMap_.panTo(latlng);

};



/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.onMapMoveStart_ = function () {
  if (this.moveEventOwner_ === null) {
    this.moveEventOwner_ = this.map_;
  }
};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.onMapMoveEnd_ = function () {
  if (this.moveEventOwner_ === this.map_) {
    var centerPos = this.map_.getCenter();
    this.overviewMap_.panTo(centerPos);
    this.moveEventOwner_ = null;
  }
};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.onOverviewMapMoveStart_ = function () {
  if (this.moveEventOwner_ === null) {
    this.moveEventOwner_ = this.overviewMap_;
  }
};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.onOverviewMapMoveEnd_ = function () {
  if (this.moveEventOwner_ === "dragging") {
    return;
  }
  var centerPos = this.overviewMap_.getCenter();
  var sPos = this.fromPixelToBoundsCtrlLeftTop_(new GPoint(this.boundsAreaCtrl_.left, this.boundsAreaCtrl_.top));
  var ePos = this.fromLatLngToBoundsCtrlLeftTop_(centerPos);
  this.boundsAnimation_(this.boundsAreaCtrl_, sPos, ePos);
  
  if (this.moveEventOwner_ === this.overviewMap_) {
    this.map_.panTo(centerPos);
    this.moveEventOwner_ = null;
  }
};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.onMapZoomEnd_ = function () {
  var bounds = this.map_.getBounds();
  var mapType = this.overviewMap_.getCurrentMapType();
  var zoom = mapType.getBoundsZoomLevel(bounds, new GSize(this.mapContainer_.offsetWidth, this.mapContainer_.offsetHeight));
  zoom--;
  if (zoom - mapType.getMinimumResolution() > 0) {
    this.boundsArea_.show();
  } else {
    this.boundsArea_.hide();
    zoom = mapType.getMinimumResolution();
  }
  this.overviewMap_.setCenter(this.map_.getCenter(), zoom);
};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.onOverviewMapZoomEnd_ = function () {
  var bounds = this.map_.getBounds();
  this.boundsArea_.setBounds(bounds);
  var leftTop = this.fromLatLngToBoundsCtrlLeftTop_(this.map_.getCenter());
  this.boundsAreaCtrl_.moveTo(leftTop);
};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.onOverviewMapDblClick_ = function (overlay, latlng) {
  this.moveEventOwner_ = this.overviewMap_;
};


/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.fromPixelToBoundsCtrlLeftTop_ = function (centerPixel) {
  var boundsAreaSize = this.boundsArea_.getSize();
  return new GPoint(centerPixel.x - boundsAreaSize.width / 2, centerPixel.y - boundsAreaSize.height / 2);
};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.fromLatLngToBoundsCtrlLeftTop_ = function (centerLatlng) {
  var centerPixel = this.overviewMap_.fromLatLngToDivPixel(centerLatlng);
  return this.fromPixelToBoundsCtrlLeftTop_(centerPixel);
};



/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.boundsAnimation_ = function (draggableObject, startPos, endPos, callback) {
  draggableObject.disable();

  var finishFlag = false;
  var xStep = (endPos.x - startPos.x) / 10;
  var yStep = (endPos.y - startPos.y) / 10;
  
  var curPos = new GPoint(draggableObject.left + xStep, draggableObject.top + yStep);
  if (startPos.x < endPos.x) {
    if (curPos.x >= endPos.x) {
      curPos.x = endPos.x;
      finishFlag = true;
    }
  } else {
    if (curPos.x <= endPos.x) {
      curPos.x = endPos.x;
      finishFlag = true;
    }
  }
  if (startPos.y < endPos.y) {
    if (curPos.y >= endPos.y) {
      curPos.y = endPos.y;
      finishFlag = true;
    }
  } else {
    if (curPos.y <= endPos.y) {
      curPos.y = endPos.y;
      finishFlag = true;
    }
  }
  
  //simplified stopper for endless loop
  if (!this.isNull(this.before)) {
    if (this.before.x === curPos.x && this.before.y === curPos.y) {
      finishFlag = true;
    }
  }
  this.before = curPos;
  
  if (finishFlag === false) {
    draggableObject.moveTo(curPos);
    var this_ = this;
    var arguments_ = arguments;
    setTimeout(function () {
      arguments_.callee.apply(this_, arguments_);
    }, 0);
  } else {
    draggableObject.moveTo(endPos);
    draggableObject.enable();
    this.isAnimating_ = false;
    if (!this.isNull(callback)) {
      callback.apply(this);
    }
  }
};

/**
 * @private
 * @desc make container for ExtOverviewMapControl
 * @ignore
 */
ExtOverviewMapControl.prototype.createContainer_ = function (ctrlPosSize, btnImgSrc, btnPosSize) {
  //make container
  var container = this.createDiv_(ctrlPosSize);
  container.style.borderStyle = "solid none none solid";
  container.style.borderColor = "#979797";
  container.style.borderWidth = "1px 0 0 1px";
  container.style.backgroundColor = "#e8ecf8";
  container.style.zIndex = 0;
  
  //make container for overview map.
  var mapContainerFrameSize = {};
  mapContainerFrameSize.left = ctrlPosSize.padding;
  mapContainerFrameSize.top = ctrlPosSize.padding;
  mapContainerFrameSize.width = ctrlPosSize.width - ctrlPosSize.padding - 2;
  mapContainerFrameSize.height = ctrlPosSize.height - ctrlPosSize.padding - 2;
  
  var mapContainerFrame = this.createDiv_(mapContainerFrameSize);
  mapContainerFrame.style.borderStyle = "solid";
  mapContainerFrame.style.borderColor = "#979797";
  mapContainerFrame.style.borderWidth = "1px";
  mapContainerFrame.style.backgroundColor = "#e8ecf8";
  container.appendChild(mapContainerFrame);
  
  var mapContainerSize = {};
  mapContainerSize.left = -this.overviewMapOffset_ - ctrlPosSize.padding + 2;
  mapContainerSize.top = -this.overviewMapOffset_ - ctrlPosSize.padding + 2;
  mapContainerSize.width = ctrlPosSize.width + this.overviewMapOffset_ * 2;
  mapContainerSize.height = ctrlPosSize.height + this.overviewMapOffset_ * 2;
  var mapContainer = this.createDiv_(mapContainerSize);
  mapContainerFrame.appendChild(mapContainer);

  //arrow button
  var arrowBtn = this.makeImgDiv_(btnImgSrc, btnPosSize);
  arrowBtn.style.cursor = "pointer";
  arrowBtn.style.left = (ctrlPosSize.width - btnPosSize.width) + "px";
  arrowBtn.style.top = (ctrlPosSize.height - btnPosSize.height - 1) + "px";
  container.appendChild(arrowBtn);
  
  return {container : container,
          arrowBtn : arrowBtn,
          mapContainer : mapContainer};
};

/**
 * @private
 * @desc create overview map
 * @ignore
 */
ExtOverviewMapControl.prototype.createOverviewMap_ = function (map, mapContainer) {
  var currentMapType = map.getCurrentMapType();
  
  //make a overview map
  var opts = {};
  opts.maptypes = map.getMapTypes();
  var overviewMap = new GMap2(mapContainer, opts);
  
  //disable something events
  overviewMap.disableDoubleClickZoom();
  overviewMap.disableInfoWindow();
  overviewMap.disableContinuousZoom();
  overviewMap.disableGoogleBar();
  overviewMap.disableScrollWheelZoom();

  return overviewMap;
};

/**
 * @private
 * @desc click arrow button
 */
ExtOverviewMapControl.prototype.clickArrowBtn_ = function () {
  var params = {};
  params.mapSize = this.map_.getSize();
  params.width = this.container_.offsetWidth;
  params.height = this.container_.offsetHeight;
  params.xStep = Math.floor((this.ctrlSize_.width - this.divTbl_.arrowBtnImg.width) / 10);
  params.yStep = Math.floor((this.ctrlSize_.height - this.divTbl_.arrowBtnImg.height) / 10);
  params.cnt = 0;
  
  var borderStyle;
  if (this.minimize_) {
    this.minimize_ = false;
    params.aniPosDirection = -1;
    params.aniSizeDirection = 1;
    params.btnImgPos = this.divTbl_.arrowBtnImgMinimize;
    params.maxWidth = this.ctrlSize_.width;
    params.maxHeight = this.ctrlSize_.height;
    this.container_.style.borderStyle = "solid";
    params.borderWidth = 1;
  } else {
    this.minimize_ = true;
    params.aniPosDirection = 1;
    params.aniSizeDirection = -1;
    params.btnImgPos = this.divTbl_.arrowBtnImgMaximize;
    params.maxWidth = this.divTbl_.arrowBtnImg.width;
    params.maxHeight = this.divTbl_.arrowBtnImg.height;
    this.container_.style.borderStyle = "none";
    params.borderWidth = 0;
  }
  
  params.xStep *= params.aniSizeDirection;
  params.yStep *= params.aniSizeDirection;
  
  this.doAnimation_(params);
};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.doAnimation_ = function (params) {
  params.width += params.xStep;
  params.height += params.yStep;
  
  this.container_.style.left = (params.mapSize.width - params.width - params.borderWidth) + "px";
  this.container_.style.top = (params.mapSize.height - params.height - params.borderWidth) + "px";
  this.container_.style.width = params.width + "px";
  this.container_.style.height = params.height + "px";
  
  this.arrowBtn_.style.left = (params.width - this.divTbl_.arrowBtnImg.width) + "px";
  this.arrowBtn_.style.top = (params.height - this.divTbl_.arrowBtnImg.height) + "px";
  
  
  params.cnt++;
  if (params.cnt < 10) {
    var arg = arguments;
    var this_ = this;
    setTimeout(function () {
      arg.callee.apply(this_, arg);
    }, 0);
  } else {
    this.arrowBtn_.firstChild.style.left = params.btnImgPos.left + "px";
    this.arrowBtn_.firstChild.style.top = params.btnImgPos.top + "px";
    this.container_.style.left = (params.mapSize.width - params.maxWidth - params.borderWidth) + "px";
    this.container_.style.top = (params.mapSize.height - params.maxHeight - params.borderWidth) + "px";
    this.container_.style.width = params.maxWidth + "px";
    this.container_.style.height = params.maxHeight + "px";
    this.arrowBtn_.style.left = (params.maxWidth - this.divTbl_.arrowBtnImg.width) + "px";
    this.arrowBtn_.style.top = (params.maxHeight - this.divTbl_.arrowBtnImg.height) + "px";
  }
};


/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.getDefaultPosition = function () {
  return new GControlPosition(G_ANCHOR_BOTTOM_RIGHT, new GSize(0, 0));
};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.selectable = function () {
  return false;
};

/**
 * @private
 * @ignore
 */
ExtOverviewMapControl.prototype.printable = function () {
  return true;
};


/**
 * @private
 * @desc      detect null,null string and undefined
 * @param     value
 * @return    true  :  value is nothing
 *            false :  value is not nothing
 */
ExtOverviewMapControl.prototype.isNull = function (value) {
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
ExtOverviewMapControl.prototype.makeImgDiv_ = function (imgSrc, params) {
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

/**
 * @private
 * @desc      create div element
 */
ExtOverviewMapControl.prototype.createDiv_ = function (params) {

  var divEle = document.createElement("div");
  divEle.style.position = "absolute";
  
  if (!this.isNull(params.bgcolor)) {
    divEle.style.backgroundColor = params.bgcolor;
  }
  if (!this.isNull(params.color)) {
    divEle.style.color = params.color;
  }
  
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
