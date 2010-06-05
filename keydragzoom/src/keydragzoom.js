/**
 * @name KeyDragZoom
 * @version 1.1
 * @author: Nianwei Liu [nianwei at gmail dot com] & Gary Little [gary at luxcentral dot com]
 * @fileoverview This library adds a drag zoom capability to a V2 Google map.
 *  When drag zoom is enabled, holding down a designated hot key <code>(shift | ctrl | alt)</code>
 *  while dragging a box around an area of interest will zoom the map in to that area when
 *  the mouse button is released. Optionally, a visual control can also be supplied for turning
 *  a drag zoom operation on and off.
 *  Only one line of code is needed: <code>GMap2.enableKeyDragZoom();</code>
 *  <p>
 *  Note that if the map's container has a border around it, the border widths must be specified
 *  in pixel units (or as thin, medium, or thick). This is required because of an MSIE limitation.
 */
/*!
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function () {
  /*jslint browser:true */
  /*global GMap2,GEvent,GLatLng,GLatLngBounds,GPoint,GControl,GControlPosition,GSize,G_ANCHOR_TOP_LEFT */
  /* Utility functions use "var funName=function()" syntax to allow use of the */
  /* Dean Edwards Packer compression tool (with Shrink variables, without Base62 encode). */

  /**
   * Converts 'thin', 'medium', and 'thick' to pixel widths
   * in an MSIE environment. Not called for other browsers
   * because getComputedStyle() returns pixel widths automatically.
   * @param {String} widthValue
   */
  var toPixels = function (widthValue) {
    var px;
    switch (widthValue) {
    case 'thin':
      px = "2px";
      break;
    case 'medium':
      px = "4px";
      break;
    case 'thick':
      px = "6px";
      break;
    default:
      px = widthValue;
    }
    return px;
  };
 /**
  * Get the widths of the borders of an HTML element.
  *
  * @param {Object} h  HTML element
  * @return {Object} widths object (top, bottom left, right)
  */
  var getBorderWidths = function (h) {
    var computedStyle;
    var bw = {};
    if (document.defaultView && document.defaultView.getComputedStyle) {
      computedStyle = h.ownerDocument.defaultView.getComputedStyle(h, "");
      if (computedStyle) {
        // The computed styles are always in pixel units (good!)
        bw.top = parseInt(computedStyle.borderTopWidth, 10) || 0;
        bw.bottom = parseInt(computedStyle.borderBottomWidth, 10) || 0;
        bw.left = parseInt(computedStyle.borderLeftWidth, 10) || 0;
        bw.right = parseInt(computedStyle.borderRightWidth, 10) || 0;
        return bw;
      }
    } else if (document.documentElement.currentStyle) { // MSIE
      if (h.currentStyle) {
        // The current styles may not be in pixel units so try to convert (bad!)
        bw.top = parseInt(toPixels(h.currentStyle.borderTopWidth), 10) || 0;
        bw.bottom = parseInt(toPixels(h.currentStyle.borderBottomWidth), 10) || 0;
        bw.left = parseInt(toPixels(h.currentStyle.borderLeftWidth), 10) || 0;
        bw.right = parseInt(toPixels(h.currentStyle.borderRightWidth), 10) || 0;
        return bw;
      }
    }
    // Shouldn't get this far for any modern browser
    bw.top = parseInt(h.style["border-top-width"], 10) || 0;
    bw.bottom = parseInt(h.style["border-bottom-width"], 10) || 0;
    bw.left = parseInt(h.style["border-left-width"], 10) || 0;
    bw.right = parseInt(h.style["border-right-width"], 10) || 0;
    return bw;
  };
  /**
   * Get the position of the mouse relative to the document.
   * @param {Object} e  Mouse event
   * @return {Object} left & top position
   */
  var getMousePosition = function (e) {
    var posX = 0, posY = 0;
    e = e || window.event;
    if (typeof e.pageX !== "undefined") {
      posX = e.pageX;
      posY = e.pageY;
    } else if (typeof e.clientX !== "undefined") {
      posX = e.clientX +
      (typeof document.documentElement.scrollLeft !== "undefined" ? document.documentElement.scrollLeft : document.body.scrollLeft);
      posY = e.clientY +
      (typeof document.documentElement.scrollTop !== "undefined" ? document.documentElement.scrollTop : document.body.scrollTop);
    }
    return {
      left: posX,
      top: posY
    };
  };
  /**
   * Get the position of an HTML element relative to the document.
   * @param {Object} h  HTML element
   * @return {Object} left & top position
   */
  var getElementPosition = function (h) {
    var posX = h.offsetLeft;
    var posY = h.offsetTop;
    var parent = h.offsetParent;
    // Add offsets for all ancestors in the hierarchy
    while (parent !== null) {
      // Adjust for scrolling elements which may affect the map position.
      //
      // See http://www.howtocreate.co.uk/tutorials/javascript/browserspecific
      //
      // "...make sure that every element [on a Web page] with an overflow
      // of anything other than visible also has a position style set to
      // something other than the default static..."
      if (parent !== document.body && parent !== document.documentElement) {
        posX -= parent.scrollLeft;
        posY -= parent.scrollTop;
      }
      posX += parent.offsetLeft;
      posY += parent.offsetTop;
      parent = parent.offsetParent;
    }
    return {
      left: posX,
      top: posY
    };
  };
  /**
   * Set the properties of an object to those from another object.
   * @param {Object} obj target object
   * @param {Object} vals source object
   */
  var setVals = function (obj, vals) {
    if (obj && vals) {
      for (var x in vals) {
        if (vals.hasOwnProperty(x)) {
          obj[x] = vals[x];
        }
      }
    }
    return obj;
  };
  /**
   * Set the opacity. If op is not passed in, this function just performs an MSIE fix.
   * @param {Node} div
   * @param {Number} op (0-1)
   */
  var setOpacity = function (div, op) {
    if (typeof op !== 'undefined') {
      div.style.opacity = op;
    }
    if (typeof div.style.opacity !== 'undefined') {
      div.style.filter = "alpha(opacity=" + (div.style.opacity * 100) + ")";
    }
  };
  /**
   * @name KeyDragZoomOptions
   * @class This class represents the optional parameter passed into <code>GMap2.enableKeyDragZoom</code>.
   * @property {String} [key] The hot key to hold down to activate a drag zoom, <code>shift | ctrl | alt</code>.
   *  The default is <code>shift</code>.
   * @property {Object} [boxStyle] The css style of the zoom box.
   *  The default is <code>{border: '2px solid #FF0000'}</code>.
   * Border widths must be specified in pixel units (or as thin, medium, or thick).
   * @property {Object} [veilStyle] The css style of the veil pane which covers the map when
   *  a drag zoom is activated. The previous name for this property was <code>paneStyle</code>
   *  but the use of this name is now deprecated.
   *  The default is <code>{backgroundColor: 'white', opacity: 0.0, cursor: 'crosshair'}</code>.
   * @property {Boolean} [visualEnabled] A flag indicating whether a visual control is to be used.
   *  The default is <code>false</code>.
   * @property {GControlPosition} [visualPosition] The position of the visual control.
   *  The default position is (27,285) relative to the top left corner of the map.
   * @property {String} [imageOn] The URL of the picture to show when drag zoom is on.
   * @property {String} [imageOff] The URL of the picture to show when drag zoom is off.
   * @property {String} [imageHot] The URL of the picture to show when the mouse is over the drag zoom control.
   */
  /**
   * @name DragZoom
   * @class This class represents a drag zoom object for a map. The object is activated by holding down the hot key
   * or by turning on the visual control.
   * This object is created when <code>GMap2.enableKeyDragZoom</code> is called; it cannot be created directly.
   * Use <code>GMap2.getDragZoomObject</code> to gain access to this object in order to attach event listeners.
   * @param {GMap2} map
   * @param {KeyDragZoomOptions} opt_zoomOpts
   */
  function DragZoom(map, opt_zoomOpts) {
    var i;
    this.map_ = map;
    opt_zoomOpts = opt_zoomOpts || {};
    this.key_ = opt_zoomOpts.key || 'shift';
    this.key_ = this.key_.toLowerCase();
    this.borderWidths_ = getBorderWidths(this.map_.getContainer());

    this.veilDiv_ = [];
    for (i = 0; i < 4; i++) {
      this.veilDiv_[i] = document.createElement("div");
      this.veilDiv_[i].onselectstart = function () {
        return false;
      };
      // default style
      setVals(this.veilDiv_[i].style, {
        backgroundColor: 'white',
        opacity: 0.0,
        cursor: 'crosshair'
      });
      // allow overwrite
      setVals(this.veilDiv_[i].style, opt_zoomOpts.paneStyle); // Old option name was "paneStyle"
      setVals(this.veilDiv_[i].style, opt_zoomOpts.veilStyle); // New name is "veilStyle"
      // stuff that cannot be overwritten
      setVals(this.veilDiv_[i].style, {
        position: 'absolute',
        overflow: 'hidden',
        zIndex: 101,
        display: 'none'
      });
      if (this.key_ === 'shift') { // Workaround for Firefox Shift-Click problem
        this.veilDiv_[i].style.MozUserSelect = "none";
      }
      setOpacity(this.veilDiv_[i]);
      // An IE fix: if the background is transparent, it cannot capture mousedown events
      if (this.veilDiv_[i].style.backgroundColor === 'transparent') {
        this.veilDiv_[i].style.backgroundColor = 'white';
        setOpacity(this.veilDiv_[i], 0);
      }
      this.map_.getContainer().appendChild(this.veilDiv_[i]);
    }

    this.visualEnabled_ = opt_zoomOpts.visualEnabled || false;
    this.visualPosition_ = opt_zoomOpts.visualPosition || this.getDefaultPosition();
    this.imageOn_ = opt_zoomOpts.imageOn;
    this.imageOff_ = opt_zoomOpts.imageOff;
    this.imageHot_ = opt_zoomOpts.imageHot;

    this.boxDiv_ = document.createElement('div');
    setVals(this.boxDiv_.style, {
      border: '2px solid #FF0000'
    });
    setVals(this.boxDiv_.style, opt_zoomOpts.boxStyle);
    setVals(this.boxDiv_.style, {
      position: 'absolute',
      display: 'none'
    });
    setOpacity(this.boxDiv_);
    this.map_.getContainer().appendChild(this.boxDiv_);
    this.boxBorderWidths_ = getBorderWidths(this.boxDiv_);

    this.keyDownListener_ = GEvent.bindDom(document, 'keydown',  this, this.onKeyDown_);
    this.keyUpListener_ = GEvent.bindDom(document, 'keyup', this, this.onKeyUp_);
    this.mouseDownListener_ = GEvent.bindDom(this.veilDiv_[0], 'mousedown', this, this.onMouseDown_);
    this.mouseDownListenerDocument_ = GEvent.bindDom(document, 'mousedown', this, this.onMouseDownDocument_);
    this.mouseMoveListener_ = GEvent.bindDom(document, 'mousemove', this, this.onMouseMove_);
    this.mouseUpListener_ = GEvent.bindDom(document, 'mouseup', this, this.onMouseUp_);

    this.hotKeyDown_ = false;
    this.dragging_ = false;
    this.startPt_ = null;
    this.endPt_ = null;
    this.boxMaxX_ = null;
    this.boxMaxY_ = null;
    this.mousePosn_ = null;
    this.mapPosn_ = null;
    this.mouseDown_ = false;

    if (this.visualEnabled_) {
      map.addControl(this, this.visualPosition_);
    }
  }
  /**
   * DragZoom is a subclass of <code>GControl</code>.
   */
  DragZoom.prototype = new GControl();
  /**
   * Returns the default position for the visual control.
   * @return {GControlPosition} The default position.
   * @private
   */
  DragZoom.prototype.getDefaultPosition = function () {
    return new GControlPosition(G_ANCHOR_TOP_LEFT, new GSize(27, 285));
  };
  /**
   * Initializes the visual control and returns its DOM element.
   * @param {GMap2} map The map to which the control is to be added.
   * @return {Node} The DOM element containing the visual control.
   * @private
   */
  DragZoom.prototype.initialize = function (map) {
    var me = this;
    this.buttonImg_ = document.createElement("img");
    this.buttonImg_.src = this.imageOff_;
    this.buttonImg_.onclick = function () {
      if (!me.isHotKeyDown_()) {
        me.hotKeyDown_ = !me.hotKeyDown_;
        if (me.hotKeyDown_) {
          me.buttonImg_.src = me.imageOn_;
          GEvent.trigger(me, 'activate');
        } else {
          me.buttonImg_.src = me.imageOff_;
          GEvent.trigger(me, 'deactivate');
        }
      }
    };
    this.buttonImg_.onmouseover = function () {
      me.buttonImg_.src = me.imageHot_;
    };
    this.buttonImg_.onmouseout = function () {
      if (me.hotKeyDown_) {
        me.buttonImg_.src = me.imageOn_;
      } else {
        me.buttonImg_.src = me.imageOff_;
      }
    };
    setVals(this.buttonImg_.style, {
      zIndex: 102,
      cursor: 'pointer'
    });
    map.getContainer().appendChild(this.buttonImg_);
    return this.buttonImg_;
  };
  /**
   * Returns <code>true</code> if the hot key is being pressed when an event occurs.
   * @param {Event} e
   * @return {Boolean}
   */
  DragZoom.prototype.isHotKeyDown_ = function (e) {
    var isHot;
    e = e || window.event;
    isHot = (e.shiftKey && this.key_ === 'shift') || (e.altKey && this.key_ === 'alt') || (e.ctrlKey && this.key_ === 'ctrl');
    if (!isHot) {
      // Need to look at keyCode for Opera because it
      // doesn't set the shiftKey, altKey, ctrlKey properties
      // unless a non-modifier event is being reported.
      //
      // See http://cross-browser.com/x/examples/shift_mode.php
      // Also see http://unixpapa.com/js/key.html
      switch (e.keyCode) {
      case 16:
        if (this.key_ === 'shift') {
          isHot = true;
        }
        break;
      case 17:
        if (this.key_ === 'ctrl') {
          isHot = true;
        }
        break;
      case 18:
        if (this.key_ === 'alt') {
          isHot = true;
        }
        break;
      }
    }
    return isHot;
  };
  /**
   * Checks if the mouse is on top of the map. The position is captured
   * in onMouseMove_.
   * @return true if mouse is on top of the map div.
   */
  DragZoom.prototype.isMouseOnMap_ = function () {
    var mousePos = this.mousePosn_;
    if (mousePos) {
      var mapPos = this.mapPosn_;
      var size = this.map_.getSize();
      return mousePos.left > mapPos.left && mousePos.left < mapPos.left + size.width &&
      mousePos.top > mapPos.top && mousePos.top < mapPos.top + size.height;
    } else {
      // if user never moved mouse
      return false;
    }
  };
  /**
   * Show the veil if the hot key is down and the mouse is over the map,
   * otherwise hide the veil.
   */
  DragZoom.prototype.setVeilVisibility_ = function () {
    var i;
    if (this.map_ && this.hotKeyDown_ && this.isMouseOnMap_()) {
      var size = this.map_.getSize();
      this.veilDiv_[0].style.left = 0 + 'px';
      this.veilDiv_[0].style.top = 0 + 'px';
      this.veilDiv_[0].style.width = size.width - (this.borderWidths_.left + this.borderWidths_.right) + 'px';
      this.veilDiv_[0].style.height = size.height - (this.borderWidths_.top + this.borderWidths_.bottom) + 'px';
      for (i = 1; i < this.veilDiv_.length; i++) {
        this.veilDiv_[i].style.width = 0 + 'px';
        this.veilDiv_[i].style.height = 0 + 'px';
      }
      for (i = 0; i < this.veilDiv_.length; i++) {
        this.veilDiv_[i].style.display = 'block';
      }
      this.boxMaxX_ = parseInt(this.veilDiv_[0].style.width, 10) - (this.boxBorderWidths_.left + this.boxBorderWidths_.right);
      this.boxMaxY_ = parseInt(this.veilDiv_[0].style.height, 10) - (this.boxBorderWidths_.top + this.boxBorderWidths_.bottom);
    } else {
      for (i = 0; i < this.veilDiv_.length; i++) {
        this.veilDiv_[i].style.display = 'none';
      }
    }
  };
  /**
   * Handle key down. Show the veil if the hot key has been pressed.
   * @param {Event} e
   */
  DragZoom.prototype.onKeyDown_ = function (e) {
    if (this.map_ && !this.hotKeyDown_ && this.isHotKeyDown_(e)) {
      this.mapPosn_ = getElementPosition(this.map_.getContainer());
      this.hotKeyDown_ = true;
      this.setVeilVisibility_();
     /**
       * This event is fired when the hot key is pressed.
       * @name DragZoom#activate
       * @event
       */
      GEvent.trigger(this, 'activate');
    }
    if (this.visualEnabled_) {
      if (this.hotKeyDown_ && this.buttonImg_.src !== this.imageOn_) {
        this.buttonImg_.src = this.imageOn_;
      }
    }
  };
  /**
   * Get the <code>GPoint</code> of the mouse position.
   * @param {Object} e
   * @return {GPoint} point
   */
  DragZoom.prototype.getMousePoint_ = function (e) {
    var mousePosn = getMousePosition(e);
    var p = new GPoint();
    p.x = mousePosn.left - this.mapPosn_.left - this.borderWidths_.left;
    p.y = mousePosn.top - this.mapPosn_.top - this.borderWidths_.top;
    p.x = Math.min(p.x, this.boxMaxX_);
    p.y = Math.min(p.y, this.boxMaxY_);
    p.x = Math.max(p.x, 0);
    p.y = Math.max(p.y, 0);
    return p;
  };
  /**
   * Handle mouse down.
   * @param {Event} e
   */
  DragZoom.prototype.onMouseDown_ = function (e) {
    if (this.map_ && this.hotKeyDown_) {
      this.mapPosn_ = getElementPosition(this.map_.getContainer());
      this.dragging_ = true;
      this.startPt_ = this.endPt_ = this.getMousePoint_(e);
      var latlng = this.map_.fromContainerPixelToLatLng(this.startPt_);
      /**
       * This event is fired when the drag operation begins.
       * The parameter passed is the geographic position of the starting point.
       * @name DragZoom#dragstart
       * @param {GLatLng} startLatLng
       * @event
       */
      GEvent.trigger(this, 'dragstart', latlng);
    }
  };
  /**
   * Handle mouse down at the document level.
   * @param {Event} e
   */
  DragZoom.prototype.onMouseDownDocument_ = function (e) {
    this.mouseDown_ = true;
  };
  /**
   * Handle mouse move.
   * @param {Event} e
   */
  DragZoom.prototype.onMouseMove_ = function (e) {
    this.mousePosn_ = getMousePosition(e);
    if (this.dragging_) {
      this.endPt_ = this.getMousePoint_(e);
      var left = Math.min(this.startPt_.x, this.endPt_.x);
      var top = Math.min(this.startPt_.y, this.endPt_.y);
      var width = Math.abs(this.startPt_.x - this.endPt_.x);
      var height = Math.abs(this.startPt_.y - this.endPt_.y);
      this.veilDiv_[0].style.top = "0px";
      this.veilDiv_[0].style.left = "0px";
      this.veilDiv_[0].style.width = left + "px";
      this.veilDiv_[0].style.height = (this.map_.getSize().height - (this.borderWidths_.top + this.borderWidths_.bottom)) + "px";
      this.veilDiv_[1].style.top = "0px";
      this.veilDiv_[1].style.left = (left + width + this.boxBorderWidths_.left + this.boxBorderWidths_.right) + "px";
      this.veilDiv_[1].style.width = (this.map_.getSize().width - (left + width) - (this.borderWidths_.left + this.borderWidths_.right) - (this.boxBorderWidths_.left + this.boxBorderWidths_.right)) + "px";
      this.veilDiv_[1].style.height = (this.map_.getSize().height - (this.borderWidths_.top + this.borderWidths_.bottom)) + "px";
      this.veilDiv_[2].style.top = "0px";
      this.veilDiv_[2].style.left = left + "px";
      this.veilDiv_[2].style.width = (width + this.boxBorderWidths_.left + this.boxBorderWidths_.right) + "px";
      this.veilDiv_[2].style.height = top + "px";
      this.veilDiv_[3].style.top = (top + height + this.boxBorderWidths_.top + this.boxBorderWidths_.bottom) + "px";
      this.veilDiv_[3].style.left = left + "px";
      this.veilDiv_[3].style.width = (width + this.boxBorderWidths_.left + this.boxBorderWidths_.right) + "px";
      this.veilDiv_[3].style.height = (this.map_.getSize().height - (this.borderWidths_.top + this.borderWidths_.bottom)- (this.boxBorderWidths_.top + this.boxBorderWidths_.bottom) - (top + height)) + "px";
      this.boxDiv_.style.left = left + 'px';
      this.boxDiv_.style.top = top + 'px';
      this.boxDiv_.style.width = width + 'px';
      this.boxDiv_.style.height = height + 'px';
      this.boxDiv_.style.display = 'block';
      /**
       * This event is repeatedly fired while the user drags a box across the area of interest.
       * The southwest and northeast point are passed as parameters of type <code>GPoint</code>
       * (for performance reasons), relative to the map container. Note: the event listener is 
       * responsible for converting pixel position to geographic coordinates, if necessary, using
       * <code>GMap2.fromContainerPixelToLatLng</code>.
       * @name DragZoom#drag
       * @param {GPoint} southwestPixel
       * @param {GPoint} northeastPixel
       * @event
       */
      GEvent.trigger(this, 'drag', new GPoint(left, top + height), new GPoint(left + width, top));
    } else if (!this.mouseDown_) {
      this.mapPosn_ = getElementPosition(this.map_.getContainer());
      this.setVeilVisibility_();
    }
  };
  /**
   * Handle mouse up.
   * @param {Event} e
   */
  DragZoom.prototype.onMouseUp_ = function (e) {
    var me = this;
    this.mouseDown_ = false;
    if (this.dragging_) {
      var left = Math.min(this.startPt_.x, this.endPt_.x);
      var top = Math.min(this.startPt_.y, this.endPt_.y);
      var width = Math.abs(this.startPt_.x - this.endPt_.x);
      var height = Math.abs(this.startPt_.y - this.endPt_.y);
      var sw = this.map_.fromContainerPixelToLatLng(new GPoint(left, top + height));
      var ne = this.map_.fromContainerPixelToLatLng(new GPoint(left + width, top));
      var bnds = new GLatLngBounds(sw, ne);
      var level = this.map_.getBoundsZoomLevel(bnds);
      this.map_.setCenter(bnds.getCenter(), level);
      // Redraw box after zoom:
      var swPt = this.map_.fromLatLngToContainerPixel(sw);
      var nePt = this.map_.fromLatLngToContainerPixel(ne);
      this.boxDiv_.style.left = swPt.x + 'px';
      this.boxDiv_.style.top = nePt.y + 'px';
      this.boxDiv_.style.width = Math.abs(nePt.x - swPt.x) + 'px';
      this.boxDiv_.style.height = Math.abs(nePt.y - swPt.y) + 'px';
      // Hide box asynchronously after 1 second:
      setTimeout(function () {me.boxDiv_.style.display = 'none';}, 1000);
      this.dragging_ = false;
      /**
       * This event is fired when the drag operation ends.
       * The parameter passed is the geographic bounds of the selected area.
       * Note that this event is <i>not</i> fired if the hot key is released before the drag operation ends.
       * @name DragZoom#dragend
       * @param {GLatLngBounds} newBounds
       * @event
       */
      GEvent.trigger(this, 'dragend', bnds);
      if (!this.isHotKeyDown_()) {
        this.hotKeyDown_ = false;
        this.buttonImg_.src = this.imageOff_;
        GEvent.trigger(this, 'deactivate');
      }
    }
  };
  /**
   * Handle key up.
   * @param {Event} e
   */
  DragZoom.prototype.onKeyUp_ = function (e) {
    var i;
    if (this.map_ && this.hotKeyDown_) {
      this.hotKeyDown_ = false;
      if (this.dragging_) {
        this.boxDiv_.style.display = 'none';
      }
      for (i = 0; i < this.veilDiv_.length; i++ ) {
        this.veilDiv_[i].style.display = "none";
      }
      this.dragging_ = false;
      /**
       * This event is fired when the hot key is released.
       * @name DragZoom#deactivate
       * @event
       */
      GEvent.trigger(this, 'deactivate');
    }
    if (this.visualEnabled_) {
      if (this.buttonImg_.src !== this.imageOff_) {
        this.buttonImg_.src = this.imageOff_;
      }
    }
  };
  /**
   * @name GMap2
   * @class These are new methods added to the Google Maps JavaScript API V2's
   * <a href="http://code.google.com/apis/maps/documentation/javascript/v2/reference.html#GMap2">GMap2</a>
   * class.
   */
  /**
   * Enables drag zoom. The user can zoom to an area of interest by holding down the hot key
   * <code>(shift | ctrl | alt )</code> while dragging a box around the area or by turning
   * on the visual control then dragging a box around the area.
   * @param {KeyDragZoomOptions} opt_zoomOpts
   */
  GMap2.prototype.enableKeyDragZoom = function (opt_zoomOpts) {
    this.dragZoom_ = new DragZoom(this, opt_zoomOpts);
  };
  /**
   * Disables drag zoom.
   */
  GMap2.prototype.disableKeyDragZoom = function () {
    var i;
    var d = this.dragZoom_;
    if (d) {
      GEvent.removeListener(d.mouseDownListener_);
      GEvent.removeListener(d.mouseDownListenerDocument_);
      GEvent.removeListener(d.mouseMoveListener_);
      GEvent.removeListener(d.mouseUpListener_);
      GEvent.removeListener(d.keyUpListener_);
      GEvent.removeListener(d.keyDownListener_);
      this.getContainer().removeChild(d.boxDiv_);
      for (i = 0; i < d.veilDiv_.length; i++) {
        this.getContainer().removeChild(d.veilDiv_[i]);
      }
      if (d.visualEnabled_) {
        d.map_.removeControl(d);
      }
      this.dragZoom_ = null;
    }
  };
  /**
   * Returns <code>true</code> if the drag zoom feature has been enabled.
   * @return {Boolean}
   */
  GMap2.prototype.keyDragZoomEnabled = function () {
    return this.dragZoom_ !== null;
  };
  /**
   * Returns the DragZoom object which is created when <code>GMap2.enableKeyDragZoom</code> is called.
   * With this object you can use <code>GEvent.addListener</code> to attach event listeners
   * for the 'activate', 'deactivate', 'dragstart', 'drag', and 'dragend' events.
   * @return {DragZoom}
   */
  GMap2.prototype.getDragZoomObject = function () {
    return this.dragZoom_;
  };
})();