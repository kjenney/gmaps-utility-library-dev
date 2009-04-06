/**
 * @name CarouselMapTypeControl
 * @version 1.0
 * @author Masashi Katsumata
 * @fileoverview
 * A CarouselMapTypeControl provides a control as like carousel for selecting and switching between supported map types.
 */

/*global G_PHYSICAL_MAP, G_HYBRID_MAP, G_SATELLITE_MAP, G_NORMAL_MAP, GLatLngBounds, _mHL */

/**
 * @desc Creates an CarouselMapTypeControl, No configuration options are available.
 * @constructor
 */
function CarouselMapTypeControl() {
  
  this.divTbl_ = {};
  this.divTbl_.buttonLabel_ = {left : 5, top : 1};
  this.divTbl_.buttonImg_ = {left : -156, top : -27, width : 15, height : 16};
  this.divTbl_.buttonImgDiv_ = {left : 59, top : 1};
  
  this.buttonLabel_ = "MapTypes";
  
  this.thumbnailSize_ = new GSize(300, 200);
  this.angleStep_ = 10;
  this.screenZ_ = 300;
  this.imgSrc_ = "http://maps.google.com/mapfiles/hpimgs11.png";
  
  this.hl_ = _mHL;

  //find api key
  var scripts = document.getElementsByTagName("script");
  var key = "";
  for (var i = 0;i < scripts.length; i++) {
    var scriptNode = scripts[i];
    if (scriptNode.src.match(/^http:\/\/maps\.google\..*?&(?:amp;)?key=([^\&]+)/gi)) {
      key = RegExp.$1;
      break;
    }
  }
  this.apiKey_ = key;

}


/**
 * @private
 */
CarouselMapTypeControl.prototype = new GControl();

/**
 * @desc Initialize the map control
 * @private
 */
CarouselMapTypeControl.prototype.initialize = function (map) {
  this.map_ = map;
  this.mapContainer_ = map.getContainer();
  this.isVisible_ = false;
  this.enableClick_ = false;
  var this_ = this;

  
  //layer for thumbnails
  var thumbnailLayer = this.createDiv_({left : 0, top : 0, width : 1, height : 1});
  this.thumbnailLayer_ = thumbnailLayer;
  this.mapContainer_.appendChild(thumbnailLayer);

  var thumbnailBGLayer = this.createDiv_({left : 0, top : 0, width : 1, height : 1});
  thumbnailBGLayer.style.backgroundColor = "black";
  this.thumbnailBGLayer_ = thumbnailBGLayer;
  this.thumbnailLayer_.appendChild(thumbnailBGLayer);

  var thumbnailStageLayer = this.createDiv_({left : 0, top : 0, width : 1, height : 1});
  this.thumbnailStageLayer_ = thumbnailStageLayer;
  this.thumbnailLayer_.appendChild(thumbnailStageLayer);

  this.mapTypes_ = [];
  this.mapTypeThumbnails_ = [];
  this.cache_ = [];

  var agt = navigator.userAgent.toLowerCase();
  this._is_ie    = ((agt.indexOf("msie") !== -1) && (agt.indexOf("opera") === -1));
  this._is_ie8    = (agt.indexOf("msie 8") !== -1);
  this._is_gecko = (agt.indexOf('gecko') !== -1);
  this._is_opera = (agt.indexOf("opera") !== -1);

  // create control button
  this.ctrlBtn_ = this.createBtn_(this.buttonLabel_, "5em");
  this.mapContainer_.appendChild(this.ctrlBtn_);
  GEvent.bindDom(this.ctrlBtn_, "mouseover", this, function () {
    this_.ctrlBtn_.firstChild.style.borderColor = "#345684 #6c9ddf #6c9ddf #345684";
  });
  GEvent.bindDom(this.ctrlBtn_, "mouseout", this, function () {
    if (this_.isVisible_ === false) {
      this_.ctrlBtn_.firstChild.style.borderColor = "white #b0b0b0 #b0b0b0 white";
    }
  });
  
  // before button
  var img = this.makeImgDiv_(this.imgSrc_, { left : 0, top : -1, width : 19, height : 20});
  img.style.position = "relative";
  if (this._is_ie8 === true) {
    img.style.marginLeft = "auto";
    img.style.marginRight = "auto";
  }
  if (!this._is_ie) {
    img.style.left = "20px";
  }
  this.beforeBtn_ = this.createBtn_(img, "60px");
  this.beforeBtn_.style.visibility = "hidden";
  this.beforeBtn_.style.position = "absolute";
  this.beforeBtn_.style.left = "0px";
  this.beforeBtn_.style.top = "0px";
  this.beforeBtn_.style.textAlign = "center";
  this.beforeBtn_.firstChild.style.color = "blue";
  this.beforeBtn_.firstChild.style.fontWeight = "bold";
  this.beforeBtn_.firstChild.style.textDecoration = "underline";
  this.mapContainer_.appendChild(this.beforeBtn_);
  
  // next button
  this.nextBtn_ = this.beforeBtn_.cloneNode(true);
  this.nextBtn_.style.left = "5em";
  this.nextBtn_.firstChild.firstChild.firstChild.style.left = "-123px";
  this.beforeBtn_.firstChild.appendChild(document.createTextNode("Before"));
  this.nextBtn_.firstChild.appendChild(document.createTextNode("Next"));
  this.mapContainer_.appendChild(this.nextBtn_);

  this.mAngle = 0;
  this.tAngle = 0;
  this.tAngleDirection = 1;
  
  var mapTypes = map.getMapTypes();
  for (var i = 0; i < mapTypes.length; i++) {
    this.addMapType(mapTypes[i]);
  }

  // events
  GEvent.bindDom(map, "addmaptype", this, this.addMapType);
  GEvent.bindDom(map, "removemaptype", this, this.removeMapType);
  GEvent.bindDom(this.ctrlBtn_, "click", this, this.onClick);
  GEvent.bindDom(this.nextBtn_, "click", this, this.onNext);
  GEvent.bindDom(this.beforeBtn_, "click", this, this.onBefore);
  GEvent.bind(map, "click", this, this.hideThumbnailLayer);
  GEvent.bind(map, "maptypechanged", this, this.onMapTypeChanged);
  GEvent.bind(map, "addoverlay", this, this.hideThumbnailLayer);
  GEvent.bind(map, "removeoverlay", this, this.hideThumbnailLayer);
  GEvent.bind(map, "clearoverlays", this, this.hideThumbnailLayer);

  return this.ctrlBtn_;
};

