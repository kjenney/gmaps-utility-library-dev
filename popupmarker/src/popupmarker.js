/*
* PopupMarker Class, v1.0
*
*
*/


/**
 *
 * @constructor
 */
function PopupMarker(latlng, opt_opts_) {
  this.latlng_ = latlng;
  opt_opts_ = opt_opts_ || {};
  
  this.title_ = opt_opts_.title || "";
  if (opt_opts_.title) {
    opt_opts_.title = undefined;
  }
  this.opts_ = opt_opts_;
  
  this.popupStyle_ = opt_opts_.style || "normal";
  
  var agt    = navigator.userAgent.toLowerCase();
  var is_ie_ = ((agt.indexOf("msie") !== -1) && (agt.indexOf("opera") === -1));
  
  //marker popup's matrix
  var yPos = 0;
  this.popupImgSrc_ = "http://maps.google.com/mapfiles/transit/markers/1280.png";
  this.popupTbl = {};
  this.popupTbl.leftTop        = { "left" : 0,    "top" : yPos, "width" : 19, "height" : 7};
  this.popupTbl.leftTopFill    = { "left" : 16,   "top" : 3,    "width" : 4,  "height" : 4};
  this.popupTbl.rightTop       = { "left" : 19,   "top" : yPos, "width" : 10, "height" : 7};
  this.popupTbl.rightTopImg    = { "left" : -125, "top" : 0,    "width" : 10, "height" : 7};
  this.popupTbl.centerTopFill  = { "left" : 19,   "top" : yPos, "width" : 0,  "height" : 7};
  
  yPos += this.popupTbl.leftTop.height;
  this.popupTbl.leftBody       = { "left" : 11, "top" : yPos, "width" : 8,  "height" : 0};
  this.popupTbl.centerBodyFill = { "left" : 19, "top" : yPos, "width" : 40, "height" : 15};
  this.popupTbl.rightBody      = { "left" : 19, "top" : yPos, "width" : 9,  "height" : 0};
  this.popupTbl.leftBottom     = { "left" : 0,  "top" : yPos, "width" : 20, "height" : 21};
  this.popupTbl.leftBottomImg  = { "left" : 0,  "top" : -13,  "width" : 20, "height" : 21};
  this.popupTbl.leftBottomFill = { "left" : 16, "top" : 0,    "width" : 4,  "height" : 6};
  this.popupTbl.rightBottom    = { "left" : 19, "top" : yPos, "width" : 10, "height" : 7};
  this.popupTbl.rightBottomImg = { "left" : -125, "top" : -13, "width": 10, "height" : 7};
  this.popupTbl.centerBottomFill = { "left" : 19, "top" : (yPos + (is_ie_ ? -1 : 0)), "width" : 0, "height" : (6 + (is_ie_ ? 1 : 0)) };
  GMarker.apply(this, arguments);
}

PopupMarker.prototype = new GMarker(new GLatLng(0, 0));

PopupMarker.prototype.initialize = function (map) {
  GMarker.prototype.initialize.apply(this, arguments);
  this.map_ = map;
  
  this.popupImg_ = new Image();
  this.popupImg_.src = "http://maps.google.com/mapfiles/transit/markers/1280.png";
  
  
  //==========================//
  //      make container      //
  //==========================//
  this.container_ = document.createElement("div");
  map.getPane(G_MAP_MARKER_PANE).appendChild(this.container_);
  this.container_.style.zIndex = GOverlay.getZIndex(this.latlng_.lat());
  this.container_.style.position = "absolute";
  this.container_.style.visibility = "hidden";
  
  if (this.popupStyle_ === "chart") {
    this.makeChartPopup();
  } else {
    this.makeNormalPopup();
  }
  
  //======================//
  //        events        //
  //======================//
  var this_ = this;
  GEvent.bindDom(this.container_, "mousedown", this, function () {
    return GEvent.trigger(this_, "mousedown");
  });
  GEvent.bindDom(this.container_, "dragstart", this, function () {
    return GEvent.trigger(this_, "dragstart");
  });
  GEvent.bindDom(this.container_, "mouseup", this, function () {
    return GEvent.trigger(this_, "mouseup");
  });
  GEvent.bindDom(this.container_, "mouseover", this, function () {
    return GEvent.trigger(this_, "mouseover");
  });
  GEvent.bindDom(this.container_, "mouseout", this, function () {
    return GEvent.trigger(this_, "mouseout");
  });
};


