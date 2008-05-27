/*jslint white: true, browser: true, undef: true, nomen: true, eqeqeq: true, glovar: true */
/*global gmapsUtilityLibrary*/
if (!window.gmapsUtilityLibrary) {
  window.gmapsUtilityLibrary = {};
}
if (!window.gmapsUtilityLibrary.loader) {
  window.gmapsUtilityLibrary.loader = {};
  (function() { // New scope
    var baseUrl = 'http://localhost/~rbecker1/lemnar-loader-branch/';

    // Insert a new script into DOM with a src of url
    function loadJavascript(url) {
      var scriptElement = document.createElement('script');
      scriptElement.setAttribute('type', 'text/javascript');
      scriptElement.setAttribute('src', url);
      document.getElementsByTagName('head')[0].appendChild(scriptElement);
    }

    // Build a list of libraries to load
    var librariesToLoad = [];
    var callbacks = {};
    function loadLibrary(libName, callback) {
      var library = {};
      library.name = libName;
      library.url = baseUrl + libName + '/src/' + libName + '.js';
      librariesToLoad.push(library);
      callbacks[libName] = callback;
    }

    // Actually start loading libraries
    var finalCallback = null;
    function setOnLoadCallback(onLoadFunction) {
      finalCallback = onLoadFunction;
      for (var library in librariesToLoad) if (librariesToLoad.hasOwnProperty(library)) {
        loadJavascript(librariesToLoad[library].url);
      }
    }

    // Execute a callback for the newly loaded library
    var loadedLibraryCount = 0;
    function executeAppropriateCallbacks(libName) {
      if (callbacks[libName]) {
        callbacks[libName]();
      }
      loadedLibraryCount++;
      if (loadedLibraryCount === librariesToLoad.length) {
        finalCallback();
      }
    }

    // Place a given function into the given namespace
    function exportFunctionToNamespace(functionToExport, functionNamespace) {
      var namespaceComponents = functionNamespace.split(/\./);
      var currentNamespace = window;
      for (var i = 0; i < namespaceComponents.length - 1; i++) {
        if (!currentNamespace[namespaceComponents[i]]) {
          currentNamespace[namespaceComponents[i]] = {};
        }
        currentNamespace = currentNamespace[namespaceComponents[i]];
      }
      currentNamespace[namespaceComponents[namespaceComponents.length - 1]] = functionToExport;
    }

    // Called when library has loaded
    function libraryLoaded(libName, exportedFunctions) {
      for (var namespace in exportedFunctions) if (exportedFunctions.hasOwnProperty(namespace)) {
        exportFunctionToNamespace(exportedFunctions[namespace], namespace);
      }
      executeAppropriateCallbacks(libName);
    }

    exportFunctionToNamespace(loadLibrary, 'gmapsUtilityLibrary.load');
    exportFunctionToNamespace(setOnLoadCallback, 'gmapsUtilityLibrary.setOnLoadCallback');
    exportFunctionToNamespace(libraryLoaded, 'gmapsUtilityLibrary.loader.loaded');

  })();
}
