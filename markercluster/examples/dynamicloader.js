/**
 * @fileoverview dynamicloader first load google maps api then load other js
 * depends on google maps api.
 * @author frank2008cn@gmail.com (Xiaoxi Wu)
 */

(function() {
   /**
    * Dynamic Loader loads google maps api and other js depends on google maps
    * api dynamicly.
    * Usage: DynamicLoader(urls, initfn, 'google maps api key', 'ditu.google.cn');
    * @param {Array.<string>} pUrls urls that loaded after google maps api.
    * @param {string} pCommand the command to be executed after all files loaded.
    * @param {string} pApiKey the google maps api key for your site
    * @param {string} pBaseDomain the google maps api domain. default value is
    *     "ditu.google.cn"
    * @constructor
    */
   var DynamicLoader = function(pUrls, pCommand, pApiKey, pBaseDomain) {

     // initialization
     var baseDomain = 'ditu.google.cn';
     var apiKey = pApiKey;
     var urls = pUrls;
     var jsCount = 0;
     var initFn = pCommand;
     if(typeof pBaseDomain != "undefined") {
       baseDomain = pBaseDomain;
     }

     /**
      * load a js file dynamicly
      * @param {string} url js file url.
      * @param {function} callback callback function after file loaded.
      */
     var load = function(url, callback) {
       var script = document.createElement("script");
       if(typeof callback != "undefined") {
         script.onload = callback;
         script.onreadystatechange = callback;
       }
       script.src = url;
       script.type = "text/javascript";
       document.getElementsByTagName("head")[0].appendChild(script);
     };

     /**
      * callback function when js file loaded.
      */
     var loaded = function() {
       jsCount ++;

       // if all files are loaded and user provided a init function, execute it.
       if(jsCount == urls.length && typeof initFn != "undefined" && initFn != null) {
         eval(initFn);
       }
     };

     /**
      * load a set of js files.
      */
     var loadJs = function() {
       for(var i = 0; i < urls.length; i++) {
         var url = urls[i];
         load(url, loaded);
       }
     };

     /**
      * load google ajax api then load google maps api.
      */
     var loadApp = function() {
       load('http://www.google.com/jsapi?key=' + apiKey + '&callback=_DynamicLoader.loadMapsApi');
     };

     /**
      * load google maps api and call loadJs
      */
     DynamicLoader.loadMapsApi = function() {
       google.load("maps", "2", {'callback': loadJs, 'base_domain': baseDomain});
     };
     loadApp();
   };
   window._DynamicLoader = DynamicLoader || window._DynamicLoader;
 })();
