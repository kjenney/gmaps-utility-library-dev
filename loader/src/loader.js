/**
 * @name Loader
 * @version 1.0 
 * @author Randy Becker
 * @copyright (c) 2008, Randy Becker
 * @fileoverview This library lets you load requested versions of other
 *     libraries from the GMaps Utility Library project on demand and within a
 *     unified global namespace.
 */

/*
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

(function () {// New Scope
  // Library locations
  var releaseProjectBase = "http://gmaps-utility-library.googlecode.com/svn/trunk";
  var devProjectBase = "http://gmaps-utility-library-dev.googlecode.com/svn/branches/lemnar-loader-branch/";

  // Library versions
  var libraries = {
    "dragzoom" : ["1.0", "1.1", "1.2", "1.3"],
    "extinfowindow" : ["1.0"],
    "extmaptypecontrol" : ["1.0", "1.1", "1.2", "1.3"],
    "labeledmarker" : ["1.0", "1.1", "1.2"],
    "mapiconmaker" : ["1.0"],
    "markermanager" : ["1.0"],
    "markertracker" : ["1.0"]
  };

  // A counter of the number of libraries to load
  var librariesToLoad = 0;

  // Stores the global ("loader") callback and individual library callbacks
  var callbacks = {};

  /**
   * All GMaps Utility Libraries will be available in both their old namespaces
   *     and the new <code>google.extenstions.maps</code> namespace.  New
   *     libraries will only be available in the new namespace.
   * @name google.extensions.maps
   * @namespace
   */

  /**
   * @name LoadOptions
   * @class This class represents optional arguments to <code>google.extensions.maps.load</code>.
   * @property {Boolean} [uncompressed=false] Load the uncompressed version of a library.
   * @property {Function} [callback] A function to call after this library has been loaded.
   */

  /**
   * Loads one of the GMaps Utility Libraries.
   * @name google.extensions.maps.load
   * @function
   * @param {String} libName The name of the library to load
   * @param {String} libVersionRequested The version to load.  Specify "x" to load the development version.
   * @param {LoadOptions} [opt_libOptions] Optional load parameters.
   */
  function load(libName, libVersionRequested, opt_libOptions) {
    // Determine which version to load
    if (!libraries[libName]) {
      alert("No utility library named " + libName + " exists.");
    } else {
      var libVersion;
      if (libVersionRequested === "x") {
        libVersion = "";
      } else {
        // Turn the request into a partial regex string
        libVersionRequested = "^" + libVersionRequested.replace(/\./, "\\.");
      }
      for (var i = 0; i < libraries[libName].length; i++) {
        if (libraries[libName][i].match(libVersionRequested)) {
          // Because versions are listed in ascending order in libraries[i],
          // the highest version matching the request will be selected.
          libVersion = "/" + libraries[libName][i];
        }
      }
      if (libVersion === undefined) {
        alert("Invalid utility library version requested.");
      } else {
        // Pick between the release and development projects
        var urlBase = libVersion === "" ? devProjectBase : releaseProjectBase;
        // Default to using the compressed versions of the libraries
        var packingOption = "_packed";
        // Parse optional parameters
        if (opt_libOptions) {
          // Setup the callback
          callbacks[libName] = opt_libOptions.callback;

          // Choose uncompressed option
          packingOption = opt_libOptions.uncompressed ? "" : "_packed";
        }
        // Keep track of how many libraries we need to load
        librariesToLoad++;

        // Actually load the library
        var libUrl = urlBase + "/" + libName + libVersion + "/src/" + libName + packingOption + ".js";
        var scriptTag = document.createElement("script");
        scriptTag.setAttribute("src", libUrl);
        if (!window.GMap2) {
          alert("The Google Maps API must be loaded before loading any utility libraries.");
        } else {
          var firstHead = document.getElementsByTagName("head")[0];
          firstHead.appendChild(scriptTag);
        }
      }
    }
  }

  /**
   * Called by a library after it has loaded
   * @name google.extensions.maps.loader.loaded
   * @private
   * @param {String} libName The name of the library that has just loaded.
   */
  function loaded(libName) {
    // Execute any lib-specific callback immediately upon being loaded.
    if (typeof callbacks[libName] === "function") {
      callbacks[libName]();
    }
    // Execute the final call back after all libraries have been loaded.
    librariesToLoad--;
    if ((librariesToLoad === 0) && (typeof callbacks.loader === "function")) {
      callbacks.loader();
    }
  }

  /**
   * Registers a function to be called once all requested libraries have been
   *     loaded.  This must be called before any calls to <code>google.extensions.maps.load</code>.
   * @name google.extensions.maps.setOnLoadCallback
   * @function
   * @param {Function} callback The function to be called once the libraries have been loaded.
   */
  function setOnLoadCallback(callback) {
    callbacks.loader = callback;
  }
  
  /**
   * Places a library's functionality into our unified global namespace.
   * @name google.extensions.maps.loader.exportSymbol
   * @function
   * @private
   * @param {String} symbolName The name of the library.
   * @param {Object} symbol The library's top-level object.
   */
  function exportSymbol(symbolName, symbol) {
    var namespace = "google.extensions.maps";
    symbolName = namespace + "." + symbolName;
    var symbolNameParts = symbolName.split(/\./);
    var currentNamespace = window;
    for (var i = 0; i < (symbolNameParts.length - 1); i++) {
      if (!currentNamespace[symbolNameParts[i]]) {
        currentNamespace[symbolNameParts[i]] = {};
      }
      currentNamespace = currentNamespace[symbolNameParts[i]];
    }
    currentNamespace[symbolNameParts[(symbolNameParts.length - 1)]] = symbol;
  }

  // Put our own functionality into our namespace
  exportSymbol("load", load);
  exportSymbol("setOnLoadCallback", setOnLoadCallback);
  exportSymbol("loader.loaded", loaded);
  exportSymbol("loader.exportSymbol", exportSymbol);
})();