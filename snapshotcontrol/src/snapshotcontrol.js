/**
 * @name SnapShotControl(tempolary class name)
 * @version 1.0
 */


/**
 * @constructor
 */    
function SnapShotControl(container, opts) {
  this.cameraImgSrc = "http://www.google.com/mapfiles/cb/camera.png";
  this.transImgSrc = "http://www.google.com/mapfiles/transparent.png";
  
  this.snapContainer = container;
  
  this.snapContainerImg = new Image();
  this.snapContainerImg.src=this.transImgSrc;
  container.appendChild(this.snapContainerImg);
  
  if(this.isNull(opts)){
    opts=new Object();
  };
  this.buttonLabel_ = opts.buttonLabel_ || "shot!";
  this.maptype_ = opts.maptype_ || "";
  this.size_ = opts.size_ || "";
  
  this.divTbl = {};
  this.divTbl.container = { "left" : 0, "top" : 0, "width" : 60, "height":26, "bgcolor":"white"};
  this.divTbl.cameraImg = { "left" : 2, "top" : 2, "width" : 27, "height" : 22};
  this.divTbl.camera = { "left" : 1, "top" : 1};
  this.divTbl.buttonLabel = { "left" : 30, "top" : 1};
  
  //find api key
  var scripts = document.getElementsByTagName("script");
  var key="";
  for(var i=0;i<scripts.length;i++){
    var scriptNode=scripts[i];
    if(scriptNode.src.match(/^http:\/\/maps\.google\..*?&(?:amp;)?key=([^\&]+)/gi)){
      key=RegExp.$1;
      break;
    };
  };
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
  this.polylines_ = new Array();
  this.markers_ = new Array();

  var agt = navigator.userAgent.toLowerCase(this.divTbl.container);
  
  this._is_ie    = ((agt.indexOf("msie") !== -1) && (agt.indexOf("opera") === -1));
  this._is_gecko = (agt.indexOf('gecko') !== -1);
  this._is_opera = (agt.indexOf("opera") !== -1);

  
  //calculating of the button label
  var text = document.createElement("span");
  text.appendChild(document.createTextNode(this.buttonLabel_));
  text.style.position="absolute";
  text.style.left=this.divTbl.buttonLabel.left+"px";
  text.style.bottom=this.divTbl.buttonLabel.top+"px";
  text.style.fontSize="12px";
  text.style.lineHeight="12px";
  
  
  // create container
  var container = this.createDiv_(this.divTbl.container);
  with(container.style){
    borderStyle="solid";
    borderWidth="1px";
    borderColor="white #b0b0b0 #b0b0b0 white";
    color="black";
    cursor="pointer";
  };
  this._container = container;

  //camera Img
  var cameraImg = this.makeImgDiv_(this.cameraImgSrc, this.divTbl.cameraImg);
  with(cameraImg.style){
    cursor="pointer";
    left=this.divTbl.camera.left+"px";
    top=this.divTbl.camera.top+"px";
  };
  container.appendChild(cameraImg); 
  
  //button label
  container.appendChild(text); 

  // events
  GEvent.bindDom(container, "click", this, this._click);
  GEvent.bind(map, "addoverlay", this, this._addOverlay);

  map.getContainer().appendChild(container);
  
  return container;
};

/**
 * @private
 */
SnapShotControl.prototype._addOverlay = function (overlay) {
  switch(this.detectOverlay(overlay)){
    case "GPolyline":
      var polygonInfo = new Object();
      polygonInfo.handle = overlay;
      polygonInfo.color = this.colorNameToRgb(overlay.color).replace("#","0x");
      polygonInfo.weight = overlay.weight;
      polygonInfo.opacity = Math.floor(overlay.opacity*255).toString(16);
      polygonInfo.vertexCount = overlay.getVertexCount();
      polygonInfo.vertexList = new Array();
      polygonInfo.drawFlagList = new Array();
      for(var i=0;i<polygonInfo.vertexCount;i++){
        var pos = new GLatLng(this.floor6decimal(overlay.getVertex(i).lat()), this.floor6decimal(overlay.getVertex(i).lng()));
        polygonInfo.vertexList.push(pos);
      };
      this.polylines_.push(polygonInfo);
      break;
      
    case "GMarker":
      var markerInfo = new Object();
      markerInfo.handle = overlay;
      
      this.markers_.push(markerInfo);
      break;
  };
};