/**
 * @private
 * @desc     create a button
 * @param    {Object} or {String}  contentsObj
 * @param    {Number} btnWidth
 * @return   DIV element of a button
 */
CarouselMapTypeControl.prototype.createBtn_ = function (contentsObj, btnWidth) {
  var button = document.createElement("div");
  button.style.fontSize = "12px";
  button.style.lineHeight = "12px";
  button.style.position = "static";
  button.style.borderStyle = "solid";
  button.style.borderWidth = "1px";
  button.style.borderColor = "black";
  button.style.color = "black";
  button.style.cursor = "pointer";
  button.style.backgroundColor = "white";
  button.unselectable = "on";
  button.style.MozUserSelect = "none";
  button.style.KhtmlUserSelect = "none";
  button.style.userSelect = "none";
  
  var buttonIn = document.createElement("div");
  buttonIn.style.textAlign = "center";
  buttonIn.style.borderStyle = "solid";
  buttonIn.style.borderWidth = "1px";
  buttonIn.style.borderColor = "white #b0b0b0 #b0b0b0 white";
  buttonIn.style.padding = "2px";
  buttonIn.unselectable = "on";
  buttonIn.style.MozUserSelect = "none";
  buttonIn.style.KhtmlUserSelect = "none";
  buttonIn.style.userSelect = "none";
  buttonIn.style.width = btnWidth;
  if (contentsObj.nodeType === 3 || typeof contentsObj === "string") {
    buttonIn.appendChild(document.createTextNode(contentsObj));
  } else {
    buttonIn.appendChild(contentsObj);
  }
  button.appendChild(buttonIn);
  return button;
};

/**
 * @private
 * @desc      Click events action for the before button
 */
CarouselMapTypeControl.prototype.onBefore = function () {
  //if (this.tAngle !== this.mAngle) {
  //  return;
  //}
  
  var len = this.getHashLength_(this.mapTypeThumbnails_);
  this.tAngle -= 360 / len;
  this.tAngleDirection = -1;
  this.loop();
};

