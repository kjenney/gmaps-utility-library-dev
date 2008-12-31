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
document.write("<!-- saved from url=(0014)about:internet -->");
document.write("<!-- saved from url=(0022)http://maps.google.com -->");

ExtStreetviewControl.prototype = new GControl();

ExtStreetviewControl.prototype.eventHandler_ = {};

ExtStreetviewControl.prototype.initialize = function(map) {
    GControl.prototype.initialize.apply(this, arguments);
    
    
    var agt = navigator.userAgent.toLowerCase();
    var isIE = 0;
    var _handleList = new Array();
    if(agt.indexOf('msie') != -1 ){isIE = 1;};
    
    
    //====================================//
    //            initialize              //
    //====================================//
    this.latlng_ = this.latlng_ || map.getCenter();
    ExtStreetviewControl.prototype.map_ = map;
    ExtStreetviewControl.prototype.bounds_ = map.getBounds();
    ExtStreetviewControl.prototype.minimize_ = false;
    ExtStreetviewControl.prototype.maximize_ = false;
    ExtStreetviewControl.prototype.ctrlSize_ = this.ctrlSize_;
    ExtStreetviewControl.prototype.stViewCnt_ = 0;
    
    //====================================//
    //          make container            //
    //====================================//
    ExtStreetviewControl.prototype.container_ = document.createElement("div");
    map.getContainer().appendChild(ExtStreetviewControl.prototype.container_);
    
    with(ExtStreetviewControl.prototype.container_.style){
        overflow="hidden";
        width=ExtStreetviewControl.prototype.ctrlSize_.width+"px";
        height=ExtStreetviewControl.prototype.ctrlSize_.height+"px";
    };
    
    //====================================//
    //       make visibleContainer        //
    //====================================//
    ExtStreetviewControl.prototype.visibleContainer_ = document.createElement("div");
    ExtStreetviewControl.prototype.container_.appendChild(ExtStreetviewControl.prototype.visibleContainer_);
    with(ExtStreetviewControl.prototype.visibleContainer_.style){
        borderStyle="solid none none solid";
        borderColor="#979797";
        borderWidth="1px 0 0 1px";
        width=ExtStreetviewControl.prototype.ctrlSize_.width+"px";
        height=ExtStreetviewControl.prototype.ctrlSize_.height+"px";
        overflow="hidden";
        backgroundColor="#e8ecf8";
        position="absolute";
    };
    
    //====================================//
    //        streetview container         //
    //====================================//
    ExtStreetviewControl.prototype.flashContainer_ = document.createElement("div");
    ExtStreetviewControl.prototype.visibleContainer_.appendChild(ExtStreetviewControl.prototype.flashContainer_);
    with(ExtStreetviewControl.prototype.flashContainer_.style){
        position = "absolute";
        left="5px";
        top="5px";
        width=(ExtStreetviewControl.prototype.ctrlSize_.width-5)+"px";
        height=(ExtStreetviewControl.prototype.ctrlSize_.height-5)+"px";
        backgroundColor="#000000";
    };
    //====================================//
    //          minmize button            //
    //====================================//
    ExtStreetviewControl.prototype.minmizeBtn_ = ExtStreetviewControl.prototype.makeImgDiv_(this.minimizeImgSrc_, {"left":0, "top":-428, "width":15, "height":15});
    ExtStreetviewControl.prototype.container_.appendChild(ExtStreetviewControl.prototype.minmizeBtn_);
    with(ExtStreetviewControl.prototype.minmizeBtn_.style){
         right="0px";
         bottom="0px";
    };
    
    //====================================//
    //          maximize button           //
    //====================================//
    ExtStreetviewControl.prototype.maximizeBtn_ = ExtStreetviewControl.prototype.makeImgDiv_(this.maximizeImgSrc_, {"left":0, "top":0, "width":17, "height":17});
    ExtStreetviewControl.prototype.visibleContainer_.appendChild(ExtStreetviewControl.prototype.maximizeBtn_);
    with(ExtStreetviewControl.prototype.maximizeBtn_.style){
        left=-1;
        top=-1;
    };
    
    //====================================//
    //           pegman marker            //
    //====================================//
    var pegmanIcon = new GIcon();
    pegmanIcon.image = this.iconSrc_;
    pegmanIcon.iconSize = new GSize(49, 52);
    pegmanIcon.iconAnchor = new GPoint(24, 34);
    pegmanIcon.infoWindowAnchor = new GPoint(18, 11);
    
    
    this.latlng_ = this.latlng_ || map.getCenter();
    
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
    ExtStreetviewControl.prototype.marker_ = new pegmanMarker(this.latlng_ ,{draggable: true, icon:pegmanIcon});
    
    ExtStreetviewControl.prototype.marker_.isFirst_ = true;
    ExtStreetviewControl.prototype.setEventListener(ExtStreetviewControl.prototype.marker_, "dragstart", this.markerDragStart_);
    ExtStreetviewControl.prototype.setEventListener(ExtStreetviewControl.prototype.marker_, "drag", this.markerDrag_);
    ExtStreetviewControl.prototype.setEventListener(ExtStreetviewControl.prototype.marker_, "dragend", this.markerDragEnd_);
    map.addOverlay( ExtStreetviewControl.prototype.marker_);
    
    
    //====================================//
    //        streetview panorama         //
    //====================================//
    ExtStreetviewControl.prototype.stObj_ = null;
    ExtStreetviewControl.prototype.stClient_ = new GStreetviewClient();
    ExtStreetviewControl.prototype.createStreetviewPanorama();
    
    //====================================//
    //              events                //
    //====================================//
    ExtStreetviewControl.prototype.setDomEventListener(ExtStreetviewControl.prototype.minmizeBtn_, "click", this.toggleMinimize_);
    ExtStreetviewControl.prototype.setDomEventListener(ExtStreetviewControl.prototype.maximizeBtn_, "click", this.toggleMaximize_);
    ExtStreetviewControl.prototype.setDomEventListener(window, "resize", this.windowResize_);
    ExtStreetviewControl.prototype.setEventListener(map, "moveend", this.mapMove_);
    ExtStreetviewControl.prototype.removeControlOrg_ = GMap2.prototype.removeControl;
    GMap2.prototype.removeControl = ExtStreetviewControl.prototype.removeControl_;
    
    this.setLocationAndPOV(this.latlng_,this.pov_);
    
    ExtStreetviewControl.prototype.iconSrc_ = this.iconSrc_;
    return ExtStreetviewControl.prototype.container_;
};

