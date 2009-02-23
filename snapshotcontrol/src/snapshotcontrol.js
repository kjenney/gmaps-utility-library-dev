/**
 * @name SnapShotControl(tempolary class name)
 * @version 1.0
 */

/*global GPolygon, GPolyline, GMarker, G_PHYSICAL_MAP, G_HYBRID_MAP, G_SATELLITE_MAP, GLatLngBounds, _mHL  */


/**
 * @constructor
 */    
function SnapShotControl() {
  this.cameraImgSrc = "http://www.google.com/mapfiles/cb/camera.png";
  this.transImgSrc = "http://www.google.com/mapfiles/transparent.png";
  
  var container = undefined;
  var opts_ = {};
  var s = 1, idx = 1;
  var obj;
  //detect constructor params
  if (arguments.length > 0) {
    if (!this.isNull(arguments[0].style)) {
      container = arguments[0];
      
      if (arguments.length === 2) {
        opts_ = arguments[1];
      }
      
    }
    
  }
  
  this.snapContainer = container;
  
  this.snapContainerImg = new Image();
  this.snapContainerImg.src = this.transImgSrc;
  if (!this.isNull(container)) {
    container.appendChild(this.snapContainerImg);
  } else {
    opts_.hidden = true;
  }
  
  this.buttonLabel_ = opts_.buttonLabel || "shot!";
  this.maptype_ = opts_.maptype || "";
  this.size_ = opts_.size || "";
  this.isHidden_ = opts_.hidden || false;
  this.hl_ = opts_.hl || _mHL;
  this.hl_ = this.hl_ || "";
  this.frame_ = opts_.frame || false;
  this.imgFormat_ = opts_.format || "gif";
  
  this.divTbl = {};
  this.divTbl.container = { "left" : 0, "top" : 0, "width" : 60, "height" : 26, "bgcolor" : "white"};
  this.divTbl.cameraImg = { "left" : 2, "top" : 2, "width" : 27, "height" : 22};
  this.divTbl.camera =    { "left" : 1, "top" : 1};
  this.divTbl.buttonLabel = { "left" : 30, "top" : 1};
  
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
SnapShotControl.prototype = new GControl();


/**
 * @desc Initialize the map control
 * @private
 */
SnapShotControl.prototype.initialize = function (map) {
  this.map_ = map;
  this.polylines_ = [];
  this.markers_ = [];

  var agt = navigator.userAgent.toLowerCase(this.divTbl.container);
  
  this._is_ie    = ((agt.indexOf("msie") !== -1) && (agt.indexOf("opera") === -1));
  this._is_gecko = (agt.indexOf('gecko') !== -1);
  this._is_opera = (agt.indexOf("opera") !== -1);
  
  //calculating of the button label
  var text = document.createElement("span");
  text.appendChild(document.createTextNode(this.buttonLabel_));
  text.style.position = "absolute";
  text.style.left = this.divTbl.buttonLabel.left + "px";
  text.style.bottom = this.divTbl.buttonLabel.top + "px";
  text.style.fontSize = "12px";
  text.style.lineHeight = "12px";
  
  
  // create container
  var container = this.createDiv_(this.divTbl.container);
  container.style.borderStyle = "solid";
  container.style.borderWidth = "1px";
  container.style.borderColor = "white #b0b0b0 #b0b0b0 white";
  container.style.color = "black";
  container.style.cursor = "pointer";
  this._container = container;

  //camera Img
  var cameraImg = this.makeImgDiv_(this.cameraImgSrc, this.divTbl.cameraImg);
  cameraImg.style.cursor = "pointer";
  cameraImg.style.left = this.divTbl.camera.left + "px";
  cameraImg.style.top = this.divTbl.camera.top + "px";
  container.appendChild(cameraImg); 
  
  //button label
  container.appendChild(text); 

  // events
  GEvent.bindDom(container, "click", this, this.getImage);
  GEvent.bind(map, "addoverlay", this, this._addOverlay);
  GEvent.bind(map, "clearoverlays", this, this._clearOverlays);
  GEvent.bind(map, "removeoverlay", this, this._removeOverlay);

  if (this.isHidden_ === true) {
    this._container.style.visibility = "hidden";
    this.isHidden_ = true;
  }

  map.getContainer().appendChild(container);
  
  return container;
};

/**
 * @private
 */
SnapShotControl.prototype._addOverlay = function (overlay) {
  var i, pos;
  var polygonInfo = {};
  var polylineInfo = {};
  var markerInfo = {};
  var tmp = this.detectOverlay(overlay);
  switch (tmp) {
  case "GPolygon":
    polygonInfo.handle = overlay;
    polygonInfo.color = overlay.color.replace("#", "0x");
    polygonInfo.weight = overlay.weight;
    polygonInfo.opacity = Math.floor(overlay.opacity * 255).toString(16);
    polygonInfo.vertexCount = overlay.getVertexCount();
    polygonInfo.vertexList = [];
    polygonInfo.drawFlagList = [];
    for (i = 0; i < polygonInfo.vertexCount; i++) {
      pos = new GLatLng(this.floor6decimal(overlay.getVertex(i).lat()), this.floor6decimal(overlay.getVertex(i).lng()));
      polygonInfo.vertexList.push(pos);
    }
    this.polylines_.push(polygonInfo);
    break;

  case "GPolyline":
    polylineInfo.handle = overlay;
    polylineInfo.color = overlay.color.replace("#", "0x");
    polylineInfo.weight = overlay.weight;
    polylineInfo.opacity = Math.floor(overlay.opacity * 255).toString(16);
    polylineInfo.vertexCount = overlay.getVertexCount();
    polylineInfo.vertexList = [];
    polylineInfo.drawFlagList = [];
    for (i = 0; i < polylineInfo.vertexCount; i++) {
      pos = new GLatLng(this.floor6decimal(overlay.getVertex(i).lat()), this.floor6decimal(overlay.getVertex(i).lng()));
      polylineInfo.vertexList.push(pos);
    }
    this.polylines_.push(polylineInfo);
    break;
      
  case "GMarker":
    markerInfo.handle = overlay;
    
    this.markers_.push(markerInfo);
    break;
  }
};

/**
 * @private
 */
SnapShotControl.prototype._clearOverlays = function (overlay) {
  this.polylines_.length = 0;
  this.markers_.length = 0;
};

/**
 * @private
 */
SnapShotControl.prototype._removeOverlay = function (overlay) {
  var i, pos;
  var polygonInfo = {};
  var markerInfo = {};
  var shiftFlag = false;
  
  switch (this.detectOverlay(overlay)) {
  case "GPolygon":
  case "GPolyline":
    polygonInfo.handle = overlay;
    for (i = 0; i < this.polylines_.length; i++) {
      if (shiftFlag === true) {
        this.polylines_[i - 1] = this.polylines_[i];
      }
      if (this.polylines_[i].handle === overlay) {
        shiftFlag = true;
      }
    }
    this.polylines_.length -= 1;
    break;
    
  case "GMarker":
    markerInfo.handle = overlay;
    
    for (i = 0; i < this.markers_.length; i++) {
      if (shiftFlag === true) {
        this.markers_[i - 1] = this.markers_[i];
      }
      if (this.markers_[i].handle === overlay) {
        shiftFlag = true;
      }
    }
    this.markers_.length -= 1;
    break;
  }
};


/**
 * @name show
 * @desc change visibility of the control to visible
 */
SnapShotControl.prototype.show = function () {
  this._container.style.visibility = "visible";
  this.isHidden_ = false;
};

/**
 * @name hide
 * @desc change visibility of the control to hidden
 */
SnapShotControl.prototype.hide = function () {
  this._container.style.visibility = "hidden";
  this.isHidden_ = true;
};

/**
 * @name isHidden
 * @desc return true when visibility of the control is hidden 
 */
SnapShotControl.prototype.isHidden = function () {
  return this.isHidden_;
};

/**
 * @private
 * @desc detecting the overlay
 */
SnapShotControl.prototype.detectOverlay = function (overlay) {
  
  if (this.matchingTest(overlay, GPolyline)) {
    return "GPolyline";
  }
  if (this.matchingTest(overlay, GPolygon)) {
    return "GPolygon";
  }
  if (this.matchingTest(overlay, GMarker)) {
    return "GMarker";
  }
  return undefined;
};

/**
 * @private
 * @desc matching test targetObject and matchClass
 */
SnapShotControl.prototype.matchingTest = function (targetObject, matchClass) {
  for (var key in matchClass.prototype) {
    if (key in targetObject === false && key !== "prototype" && key !== "__super") {
      return false;
    }
  }
  return true;
};


/**
 * @name getImage
 * @desc  get new static map's image.
 */
SnapShotControl.prototype.getImage = function () {
  var url = "http://maps.google.com/staticmap?key=" + this.apiKey_;
  
  var bounds = this.map_.getBounds();
  var zoom = this.map_.getZoom();
  
  //center position
  var mapCenterPos = this.map_.getCenter();
  url += "&center=" + this.floor6decimal(mapCenterPos.lat()) + "," + this.floor6decimal(mapCenterPos.lng());
  
  //size
  var mapSize = this.map_.getSize();
  if (!this.isNull(this.size_)) {
    if (this.size_.width > 640) {
      this.size_.width = 640;
    }
    if (this.size_.height > 640) {
      this.size_.height = 640;
    }
    
    url += "&size=" + this.size_.width + "x" + this.size_.height;
    this.snapContainerImg.width = this.size_.width;
    this.snapContainerImg.height = this.size_.height;
  } else {
    if (mapSize.width > 640) {
      mapSize.width = 640;
    }
    if (mapSize.height > 640) {
      mapSize.height = 640;
    }
    
    url += "&size=" + mapSize.width + "x" + mapSize.height;
    this.snapContainerImg.width = mapSize.width;
    this.snapContainerImg.height = mapSize.height;
  }
  
  
  //zoom level
  url += "&zoom=" + zoom;
  
  //map type
  var maptype = "";
  if (this.isNull(this.maptype_)) {
    switch (this.map_.getCurrentMapType()) {
    case G_SATELLITE_MAP:
      maptype = "satellite";
      break;
    case G_HYBRID_MAP:
      maptype = "hybrid";
      break;
    case G_PHYSICAL_MAP:
      maptype = "terrain";
      break;
    default:
      maptype = "roadmap";
      if (this.snapContainerImg.width < 300 || this.snapContainerImg.height < 300) {
        maptype = "mobile";
      }
    }
  } else {
    maptype = this.maptype_;
  }
  if (maptype !== "") {
    url += "&maptype=" + maptype;
  }
  
  if (this.hl_ !== "" && String(this.hl_).toLowerCase() !== "en") {
    url += "&hl=" + this.hl_.toLowerCase();
  }
  if (String(this.frame_).toLowerCase() === "true") {
    url += "&frame=true";
  }
  
  if (!this.isNull(this.imgFormat_)) {
    var imgFormat = this.imgFormat_.toLowerCase();
    
    if (imgFormat === "jpg" || imgFormat === "jpeg") {
      url += "&format=jpg";
    } else if (imgFormat === "png") {
      url += "&format=png32";
    } else if (imgFormat === "jpg-baseline" || imgFormat === "png8" || imgFormat === "png32") {
      url += "&format=" + imgFormat;
    }
    
  }

  //polylines
  var is_draw_ = false;
  var lineBound, i, j;
  for (i = 0; i < this.polylines_.length; i++) {
    var polyline = this.polylines_[i];
    
    if (polyline.handle.isHidden() === false) {
      var vertexLatLng;
      var pathStr = "";
      var addedList = [];
      addedList.length = polyline.vertexCount;
      polyline.drawFlagList[0] = bounds.containsLatLng(polyline.vertexList[0]);
      addedList[0] = 0;
      if (polyline.drawFlagList[0] === true) {
        pathStr += "|" + polyline.vertexList[0].lat() + "," + polyline.vertexList[0].lng();
        addedList[0] = 1;
      }
      
      for (j = 1; j < polyline.vertexCount; j++) {
        addedList[j] = 0;
        polyline.drawFlagList[j] = bounds.containsLatLng(polyline.vertexList[j]);
        if (polyline.drawFlagList[j - 1] === true || polyline.drawFlagList[j] === true) {
          if (polyline.drawFlagList[j - 1] === false && addedList[j - 1] === 0) {
            pathStr += "|" + polyline.vertexList[j - 1].lat() + "," + polyline.vertexList[j - 1].lng();
          }
          pathStr += "|" + polyline.vertexList[j].lat() + "," + polyline.vertexList[j].lng();
          addedList[j] = 1;
          
        } else {
          lineBound = new GLatLngBounds(polyline.vertexList[j - 1], polyline.vertexList[j]);
          
          polyline.drawFlagList[j] = bounds.intersects(lineBound);
          
          if (polyline.drawFlagList[j] === true) {
            if (polyline.drawFlagList[j - 1] === false && addedList[j - 1] === 0) {
              pathStr += "|" + polyline.vertexList[j - 1].lat() + "," + polyline.vertexList[j - 1].lng();
            }
            pathStr += "|" + polyline.vertexList[j].lat() + "," + polyline.vertexList[j].lng();
            addedList[j] = 1;
          } else if (polyline.drawFlagList[j - 1] === true) {
            if (addedList[j - 1] === 0) {
              pathStr += "|" + polyline.vertexList[j - 1].lat() + "," + polyline.vertexList[j - 1].lng();
            }
            pathStr += "|" + polyline.vertexList[j].lat() + "," + polyline.vertexList[j].lng();
            addedList[j] = 1;
          }
        }
      }
      if (pathStr !== "") {
        var path = "&path=";
        if (polyline.opacity.toLowerCase() === "7f") {
          path += "rgb:" + polyline.color;
        } else {
          path += "rgba:" + polyline.color + polyline.opacity;
        }
        if (!this.isNull(polyline.weight)) {
          path += ",weight:" + polyline.weight;
        }
        path += pathStr;
        url += path;
      }
    }
  }
  
  //markers
  var markerStr = "";
  var markerLatLng;
  var markerSize;
  var markerAlphaNumeric;
  var markerColor;
  var optStr = "";

  for (i = 0; i < this.markers_.length; i++) {
    markerLatLng = this.markers_[i].handle.getLatLng();
    if (!this.markers_[i].handle.isHidden() && bounds.containsLatLng(markerLatLng)) {
    
      markerStr += (markerStr !== "" ? "|":"") + this.floor6decimal(markerLatLng.lat()) + "," + this.floor6decimal(markerLatLng.lng());
      
      optStr = "";
      //{size}
      markerSize = this.markers_[i].handle.ssSize;
      if (!this.isNull(markerSize)) {
        markerSize = markerSize.toLowerCase();
        if (markerSize === "normal" || markerSize === "tiny" || markerSize === "mid" || markerSize === "small") {
          optStr += markerSize;
        }
      }
      
      //{color}
      markerColor = this.markers_[i].handle.ssColor;
      if (!this.isNull(markerColor)) {
        markerColor = markerColor.toLowerCase();
        
        if (markerColor === "black" || markerColor === "brown" || markerColor === "purple" || markerColor === "green" || 
          markerColor === "yellow" || markerColor === "blue" || markerColor === "gray" || markerColor === "orange" || 
          markerColor === "red" || markerColor === "white") {
          optStr += markerColor;
        }
      } else if (!this.isNull(markerSize)) {
        optStr += "red";
      }
      
      //{alphanumeric-character}
      markerAlphaNumeric = this.markers_[i].handle.ssCharacter;
      if (!this.isNull(markerAlphaNumeric) && markerSize !== "small" && markerSize !== "tiny") {
        if (markerAlphaNumeric.match(/^[a-zA-Z0-9]/)) {
          if (optStr === "") {
            optStr = "red";
          }
          optStr += markerAlphaNumeric.substr(0, 1);
        }
      }
      
      if (optStr !== "") {
        markerStr += "," + optStr;
      }
    }
  }
  url += "&markers=" + markerStr;

  this.snapContainerImg.src = url;
  this.imgUrl_ = url;
  
  return url;
};

/**
 * @name setLanguage
 */
SnapShotControl.prototype.setLanguage = function (lang) {
  this.hl_ = lang;
};

/**
 * @name getLanguage
 */
SnapShotControl.prototype.getLanguage = function () {
  return this.hl_;
};
/**
 * @name setFormat
 */
SnapShotControl.prototype.setFormat = function (format) {
  this.imgFormat_ = format;
};

/**
 * @name getFormat
 */
SnapShotControl.prototype.getFormat = function () {
  return this.imgFormat_;
};

/**
 * @name setFrame
 * @param frame : true or false
 */
SnapShotControl.prototype.setFrame = function (frame) {
  this.frame_ = frame;
};

/**
 * @name getFrame
 */
SnapShotControl.prototype.getFrame = function () {
  return this.frame_;
};


/**
 * @name setMapSize
 * @desc set map size of static maps.
 */
SnapShotControl.prototype.setMapSize = function (mapSize) {
  this.size_ = mapSize;
};

/**
 * @name getMapSize
 * @desc return currently map size of static maps.
 */
SnapShotControl.prototype.getMapSize = function () {
  return this.size_;
};

/**
 * @name setMapType
 * @desc set map type of static maps.
 */
SnapShotControl.prototype.setMapType = function (mapType) {
  this.maptype_ = mapType;
};

/**
 * @name getMapType
 * @desc return currently map type of static maps.
 */
SnapShotControl.prototype.getMapType = function () {
  return this.maptype_;
};

/**
 * @name getImageUrl
 * @desc return currently url of static maps.
 */
SnapShotControl.prototype.getImageUrl = function () {
  return this.imgUrl_;
};

/**
 * @private
 * @ignore
 */
SnapShotControl.prototype.floor6decimal = function (value) {
  return (Math.floor(value * 1000000) / 1000000);
};


/**
 * @private
 * @ignore
 */
SnapShotControl.prototype.copy = function () {
  return new SnapShotControl(this.latlng_, this.opt_opts_);
};


/**
 * @private
 * @ignore
 */
SnapShotControl.prototype.getDefaultPosition = function () {
  return new GControlPosition(G_ANCHOR_TOP_LEFT, new GSize(10, 10));
};


/**
 * @private
 * @ignore
 */
SnapShotControl.prototype.selectable = function () {
  return false;
};

/**
 * @private
 * @ignore
 */
SnapShotControl.prototype.printable = function () {
  return true;
};

/**
 * @private
 * @desc      detect null,null string and undefined
 * @param     value
 * @return    true  :  value is nothing
 *            false :  value is not nothing
 */
SnapShotControl.prototype.isNull = function (value) {
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
SnapShotControl.prototype.makeImgDiv_ = function (imgSrc, params) {
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
 */
SnapShotControl.prototype.createDiv_ = function (params) {
  
  var bgDiv = document.createElement("div");
  bgDiv.style.position = "absolute";
  if (!this.isNull(params.bgcolor)) {
    bgDiv.style.backgroundColor = params.bgcolor;
  }
  if (!this.isNull(params.color)) {
    bgDiv.style.backgroundColor = params.color;
  }
  bgDiv.style.fontSize = "1px";
  bgDiv.style.lineHeight = "1px";
  bgDiv.style.overflow = "hidden";
  bgDiv.style.left = params.left + "px";
  bgDiv.style.top = params.top + "px";
  bgDiv.style.width = params.width + "px";
  bgDiv.style.height = params.height + "px";
  return bgDiv;
};

