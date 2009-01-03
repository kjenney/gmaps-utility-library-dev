/**
 * @name ExtStreetviewControl
 * @version 1.0
 * @author Masashi Katsumata
 * @fileoverview Creates a control with Street View.
 */

/**
 * @desc Creates an ExtStreetviewControl. 
 *
 * @constructor
 */  
var ExtStreetviewControl = function(opt_opts){
  this.minimizeImgSrc_ = "http://maps.google.com/mapfiles/mapcontrols3d.png";
  this.maximizeImgSrc_ = "http://maps.google.com/mapfiles/cb/resize_toggles.png";
  this.iconSrc_ = "http://maps.google.com/mapfiles/cb/pegman.png";
  
  if(ExtStreetviewControl.prototype.isNull(opt_opts)){
    opt_opts = {}
  };
  
  this.latlng_ = opt_opts.latlng || null;
  this.ctrlSize_ = opt_opts.size || new GSize(295,210);
  this.pov_ = opt_opts.pov || {yaw:0, pitch:0, panoId:null};
};

/**
 * @desc http://msdn.microsoft.com/en-us/library/ms537628(VS.85).aspx
 *
 */    
document.write("<!-- saved from url=(0013)about:internet -->");
document.write("<!-- saved from url=(0022)http://maps.google.com -->");

/**
 * @private
 */
ExtStreetviewControl.prototype = new GControl();

/**
 * @desc Initialize the streetview control
 * @private
 */