/**
 * @private
 * @desc      Click events action for the next button
 */
CarouselMapTypeControl.prototype.onNext = function () {
  //if (this.tAngle !== this.mAngle) {
  //  return;
  //}
  
  var len = this.getHashLength_(this.mapTypeThumbnails_);
  this.tAngle += 360 / len;
  this.tAngleDirection = 1;
  this.loop();
};

/**
 * @private
 * @desc      Set label for control button
 */
CarouselMapTypeControl.prototype.setCtrlBtnLabel = function (text) {
  if (this.ctrlBtn_.firstChild.hasChildNodes() === true) {
    this.ctrlBtn_.firstChild.removeChild(this.ctrlBtn_.firstChild.firstChild);
  }
  this.ctrlBtn_.firstChild.appendChild(document.createTextNode(text));
  
};

/**
 * @private
 * @desc      Click event action for the control button
 */
CarouselMapTypeControl.prototype.onClick = function () {
  var this_ = this;
  if (this.isVisible_ === true) {
    this.feedOut(function () {
      this_.hideThumbnailLayer();
      GEvent.trigger(this_.ctrlBtn_, "mouseout");
    });
    return;
  }
  this.setCtrlBtnLabel("close");

  this.circleR_ = this.mapContainer_.offsetWidth;
  this.isVisible_ = true;
  this.enableClick_  = true;
  
  this.mapContainerSize = new GSize(this.map_.getContainer().offsetWidth, this.map_.getContainer().offsetHeight);
  this.thumbnailLayer_.style.width =  this.mapContainerSize.width + "px";
  this.thumbnailLayer_.style.height =  this.mapContainerSize.height + "px";
  
  this.thumbnailBGLayer_.style.width = this.mapContainerSize.width + "px";
  this.thumbnailBGLayer_.style.height =  this.mapContainerSize.height + "px";
  this.opacity = 0;
  
  var feedIn = function () {
    if (this_._is_ie) {
      this_.thumbnailBGLayer_.style.filter =  "alpha(opacity=" + this_.opacity + ")";
    } else {
      this_.thumbnailBGLayer_.style.MozOpacity = this_.opacity / 100;
      this_.thumbnailBGLayer_.style.opacity = this_.opacity / 100;
    }
    this_.opacity += 5;
    if (this_.opacity < 30) {
      setTimeout(arguments.callee, 10);
    }
  };
  feedIn();
  this.thumbnailLayer_.style.visibility = "visible";
  this.nextBtn_.style.visibility = "visible";
  this.beforeBtn_.style.visibility = "visible";
  
  var x = this.mapContainerSize.width / 2;
  var y = this.mapContainerSize.height / 4 * 3 + this.nextBtn_.offsetHeight;
  this.nextBtn_.style.left = x + "px";
  this.nextBtn_.style.top = y + "px";
  
  x = this.mapContainerSize.width / 2 - this.nextBtn_.offsetWidth;
  this.beforeBtn_.style.left = x + "px";
  this.beforeBtn_.style.top = y + "px";
  
  
  this.centerDivPixel = new GPoint(this.mapContainerSize.width / 2 , this.mapContainerSize.height / 2 + this.thumbnailSize_.height / 2);
  this.selectFrontThumbnail(this.getMapTypeIndex(this.map_.getCurrentMapType()));
  
};

/**
 * @private
 * @desc     The maptypechanged event action for the map
 */
CarouselMapTypeControl.prototype.onMapTypeChanged = function () {
  var currentMapType = this.map_.getCurrentMapType();
  this.hideThumbnailLayer();
  this.selectFrontThumbnail(this.getMapTypeIndex(currentMapType));
};

/**
 * @private
 * @desc     get a index number of thumbnails from the GMapType
 * @param    {GMapType} mapType
 * @return   {Number}   index number of thumbnails
 */
CarouselMapTypeControl.prototype.getMapTypeIndex = function (mapType) {
  var i = this.getHashLength_(this.mapTypeThumbnails_);
  for (var mName in this.mapTypes_) {
    if (mName in this.mapTypes_) {
      if (mapType === this.mapTypes_[mName]) {
        return i;
      }
      i--;
    }
  }
};