//====================================//
//  event : pegman-marker drag start  //
//====================================//
ExtStreetviewControl.prototype.markerDragStart_ = function() {
    ExtStreetviewControl.prototype.lng_ = ExtStreetviewControl.prototype.latlng_.lng();
};

//====================================//
//  event : pegman-marker dragging    //
//====================================//
ExtStreetviewControl.prototype.markerDrag_ = function() {
    var beforeLng = ExtStreetviewControl.prototype.lng_;
    var currentLng = ExtStreetviewControl.prototype.marker_.getLatLng().lng();
    ExtStreetviewControl.prototype.lng_ = currentLng;
    
    var dragDirection = beforeLng-currentLng;
    var imgTop;
    
    if(dragDirection>0){
        imgTop = 17;
    }else{
        imgTop = 18;
    };
    imgTop = -imgTop * ExtStreetviewControl.prototype.marker_.getIcon().iconSize.height;
    
    ExtStreetviewControl.prototype.marker_.getIconContainer_().firstChild.style.top=imgTop+"px";
};

//====================================//
//  event : pegman-marker drag end    //
//====================================//
ExtStreetviewControl.prototype.markerDragEnd_ = function() {
    var latlng = ExtStreetviewControl.prototype.marker_.getLatLng();
    ExtStreetviewControl.prototype.map_.panTo(latlng);
    ExtStreetviewControl.prototype.setLocationAndPOV(latlng);
};


