/**
 * @name PopupMarker
 * @version 1.0
 * @author Masashi Katsumata
 * @fileoverview This library gives the popup next to with a marker.
 * It has two method.
 * One is simple popup. The popup can show texts, images and HTML,
 * but it can not change background-color.
 * Another popup is using output of the Google Chart API.
 * It can show texts and changees the background-color by some
 * options. But it NOT support a lot of change.
 * (e.g. change texts when on dragging event)
 * You can select it by set the "style" option when creating new the PopupMarker.
 *
 * ref. <a href="http://groups.google.com/group/google-chart-api/web/chart-types-for-information-bubbles">
 *      The Google Chart API - Chart types for information bubbles
 *      </a>
 */

/**
 * @name PopupMarkerOptions
 * @class This class represents optional arguments to {@link PopupMarker} and <code>GMarker</code>.
 *     Each of the functions use a subset of these arguments. See the function descriptions
 *     for the list of supported options.
 *     It has no constructor, but is instantiated as an object literal.
 * @property {String} [style = "normal"] Specifies style for popup, chooses from "normal" or "chart".
 *     If it set "chart", then this library shows the popup using output of the Google Chart API.
 * @property {String} [text = ""] Specifies text for popup. If the style property set "chart",
 *     then it follow format for text property of the Google Chart API.
 * @property {PopupMarkerChartAPIOptions} [chart = {} ] This property specifies the options to configure
 *     the Google Chart API. These options are passed to the PopupMarkerOptions object literal
 *     when the marker is constructed, and are used to construct the PopupMarker
 *     when PopupMarker.showPopup() is called.
 *     If the style property not set "chart", then this property is ignored.
 */

/**
 * @name PopupMarkerChartAPIOptions
 * @class This call represents options passed within the PopupMarkerChartAPIOptions to
 *     the PopupMarkerOptions object. It has no constructor, but is instantiated as an object literal.
 * @property {String} [chartStyle = ""] Specifies style for the Google Chart API,
 *     chooses from "d_bubble_icon_text_small", "d_bubble_icon_text_big",
 *     "d_bubble_icon_texts_big" or "d_bubble_texts_big".
 * @property {String} [icon = ""] Specifies, icon's name of the Google Chart API.
 * @property {String} [shapeStyle = "bb" ] Specifies shape style for the Google Chart API.
 *     This may, in the future, allow you to use different shapes for the bubble.
 *     For now, "bb" is the only valid option.
 * @property {String} [textColor = "000000" ] Specifies text color, as a 6-digit hexadecimal number,
 *     for example 000000 for black, FF0000 for red, FFFFFF for white, or FFFF00 for yellow. 
 * @property {String} [bgColor = "FFFFFF" ] Specifies background color, also as a 6-digit hexadecimal number. 
 */

/**
 * @desc Creates a marker with options specified in {@link PopupMarkerOptions}
 *      (extension of <code>GMarkerOptions</code>). Creates a popup and then
 *       calls the <code>GMarker</code> constructor.
 * @param {GLatLng} latlng Initial marker position
 * @param {PopupMarkerOptions} [opts] Named optional arguments.
 * @constructor
 */    