/**
 * @private
 * @desc detecting the overlay
 */
SnapShotControl.prototype.detectOverlay = function (overlay) {
  var overlayProperties = new Array();
  for(var key in overlay){
    overlayProperties[key]=1;
  };
  
  var this_ = this;
  
  var matchingTest=function(checkClass){
    for(var key2 in checkClass.prototype){
      if(this_.isNull(overlayProperties[key2]) && key2!="prototype"){
        return false;
      };
    };
    return true;
  };
  
  if(matchingTest(GPolyline)){return "GPolyline";};
  if(matchingTest(GMarker)){return "GMarker";};
  
  return undefined;
};

/**
 * @private
 */
SnapShotControl.prototype._click = function () {
  var url="http://maps.google.com/staticmap?key="+this.apiKey_;
  
  
  //center position
  var mapCenterPos = this.map_.getCenter();
  url+="&center="+(this.floor6decimal(mapCenterPos.lat()))+","+(this.floor6decimal(mapCenterPos.lng()));
  
  //size
  var mapSize = this.map_.getSize();
  if(!this.isNull(this.size_)){
    url+="&size="+this.size_;
    var size = this.size_.split("x");
    this.snapContainerImg.width=size[0]+"px";
    this.snapContainerImg.height=size[1]+"px";
  }else{
    url+="&size="+mapSize.width+"x"+mapSize.height;
    this.snapContainerImg.width=mapSize.width;
    this.snapContainerImg.height=mapSize.height;
  };
  

  
  //zoom level
  url+="&zoom="+this.map_.getZoom();
  
  //map type
  var maptype="";
  if(this.isNull(this.maptype_)){
    switch(this.map_.getCurrentMapType()){
      case G_SATELLITE_MAP:
        maptype = "satellite";
        break;
      case G_HYBRID_MAP:
        maptype = "hybrid";
        break;
      case G_PHYSICAL_MAP:
        maptype = "terrain";
        break;
    };
  }else{
    maptype=this.maptype_;
  };
  if(maptype!=""){
    url+="&maptype="+maptype;
  };
  
  //polylines
  var bounds = this.map_.getBounds();
  var is_draw_ = false;
  var lineBound ;
  for(var i=0;i<this.polylines_.length;i++){
    var polyline = this.polylines_[i];
    if(polyline.handle.isHidden()==false){
      var vertexLatLng;
      var pathStr="";
      var addedList = new Array(polyline.vertexCount);
      polyline.drawFlagList[0]=false;
      addedList[0]=0;
      for(var j=1;j<polyline.vertexCount;j++){
        addedList[j]=0;
        polyline.drawFlagList[j] = bounds.containsLatLng(polyline.vertexList[j]);
        if(polyline.drawFlagList[j-1] || polyline.drawFlagList[j]){
          if(polyline.drawFlagList[j-1]==false && addedList[j-1]==0){
            pathStr+="|"+polyline.vertexList[j-1].lat()+","+polyline.vertexList[j-1].lng();
          };
          pathStr+="|"+polyline.vertexList[j].lat()+","+polyline.vertexList[j].lng();
          addedList[j]=1;
        }else{
          lineBound = new GLatLngBounds(polyline.vertexList[j-1], polyline.vertexList[j]);
          
          polyline.drawFlagList[j]=bounds.intersects(lineBound);
          
          
          if(polyline.drawFlagList[j]==true){
            if(polyline.drawFlagList[j-1]==false && addedList[j-1]==0){
              pathStr+="|"+polyline.vertexList[j-1].lat()+","+polyline.vertexList[j-1].lng();
            };
            pathStr+="|"+polyline.vertexList[j].lat()+","+polyline.vertexList[j].lng();
            addedList[j]=1;
          }else if(polyline.drawFlagList[j-1]==true){
            if(addedList[j-1]==0){
              pathStr+="|"+polyline.vertexList[j-1].lat()+","+polyline.vertexList[j-1].lng();
            };
            pathStr+="|"+polyline.vertexList[j].lat()+","+polyline.vertexList[j].lng();
            addedList[j]=1;
          };
        };
      };
      if(pathStr!=""){
        var path="&path=";
        if(polyline.opacity.toLowerCase()=="7f"){
          path+="rgb:"+ polyline.color;
        }else{
          path+="rgba:"+ polyline.color+polyline.opacity;
        };
        if(!this.isNull(polyline.weight)){
          path+=",weight:" + polyline.weight;
        };
        path+=pathStr;
        url+=path;
      };
    };
    
    //markers
    var markerStr="";
    var markerLatLng;
    var markerSize;
    var markerAlphaNumeric;
    var markerColor;
    var optStr="";
    for(var i=0;i<this.markers_.length;i++){
      markerLatLng = this.markers_[i].handle.getLatLng();
      if(!this.markers_[i].handle.isHidden() && bounds.containsLatLng(markerLatLng)){
      
        markerStr+=(markerStr!="" ? "|":"")+this.floor6decimal(markerLatLng.lat())+","+this.floor6decimal(markerLatLng.lng());
        
        optStr="";
        //{size}
        markerSize=this.markers_[i].handle.size;
        if(!this.isNull(markerSize)){
          markerSize=markerSize.toLowerCase();
          if(markerSize=="normal" || markerSize=="tiny" || markerSize=="mid" || markerSize=="small"){
            optStr+=markerSize;
          };
        };
        
        //{color}
        markerColor=this.markers_[i].handle.color;
        if(!this.isNull(markerColor)){
          markerColor= markerColor.toLowerCase();
          if(markerColor=="black" || markerColor=="brown" || markerColor=="purple" || markerColor=="green"
            || markerColor=="yellow" || markerColor=="blue" || markerColor=="gray" || markerColor=="orange"
            || markerColor=="red" || markerColor=="white"){
            optStr+=markerColor;
          };
        }else if(!this.isNull(markerSize)){
          optStr+="red";
        };
        
        //{alphanumeric-character}
        markerAlphaNumeric=this.markers_[i].handle.charactor;
        if(!this.isNull(markerAlphaNumeric) && markerSize!="small" && markerSize!="tiny" ){
          if(markerAlphaNumeric.match(/^[a-zA-Z0-9]/)){
            if(optStr==""){
              optStr="red";
            };
            optStr+=markerAlphaNumeric.substr(0,1);
          };
        };
        
        if(optStr!=""){
          markerStr+="," + optStr;
        };
      };
    };
    url+="&markers="+markerStr;
  };

  this.snapContainerImg.src=url;
  this.imgUrl_ = url;
  
};