//====================================//
//  event : yawchanged on streetview  //
//====================================//
ExtStreetviewControl.prototype.yawChanged_ = function(yaw) {
    ExtStreetviewControl.prototype.pov_.yaw = yaw;

    var imgTop = -Math.floor(yaw/(360/16))*ExtStreetviewControl.prototype.marker_.getIcon().iconSize.height;
    
    ExtStreetviewControl.prototype.marker_.getIconContainer_().firstChild.style.top=imgTop+"px";
};
//====================================//
//  event : pitchchanged on streetview//
//====================================//
ExtStreetviewControl.prototype.pitChchanged_ = function(pitch) {
    ExtStreetviewControl.prototype.pov_.pitch = pitch;
};

//====================================//
//  event : window resize             //
//====================================//
ExtStreetviewControl.prototype.windowResize_ = function() {
    if(ExtStreetviewControl.prototype.maximize_){
        var mapSize = ExtStreetviewControl.prototype.map_.getSize();
        mapSize.height=Math.floor(mapSize.height);
        with(ExtStreetviewControl.prototype.container_.style){
            left = null;
            top = null;
            width=mapSize.width+"px";
            height=mapSize.height+"px";
        };
        
        with(ExtStreetviewControl.prototype.visibleContainer_.style){
            width=mapSize.width+"px";
            height=mapSize.height+"px";
        };

        with(ExtStreetviewControl.prototype.flashContainer_.style){
            width=(mapSize.width-5)+"px";
            height=(mapSize.height-5)+"px";
        };
        
        ExtStreetviewControl.prototype.stObj_.checkResize();
    };
};


//====================================//
//  event : click maximize button     //
//====================================//
ExtStreetviewControl.prototype.toggleMaximize_ = function() {
    var mapSize = ExtStreetviewControl.prototype.map_.getSize();
    var param = new Object();
    param.x = ExtStreetviewControl.prototype.container_.offsetLeft;
    param.y = ExtStreetviewControl.prototype.container_.offsetTop;
    param.width = ExtStreetviewControl.prototype.container_.offsetWidth;
    param.height = ExtStreetviewControl.prototype.container_.offsetHeight;
    param.maxWidth = mapSize.width ;
    param.maxHeight = mapSize.height;
    param.xStep = (param.maxWidth - ExtStreetviewControl.prototype.ctrlSize_.width )  / 10;
    param.yStep = (param.maxHeight - ExtStreetviewControl.prototype.ctrlSize_.height) / 10;
    
    param.cnt = 0;
    if(ExtStreetviewControl.prototype.maximize_){
        ExtStreetviewControl.prototype.maximize_ = false;
        param.aniPosDirection = 1;
        param.aniSizeDirection = -1;
        param.maximizeImgY = 0;
        ExtStreetviewControl.prototype.container_.style.width=ExtStreetviewControl.prototype.ctrlSize_.width+"px";
        ExtStreetviewControl.prototype.container_.style.height=ExtStreetviewControl.prototype.ctrlSize_.height+"px";
        param.maxWidth = ExtStreetviewControl.prototype.ctrlSize_.width ;
        param.maxHeight = ExtStreetviewControl.prototype.ctrlSize_.height;
        ExtStreetviewControl.prototype.minmizeBtn_.style.visibility="visible";
    }else{
        ExtStreetviewControl.prototype.maximize_ = true;
        param.aniPosDirection = -1;
        param.aniSizeDirection = 1;
        param.maximizeImgY = -17;
        ExtStreetviewControl.prototype.container_.style.width=mapSize.width+"px";
        ExtStreetviewControl.prototype.container_.style.height=(mapSize.height)+"px";
        
        ExtStreetviewControl.prototype.minmizeBtn_.style.visibility="hidden";
    };
    if(ExtStreetviewControl.prototype.isIE_() && ExtStreetviewControl.prototype.latlng_){
        if(document.location.protocol.toLowerCase()=="file:"){
            ExtStreetviewControl.prototype.stObj_.hide();
        };
    };
    ExtStreetviewControl.prototype.flashContainer_.style.visibility="hidden";

    function max_resizeAnimation(param){
        param.x = param.x + param.aniPosDirection * param.xStep;
        param.x = param.x < 0  ? 0 : param.x;
        param.y = param.y + param.aniPosDirection * param.yStep;
        param.y = param.y < 0  ? 0 : param.y;
        param.width = param.width + param.aniSizeDirection * param.xStep;
        param.height = param.height + param.aniSizeDirection * param.yStep;
        
        with(ExtStreetviewControl.prototype.container_.style){
            left = param.x+"px";
            top = param.y+"px";
            width=param.width+"px";
            height=param.height+"px";
        };
        with(ExtStreetviewControl.prototype.visibleContainer_.style){
            width=param.width+"px";
            height=param.height+"px";
        };

        with(ExtStreetviewControl.prototype.flashContainer_.style){
            width=(param.width-5)+"px";
            height=(param.height-5)+"px";
        };
        
        
        param.cnt++;
        if(param.cnt <10){
            var arg = arguments;
            setTimeout(function(){arg.callee.apply(null, arg);}, 10);
        }else{
            with(ExtStreetviewControl.prototype.container_.style){
                width=(param.maxWidth)+"px";
                height=(param.maxHeight)+"px";
                left = null;
                top = null;
            };
            ExtStreetviewControl.prototype.maximizeBtn_.firstChild.style.top=param.maximizeImgY;
            if(ExtStreetviewControl.prototype.isIE_() && ExtStreetviewControl.prototype.latlng_){
                if(document.location.protocol.toLowerCase()=="file:"){
                    ExtStreetviewControl.prototype.stObj_.show();
                };
            };
            ExtStreetviewControl.prototype.flashContainer_.style.visibility="visible";
            ExtStreetviewControl.prototype.stObj_.checkResize();
        };
    };
    max_resizeAnimation(param);
};