/**
 * @private
 * @desc     change the carousel angle from the current angle to the maptype of index
 * @param    {Number}   index number of thumbnails
 * @param    [function = undefined]   set callback function on select changed
 */
CarouselMapTypeControl.prototype.selectFrontThumbnail = function (index, onchanged) {
  var len = this.getHashLength_(this.mapTypeThumbnails_);
  var currentIndex = (this.mAngle * len) / 360;
  if (index === len) {
    index = 0;
  }
  this.tAngle =  360 / len * index;
  
  if (this.mAngle > this.tAngle) {
    this.tAngleDirection = -1;
  } else {
    this.tAngleDirection = 1;
  }
  if (this.mAngle === 0 && this.tAngle === 360) {
    this.mAngle = 360;
  }
  if (this.isVisible_ === true) {
    this.loop(onchanged);
  }
};

/**
 * @private
 * @desc     The carousel roundes from mAngle to tAngle.
 * @param    [function = undefined]   set callback function on changed
 */
CarouselMapTypeControl.prototype.loop = function (onchanged) {

  this.enableClick_ = false;
  var screenZ = this.screenZ_;
  var circleR = this.circleR_;
  var k, xx, yy, zz, i, len, zoomScale, mapTypeName, thumbnail;
  i = 0;
  len = this.getHashLength_(this.mapTypeThumbnails_);
  for (mapTypeName in this.mapTypeThumbnails_) {
    if (mapTypeName in this.mapTypeThumbnails_ === true) {
      thumbnail = this.mapTypeThumbnails_[mapTypeName].ele;
  
      k = (this.mAngle + 180) / 180 * Math.PI + Math.PI * 2 / len * i;
      xx = circleR * Math.sin(k);
      yy = -100;
      zz = circleR - circleR * Math.cos(k);
      zoomScale = Math.floor(zz / circleR / 2 * 1000) / 1000;
      thumbnail.style.zIndex = Math.floor(zz);
      zz += screenZ;
      thumbnail.style.left = (this.centerDivPixel.x + xx * screenZ / zz - this.thumbnailSize_.width / 2 * zoomScale) + "px";
      thumbnail.style.top = (this.centerDivPixel.y + yy * screenZ / zz - this.thumbnailSize_.height * zoomScale) + "px";
      
      this.setThumbnailZoomScale(this.mapTypeThumbnails_[mapTypeName], zoomScale);
      i++;
    }
  }
  
  
  var isNext = false;
  if (this.tAngleDirection === 1) {
    if (this.mAngle < this.tAngle) {
      this.mAngle += this.angleStep_;
      if (this.mAngle > this.tAngle) {
        this.mAngle = this.tAngle;
      }
      isNext = true;
    }
  } else {
    if (this.mAngle > this.tAngle) {
      this.mAngle -= this.angleStep_;
      isNext = true;
    }
  }
  
  if (isNext === true) {
    var this_ = this;
    setTimeout(function () {
      this_.loop(onchanged);
    }, 25);
  } else {
    this.enableClick_ = true;
    
    if (this.mAngle < 0) {
      this.mAngle += 360;
      this.tAngle += 360;
    } else if (this.mAngle >= 360) {
      this.mAngle -= 360 * Math.abs(this.mAngle / 360);
      this.tAngle -= 360 * Math.abs(this.tAngle / 360);
    }

    if (!this.isNull(onchanged) === true) {
      onchanged();
    }
  }
};

/**
 * @private
 * @desc     Set zoom scale for thumbnail
 * @param    {Object} thumbnail
 * @param    {Number} zoomScale
 */
CarouselMapTypeControl.prototype.setThumbnailZoomScale = function (thumbnail, zoomScale) {
  var i, ele, info;
  var width = this.thumbnailSize_.width * zoomScale;
  var height = this.thumbnailSize_.height * zoomScale;
  var infoList = thumbnail.infoList;
  var tileSize = (Math.round((thumbnail.tileSize * zoomScale * 10)) / 10) + "px";

  thumbnail.ele.style.width = width + "px";
  thumbnail.ele.style.height = height + "px";
  for (i = 0; i < thumbnail.infoList.length; i++) {
    info = infoList[i];
    ele = this.cache_[info.idx];
    ele.style.left = (info.x * zoomScale) + "px";
    ele.style.top =  (info.y * zoomScale) + "px";
    ele.style.width = tileSize;
    ele.style.height = tileSize;
  }
};


