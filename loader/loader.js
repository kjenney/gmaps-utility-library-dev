/*jslint white: true, browser: true, undef: true, nomen: true, eqeqeq: true, glovar: true */
/*global gmapsUtilityLibrary*/
if (!window.gmapsUtilityLibrary) {
  window.gmapsUtilityLibrary = {};
}
if (!window.gmapsUtilityLibrary.loader) {
  window.gmapsUtilityLibrary.loader = {};
  (function() { // New scope
    if (google.loader.loadFailure) {
      alert('Loader requires Google AJAX Libraries API to be loaded.');
    } else {
        google.loader.GoogleApisBase = 'http://gmaps-utility-library.googlecode.com/svn/trunk';
        google.loader.rpl({
      		":dragzoom" : {
      			"versions" : {
      				":1.0" : {
      					"uncompressed" : "../../../dragzoom/1.0/src/dragzoom.js",
      					"compressed" : "../../../dragzoom/1.0/src/dragzoom_packed.js"
      				},
      				":1.1" : {
      					"uncompressed" : "../../../dragzoom/1.2/src/dragzoom.js",
      					"compressed" : "../../../dragzoom/1.2/src/dragzoom_packed.js"
      				},
      				":1.2" : {
      					"uncompressed" : "../../../dragzoom/1.2/src/dragzoom.js",
      					"compressed" : "../../../dragzoom/1.2/src/dragzoom_packed.js"
      				}
      			},
      			"aliases" : {
      				":1" : "1.2"
      			}
      		},
      		":extinfowindow" : {
      			"versions" : {
      				":1.0" : {
      					"uncompressed" : "../../../extinfowindow/1.0/src/extinfowindow.js",
      					"compressed" : "../../../extinfowindow/1.0/src/extinfowindow_packed.js"
      				}
      			},
      			"aliases" : {
      				":1" : "1.0"
      			}
      		},
      		":extmaptypecontrol" : {
      			"versions" : {
      				":1.0" : {
      					"uncompressed" : "../../../extmaptypecontrol/1.0/src/extmaptypecontrol.js",
                "compressed" : "../../../extmaptypecontrol/1.0/src/extmaptypecontrol.js" // No compressed version
      				},
      				":1.1" : {
      					"uncompressed" : "../../../extmaptypecontrol/1.1/src/extmaptypecontrol.js",
      					"compressed" : "../../../extmaptypecontrol/1.1/src/extmaptypecontrol_packed.js"
      				},
      				":1.2" : {
      					"uncompressed" : "../../../extmaptypecontrol/1.2/src/extmaptypecontrol.js",
      					"compressed" : "../../../extmaptypecontrol/1.2/src/extmaptypecontrol_packed.js"
      				}
      			},
      			"aliases" : {
      				":1" : "1.2"
      			}
      		},
      		":labeledmarker" : {
      			"versions" : {
      				":1.0" : {
      					"uncompressed" : "../../../labeledmarker/1.0/src/labeledmarker.js",
      					"compressed" : "../../../labeledmarker/1.0/src/labeledmarker_packed.js"
      				},
      				":1.1" : {
      					"uncompressed" : "../../../labeledmarker/1.1/src/labeledmarker.js",
      					"compressed" : "../../../labeledmarker/1.1/src/labeledmarker_packed.js"
      				}
      			},
      			"aliases" : {
      				":1" : "1.1"
      			}
      		}, 
      		":mapiconmaker" : {
      			"versions" : {
      				":1.0" : {
      					"uncompressed" : "../../../mapiconmaker/1.0/src/mapiconmaker.js",
      					"compressed" : "../../../mapiconmaker/1.0/src/mapiconmaker_packed.js"
      				}
      			},
      			"aliases" : {
      				":1" : "1.0"
      			}
      		},
      		":markermanager" : {
      			"versions" : {
      				":1.0" : {
      					"uncompressed" : "../../../markermanager/1.0/src/markermanager.js",
      					"compressed" : "../../../markermanager/1.0/src/markermanager.js" // No compressed version
      				}
      			},
      			"aliases" : {
      				":1" : "1.0"
      			}
      		},
      		":markertracker" : {
      			"versions" : {
      				":1.0" : {
      					"uncompressed" : "../../../markertracker/1.0/src/markertracker.js",
      					"compressed" : "../../../markertracker/1.0/src/markertracker.js" // No compressed version
      				}
      			},
      			"aliases" : {
      				":1" : "1.0"
      			}
      		}
      	});
      }
    }
  })();
}