//====================================//
//  event : click minimize button     //
//====================================//
ExtStreetviewControl.prototype.toggleMinimize_ = function() {
    var param = new Object();
    with(ExtStreetviewControl.prototype.container_){
        param.x = offsetLeft;
        param.y = offsetTop;
        param.width = offsetWidth;
        param.height = offsetHeight;
    };
    param.xStep = ( ExtStreetviewControl.prototype.ctrlSize_.width -15)  / 10;
    param.yStep = ( ExtStreetviewControl.prototype.ctrlSize_.height -15) / 10;
    param.cnt = 0;
    if(ExtStreetviewControl.prototype.minimize_){
        ExtStreetviewControl.prototype.minimize_ = false;
        param.aniPosDirection = -1;
        param.aniSizeDirection = 1;
        param.minimizeImgY = -428;
        
        param.maxWidth=ExtStreetviewControl.prototype.ctrlSize_.width;
        param.maxHeight=ExtStreetviewControl.prototype.ctrlSize_.height;
    }else{
        ExtStreetviewControl.prototype.minimize_ = true;
        param.aniPosDirection = 1;
        param.aniSizeDirection = -1;
        param.minimizeImgY = -443;
        param.maxWidth = 15 ;
        param.maxHeight = 15;
    };
    
    ExtStreetviewControl.prototype.flashContainer_.style.visibility="hidden";
    
    function min_resizeAnimation(param){
        param.x = param.x + param.aniPosDirection * param.xStep;
        param.x = param.x < 0  ? 0 : param.x;
        param.y = param.y + param.aniPosDirection * param.yStep;
        param.y = param.y < 0  ? 0 : param.y;
        param.width = param.width + param.aniSizeDirection * param.xStep;
        param.height = param.height + param.aniSizeDirection * param.yStep;
        
        with(ExtStreetviewControl.prototype.container_.style){
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
            ExtStreetviewControl.prototype.minmizeBtn_.firstChild.style.top=param.minimizeImgY;
            with(ExtStreetviewControl.prototype.container_.style){
                width=(param.maxWidth)+"px";
                height=(param.maxHeight)+"px";
                left = null;
                top = null;
                right="0px";
                bottom="0px";
            };
            if(!ExtStreetviewControl.prototype.minimize_){
                ExtStreetviewControl.prototype.flashContainer_.style.visibility="visible";
            };
        };
    };
    min_resizeAnimation(param);
};

