/*global google*/
/*global gmapsUtilityLibrary*/
if (!window.gmapsUtilityLibrary) {
  window.gmapsUtilityLibrary = {};
}
if (!window.gmapsUtilityLibrary.loader) {
  window.gmapsUtilityLibrary.loader = {};
  (function () { // New scope
    if (google.loader.loadFailure) {
      alert('Loader requires Google AJAX Libraries API to be loaded.');
    } else {
      google.loader.GoogleApisBase = 'http://gmaps-utility-library.googlecode.com/svn/trunk';
      google.loader.rpl(function () {
        // A shorthand version of the object required by rpl
        var libraries = {
          "compressed" : {
            "dragzoom" : 2,
            "extinfowindow" : 0,
            "extmaptypecontrol" : 2,
            "labeledmarker" : 1,
            "mapiconmaker" : 1
          },
          "uncompressed" : {
            "markermanager" : 0,
            "markertracker" : 0
          }
        };
        var rplObject = {};
        // Convert shorthand into the real thing.  Assumptions:
        // we always compress some libraries, and never others
        // we increment versions by 0.1, from 1.0
        // we neither change major versions nor skip minor versions
        for (var librarySetName in libraries) {
          var librarySet = libraries[librarySetName];
          for (var libraryName in librarySet) {
            var highestLibraryVersion = librarySet[libraryName];
            var rplLibrary = rplObject[":" + libraryName] = {};
            rplLibrary.versions = {};
            for (var versionName = 0; versionName <= highestLibraryVersion; versionName++) {
              var rplUrl = rplLibrary.versions[":1." + versionName] = {};
              // Traversing up three directories is necessary as the real ajax
              // libraries use a different directory structure than we do.
              var url = "../../../" + libraryName + "/1." + versionName + "/src/" + libraryName;
              rplUrl.uncompressed = url + ".js";
              rplUrl.compressed = url + ((librarySetName === "compressed") ? "_packed" : "") + ".js";
            }
            rplObject[":" + libraryName].aliases = {":1" : "1." + highestLibraryVersion};
          }
        }
        return rplObject;
      }());
    }
  })();
}