/**
 * @private
 * @ignore
 */
CarouselMapTypeControl.prototype.getDefaultPosition = function () {
  return new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(10, 10));
};

/**
 * @private
 * @desc      action for addmaptype event
 */
CarouselMapTypeControl.prototype.addMapType = function (mapType) {
  var name = mapType.getName();

  if (this.isNull(this.mapTypes_[name]) === true) {
    this.mapTypes_[name] = mapType;
    this.mapTypeThumbnails_[name] = this.makeThumbnail(mapType, this.thumbnailSize_);
    this.thumbnailLayer_.appendChild(this.mapTypeThumbnails_[name].ele);
  }
};

/**
 * @private
 * @desc      action for removemaptype event
 */
CarouselMapTypeControl.prototype.removeMapType = function (mapType) {
  var vFlag = false;
  if (this.isVisible_ === true) {
    vFlag = true;
    this.hideThumbnailLayer();
    this.loop();
  }
  var info, i, ele;
  var name = mapType.getName();
  if (this.isNull(this.mapTypes_[name]) === false) {
    var thumbnail = this.mapTypeThumbnails_[name];
    
    for (i = 0; i < thumbnail.infoList.length; i++) {
      info = thumbnail.infoList[i];
      ele = this.cache_[info.idx];
      ele.parentNode.removeChild(ele);
    }
    this.thumbnailLayer_.removeChild(this.mapTypeThumbnails_[name].ele);
    delete this.mapTypes_[name];
    delete this.mapTypeThumbnails_[name];
  }
  if (vFlag === true) {
    this.onClick();
  }
};


/**
 * @private
 * @desc      create a thumbnail for the mapType.
 * @param  {GMapType} mapType
 * @param  {GSize}    thumbnailSize
 */
