var MultiIconMarker = function(latlng, opt_opts_){
  this.latlng_ = latlng;
  this.opt_opts_ = opt_opts_;
  
  if(this.isNull(opt_opts_)){
    opt_opts_ = G_DEFAULT_ICON;
  };
  
  this.icon_ = new GIcon(opt_opts_.icon);
  opt_opts_.icon.image = null;
  opt_opts_.icon.sprite = null;
  GMarker.apply(this, arguments);
};

MultiIconMarker.prototype = new GMarker(new GLatLng(0,0));

/**
 * @private
 */
MultiIconMarker.prototype.iconListEvent1_ = new Array();
MultiIconMarker.prototype.restoreListEvent2_ = new Array();
MultiIconMarker.prototype.saveIcon_ = null;

/**
 * @private
 * @desc       initialize MultiIconMarker
 */
MultiIconMarker.prototype.initialize = function(map){
  GMarker.prototype.initialize.apply(this, arguments);
  MultiIconMarker.prototype.map_ = map;
  MultiIconMarker.prototype.icon_ = this.icon_;
  
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
  MultiIconMarker.prototype.container_ = this.makeImgDiv_(this.icon_.image, param);
  
  map.getPane(G_MAP_MARKER_PANE).appendChild(MultiIconMarker.prototype.container_);
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
  MultiIconMarker.prototype.iconListEvent1_[eventName1] = icon;
  if(!this.isNull(eventName2)){
      MultiIconMarker.prototype.restoreListEvent2_[eventName1]=eventName2;
      GEvent.bindDom(this, eventName2, this, this.restoreIcon_);
  };
  GEvent.bindDom(this, eventName1, this, function(){this.eventProcess_(eventName1);});
};

/**
 * @private
 * @desc     redraw force when event happen
 */
MultiIconMarker.prototype.eventProcess_ = function(eventName){
  
  if(!MultiIconMarker.prototype.isNull(MultiIconMarker.prototype.iconListEvent1_[eventName])){
    
    if(!MultiIconMarker.prototype.isNull(MultiIconMarker.prototype.restoreListEvent2_[eventName])){
      if(MultiIconMarker.prototype.isNull(MultiIconMarker.prototype.saveIcon_)){
        MultiIconMarker.prototype.saveIcon_ = MultiIconMarker.prototype.icon_;
      };
    };
    
    MultiIconMarker.prototype.icon_=MultiIconMarker.prototype.iconListEvent1_[eventName];
    
    MultiIconMarker.prototype.setIcon(MultiIconMarker.prototype.icon_);
  };
};

/**
 * @private
 * @desc     restore icon
 */
MultiIconMarker.prototype.restoreIcon_ = function(){
  MultiIconMarker.prototype.icon_ = new GIcon(MultiIconMarker.prototype.saveIcon_);
  MultiIconMarker.prototype.setIcon(MultiIconMarker.prototype.icon_);
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
  if(!MultiIconMarker.prototype.isNull(icon.sprite)){
    if(!MultiIconMarker.prototype.isNull(icon.sprite.left)){
      param.left = icon.sprite.left;
    };
  };
  if(!MultiIconMarker.prototype.isNull(icon.sprite)){
    if(!MultiIconMarker.prototype.isNull(icon.sprite.top)){
      param.top = icon.sprite.top;
    };
  };
  MultiIconMarker.prototype.changeImage_(MultiIconMarker.prototype.container_, param);
};

/**
 * @private
 * @desc     redraw marker
 */
MultiIconMarker.prototype.redraw = function(force){
  GMarker.prototype.redraw.apply(this, arguments);
  
  this.latlng_ = this.getLatLng();
  MultiIconMarker.prototype.container_.style.zIndex = GOverlay.getZIndex(this.latlng_.lat()+1);
  var pxPos = MultiIconMarker.prototype.map_.fromLatLngToDivPixel(this.latlng_);
  
  with(MultiIconMarker.prototype.container_.style){
    left =(pxPos.x - MultiIconMarker.prototype.icon_.iconAnchor.x)+"px";
    top = ( pxPos.y - MultiIconMarker.prototype.icon_.iconAnchor.y) +"px";
  };
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
  return MultiIconMarker.prototype.icon_;
};


/**
 * @private
 * @desc      create div element with PNG image
 */
MultiIconMarker.prototype.makeImgDiv_=function(imgSrc, params){
   
  var isIE_ = MultiIconMarker.prototype.isIE_();
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
    if(MultiIconMarker.prototype.isIE_()){
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

