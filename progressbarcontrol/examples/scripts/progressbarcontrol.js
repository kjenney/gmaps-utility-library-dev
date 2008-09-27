/**
*    Custom progress control.
*    Possibly extendable with other styles later on?
*   @return GControl object
**/    
function LoaderControl(oMap, iWidth) { 
	this.oMap = oMap; this.iWidth = iWidth; 
};




LoaderControl.prototype = new GControl(true, false);
LoaderControl.prototype.initialize = function () {
	var oContainer = document.createElement("div");
	oContainer.innerHTML         = "<div style='position:absolute;width:100%;border:5px;text-align:center;vertical-align:bottom;' id='geo_progress_text'></div><div style='background-color:green;height:100%;' id='geo_progress'></div>";
	oContainer.id                 = "geo_progress_container";
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
/**
*   @return GControlPosition
**/
LoaderControl.prototype.getDefaultPosition = function () {
		return new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(30,56));
};   



		
/**
*   progress bar class.
*
*   Usage:
*   oProgressbarControl = new ProgressbarControl(oMap, opt_opts);
*   oProgressbarControl.(500); // Amount of operations, unhides the control
*   oProgressbarControl.(iAdded); // Add amount of operations just done
*   oProgressbarControl.(); // Hide the control.
*   
*   opt_opts: Object containing options:
*               {Number} iWidth Width of the control
*               {String} sLoadstring String displayed when first starting the control
*
*   Part of GeoStart (www.geostart.nl)
*   Author: Björn Brala SWIS BV
**/
function ProgressbarControl(oMap, opt_opts){
    /**
    *   @desc  Init the progress bar, Create a Control on the map.
    *    Loader:     geo_progress_container
    *    Info:        geo_progress
    *   @param object GMap2 object
    **/    
    this.options_ = opt_opts == null ? {} : opt_opts;


    this.iWidth_ = this.options_.iWidth == null ? 176 : this.options_.iWidth;
    this.sLoadstring_ = this.options_.sLoadstring == null ? 'Loading...' : this.options_.sLoadstring;                             // String for when loading ( before counter )        

    this.oControl_ = new LoaderControl(oMap, this.iWidth_);                               // Control object reference

    this.oMap_ = oMap;                                                      // GMap2 reference
    this.oMap_.addControl(this.oControl_);                                  // Load control into map
    this.oDiv_ = document.getElementById('geo_progress');                  // progress DIV
    this.oText_ = document.getElementById('geo_progress_text');            // progress text DIV
    this.oContainer_ = document.getElementById('geo_progress_container');  // progress container

    this.iOperations_ = 0;
    this.iCurrent_ = 0;
        
        
    
}

/**
*    @desc Start progress bar
*    @param int iOperations Counter for the amount of operations that will be executed.
**/
ProgressbarControl.prototype.start = function(iOperations) {
    this.oDiv_.style.width = '0%'; 
    this.iOperations_ = iOperations || 0;
    this.iCurrent_ = 0;
    this.oText_.style.color = "#111";
    this.oText_.innerHTML = this.sLoadstring_;
    this.oContainer_.style.display = "block";
}


/**
*   @desc  Set progress info.
*   @param int iStep Add number of operations to progress.
**/
ProgressbarControl.prototype.updateLoader = function( iStep ){
    this.iCurrent_ += iStep;
    if ( this.iCurrent_ > 0){
        var percentage = Math.ceil((this.iCurrent_ / this.iOperations_) * 100);
        if ( percentage > 100 ) { percentage = 100; }
        this.oDiv_.style.width = percentage + '%'; 
        this.oText_.innerHTML = this.iCurrent_ + ' / ' + this.iOperations_;
    } 
}

/**
*    @desc Remove control. Well, hide actually.
**/
ProgressbarControl.prototype.remove = function() {
    this.oContainer_.style.display = 'none';
}
