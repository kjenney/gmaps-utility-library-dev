var MultiIconMarker = function(latlng, opt_opts_){
  this.latlng_ = latlng;
  this.opt_opts_ = opt_opts_;
  
  if(this.isNull(opt_opts_)){
    opt_opts_ = G_DEFAULT_ICON;
  };
  
  this.iconListEvent1_ = new Array();
  this.restoreListEvent2_ = new Array();
  this.saveIcon_ = null;

  this.icon_ = new GIcon(opt_opts_.icon);
  opt_opts_.icon.image = null;
  opt_opts_.icon.sprite = null;
  GMarker.apply(this, arguments);
};

MultiIconMarker.prototype = new GMarker(new GLatLng(0,0));

/**
 * @private
 */

/**
 * @private
 * @desc       initialize MultiIconMarker
 */
MultiIconMarker.prototype.initialize = function(map){
  GMarker.prototype.initialize.apply(this, arguments);
  this.map_ = map;
  
  var param = new Object();
  param.left = 0;
  param.top = 0;
  param.width = this.icon_.iconSize.width;
  param.height = this.icon_.iconSize.height;
  if(!this.isNull(this.icon_.sprite)){
    if(!this.isNull(this.icon_.sprite.left)){
      param.left = this.icon_.sprite.left;
    };
  };
  if(!this.isNull(this.icon_.sprite)){
    if(!this.isNull(this.icon_.sprite.top)){
      param.top = this.icon_.sprite.top;
    };
  };
  this.container_ = this.makeImgDiv_(this.icon_.image, param);
  
  map.getPane(G_MAP_MARKER_PANE).appendChild(this.container_);
};

/**
 * @name   addIcon
 * @desc   add GIcon
 * @param  icon : GIcon
 * @param  eventName1 : change icon on eventName1
 * @param  eventName2 : restore icon on eventName2[opt]
 * @return none
 */
MultiIconMarker.prototype.addIcon = function(icon, eventName1, eventName2){
  if(this.isNull(eventName1) || this.isNull(icon)){return;};
  this.iconListEvent1_[eventName1] = icon;
  if(!this.isNull(eventName2)){
      this.restoreListEvent2_[eventName1]=eventName2;
      GEvent.bindDom(this, eventName2, this, this.restoreIcon_);
  };
  GEvent.bindDom(this, eventName1, this, function(){this.eventProcess_(eventName1);});
};

/**
 * @private
 * @desc     redraw force when event happen
 */
MultiIconMarker.prototype.eventProcess_ = function(eventName){
  
  if(!this.isNull(this.iconListEvent1_[eventName])){
    
    if(!this.isNull(this.restoreListEvent2_[eventName])){
      if(this.isNull(this.saveIcon_)){
        this.saveIcon_ = this.icon_;
      };
    };
    
    this.icon_=this.iconListEvent1_[eventName];
    
    this.setIcon(this.icon_);
  };
};

/**
 * @private
 * @desc     restore icon
 */
MultiIconMarker.prototype.restoreIcon_ = function(){
  this.icon_ = new GIcon(this.saveIcon_);
  this.setIcon(this.icon_);
};



/**
 * @name   setIcon
 * @desc   change Icon
 * @param  icon : Gicon
 * @return none
 */
MultiIconMarker.prototype.setIcon = function(icon){
  
  var param = new Object();
  param.left = 0;
  param.top = 0;
  param.width = icon.iconSize.width;
  param.height = icon.iconSize.height;
  param.image = icon.image;
  if(!this.isNull(icon.sprite)){
    if(!this.isNull(icon.sprite.left)){
      param.left = icon.sprite.left;
    };
  };
  if(!this.isNull(icon.sprite)){
    if(!this.isNull(icon.sprite.top)){
      param.top = icon.sprite.top;
    };
  };
  this.changeImage_(this.container_, param);
};

/**
 * @desc     redraw marker
 */
MultiIconMarker.prototype.redraw = function(force){
  GMarker.prototype.redraw.apply(this, arguments);
  
  this.latlng_ = this.getLatLng();
  this.container_.style.zIndex = GOverlay.getZIndex(this.latlng_.lat()+1);
  var pxPos = this.map_.fromLatLngToDivPixel(this.latlng_);
  
  with(this.container_.style){
    left =(pxPos.x - this.icon_.iconAnchor.x)+"px";
    top = ( pxPos.y - this.icon_.iconAnchor.y) +"px";
  };
};


/**
 * @desc     copy marker
 */
MultiIconMarker.prototype.copy = function(){
  return new MultiIconMarker(this.getLatLng(), this.opt_opts_);
};


/**
 * @name   remove
 * @desc   remove this icon
 * @param  none
 * @return none
 */
MultiIconMarker.prototype.remove = function(){
  GMarker.prototype.remove.apply(this, arguments);
};


/**
 * @name   getIcon
 * @desc   return current GIcon
 * @param  none
 * @return current GIcon
 */
MultiIconMarker.prototype.getIcon = function(){
  return this.icon_;
};


/**
 * @private
 * @desc      create div element with PNG image
 */
MultiIconMarker.prototype.makeImgDiv_=function(imgSrc, params){
   
  var isIE_ = this.isIE_();
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
 * @private
 * @desc      change image
 */
MultiIconMarker.prototype.changeImage_=function(div_, param){
   
  with(div_.firstChild.style){
    left = param.left+"px";
    top = -param.top+"px";
    if(this.isIE_()){
      width = param.width+"px";
      height = param.height+"px";
      filter="progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+param.image+"')";
    }else{
      div_.firstChild.src=param.image;
    };
  };
  
  with(div_.style){
    width = param.width+"px";
    height = param.height+"px";
  };
};

/**
 * @private
 * @desc      detect IE
 * @param     none
 * @return    true  :  blowser is Interner Explorer
 *            false :  value is Interner Explorer
 */
MultiIconMarker.prototype.isIE_ = function() {
  return (navigator.userAgent.toLowerCase().indexOf('msie') != -1 ) ? true : false;
};

/**
 * @private
 * @desc      detect null,null string and undefined
 * @param     value
 * @return    true  :  value is nothing
 *            false :  value is not nothing
 */
MultiIconMarker.prototype.isNull = function(value) {
  if(!value && value!=0 ||
    value==undefined ||
    value=="" ||
    value==null ||
    typeof value=="undefined"){return true;};
  return false;
};