/**
 * @name getImageUrl
 * @desc
 */
SnapShotControl.prototype.getImageUrl = function () {
  return this.imgUrl_;
};

/**
 * @private
 * @ignore
 */
SnapShotControl.prototype.floor6decimal = function (value) {
  return (Math.floor(value*1000000)/1000000);
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
  };
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
  };
  if (params.height) {
    imgDiv.style.height = params.height + "px";
  };
  
  
  var img = null;
  if (!this._is_ie) {
    img = new Image();
    img.src = imgSrc;
  } else {
    img = document.createElement("div");
    if (params.width) {
      img.style.width = params.width + "px";
    };
    if (params.height) {
      img.style.height = params.height + "px";
    };
  };
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
SnapShotControl.prototype.createDiv_=function(params){
  
  var bgDiv = document.createElement("div");
  with(bgDiv.style){
    position="absolute";
    if(!this.isNull(params.bgcolor)){backgroundColor=params.bgcolor;};
    if(!this.isNull(params.color)){backgroundColor=params.color;};
    fontSize="1px";
    lineHeight="1px";
    overflow="hidden";
    left = params.left+"px";
    top = params.top+"px";
    width = params.width+"px";
    height = params.height+"px";
  };
  return bgDiv;
};

/**
 * @private
 */
SnapShotControl.prototype.colorNameToRgb=function(colorName){
  var colorNameTable = new Array();
  
  colorNameTable["black"]="0x000000";
  colorNameTable["navy"]="0x000080";
  colorNameTable["darkblue"]="0x00008B";
  colorNameTable["mediumblue"]="0x0000CD";
  colorNameTable["blue"]="0x0000FF";
  colorNameTable["darkgreen"]="0x006400";
  colorNameTable["green"]="0x008000";
  colorNameTable["teal"]="0x008080";
  colorNameTable["darkcyan"]="0x008B8B";
  colorNameTable["deepskyblue"]="0x00BFFF";
  colorNameTable["darkturquoise"]="0x00CED1";
  colorNameTable["mediumspringgreen"]="0x00FA9A";
  colorNameTable["lime"]="0x00FF00";
  colorNameTable["springgreen"]="0x00FF7F";
  colorNameTable["aqua"]="0x00FFFF";
  colorNameTable["cyan"]="0x00FFFF";
  colorNameTable["midnightblue"]="0x191970";
  colorNameTable["dodgerblue"]="0x1E90FF";
  colorNameTable["lightseagreen"]="0x20B2AA";
  colorNameTable["forestgreen"]="0x228B22";
  colorNameTable["seagreen"]="0x2E8B57";
  colorNameTable["darkslategray"]="0x2F4F4F";
  colorNameTable["limegreen"]="0x32CD32";
  colorNameTable["mediumseagreen"]="0x3CB371";
  colorNameTable["turquoise"]="0x40E0D0";
  colorNameTable["royalblue"]="0x4169E1";
  colorNameTable["steelblue"]="0x4682B4";
  colorNameTable["darkslateblue"]="0x483D8B";
  colorNameTable["mediumturquoise"]="0x48D1CC";
  colorNameTable["indigo"]="0x4B0082";
  colorNameTable["darkolivegreen"]="0x556B2F";
  colorNameTable["cadetblue"]="0x5F9EA0";
  colorNameTable["cornflowerblue"]="0x6495ED";
  colorNameTable["mediumaquamarine"]="0x66CDAA";
  colorNameTable["olivedrab"]="0x688E23";
  colorNameTable["dimgray"]="0x696969";
  colorNameTable["slateblue"]="0x6A5ACD";
  colorNameTable["slategray"]="0x708090";
  colorNameTable["lightslategray"]="0x778899";
  colorNameTable["mediumslateblue"]="0x7B68EE";
  colorNameTable["lawngreen"]="0x7CFC00";
  colorNameTable["chartreuse"]="0x7FFF00";
  colorNameTable["aquamarine"]="0x7FFFD4";
  colorNameTable["maroon"]="0x800000";
  colorNameTable["purple"]="0x800080";
  colorNameTable["olive"]="0x808000";
  colorNameTable["gray"]="0x808080";
  colorNameTable["skyblue"]="0x87CEEB";
  colorNameTable["lightskyblue"]="0x87CEFA";
  colorNameTable["blueviolet"]="0x8A2BE2";
  colorNameTable["darkred"]="0x8B0000";
  colorNameTable["darkmagenta"]="0x8B008B";
  colorNameTable["saddlebrown"]="0x8B4513";
  colorNameTable["darkseagreen"]="0x8FBC8F";
  colorNameTable["lightgreen"]="0x90EE90";
  colorNameTable["mediumpurple"]="0x9370D8";
  colorNameTable["darkviolet"]="0x9400D3";
  colorNameTable["palegreen"]="0x98FB98";
  colorNameTable["darkorchid"]="0x9932CC";
  colorNameTable["yellowgreen"]="0x9ACD32";
  colorNameTable["sienna"]="0xA0522D";
  colorNameTable["brown"]="0xA52A2A";
  colorNameTable["darkgray"]="0xA9A9A9";
  colorNameTable["lightblue"]="0xADD8E6";
  colorNameTable["greenyellow"]="0xADFF2F";
  colorNameTable["paleturquoise"]="0xAFEEEE";
  colorNameTable["lightsteelblue"]="0xB0C4DE";
  colorNameTable["powderblue"]="0xB0E0E6";
  colorNameTable["firebrick"]="0xB22222";
  colorNameTable["darkgoldenrod"]="0xB8860B";
  colorNameTable["mediumorchid"]="0xBA55D3";
  colorNameTable["rosybrown"]="0xBC8F8F";
  colorNameTable["darkkhaki"]="0xBDB76B";
  colorNameTable["silver"]="0xC0C0C0";
  colorNameTable["mediumvioletred"]="0xC71585";
  colorNameTable["indianred"]="0xCD5C5C";
  colorNameTable["peru"]="0xCD853F";
  colorNameTable["chocolate"]="0xD2691E";
  colorNameTable["tan"]="0xD2B48C";
  colorNameTable["lightgray"]="0xD3D3D3";
  colorNameTable["palevioletred"]="0xD87093";
  colorNameTable["thistle"]="0xD8BFD8";
  colorNameTable["orchid"]="0xDA70D6";
  colorNameTable["goldenrod"]="0xDAA520";
  colorNameTable["crimson"]="0xDC143C";
  colorNameTable["gainsboro"]="0xDCDCDC";
  colorNameTable["plum"]="0xDDA0DD";
  colorNameTable["burlywood"]="0xDEB887";
  colorNameTable["lightcyan"]="0xE0FFFF";
  colorNameTable["lavender"]="0xE6E6FA";
  colorNameTable["darksalmon"]="0xE9967A";
  colorNameTable["violet"]="0xEE82EE";
  colorNameTable["palegoldenrod"]="0xEEE8AA";
  colorNameTable["lightcoral"]="0xF08080";
  colorNameTable["khaki"]="0xF0E68C";
  colorNameTable["aliceblue"]="0xF0F8FF";
  colorNameTable["honeydew"]="0xF0FFF0";
  colorNameTable["azure"]="0xF0FFFF";
  colorNameTable["sandybrown"]="0xF4A460";
  colorNameTable["wheat"]="0xF5DEB3";
  colorNameTable["beige"]="0xF5F5DC";
  colorNameTable["whitesmoke"]="0xF5F5F5";
  colorNameTable["mintcream"]="0xF5FFFA";
  colorNameTable["ghostwhite"]="0xF8F8FF";
  colorNameTable["salmon"]="0xFA8072";
  colorNameTable["antiquewhite"]="0xFAEBD7";
  colorNameTable["linen"]="0xFAF0E6";
  colorNameTable["lightgoldenrodyellow"]="0xFAFAD2";
  colorNameTable["oldlace"]="0xFDF5E6";
  colorNameTable["red"]="0xFF0000";
  colorNameTable["fuchsia"]="0xFF00FF";
  colorNameTable["magenta"]="0xFF00FF";
  colorNameTable["deeppink"]="0xFF1493";
  colorNameTable["orangered"]="0xFF4500";
  colorNameTable["tomato"]="0xFF6347";
  colorNameTable["hotpink"]="0xFF69B4";
  colorNameTable["coral"]="0xFF7F50";
  colorNameTable["darkorange"]="0xFF8C00";
  colorNameTable["lightsalmon"]="0xFFA07A";
  colorNameTable["orange"]="0xFFA500";
  colorNameTable["lightpink"]="0xFFB6C1";
  colorNameTable["pink"]="0xFFC0CB";
  colorNameTable["gold"]="0xFFD700";
  colorNameTable["peachpuff"]="0xFFDAB9";
  colorNameTable["navajowhite"]="0xFFDEAD";
  colorNameTable["moccasin"]="0xFFE4B5";
  colorNameTable["bisque"]="0xFFE4C4";
  colorNameTable["mistyrose"]="0xFFE4E1";
  colorNameTable["blanchedalmond"]="0xFFEBCD";
  colorNameTable["papayawhip"]="0xFFEFD5";
  colorNameTable["lavenderblush"]="0xFFF0F5";
  colorNameTable["seashell"]="0xFFF5EE";
  colorNameTable["cornsilk"]="0xFFF8DC";
  colorNameTable["lemonchiffon"]="0xFFFACD";
  colorNameTable["floralwhite"]="0xFFFAF0";
  colorNameTable["snow"]="0xFFFAFA";
  colorNameTable["yellow"]="0xFFFF00";
  colorNameTable["lightyellow"]="0xFFFFE0";
  colorNameTable["ivory"]="0xFFFFF0";
  colorNameTable["white"]="0xFFFFFF";
  
  colorNameLow=colorName.toLowerCase();
  if(!this.isNull(colorNameTable[colorNameLow])){
    return colorNameTable[colorNameLow];
  }else{
    return colorName;
  };
};