//================================//
//  method : getLatLng //
//================================//
ExtStreetviewControl.prototype.getLatLng = function(){
    return ExtStreetviewControl.prototype.latlng_;
};

//================================//
//  method : getPov //
//================================//
ExtStreetviewControl.prototype.getPov = function(){
    if(!this.isNull(pov)){
        return ExtStreetviewControl.prototype.pov_;
    }else{
        return null;
    };
};

//====================================//
//  method : set location and pov     //
//====================================//
ExtStreetviewControl.prototype.setLocationAndPOV = function(latlng, pov) {
    if(!this.isNull(pov)){
        ExtStreetviewControl.prototype.pov_ = pov;
    };
    ExtStreetviewControl.prototype.stClient_.getNearestPanorama(latlng, ExtStreetviewControl.prototype.stClientEnum_ );
};
//====================================//
//  event : map move     //
//====================================//
ExtStreetviewControl.prototype.mapMove_ = function() {
    ExtStreetviewControl.prototype.bounds_ = ExtStreetviewControl.prototype.map_.getBounds();
};



//=========================================//
//  property : GControl getDefaultPosition //
//=========================================//
ExtStreetviewControl.prototype.getDefaultPosition = function() {
    return new GControlPosition(G_ANCHOR_BOTTOM_RIGHT, new GSize(0, 0));
};

//=================================//
//  property : GControl selectable //
//=================================//
ExtStreetviewControl.prototype.selectable = function(){
    return false;
};

//================================//
//  property : GControl printable //
//================================//
ExtStreetviewControl.prototype.printable = function(){
    return true;
};
//================================//
//  method : GControl remove //
//================================//
ExtStreetviewControl.prototype.removeControl_ = function(control){
    if(control.toString()==ExtStreetviewControl.prototype.toString()){
        for(var source in ExtStreetviewControl.prototype.eventHandler_){
            if(!ExtStreetviewControl.prototype.isNull(source)){
                GEvent.clearInstanceListeners(source);
            };
        };
        ExtStreetviewControl.prototype.stObj_.remove();
    };
    ExtStreetviewControl.prototype.removeControlOrg_.apply(this, arguments);
};

//=============================================//
//  event : changed the position on streetview //
//=============================================//
ExtStreetviewControl.prototype.stInitialized_ = function(location, force) {
    
    if(!ExtStreetviewControl.prototype.isNull(location.pov.yaw)
      || ExtStreetviewControl.prototype.isNull(ExtStreetviewControl.prototype.pov_.yaw)){
        ExtStreetviewControl.prototype.pov_ = location.pov;
    };
    if(force==true){
        ExtStreetviewControl.prototype.stObj_.setLocationAndPOV(location.latlng, ExtStreetviewControl.prototype.pov_);
    };
    
    ExtStreetviewControl.prototype.latlng_ = location.latlng;
    ExtStreetviewControl.prototype.marker_.setLatLng(location.latlng);
    if(!ExtStreetviewControl.prototype.bounds_.containsLatLng(location.latlng)){
        ExtStreetviewControl.prototype.map_.panTo(location.latlng);
    };

    ExtStreetviewControl.prototype.stViewCnt_++;
    if(ExtStreetviewControl.prototype.stViewCnt_>10){
        ExtStreetviewControl.prototype.createStreetviewPanorama();
    };
};

//========================================//
//  enum : callback for GStreetviewClient //
//========================================//
ExtStreetviewControl.prototype.stClientEnum_ = function(gstreetviewdata){
    if(gstreetviewdata.code!=200){
        ExtStreetviewControl.prototype.marker_.getIconContainer_().firstChild.style.top="0px";
        ExtStreetviewControl.prototype.stObj_.remove();
        return;
    };
    if(ExtStreetviewControl.prototype.stObj_){
        if(ExtStreetviewControl.prototype.stObj_.isHidden()){
            ExtStreetviewControl.prototype.createStreetviewPanorama();
        };
    };
    
    ExtStreetviewControl.prototype.stInitialized_(gstreetviewdata.location,true);
    
    if(ExtStreetviewControl.prototype.isIE_() && !ExtStreetviewControl.prototype.marker_.isFirst_){
        if(document.location.protocol.toLowerCase()=="file:"){
            ExtStreetviewControl.prototype.stObj_.show();
        };
    };
    ExtStreetviewControl.prototype.marker_.isFirst_=false;

};

