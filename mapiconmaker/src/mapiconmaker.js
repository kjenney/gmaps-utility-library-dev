/**
 * MapIconMaker v1.0
 * Copyright (c) 2008 Pamela Fox
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License. 
 *
 *
 *  Author: Pamela Fox
 *
 *  This gives you static function(s) for creating dynamically sized and
 *  colored marker icons using the Charts API marker output.
 */

var MapIconMaker = {};

MapIconMaker.createMarkerIcon = function (opts) {
  var width = opts.width || 32;
  var height = opts.height || 32;
  var primaryColor = opts.primaryColor || "#ff0000";
  var strokeColor = opts.strokeColor || "#000000";
  var cornerColor = opts.cornerColor || "#ffffff";
  var transparency = opts.transparency;
   
  var baseUrl = "http://chart.apis.google.com/chart?cht=mm";
  var iconUrl = baseUrl + "&chs=" + width + "x" + height + "&chco=" + cornerColor.replace("#", "") + "," + primaryColor.replace("#", "") + "," + strokeColor.replace("#", "") + "&ext=.png";
  if (transparency) {
    iconUrl = iconUrl + "&chf=a,s,ffffff" + transparency;
  }
  var icon = new GIcon(G_DEFAULT_ICON);
  icon.image = iconUrl;
  icon.iconSize = new GSize(width, height);
  icon.shadowSize = new GSize(Math.floor(width * 1.6), height);
  icon.iconAnchor = new GPoint(width / 2, height);
  icon.infoWindowAnchor = new GPoint(width / 2, Math.floor(height / 12));
  icon.printImage = iconUrl + "&chof=gif";
  icon.mozPrintImage = iconUrl + "&chf=bg,s,ECECD8" + "&chof=gif";
  icon.transparent = baseUrl + "&chs=" + width + "x" + height + "&chco=" + cornerColor.replace("#", "") + "," + primaryColor.replace("#", "") + "," + strokeColor.replace("#", "") + "&chf=a,s,ffffff11&ext=.png";

  icon.imageMap = [
    width / 2, height,
    (7 / 16) * width, (5 / 8) * height,
    (5 / 16) * width, (7 / 16) * height,
    (7 / 32) * width, (5 / 16) * height,
    (5 / 16) * width, (1 / 8) * height,
    (1 / 2) * width, 0,
    (11 / 16) * width, (1 / 8) * height,
    (25 / 32) * width, (5 / 16) * height,
    (11 / 16) * width, (7 / 16) * height,
    (9 / 16) * width, (5 / 8) * height
  ];
  for (var i = 0; i < icon.imageMap.length; i++) {
    icon.imageMap[i] = parseInt(icon.imageMap[i], 10);
  }

  return icon;
};

MapIconMaker.createFlatIcon = function (opts) {
  var width = opts.width || 32;
  var height = opts.height || 32;
  var primaryColor = opts.primaryColor || "#ff0000";
  var shadowColor = opts.shadowColor || "#000000";
  var text = opts.text || "";
  var textColor = opts.textColor || "#000000";
  var textSize = opts.textSize || 0;
  var type = opts.type || "circle";
  var typeCode = (type === "circle") ? "it" : "itr";

  var baseUrl = "http://chart.apis.google.com/chart?cht=" + typeCode;
  var iconUrl = baseUrl + "&chs=" + width + "x" + height + "&chco=" + primaryColor.replace("#", "") + "," + shadowColor.replace("#", "") + "ff,ffffff01" + "&chl=" + text + "&chx=" + textColor.replace("#", "") + "," + textSize;
  var icon = new GIcon(G_DEFAULT_ICON);
  icon.image = iconUrl + "&chf=bg,s,00000000" + "&ext=.png";
  icon.iconSize = new GSize(width, height);
  icon.shadowSize = new GSize(0, 0);
  icon.iconAnchor = new GPoint(width / 2, height / 2);
  icon.infoWindowAnchor = new GPoint(width / 2, height / 2);
  icon.printImage = iconUrl + "&chof=gif";
  icon.mozPrintImage = iconUrl + "&chf=bg,s,ECECD8" + "&chof=gif";
  icon.transparent = iconUrl + "&chf=a,s,ffffff11&ext=.png";
  // icon.imageMap, im lazy
  return icon;
};