CarouselMapTypeControl.prototype.makeThumbnail = function (mapType, thumbnailSize) {

  var elementInfoList = [];
  var this_ = this;
  var i, x, y, tileIndex, tileImgUrl, zoomScale, ix, iy;
  var initDomSize = function (obj, pos, size) {
    obj.style.left = pos.x + "px";
    obj.style.top = pos.y + "px";
    
    if (!this_.isNull(size)) {
      obj.style.width = size.width + "px";
      obj.style.height = size.height + "px";
    }
  };

  var zoom =  mapType.getMinimumResolution() + 1;
  var tileSize = mapType.getTileSize();
  var projection = mapType.getProjection();
  var wrapWidth = projection.getWrapWidth(zoom);

  var tileNW = this.getTileIndex(mapType, projection.fromPixelToLatLng(new GPoint(0, 0), zoom), zoom);
  var tileSE = this.getTileIndex(mapType, projection.fromPixelToLatLng(new GPoint(wrapWidth, thumbnailSize.height), zoom), zoom);

  var x1 = tileNW.x;
  var x2 = tileSE.x;
  var y1 = tileNW.y;
  var y2 = tileSE.y;
  var incrementX = 1;
  if (tileSE.x < tileNW.x) {
    incrementX = -1;
  }
  

  var thumbnailContainer = this.createDiv_({left : 0, top : 0, width : 0, height : 0});
  thumbnailContainer.style.backgroundColor = "white";
  thumbnailContainer.style.borderColor = "white #808080 #808080 white";
  thumbnailContainer.style.borderWidth = "2px";
  thumbnailContainer.style.borderStyle = "solid";
  thumbnailContainer.style.cursor = "pointer";
  initDomSize(thumbnailContainer, {x : 0, y : 0}, thumbnailSize);

  zoomScale = thumbnailSize.width / wrapWidth;
  var tileSizeOrg = tileSize;
  tileSize = Math.floor(tileSize * zoomScale);
  
  var dx = Math.floor(thumbnailSize.width / tileSize);
  //var initX = dx;
  if (thumbnailSize.width % tileSize !== 0) {
    dx++;
  //  initX -= (thumbnailSize.width - tileSize) / 2;
  }

  var dy = Math.floor(thumbnailSize.height / tileSize);
  if (thumbnailSize.height % tileSize !== 0) {
    dy++;
  }
  var pxPos = new GPoint(0, 0);
  var initY = 0;
  initY = (thumbnailSize.height - tileSize * dy) / 2;
  var mapTileMargin = new GPoint(0, 0);
  var tileSizeXY = new GSize(tileSize, tileSize);
  var zeroPosXY = new GPoint(0, 0);
  
  if (mapType === G_SATELLITE_MAP || 
    mapType === G_HYBRID_MAP ||
    mapType === G_PHYSICAL_MAP ||
    mapType === G_NORMAL_MAP) {
    
    var centerPos = new GPoint(wrapWidth / 2, ((dy * tileSizeOrg) - initY) / 2);
    var centerPosLatLng = projection.fromPixelToLatLng(centerPos, zoom);
    return this.makeThumbnailWithStaticMapAPI_(mapType, thumbnailSize, centerPosLatLng, zoom, new GSize(wrapWidth, dy * tileSizeOrg));
  }


  var j = this.cache_.length;
  var tileLayers = mapType.getTileLayers();
  var isPng = false;
  for (i = 0; i < tileLayers.length; i++) {
    var layer = tileLayers[i];
    isPng = layer.isPng();
    pxPos.y = initY;
    iy = y1;
    for (y = 0; y < dy; y++) {
      ix = x1;
      pxPos.x = 0;
      for (x = 0; x < dx; x++) {
        tileIndex = new GPoint(ix, iy);
        if (projection.tileCheckRange(tileIndex, zoom, tileSize) === true) {
          tileImgUrl = layer.getTileUrl(tileIndex, zoom);
          
          var img = this.makeImgDivSlim_(tileImgUrl, {left : pxPos.x, top : pxPos.y, isPng : isPng});
          initDomSize(img, pxPos, tileSizeXY);
          this.cache_[j] = img;
          elementInfoList.push({x : pxPos.x, y : pxPos.y, idx : j++});
          initDomSize(img.firstChild, zeroPosXY, tileSizeXY);
          this.cache_[j] = img.firstChild;
          elementInfoList.push({x : 0, y : 0, idx : j++});
          
          thumbnailContainer.appendChild(img);
        }
        pxPos.x += tileSize;
        ix += incrementX;
      }
      pxPos.y += tileSize;
      iy++;
    }
  }
  var label = this.createDiv_({left : 0, top : thumbnailSize.height - 15, width : 1, height : 1});
  label.style.backgroundColor = "white";
  label.style.textColor = "black";
  label.style.fontSize = "13px";
  label.style.lineHeight = "15px";
  label.style.height = "15px";
  label.style.fontWeight = "bold";
  label.style.textAlign = "center";
  if (this._is_ie) {
    label.style.filter = "alpha(opacity=70)";
  } else {
    label.style.MozOpacity = 0.7;
    label.style.opacity = 0.7;
  }
  label.style.width = thumbnailSize.width + "px";
  label.appendChild(document.createTextNode(mapType.getName()));
  thumbnailContainer.appendChild(label);
  
  GEvent.bindDom(thumbnailContainer, "click", this, function () {
    if (this_.enableClick_ === true) {
      if (this_.map_.getCurrentMapType() !== mapType) {
        var mIndex = this_.getMapTypeIndex(mapType);
        this_.selectFrontThumbnail(mIndex, function () {
          this_.feedOut(function () {
            this_.onClick();
            this_.map_.setMapType(mapType);
          });
        });
      } else {
        this_.feedOut();
        this_.hideThumbnailLayer();
      }
    }
  });
  return {ele : thumbnailContainer, infoList : elementInfoList, tileSize : tileSize};
};




/**
 * @private
 * @desc      hide carousel
 */
CarouselMapTypeControl.prototype.hideThumbnailLayer = function () {
  this.thumbnailLayer_.style.visibility = "hidden";
  this.nextBtn_.style.visibility = "hidden";
  this.beforeBtn_.style.visibility = "hidden";
  this.isVisible_ = false;
  
  this.setCtrlBtnLabel(this.buttonLabel_);
};


/**
 * @private
 * @ignore
 */