PopupMarker.prototype.makeNormalPopup = function () {
  //==========================//
  //     left-top corner      //
  //==========================//
  this.leftTop_ = this.makeImgDiv_(this.popupImgSrc_, this.popupTbl.leftTop);
  this.leftTop_.appendChild(this.fillDiv_(this.popupTbl.leftTopFill));
  this.container_.appendChild(this.leftTop_);
  
  //========================//
  //      left-body         //
  //========================//
  this.leftBody_ = this.fillDiv_(this.popupTbl.leftBody);
  this.leftBody_.style.borderWidth = "0 0 0 1px";
  this.leftBody_.style.borderStyle = "none none none solid";
  this.leftBody_.style.borderColor = "#000000";
  this.container_.appendChild(this.leftBody_);
  
  
  //====================================//
  //   make container left-bottom side  //
  //====================================//
  this.leftBottom_ = this.makeImgDiv_(this.popupImgSrc_, this.popupTbl.leftBottomImg);
  this.leftBottom_.style.left = this.popupTbl.leftBottom.left + "px";
  this.leftBottom_.style.top = this.popupTbl.leftBottom.top + "px";
  this.leftBottom_.style.width = this.popupTbl.leftBottom.width + "px";
  this.leftBottom_.style.height = this.popupTbl.leftBottom.height + "px";
  this.leftBottom_.appendChild(this.fillDiv_(this.popupTbl.leftBottomFill));
  this.container_.appendChild(this.leftBottom_);
  
  //==================================//
  //      body container boddom       //
  //==================================//
  //make text container
  this.bodyContainer_  = document.createElement("div");
  this.bodyContainer_.style.position = "absolute";
  this.bodyContainer_.style.backgroundColor = "#CCCCFF";
  this.bodyContainer_.style.overflow = "hidden";
  this.bodyContainer_.style.left = this.popupTbl.centerBodyFill.left + "px";
  this.bodyContainer_.style.top = this.popupTbl.centerBodyFill.top + "px";
  this.bodyContainer_.style.width = this.popupTbl.centerBodyFill.width + "px";
  this.bodyContainer_.style.height = this.popupTbl.centerBodyFill.height + "px";
  this.container_.appendChild(this.bodyContainer_);
  
  //========================//
  //       right-top        //
  //========================//
  this.rightTop_ = this.makeImgDiv_(this.popupImgSrc_, this.popupTbl.rightTopImg);
  this.rightTop_.style.left = this.popupTbl.rightTop.left + "px";
  this.rightTop_.style.top = this.popupTbl.rightTop.top + "px";
  this.rightTop_.style.width = this.popupTbl.rightTop.width + "px";
  this.rightTop_.style.height = this.popupTbl.rightTop.height + "px";
  this.container_.appendChild(this.rightTop_);

  //==========================//
  //       right-bottom       //
  //==========================//
  this.rightBottom_ = this.makeImgDiv_(this.popupImgSrc_, this.popupTbl.rightBottomImg);
  this.rightBottom_.style.left = this.popupTbl.rightBottom.left + "px";
  this.rightBottom_.style.top = this.popupTbl.rightBottom.top + "px";
  this.rightBottom_.style.width = this.popupTbl.rightBottom.width + "px";
  this.rightBottom_.style.height = this.popupTbl.rightBottom.height + "px";
  this.container_.appendChild(this.rightBottom_);

  
  //=========================//
  //      right-body         //
  //=========================//
  this.rightBody_ = this.fillDiv_(this.popupTbl.rightBody);
  this.rightBody_.style.borderWidth = "0 1px 0 0";
  this.rightBody_.style.borderStyle = "none solid none none";
  this.rightBody_.style.borderColor = "#000000";
  this.container_.appendChild(this.rightBody_);


  //==============================//
  //      body container bottom   //
  //==============================//
  this.centerBottom_ = this.fillDiv_(this.popupTbl.centerBottomFill);
  this.centerBottom_.style.borderWidth = "0 0 1px 0";
  this.centerBottom_.style.borderStyle = "none none solid none";
  this.centerBottom_.style.borderColor = "#000000";
  this.container_.appendChild(this.centerBottom_);
  
  //===========================//
  //      body container top   //
  //===========================//
  this.centerTop_ = this.fillDiv_(this.popupTbl.centerTopFill);
  this.centerTop_.style.borderColor = "#000000";
  this.centerTop_.style.borderWidth = "1px 0 0 0";
  this.centerTop_.style.borderStyle = "solid none none none";
  this.container_.appendChild(this.centerTop_);

};