ExtStreetviewControl.prototype.initialize = function(map) {
  GControl.prototype.initialize.apply(this, arguments);
  
  
  var agt = navigator.userAgent.toLowerCase();
  var isIE = 0;
  var _handleList = new Array();
  if(agt.indexOf('msie') != -1 ){isIE = 1;};
  
  
  //initialize
  this.latlng_ = this.latlng_ || map.getCenter();
  this.map_ = map;
  this.bounds_ = map.getBounds();
  this.minimize_ = false;
  this.maximize_ = false;
  this.ctrlSize_ = this.ctrlSize_;
  this.stViewCnt_ = 0;
  
  //make container
  this.container_ = document.createElement("div");
  map.getContainer().appendChild(this.container_);
  
  with(this.container_.style){
    overflow="hidden";
    width=this.ctrlSize_.width+"px";
    height=this.ctrlSize_.height+"px";
    zIndex=0;
  };
  
  //make visibleContainer
  this.visibleContainer_ = document.createElement("div");
  this.container_.appendChild(this.visibleContainer_);
  with(this.visibleContainer_.style){
    borderStyle="solid none none solid";
    borderColor="#979797";
    borderWidth="1px 0 0 1px";
    width=this.ctrlSize_.width+"px";
    height=this.ctrlSize_.height+"px";
    overflow="hidden";
    backgroundColor="#e8ecf8";
    position="absolute";
  };
  
  //streetview panorama container
  this.flashContainer_ = document.createElement("div");
  this.visibleContainer_.appendChild(this.flashContainer_);
  with(this.flashContainer_.style){
    position = "absolute";
    left="5px";
    top="5px";
    width=(this.ctrlSize_.width-5)+"px";
    height=(this.ctrlSize_.height-5)+"px";
    backgroundColor="#000000";
    zIndex=0;
  };
  
  //minmize button
  this.minmizeBtn_ = this.makeImgDiv_(this.minimizeImgSrc_, {"left":0, "top":-428, "width":15, "height":15});
  this.container_.appendChild(this.minmizeBtn_);
  with(this.minmizeBtn_.style){
    right="0px";
    bottom="0px";
    zIndex=2;
  };
  
  //maximize button
  this.maximizeBtn_ = this.makeImgDiv_(this.maximizeImgSrc_, {"left":0, "top":0, "width":17, "height":17});
  this.visibleContainer_.appendChild(this.maximizeBtn_);
  with(this.maximizeBtn_.style){
    left="-1px";
    top="-1px";
    zIndex=2;
  };
  
  //pegman marker
  var pegmanIcon = new GIcon();
  pegmanIcon.image = this.iconSrc_;
  pegmanIcon.iconSize = new GSize(49, 52);
  pegmanIcon.iconAnchor = new GPoint(24, 34);
  pegmanIcon.infoWindowAnchor = new GPoint(18, 11);
  
  var pegmanMarker = function(latlng, opt_opts){
    this.icon_ = new GIcon(opt_opts.icon);
    opt_opts.icon.image = null;
    opt_opts.icon.sprite = null;
    GMarker.apply(this, arguments);
  };
  pegmanMarker.prototype = new GMarker(new GLatLng(0,0));
  
  pegmanMarker.prototype.initialize = function(map){
    GMarker.prototype.initialize.apply(this, arguments);
    this.map_ = map;
    
    this.iconContainer_ = ExtStreetviewControl.prototype.makeImgDiv_(this.icon_.image, {"left":0, "top":0, "width":52, "height":52});
    
    map.getPane(G_MAP_MARKER_PANE).appendChild(this.iconContainer_);
  };

  pegmanMarker.prototype.redraw = function(force){
    GMarker.prototype.redraw.apply(this, arguments);
    
    this.latlng_=this.getLatLng();
    this.iconContainer_.style.zIndex = GOverlay.getZIndex(this.latlng_.lat()+1);
    
    var pxPos = this.map_.fromLatLngToDivPixel(this.latlng_);
    this.iconContainer_.style.left =(pxPos.x - this.icon_.iconAnchor.x)+"px";
    this.iconContainer_.style.top = ( pxPos.y - this.icon_.iconAnchor.y) +"px";
  };
  pegmanMarker.prototype.getIcon = function(){
    return this.icon_;
  };
  pegmanMarker.prototype.getIconContainer_ = function(){
    return this.iconContainer_;
  };
  this.marker_ = new pegmanMarker(this.latlng_ ,{draggable: true, icon:pegmanIcon});
  
  this.marker_.isFirst_ = true;
  GEvent.bind(this.marker_, "dragstart", this, this.markerDragStart_);
  GEvent.bind(this.marker_, "drag", this, this.markerDrag_);
  GEvent.bind(this.marker_, "dragend", this, this.markerDragEnd_);
  map.addOverlay(this.marker_);
  
  //streetview panorama
  this.stObj_ = null;
  this.stClient_ = new GStreetviewClient();
  this.createStreetviewPanorama();
  
  
  //GOverviewMapControl
  var myGOverviewMapControl = function(){
    GOverviewMapControl.apply(this, arguments);
  };
  
  myGOverviewMapControl.prototype = new GOverviewMapControl();
  
  myGOverviewMapControl.prototype.initialize=function(map){
    this.ctrlDiv_ = GOverviewMapControl.prototype.initialize.apply(this, arguments);
    if(this.ctrlDiv_.childNodes.length){
      this.ctrlDiv_.lastChild.style.display="none";
    };
    return this.ctrlDiv_;
  };
  
  myGOverviewMapControl.prototype.hide=function(){
    GOverviewMapControl.prototype.hide.apply(this, arguments);
    this.ctrlDiv_.style.visibility="hidden";
  };
  
  myGOverviewMapControl.prototype.show=function(){
    GOverviewMapControl.prototype.show.apply(this, arguments);
    this.ctrlDiv_.style.visibility="visible";
  };
  
  this.overviewMapControl_ = new myGOverviewMapControl();
  map.addControl(this.overviewMapControl_);
  this.overviewMapControl_.hide();
  //GLog.write(this.overviewMapControl_.getOverviewMap());
  
  //events
  GEvent.bindDom(this.minmizeBtn_, "click", this, this.toggleMinimize_);
  GEvent.bindDom(this.maximizeBtn_, "click", this, this.toggleMaximize_);
  GEvent.bindDom(window, "resize",this,  this.windowResize_);
  GEvent.bind(map, "moveend", this, this.mapMove_);
  this.removeControlOrg_ = GMap2.prototype.removeControl;
  GMap2.prototype.removeControl = this.removeControl_;
  
  this.setLocationAndPOV(this.latlng_,this.pov_);
  
  this.iconSrc_ = this.iconSrc_;
  return this.container_;
};