CarouselMapTypeControl.prototype.feedOut = function (onfeedouted) {
  var this_ = this;
  if (this._is_ie) {
    this.thumbnailBGLayer_.style.filter =  "alpha(opacity=" + this.opacity + ")";
  } else {
    this.thumbnailBGLayer_.style.MozOpacity = this.opacity / 100;
    this.thumbnailBGLayer_.style.opacity = this.opacity / 100;
  }
  this.opacity -= 5;
  if (this.opacity > 0) {
    setTimeout(function () {
      this_.feedOut(onfeedouted);
    }, 10);
  } else {
    this.opacity = 0;
    if (!this.isNull(onfeedouted) === true) {
      onfeedouted();
    }
  }
  
};

/**
 * @private
 * @desc      get the tile index of currentProjection
 * @param     {GMapType} mapType
 * @param     {GLatLng} latlng
 * @param     {Number}  zoom
 * @return    {GPoint}  tile index
 */
CarouselMapTypeControl.prototype.getTileIndex = function (mapType, latlng, zoom) {
  var tile = new GPoint();
  var point = new GPoint();
  var projection = mapType.getProjection();
  var tileSize = mapType.getTileSize();
  
  point = projection.fromLatLngToPixel(latlng, zoom);
  tile.x = Math.floor(point.x / tileSize);
  tile.y = Math.floor(point.y / tileSize);
  return tile;
};


/**
 * @private
 * @ignore
 */
CarouselMapTypeControl.prototype.selectable = function () {
  return false;
};

/**
 * @private
 * @ignore
 */
CarouselMapTypeControl.prototype.printable = function () {
  return false;
};

/**
 * @private
 * @desc      detect null,null string and undefined
 * @param     value
 * @return    true  :  value is nothing
 *            false :  value is not nothing
 */
CarouselMapTypeControl.prototype.isNull = function (value) {
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
 * @desc      create div element with image
 */
CarouselMapTypeControl.prototype.makeImgDivSlim_ = function (imgSrc, params) {
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
  if (!this._is_ie || this._is_ie && (this.isNull(params.isPng) === true || params.isPng === false)) {
    img = new Image();
    img.src = imgSrc;
  } else {
    img = document.createElement("div");
    img.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod='scale', src='" + imgSrc + "')";
  }
  
  imgDiv.appendChild(img);
  return imgDiv;
};

/**
 * @private
 * @desc      create div element with PNG image
 */