PopupMarker.prototype.makeChartPopup = function () {
  this.chartImg_ = this.makeImgDiv_("http://www.google.com/mapfiles/transparent.png", {"left" : 0, "top" : 0, "width" : 0, "height" : 0 });
  this.container_.appendChild(this.chartImg_);
};


/**
 * @private
 * @ignore
 */
PopupMarker.prototype.redraw = function (force) {
  GMarker.prototype.redraw.apply(this, arguments);
  
  if (force) {
    this.setTitle(this.title_);
    this.latlng_ = this.getLatLng();
    this.container_.style.zIndex = GOverlay.getZIndex(this.latlng_.lat() + 1);
  }
};

/**
 * @private
 * @ignore
 */
PopupMarker.prototype.copy = function () {
  this.opts_.title = this.title_;
  return new PopupMarker(this.latlng_, this.opts_);
};

/**
 * @name hide
 * @desc hidden marker and popup
 * @param none
 * @return none
 */
PopupMarker.prototype.hide = function () {
  GMarker.prototype.hide.apply(this, arguments);
  this.container_.style.visibility = "hidden";
};

/**
 * @name showPopup
 * @desc show marker's popup
 * @param title : popup's title[opt]
 * @return none
 */
PopupMarker.prototype.showPopup = function (title) {
  if (!this.isNull(title)) {
    this.setTitle(title);
  }
  var info = this.map_.getInfoWindow();
  if (!info.isHidden() || this.isNull(this.title_)) {
    return;
  }
  this.container_.style.visibility = "visible";
};

/**
 * @name hidePopup
 * @desc hidden marker's popup
 * @param none
 * @return none
 */
PopupMarker.prototype.hidePopup = function () {
  this.container_.style.visibility = "hidden";
};


/**
 * @private
 * @ignore
 */
PopupMarker.prototype.remove = function () {
  GEvent.clearInstanceListeners(this.container_);
  while (this.container_.firstChild) {
    this.container_.removeChild(this.container_.firstChild);
  }
  this.container_.parentNode.removeChild(this.container_);
  GMarker.prototype.remove.apply(this, arguments);
  delete arguments.callee;
};



/**
 * @name setTitle
 * @desc set marker's title
 * @param title : new marker's title
 * @return none
 */
PopupMarker.prototype.setTitle = function (title) {
  this.title_ = title;
  
  if (this.popupStyle_ === "chart") {
    this.redrawChartImg_(title);
  } else {
    this.redrawNormalPopup_(title);
  }
};

/**
 * @private
 * @ignore
 */
PopupMarker.prototype.redrawNormalPopup_ = function (title) {
  while (this.bodyContainer_.firstChild) {
    this.bodyContainer_.removeChild(this.bodyContainer_.firstChild);
  }
  this.bodyContainer_.innerHTML = title;
  if (this.isIE_() === false && this.bodyContainer_.hasChildNodes) {
    if (this.bodyContainer_.firstChild.nodeType === 1) {
      this.bodyContainer_.firstChild.style.margin = 0;
    }
  }
  var offsetBorder = this.isIE_() ? 2 : 0;
  var cSize  = this.getHtmlSize_(title);
  var rightX = this.popupTbl.leftTop.width + cSize.width;
  
  this.leftBottom_.style.top = (cSize.height +  this.popupTbl.leftBody.top) + "px";
  this.leftBody_.style.height = cSize.height + "px";
  this.bodyContainer_.style.width = cSize.width + "px";
  this.bodyContainer_.style.height = cSize.height + "px";
  this.bodyContainer_.style.top = this.popupTbl.leftBody.top;
  this.rightTop_.style.left = rightX + "px";
  this.rightBottom_.style.left = this.rightTop_.style.left;
  this.rightBottom_.style.top = this.leftBottom_.style.top;
  this.rightBody_.style.left = rightX + "px";
  this.rightBody_.style.height = this.leftBody_.style.height;
  this.centerBottom_.style.top = this.leftBottom_.style.top;
  this.centerBottom_.style.width = cSize.width + "px";
  this.centerTop_.style.width = cSize.width + "px";
  
  this.size_ = {"width" : (rightX + this.popupTbl.rightTop.width), "height" : (cSize.height + this.popupTbl.leftTop.height + this.popupTbl.leftBottom.height) };
  this.container_.style.width = this.size_.width + "px";
  this.container_.style.height = this.size_.height + "px";
  
  var pxPos = this.map_.fromLatLngToDivPixel(this.latlng_);
  this.container_.style.left =  pxPos.x + "px";
  this.container_.style.top = (pxPos.y - this.size_.height) + "px";
};