//==========================//
//  @method : detect Null   //
//==========================//
ExtStreetviewControl.prototype.isNull = function(value) {
    if(!value && value!=0 ||
       value==undefined ||
       value=="" ||
       value==null ||
       typeof value=="undefined"){return true;};
    return false;
};

//==========================//
//  @property : detect IE   //
//==========================//
ExtStreetviewControl.prototype.isIE_ = function() {
    return (navigator.userAgent.toLowerCase().indexOf('msie') != -1 ) ? true : false;
};

//=============================================//
//  @private : create new Streetview Panorama  //
//=============================================//
ExtStreetviewControl.prototype.createStreetviewPanorama = function() {
    var options={};
    if(!ExtStreetviewControl.prototype.isNull(ExtStreetviewControl.prototype.stObj_)){
        GEvent.clearInstanceListeners(ExtStreetviewControl.prototype.stObj_);
        ExtStreetviewControl.prototype.stObj_.remove();
        options.latlng = ExtStreetviewControl.prototype.latlng_;
        options.pov = ExtStreetviewControl.prototype.pov_;
    };
    
    var stObj = new GStreetviewPanorama(ExtStreetviewControl.prototype.flashContainer_,options);
    ExtStreetviewControl.prototype.setEventListener(stObj, "initialized", ExtStreetviewControl.prototype.stInitialized_);
    
    ExtStreetviewControl.prototype.stViewCnt_ = 0;
    ExtStreetviewControl.prototype.stObj_ = stObj;
    
    ExtStreetviewControl.prototype.setDomEventListener(stObj, "yawchanged", ExtStreetviewControl.prototype.yawChanged_);
    ExtStreetviewControl.prototype.setDomEventListener(stObj, "pitchchanged", ExtStreetviewControl.prototype.pitChchanged_);
};
//=================================//
//  @private : add event listener  //
//=================================//
ExtStreetviewControl.prototype.setEventListener = function(source, eventName, handler) {
    var hEvt = ExtStreetviewControl.prototype.eventHandler_[source];
    if(ExtStreetviewControl.prototype.isNull(hEvt)){
        ExtStreetviewControl.prototype.eventHandler_[source]=new Object();
    }else{
        hEvt = ExtStreetviewControl.prototype.eventHandler_[source][eventName];
        if(!ExtStreetviewControl.prototype.isNull(hEvt)){
            GEvent.removeListener(hEvt);
        };
    };
    hEvt = GEvent.addListener(source, eventName, handler);
    ExtStreetviewControl.prototype.eventHandler_[source][eventName]=hEvt;
};
//=================================//
//  @private : add domEvent listener  //
//=================================//
ExtStreetviewControl.prototype.setDomEventListener = function(source, eventName, handler) {
    var hEvt = ExtStreetviewControl.prototype.eventHandler_[source];
    if(ExtStreetviewControl.prototype.isNull(hEvt)){
        ExtStreetviewControl.prototype.eventHandler_[source]=new Object();
    }else{
        hEvt = ExtStreetviewControl.prototype.eventHandler_[source][eventName];
        if(!ExtStreetviewControl.prototype.isNull(hEvt)){
            GEvent.removeListener(hEvt);
        };
    };
    hEvt = GEvent.addDomListener(source, eventName, handler);
    ExtStreetviewControl.prototype.eventHandler_[source][eventName]=hEvt;
};

//=================================//
//  @private : create div element  //
//=================================//
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
//=====================//
//  method : toString  //
//=====================//
ExtStreetviewControl.prototype.toString=function(){
    return "extstreetviewcontrol";
};