CarouselMapTypeControl.prototype.makeImgDiv_ = function (imgSrc, params) {
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
 * @ignore
 */
CarouselMapTypeControl.prototype.createDiv_ = function (params) {
  
  var bgDiv = document.createElement("div");
  bgDiv.style.position = "absolute";
  if (!this.isNull(params.bgcolor)) {
    bgDiv.style.backgroundColor = params.bgcolor;
  }
  if (!this.isNull(params.color)) {
    bgDiv.style.color = params.color;
  }
  bgDiv.style.fontSize = 0;
  bgDiv.style.lineHeight = 0;
  bgDiv.style.overflow = "hidden";
  bgDiv.style.left = params.left + "px";
  bgDiv.style.top = params.top + "px";
  bgDiv.style.width = params.width + "px";
  bgDiv.style.height = params.height + "px";
  return bgDiv;
};

/**
 * @private
 * @desc return size of html elements
 * @param html : html elements
 * @return GSize
 */
CarouselMapTypeControl.prototype.getHtmlSize_ = function (html) {
  
  var mapContainer = this.map_.getContainer();
  var onlineHTMLsize_ = function (text) {
    var dummyTextNode = document.createElement("span");
    dummyTextNode.innerHTML = text;
    dummyTextNode.style.display = "inline";
    mapContainer.appendChild(dummyTextNode);
    
    var size = {};
    size.width = dummyTextNode.offsetWidth;
    size.height = dummyTextNode.offsetHeight;
    
    mapContainer.removeChild(dummyTextNode);
    return size;
  };
  
  var ret;
  var lines = html.split(/\n/i);
  var totalSize = new GSize(1, 1); // "1" is margin
  for (var i = 0; i < lines.length; i++) {
    ret = onlineHTMLsize_(lines[i]);
    totalSize.width += ret.width;
    totalSize.height += ret.height;
  }
  return totalSize;
};

/**
 * @private
 * @ignore
 */
CarouselMapTypeControl.prototype.getHashLength_ = function (hashObj) {
  var cnt = 0;
  var d;
  for (var key in hashObj) {
    if (key in hashObj === true) {
      cnt++;
    }
  }
  return cnt;
};

/**
 * @private
 * @desc  get new static map's image.
 */
CarouselMapTypeControl.prototype.makeThumbnailWithStaticMapAPI_ = function (mapType, thumbnailSize, mapCenterPos, zoom, imgSize) {
  var url = "http://maps.google.com/staticmap?key=" + this.apiKey_;
  
  //center position
  url += "&center=" + this.floor6decimal(mapCenterPos.lat()) + "," + this.floor6decimal(mapCenterPos.lng());
  
  //size
  if (imgSize.width > 600) {
    imgSize.width = 600;
  }
  if (imgSize.height > 600) {
    imgSize.height = 600;
  }
  url += "&size=" + imgSize.width + "x" + imgSize.height;
  
  //zoom level
  url += "&zoom=" + zoom;
  
  //map type
  var maptypeCode = "";
  switch (mapType) {
  case G_SATELLITE_MAP:
    maptypeCode = "satellite";
    break;
  case G_HYBRID_MAP:
    maptypeCode = "hybrid";
    break;
  case G_PHYSICAL_MAP:
    maptypeCode = "terrain";
    break;
  default:
    maptypeCode = "roadmap";
  }
  url += "&maptype=" + maptypeCode;
  
  //language
  if (this.hl_ !== "" && String(this.hl_).toLowerCase() !== "en") {
    url += "&hl=" + this.hl_.toLowerCase();
  }
  
  //format
  url += "&format=gif";
  
  var thumbnailContainer = this.makeImgDivSlim_(url, {left : 0, top : 0, width : thumbnailSize.width, height : thumbnailSize.height, isPng : false});
  thumbnailContainer.style.backgroundColor = "white";
  thumbnailContainer.style.borderColor = "white #808080 #808080 white";
  thumbnailContainer.style.borderWidth = "2px";
  thumbnailContainer.style.borderStyle = "solid";
  thumbnailContainer.style.cursor = "pointer";
  thumbnailContainer.style.left = 0;
  thumbnailContainer.style.top = 0;
  thumbnailContainer.style.width = 0;
  thumbnailContainer.style.height = 0;

  var elementInfoList = [];
  var j = this.cache_.length;
  this.cache_[j] = thumbnailContainer.firstChild;
  elementInfoList.push({x : 0, y : 0, idx : j});

  var label = this.createDiv_({left : 0, top : thumbnailSize.height - 15, width : 1, height : 1});
  label.style.backgroundColor = "white";
  label.style.textColor = "black";
  label.style.fontSize = "13px";
  label.style.lineHeight = "15px";
  label.style.height = "15px";
  label.style.fontWeight = "bold";
  label.style.textAlign = "center";
  if (this._is_ie) {
    label.style.filter = "alpha(opacity=70)";
  } else {
    label.style.MozOpacity = 0.7;
    label.style.opacity = 0.7;
  }
  label.style.width = thumbnailSize.width + "px";
  label.appendChild(document.createTextNode(mapType.getName()));
  thumbnailContainer.appendChild(label);
  
  var this_ = this;
  GEvent.bindDom(thumbnailContainer, "click", this, function () {
    if (this_.enableClick_ === true) {
      if (this_.map_.getCurrentMapType() !== mapType) {
        var mIndex = this_.getMapTypeIndex(mapType);
        this_.selectFrontThumbnail(mIndex, function () {
          this_.feedOut(function () {
            this_.onClick();
            this_.map_.setMapType(mapType);
          });
        });
      } else {
        this_.feedOut();
        this_.hideThumbnailLayer();
      }
    }
  });

  return {ele : thumbnailContainer, infoList : elementInfoList, tileSize : thumbnailSize.width};
};

/**
 * @private
 * @ignore
 */
CarouselMapTypeControl.prototype.floor6decimal = function (value) {
  return (Math.floor(value * 1000000) / 1000000);
};