/**
 * @private
 * @ignore
 */
PopupMarker.prototype.redrawChartImg_ = function (title) {
  title = title.replace(/^chst\=/i, "");
  var dummyImg = new Image();
  dummyImg.src = "http://www.google.com/chart?chst=" + title;
  
  var this_  = this;
  var is_ie_  = this.isIE_();
  var redraw = function () {
    if (dummyImg.complete === true) {
      this_.size_ = {"width" : dummyImg.width, "height" : dummyImg.height };
      if (is_ie_ === true) {
        this_.chartImg_.firstChild.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='http://www.google.com/chart?chst=" + title + "')";
      } else {
        this_.chartImg_.firstChild.src = "http://www.google.com/chart?chst=" + title;
      }
      this_.chartImg_.firstChild.style.width = this_.size_.width + "px";
      this_.chartImg_.firstChild.style.height = this_.size_.height + "px";
      
      var pxPos = this_.map_.fromLatLngToDivPixel(this_.latlng_);
      this_.container_.style.left =  pxPos.x + "px";
      this_.container_.style.top = (pxPos.y - this_.size_.height) + "px";
      
    } else {
      var own = arguments.callee;
      setTimeout(own, 10);
    }
  };
  
  redraw();
};

/**
 * @name getTitle
 * @desc return marker's current title
 * @param none
 * @return marker's title
 */
PopupMarker.prototype.getTitle = function () {
  return this.title_;
};

/**
 * @private
 * @desc      detect null,null string and undefined
 * @param     value
 * @return    true  :  value is nothing
 *            false :  value is not nothing
 */
PopupMarker.prototype.isNull = function (value) {
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
 * @name getHtmlSize_
 * @desc return size of html elements
 * @param html : html elements
 * @return GSize
 */
PopupMarker.prototype.getHtmlSize_ = function (html) {
  var dummyTextNode = document.createElement("span");
  dummyTextNode.innerHTML = html;
  dummyTextNode.style.display = "inline";
  document.body.appendChild(dummyTextNode);
  
  var elements = dummyTextNode.getElementsByTagName("*");
  var size = {};
  if (elements.length) {
    var maxX = 0;
    var width = 6;  //margin
    var height = 6;  //margin
    for (var i = 0; i < elements.length; i++) {
      elements[i].style.display = "inline";
      width = elements[i].offsetWidth;
      if (maxX < width) {
        maxX = width;
      }
      height += elements[i].offsetHeight;
    }
    size.width = dummyTextNode.offsetWidth;
    size.height = height;
  } else {
    size.width = dummyTextNode.offsetWidth;
    size.height = dummyTextNode.offsetHeight;
  }
  document.body.removeChild(dummyTextNode);
  return size;
};

/**
 * @private
 * @desc      create div element with PNG image
 */
PopupMarker.prototype.makeImgDiv_ = function (imgSrc, params) {
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
  if (this.isIE_() === false) {
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
 * @desc      create div element into fill color with #CCCCFF
 */
PopupMarker.prototype.fillDiv_ = function (params) {
  
  var bgDiv = document.createElement("div");
  bgDiv.style.position = "absolute";
  bgDiv.style.backgroundColor = "#CCCCFF";
  bgDiv.style.fontSize = "1px";
  bgDiv.style.lineHeight = "1px";
  bgDiv.style.overflow = "hidden";
  bgDiv.style.left = params.left + "px";
  bgDiv.style.top = params.top + "px";
  bgDiv.style.width = params.width + "px";
  bgDiv.style.height = params.height + "px";
  return bgDiv;
};

/**
 * @private
 * @desc      detect IE
 * @param     none
 * @return    true  :  blowser is Interner Explorer
 *            false :  blowser is not Interner Explorer
 */
PopupMarker.prototype.isIE_ = function () {
  return (navigator.userAgent.toLowerCase().indexOf('msie') !== -1) ? true : false;
};
