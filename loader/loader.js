(function () {// New scope
  var releaseProjectBase = "http://gmaps-utility-library.googlecode.com/svn/trunk";
  var devProjectBase = "http://gmaps-utility-library-dev.googlecode.com/svn/trunk";
  var libraries = {
    "dragzoom" : ["1.0", "1.1", "1.2", "1.3"],
    "extinfowindow" : ["1.0"],
    "extmaptypecontrol" : ["1.0", "1.1", "1.2", "1.3"],
    "labeledmarker" : ["1.0", "1.1", "1.2"],
    "mapiconmaker" : ["1.0"],
    "markermanager" : ["1.0"],
    "markertracker" : ["1.0"]
  };
  var librariesToLoad = 0;
  var callbacks = {};
  function load (libName, libVersionRequested, libOptions) {
    // Determine which version to load
    if (!libraries[libName]) {
      alert("No library named " + libName + " exists.");
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
        alert("Invalid version requested.");
      } else {
        // Pick between the release and development projects
        var urlBase = libVersion === "" ? devProjectBase : releaseProjectBase;
        // Default to using the compressed versions of the libraries
        var packingOption = "_packed";
        // Parse optional parameters
        if (libOptions) {
          // Setup the callback
          callbacks[libName] = libOptions.callback;

          // Choose uncompressed option
          packingOption = libOptions.uncompressed ? "" : "_packed";
        }
        // Keep track of how many libraries we need to load
        librariesToLoad++;

        // Load the library
        var firstHead = document.getElementsByTagName("head")[0];
        var scriptTag = document.createElement("script");
        var libUrl = urlBase + "/" + libName + libVersion + "/src/" + libName + packingOption + ".js";
        scriptTag.setAttribute("src", libUrl);
        if (!window.google.maps) {
          alert("The Google Maps API must be loaded before loading any utility libraries.");
        } else {
          firstHead.appendChild(scriptTag);
        }
      }
    }
  }
  function loaded (libName) {
    console.log(libName + " loaded.");
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
  function setOnLoadCallback (callback) {
    callbacks.loader = callback;
  }
  var namespace = "google.extensions.maps";
	function exportSymbol(symbolName, symbol) {
	  symbolName = namespace + "." + symbolName;
		var symbolNameParts = symbolName.split(/\./);
		var currentNamespace = window;
		for (var i = 0; i < symbolNameParts.length-1; i++) {
			if (!currentNamespace[symbolNameParts[i]]) {
				currentNamespace[symbolNameParts[i]] = {}
			}
			currentNamespace = currentNamespace[symbolNameParts[i]];
		}
		currentNamespace[symbolNameParts[symbolNameParts.length-1]] = symbol;
	}
  exportSymbol("load", load);
  exportSymbol("setOnLoadCallback", setOnLoadCallback);
  exportSymbol("loader.loaded", loaded);
  exportSymbol("loader.exportSymbol", exportSymbol);
})();