/**
 * @private
 * @desc pegman-marker drag start
 */
ExtStreetviewControl.prototype.markerDragStart_ = function() {
  this.lng_ = this.latlng_.lng();
};

/**
 * @private
 * @desc pegman-marker dragging
 */
ExtStreetviewControl.prototype.markerDrag_ = function() {
  var beforeLng = this.lng_;
  var currentLng = this.marker_.getLatLng().lng();
  this.lng_ = currentLng;
  
  var dragDirection = beforeLng-currentLng;
  var imgTop;
  
  if(dragDirection>0){
    imgTop = 17;
  }else{
    imgTop = 18;
  };
  imgTop = -imgTop * this.marker_.getIcon().iconSize.height;
  
  this.marker_.getIconContainer_().firstChild.style.top=imgTop+"px";
};

/**
 * @private
 * @desc pegman-marker drag end
 */
ExtStreetviewControl.prototype.markerDragEnd_ = function() {
  var latlng = this.marker_.getLatLng();
  this.map_.panTo(latlng);
  this.setLocationAndPOV(latlng);
};


/**
 * @private
 * @desc yawchanged on streetview
 */
ExtStreetviewControl.prototype.yawChanged_ = function(yaw) {
  this.pov_.yaw = yaw;

  var imgTop = -Math.floor(yaw/(360/16))* this.marker_.getIcon().iconSize.height;
  
  this.marker_.getIconContainer_().firstChild.style.top=imgTop+"px";
};

/**
 * @private
 * @desc pitchchanged on streetview
 */
ExtStreetviewControl.prototype.pitChchanged_ = function(pitch) {
  this.pov_.pitch = pitch;
};

/**
 * @private
 * @desc window resize
 */
ExtStreetviewControl.prototype.windowResize_ = function() {
  if(this.maximize_){
    var mapSize = this.map_.getSize();
    mapSize.height=Math.floor(mapSize.height);
    with(this.container_.style){
      left = null;
      top = null;
      width=mapSize.width+"px";
      height=mapSize.height+"px";
    };
    
    with(this.visibleContainer_.style){
      width=mapSize.width+"px";
      height=mapSize.height+"px";
    };

    with(this.flashContainer_.style){
      width=(mapSize.width-5)+"px";
      height=(mapSize.height-5)+"px";
    };
    
    this.stObj_.checkResize();
  };
};


/**
 * @private
 * @desc click maximize button
 */