function PopupMarker(latlng, opts) {
  this.latlng_ = latlng;
  opts = opts || {};
  
  this.text_ = opts.text || "";
  if (opts.text) {
    opts.text = undefined;
  }
  this.opts_ = opts;
  
  this.popupStyle_ = opts.style || "normal";
  this.chart_ = opts.chart || {};
  
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

/**
 * @private
 */
PopupMarker.prototype = new GMarker(new GLatLng(0, 0));

/**
 * @desc Initialize the marker
 * @private
 */
PopupMarker.prototype.initialize = function (map) {
  GMarker.prototype.initialize.apply(this, arguments);
  this.map_ = map;

  //==========================//
  //      make container      //
  //==========================//
  this.container_ = document.createElement("div");
  map.getPane(G_MAP_MARKER_PANE).appendChild(this.container_);
  this.container_.style.zIndex = GOverlay.getZIndex(this.latlng_.lat());
  this.container_.style.position = "absolute";
  this.container_.style.visibility = "hidden";
  
  if (this.popupStyle_ === "chart") {
    this.makeChartPopup_();
  } else {
    this.makeNormalPopup_();
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

/**
 * @desc Create normal popup
 * @private
 */
PopupMarker.prototype.makeNormalPopup_ = function () {
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

/**
 * @desc Create popup container for the Chart API
 * @private
 */
PopupMarker.prototype.makeChartPopup_ = function () {
  this.chartImg_ = this.makeImgDiv_("http://www.google.com/mapfiles/transparent.png", {"left" : 0, "top" : 0, "width" : 0, "height" : 0 });
  this.chartImg_.firstChild.style.MozUserSelect = "none";
  this.chartImg_.firstChild.style.KhtmlUserSelect = "none";
  this.chartImg_.firstChild.style.WebkitUserSelect = "none";
  this.chartImg_.firstChild.style.userSelect = "none";
  this.container_.appendChild(this.chartImg_);
};


/**
 * @ignore
 */
PopupMarker.prototype.redraw = function (force) {
  GMarker.prototype.redraw.apply(this, arguments);
  
  if (force) {
    this.showPopup();
    this.latlng_ = this.getLatLng();
    this.container_.style.zIndex = GOverlay.getZIndex(this.latlng_.lat());
  }
};

/**
 * @ignore
 */
PopupMarker.prototype.copy = function () {
  this.opts_.text = this.text_;
  return new PopupMarker(this.latlng_, this.opts_);
};

/**
 * @desc Hides the marker and popup
 */
PopupMarker.prototype.hide = function () {
  GMarker.prototype.hide.apply(this, arguments);
  this.container_.style.visibility = "hidden";
};


/**
 * @desc Shows marker.
 *    Note that this method shows only the marker.
 *    If you want show marker and the popup,
 *    then use the showPopup method.
 */
PopupMarker.prototype.show = function () {
  GMarker.prototype.show.apply(this, arguments);
};

/**
 * @desc Shows the marker and the popup.
 */
PopupMarker.prototype.showPopup = function () {
  
  this.show();
  
  if (this.popupStyle_ === "chart") {
    this.redrawChartImg_(this.text_);
  } else {
    this.redrawNormalPopup_(this.text_);
  }
  
  var info = this.map_.getInfoWindow();
  if (!info.isHidden() || this.isNull(this.text_)) {
    return;
  }
  this.container_.style.visibility = "visible";
};

/**
 * @desc Hides the popup
 */
PopupMarker.prototype.hidePopup = function () {
  this.container_.style.visibility = "hidden";
};


/**
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
 * @desc Set the text of the popup message.
 * @param {Strings} message
 */
PopupMarker.prototype.setText = function (text) {
  this.text_ = text;
};

/**
 * @desc Redraws the normal popup.
 * @private
 * @ignore
 */
PopupMarker.prototype.redrawNormalPopup_ = function (text) {
  
  if (this.beforeNormalPopupText_ !== text) {
    while (this.bodyContainer_.firstChild) {
      this.bodyContainer_.removeChild(this.bodyContainer_.firstChild);
    }
    this.bodyContainer_.innerHTML = text;
    if (this.isIE_() === false && this.bodyContainer_.hasChildNodes) {
      if (this.bodyContainer_.firstChild.nodeType === 1) {
        this.bodyContainer_.firstChild.style.margin = 0;
      }
    }
    var offsetBorder = this.isIE_() ? 2 : 0;
    var cSize  = this.getHtmlSize_(text);
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
  }
  
  var pxPos = this.map_.fromLatLngToDivPixel(this.latlng_);
  this.container_.style.left =  pxPos.x + "px";
  this.container_.style.top = (pxPos.y - this.size_.height) + "px";
  
  this.beforeNormalPopupText_ = text;
};

/**
 * @desc Set chart style for the Google Chart API.
 *       If the style property not set "chart", then this property is ignored.
 * @param {String} styleName
 */
PopupMarker.prototype.setChartStyle = function (styleName) {
  this.chart_.chartStyle = styleName;
};

/**
 * @desc Set icon's name of the Google Chart API.
 *       If the style property not set "chart", then this property is ignored.
 * @param {String} iconName
 */
PopupMarker.prototype.setChartIcon = function (iconName) {
  this.chart_.icon = iconName;
};

/**
 * @desc Set text color, also as a 6-digit hexadecimal number. 
 *       If the style property not set "chart", then this property is ignored.
 * @param {String} textColor
 */
PopupMarker.prototype.setChartTextColor = function (textColor) {
  this.chart_.textColor = textColor;
};

/**
 * @desc Set background color, also as a 6-digit hexadecimal number. 
 *       If the style property not set "chart", then this property is ignored.
 * @param {String} bgColor
 */
PopupMarker.prototype.setChartBgColor = function (bgColor) {
  this.chart_.bgColor = bgColor;
};

/**
 * @desc Set shape style for the Google Chart API.
 *     This may, in the future, allow you to use different shapes for the bubble.
 *     For now, "bb" is the only valid option.
 * @param {String} colorValue
 */
PopupMarker.prototype.setShapeStyle = function (style) {
  this.chart_.shapeStyle = "bb";
};

/**
 * @desc Redraws and re-requests output of the Google Chart API.
 * @private
 * @ignore
 */
PopupMarker.prototype.redrawChartImg_ = function (text) {

  if (!this.isNull(this.chart_.shapeStyle)) {
    this.chart_.shapeStyle = "bb";
  }
  this.chart_.textColor = this.chart_.textColor || "000000";
  this.chart_.bgColor = this.chart_.bgColor || "FFFFFF";
  
  this.chart_.textColor = this.chart_.textColor.replace("#", "");
  this.chart_.bgColor = this.chart_.bgColor.replace("#", "");
  
  var params = "chst=" + this.chart_.chartStyle;
  switch (this.chart_.chartStyle) {
  case "d_bubble_icon_text_small":
  case "d_bubble_icon_text_big":
    params = params + "&chld=" + this.chart_.icon + "|" + this.chart_.shapeStyle + "|" + text + "|" + this.chart_.bgColor + "|" + this.chart_.textColor;
    break;
    
  case "d_bubble_icon_texts_big":
    text = text.replace(/[\r]/, "");
    text = text.replace(/[\n]/, "|");
    params = params + "&chld=" + this.chart_.icon + "|" + this.chart_.shapeStyle + "|" + this.chart_.bgColor + "|" + this.chart_.textColor + "|" + text;
    break;
    
  case "d_bubble_texts_big":
    text = text.replace(/[\r]/, "");
    text = text.replace(/[\n]/, "|");
    params = params + "&chld=" + this.chart_.shapeStyle + "|" + this.chart_.bgColor + "|" + this.chart_.textColor + "|" + text;
    break;
    
  }
  
  var pxPos = this.map_.fromLatLngToDivPixel(this.latlng_);
  
  if (this.beforeParams === params) {
    //re-calcurate popup's position
    var imgHeight = parseInt(this.chartImg_.firstChild.offsetHeight, 10);  //for IE
    this.container_.style.left =  pxPos.x + "px";
    this.container_.style.top = (pxPos.y - imgHeight) + "px";
    
    return;
  }
  var dummyImg = new Image();
  dummyImg.src = "http://chart.apis.google.com/chart?" + params;
  
  var this_  = this;
  var is_ie_  = this.isIE_();
  var limitCnt = 100;
  var redraw = function () {
    limitCnt--;
    if (limitCnt === 0) {
      return;
    }
    if (dummyImg.complete === true) {
      this_.size_ = {"width" : dummyImg.width, "height" : dummyImg.height };
      if (is_ie_ === true) {
        this_.chartImg_.firstChild.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='http://chart.apis.google.com/chart?" + params + "')";
      } else {
        this_.chartImg_.removeChild(this_.chartImg_.firstChild);
        this_.chartImg_.appendChild(dummyImg);
      }
      this_.chartImg_.firstChild.style.width = this_.size_.width + "px";
      this_.chartImg_.firstChild.style.height = this_.size_.height + "px";
      
      this_.container_.style.left =  pxPos.x + "px";
      this_.container_.style.top = (pxPos.y - this_.size_.height) + "px";
      this_.container_.style.width = this_.size_.width + "px";
      this_.container_.style.height = this_.size_.height + "px";
    } else {
      var own = arguments.callee;
      setTimeout(own, 10);
    }
  };
  
  this.beforeParams = params;
  
  redraw();
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
 * @desc return size of html elements
 * @param html : html elements
 * @return GSize
 */
PopupMarker.prototype.getHtmlSize_ = function (html) {
  
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
