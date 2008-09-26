/**
*   Preloader class.
*
*   Usage:
*   oPreloader = new cPreloader();
*   oPreloader.init(oMap, iWidth);
*   oPreloader.start(500); // Amount of operations, unhides the preloader.
*   oPreloader.updateLoader(iAdded); // Add amount of operations just done
*   oPreloader.remove(); // Hide the preloader.
*   
*   Part of GeoStart (www.geostart.nl)
*   Author: Björn Brala SWIS BV
**/
function cPreloader(){
    /**
    *   @desc  Init the preloader. Create a Control on the map.
    *    Loader:     geo_preloader_container
    *    Info:        geo_preloader
    *   @param object GMap2 object
    **/    
    this.init = function(oMap, iWidth){
         this._iWidth = iWidth || 176;
         this._oMap = oMap;                                                      // GMap2 reference
         this._oControl = new LoaderControl(oMap, iWidth);                               // Control object reference
         this._oMap.addControl(this._oControl);                                  // Load control into map
         this._oDiv = document.getElementById('geo_preloader');                  // Preloader DIV
         this._oText = document.getElementById('geo_preloader_text');            // Preloader text DIV
         this._oContainer = document.getElementById('geo_preloader_container');  // Preloader container
         this._sLoadstring = 'Loading...';                             // String for when loading ( before counter )
         this._iOperations = 0;
         this._iCurrent = 0;
    }
    

    /**
    *    @desc Start preloader
    *    @param int iOperations Counter for the amount of operations that will be executed.
    **/
    this.start = function(iOperations) {
        this._oDiv.style.width = '0%'; 
        this._iOperations = iOperations || 0;
        this._iCurrent = 0;
        this._oText.style.color = "#111";
        this._oText.innerHTML = this._sLoadstring;
        this._oContainer.style.display = "block";
    }


    /**
    *   @desc  Set preloader info.
    *   @param int iStep Add number of operations to preloader.
    **/
    this.updateLoader = function( iStep ){
        this._iCurrent += iStep;
        if ( this._iCurrent > 0){
            var percentage = Math.ceil((this._iCurrent / this._iOperations) * 100);
            if ( percentage > 100 ) { percentage = 100; }
            this._oDiv.style.width = percentage + '%'; 
            this._oText.innerHTML = this._iCurrent + ' / ' + this._iOperations;
        } 
    }
    
    /**
    *    @desc Remove preloader. Well, hide actually.
    **/
    this.remove = function() {
        this._oContainer.style.display = 'none';
    }


    /**
    *    Custom preloader control.
    *    Possibly extendable with other styles later on?
    **/    
    var LoaderControl = function(oMap, iWidth) { this.oMap = oMap; this.iWidth = iWidth; };
        LoaderControl.prototype = new GControl(true, false);
        LoaderControl.prototype.initialize = function () {
                var oContainer = document.createElement("div");
                oContainer.innerHTML         = "<div style='position:absolute;width:100%;border:5px;text-align:center;vertical-align:bottom;' id='geo_preloader_text'></div><div style='background-color:green;height:100%;' id='geo_preloader'></div>";
                oContainer.id                 = "geo_preloader_container";
                oContainer.style.display       = "none";
                oContainer.style.width       = this.iWidth + "px";
                //oContainer.style.marginLeft = "-2.5em";
                oContainer.style.fontSize    = "0.8em";
                oContainer.style.height        = "1.3em";
                oContainer.style.border      = "1px solid #555"; 
                oContainer.style.backgroundColor = "white";
                oContainer.style.textAlign     = "left";
                this.oMap.getContainer().appendChild(oContainer);            
                
                return oContainer;
            }
        LoaderControl.prototype.getDefaultPosition = function () {
                return new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(30,56));
            };
}