ExtStreetviewControl.prototype.toggleMaximize_ = function() {
  var mapSize = this.map_.getSize();
  var param = new Object();
  param.x = this.container_.offsetLeft;
  param.y = this.container_.offsetTop;
  param.width = this.container_.offsetWidth;
  param.height = this.container_.offsetHeight;
  param.maxWidth = mapSize.width ;
  param.maxHeight = mapSize.height;
  param.xStep = (param.maxWidth - this.ctrlSize_.width )  / 10;
  param.yStep = (param.maxHeight - this.ctrlSize_.height) / 10;
  
  param.cnt = 0;
  if(this.maximize_){
    this.maximize_ = false;
    param.aniPosDirection = 1;
    param.aniSizeDirection = -1;
    param.maximizeImgY = 0;
    this.container_.style.width=this.ctrlSize_.width+"px";
    this.container_.style.height=this.ctrlSize_.height+"px";
    param.maxWidth = this.ctrlSize_.width ;
    param.maxHeight = this.ctrlSize_.height;
    this.minmizeBtn_.style.visibility="visible";
    this.overviewMapControl_.hide();
  }else{
    this.maximize_ = true;
    param.aniPosDirection = -1;
    param.aniSizeDirection = 1;
    param.maximizeImgY = -17;
    this.container_.style.width=mapSize.width+"px";
    this.container_.style.height=(mapSize.height)+"px";
    
    this.minmizeBtn_.style.visibility="hidden";
    
    this.overviewMapControl_.show();
  };
  if(ExtStreetviewControl.prototype.isIE_() && this.latlng_){
    if(document.location.protocol.toLowerCase()=="file:"){
      this.stObj_.hide();
    };
  };
  this.flashContainer_.style.visibility="hidden";

  var this_ = this;
  function max_resizeAnimation(param){
    param.x = param.x + param.aniPosDirection * param.xStep;
    param.x = param.x < 0  ? 0 : param.x;
    param.y = param.y + param.aniPosDirection * param.yStep;
    param.y = param.y < 0  ? 0 : param.y;
    param.width = param.width + param.aniSizeDirection * param.xStep;
    param.height = param.height + param.aniSizeDirection * param.yStep;
    
    with(this_.container_.style){
      left = param.x+"px";
      top = param.y+"px";
      width=param.width+"px";
      height=param.height+"px";
    };
    with(this_.visibleContainer_.style){
      width=param.width+"px";
      height=param.height+"px";
    };

    with(this_.flashContainer_.style){
      width=(param.width-5)+"px";
      height=(param.height-5)+"px";
    };
    
    
    param.cnt++;
    if(param.cnt <10){
      var arg = arguments;
      setTimeout(function(){arg.callee.apply(null, arg);}, 10);
    }else{
      with(this_.container_.style){
        width=(param.maxWidth)+"px";
        height=(param.maxHeight)+"px";
        left = null;
        top = null;
      };
      this_.maximizeBtn_.firstChild.style.top=param.maximizeImgY;
      if(ExtStreetviewControl.prototype.isIE_() && this_.latlng_){
        if(document.location.protocol.toLowerCase()=="file:"){
          this_.stObj_.show();
        };
      };
      this_.flashContainer_.style.visibility="visible";
      this_.stObj_.checkResize();
    };
  };
  max_resizeAnimation(param);
};

/**
 * @private
 * @desc click minimize button
 */
ExtStreetviewControl.prototype.toggleMinimize_ = function() {
  var param = new Object();
  with(this.container_){
    param.x = offsetLeft;
    param.y = offsetTop;
    param.width = offsetWidth;
    param.height = offsetHeight;
  };
  param.xStep = ( this.ctrlSize_.width -15)  / 10;
  param.yStep = ( this.ctrlSize_.height -15) / 10;
  param.cnt = 0;
  if(this.minimize_){
    this.minimize_ = false;
    param.aniPosDirection = -1;
    param.aniSizeDirection = 1;
    param.minimizeImgY = -428;
    
    param.maxWidth=this.ctrlSize_.width;
    param.maxHeight=this.ctrlSize_.height;
  }else{
    this.minimize_ = true;
    param.aniPosDirection = 1;
    param.aniSizeDirection = -1;
    param.minimizeImgY = -443;
    param.maxWidth = 15 ;
    param.maxHeight = 15;
  };
  
  this.flashContainer_.style.visibility="hidden";
  var this_ = this;
  
  function min_resizeAnimation(param){
    param.x = param.x + param.aniPosDirection * param.xStep;
    param.x = param.x < 0  ? 0 : param.x;
    param.y = param.y + param.aniPosDirection * param.yStep;
    param.y = param.y < 0  ? 0 : param.y;
    param.width = param.width + param.aniSizeDirection * param.xStep;
    param.height = param.height + param.aniSizeDirection * param.yStep;
    
    with(this_.container_.style){
      left = param.x+"px";
      top = param.y+"px";
      width=param.width+"px";
      height=param.height+"px";
    };
    param.cnt++;
    if(param.cnt <10){
      var arg = arguments;
      setTimeout(function(){arg.callee.apply(null, arg);}, 10);
    }else{
      this_.minmizeBtn_.firstChild.style.top=param.minimizeImgY;
      with(this_.container_.style){
        width=(param.maxWidth)+"px";
        height=(param.maxHeight)+"px";
        left = null;
        top = null;
        right="0px";
        bottom="0px";
      };
      if(!this_.minimize_){
        this_.flashContainer_.style.visibility="visible";
      };
    };
  };
  min_resizeAnimation(param);
};


/**
 * @private
 * @desc map move
 */
ExtStreetviewControl.prototype.mapMove_ = function() {
  this.bounds_ = this.map_.getBounds();
};

/**
 * @name getLatLng
 * @desc return current latlng
 * @param none
 * @return GLatlng
 */
ExtStreetviewControl.prototype.getLatLng = function(){
  return this.latlng_;
};

/**
 * @name getPov
 * @desc return current pov
 * @param none
 * @return GPOV
 */
ExtStreetviewControl.prototype.getPov = function(){
  if(!ExtStreetviewControl.prototype.isNull(pov)){
    return this.pov_;
  }else{
    return null;
  };
};

/**
 * @name setLocationAndPOV
 * @desc set location and pov
 * @param latlng location's GLatLng
 *        pov    location's GPOV [opt]
 * @return none
 */
ExtStreetviewControl.prototype.setLocationAndPOV = function(latlng, pov) {
  if(!ExtStreetviewControl.prototype.isNull(pov)){
    this.pov_ = pov;
  };
  this.marker_.setLatLng(latlng);
  var this_=this;
  this.stClient_.getNearestPanorama(latlng, function(){this_.stClientEnum_(this_, arguments[0]);} );
};


/**
 * @private
 * @ignore
 */
ExtStreetviewControl.prototype.getDefaultPosition = function() {
  return new GControlPosition(G_ANCHOR_BOTTOM_RIGHT, new GSize(0, 0));
};

/**
 * @private
 * @ignore
 */
ExtStreetviewControl.prototype.selectable = function(){
  return false;
};

/**
 * @private
 * @ignore
 */
ExtStreetviewControl.prototype.printable = function(){
  return true;
};

/**
 * @private
 */
ExtStreetviewControl.prototype.removeControl_ = function(control){
  if(control.toString()==this.toString()){
    this.stObj_.remove();
  };
  this.removeControlOrg_.apply(this, arguments);
};

/**
 * @private
 * @desc      changed the position on streetview
 */
ExtStreetviewControl.prototype.stInitialized_ = function(location, force) {
  if(ExtStreetviewControl.prototype.isNull(location.pov)){return;};
  
  if(!ExtStreetviewControl.prototype.isNull(location.pov.yaw)
    || ExtStreetviewControl.prototype.isNull(this.pov_.yaw)){
    this.pov_ = location.pov;
  };
  
  this.latlng_ = location.latlng;
  this.marker_.setLatLng(location.latlng);
  if(!this.bounds_.containsLatLng(location.latlng)){
    this.map_.panTo(location.latlng);
  };

  
  this.stViewCnt_++;
  if(this.stViewCnt_>10){
    this.map_.panTo(location.latlng);
    var this_ = this;
    setTimeout(function(){this_.createStreetviewPanorama();},10);
    return;
  };

  if(force==true){
    this.stObj_.setLocationAndPOV(location.latlng, this.pov_);

    if(this.stViewCnt_==1){
      this.setAttributeToStFlashViewer_("wmode","opaque");
    };
  };
  
};

/**
 * @private
 * @desc      set attribute to flash player for streetview
 */
ExtStreetviewControl.prototype.setAttributeToStFlashViewer_ = function(attrName, attrValue) {
  if(ExtStreetviewControl.prototype.isNull( this.flashContainer_)){return null;};
  
  var flashViewer = this.flashContainer_.firstChild;
  var this_ = this;
  if(ExtStreetviewControl.prototype.isNull(flashViewer)){
    setTimeout(function(){this_.setAttributeToStFlashViewer_(attrName, attrValue);}, 100);
  }else{
    this.flashContainer_.style.visibility="hidden";
    flashViewer.setAttribute(attrName, attrValue);
    //flashViewer.SetVariable(attrName, attrValue);
    
    if(flashViewer.tagName.toLowerCase()=="object"){
      var paramEle = document.createElement("param");
      paramEle.setAttribute("name", attrName);
      paramEle.name=attrName;
      paramEle.value=attrValue;
      flashViewer.appendChild(paramEle);
    };
    this.flashContainer_.style.visibility="visible";
  };
};

/**
 * @private
 * @desc      callback for GStreetviewClient
 */
ExtStreetviewControl.prototype.stClientEnum_ = function(this_, gstreetviewdata){
  if(gstreetviewdata.code!=200){
    this_.marker_.getIconContainer_().firstChild.style.top="0px";
    return;
  };
  
  this_.stInitialized_(gstreetviewdata.location,true);
  
  if(ExtStreetviewControl.prototype.isIE_() && !this_.marker_.isFirst_){
    if(document.location.protocol.toLowerCase()=="file:"){
      this_.stObj_.show();
    };
  };
  this_.marker_.isFirst_=false;

};

/**
 * @private
 * @desc      minimize action
 * @param     none
 * @return    none
 */
ExtStreetviewControl.prototype.minimize = function() {
  this.maximize_ = false;
  this.toggleMaximize_();
};

/**
 * @private
 * @desc      detect null,null string and undefined
 * @param     value
 * @return    true  :  value is nothing
 *            false :  value is not nothing
 */
ExtStreetviewControl.prototype.isNull = function(value) {
  if(!value && value!=0 ||
     value==undefined ||
     value=="" ||
     value==null ||
     typeof value=="undefined"){return true;};
  return false;
};

/**
 * @private
 * @desc      detect IE
 * @param     none
 * @return    true  :  blowser is Interner Explorer
 *            false :  blowser is not Interner Explorer
 */
ExtStreetviewControl.prototype.isIE_ = function() {
  return (navigator.userAgent.toLowerCase().indexOf('msie') != -1 ) ? true : false;
};



/**
 * @private
 * @desc      create new Streetview Panorama
 *            leak memory to avoid.
 * @param     none
 * @return    none
 */
ExtStreetviewControl.prototype.createStreetviewPanorama = function() {
  var flag=false;
  if(!ExtStreetviewControl.prototype.isNull(this.stObj_)){
    GEvent.clearInstanceListeners(this.stObj_);
    this.stObj_.remove();
    flag=true;
  };
  
  var stObj = new GStreetviewPanorama(this.flashContainer_);
  this.stViewCnt_ = 0;
  this.stObj_ = stObj;
  if(flag){
    stObj.setLocationAndPOV(this.latlng_, this.pov_);
    this.setAttributeToStFlashViewer_("wmode","opaque");
  };
  
  GEvent.bind(stObj, "initialized",this, this.stInitialized_);
  GEvent.bindDom(stObj, "yawchanged", this, this.yawChanged_);
  GEvent.bindDom(stObj, "pitchchanged",this,  this.pitChchanged_);
};

/**
 * @private
 * @desc      create div element with PNG image
 */
ExtStreetviewControl.prototype.makeImgDiv_=function(imgSrc, params){
   
  var isIE_ = ExtStreetviewControl.prototype.isIE_();
  var imgDiv = document.createElement("div");
  with(imgDiv.style){
    position = "absolute";
    overflow="hidden";
    if(params.width){width = params.width+"px";};
    if(params.height){height = params.height+"px";};
  };
  
  var img = null;
  if(!isIE_){
    img = new Image();
    img.src = imgSrc;
  }else{
    img = document.createElement("div");
    with(img.style){
      if(params.width){width = params.width+"px";};
      if(params.height){height = params.height+"px";};
    };
  };
  with(img.style){
    position="relative";
    left = params.left+"px";
    top =  params.top+"px";
    filter="progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+imgSrc+"')";
  };
  imgDiv.appendChild(img);
  return imgDiv;
};

/**
 * @name toString
 * @desc return controlName
 * @param none
 * @return name of this control class
 */
//=====================//
//  method : toString  //
//=====================//
ExtStreetviewControl.prototype.toString=function(){
  return "extstreetviewcontrol";
};
