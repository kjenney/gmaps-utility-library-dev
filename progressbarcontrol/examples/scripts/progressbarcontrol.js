/**
 * @name ProgressbarControl
 * @version 1.0
 * @author Bjorn BRala
 * @copyright (c) 2008 SWIS BV
 * @fileoverview Creates a progressbar control for usage in google maps.<br>
<br>Usage:
<br>oProgressbarControl = new ProgressbarControl(oMap, opt_opts);
<br>oProgressbarControl.(500); // Amount of operations, unhides the control
<br>oProgressbarControl.(iAdded); // Add amount of operations just done
<br>oProgressbarControl.(); // Hide the control.
<br>   
<br>opt_opts: Object containing options:
<br>               {Number} iWidth Width of the control
<br>               {String} sLoadstring String displayed when first starting the control
*/

/**
 * @name ProgressbarOptions
 * @class This class represents optional arguments to {@link ProgressbarControl}, 
 * @property {Number} [iWidth=176] Specifies, in pixels, the width of the progress bar.
 * @property {String} [sLoadstring=Loading] Specifies the string displayed when first starting the control. Before any update!
 */




/**
*    Custom progress control.
*    Possibly extendable with other styles later on?
*   @return GControl object
**/    
function ProgressbarMapControl(oMap, iWidth) { 
	this.oMap = oMap; 
	this.iWidth = iWidth; 
};



ProgressbarMapControl.prototype = new GControl(true, false);
/**
*	@desc Initilizes the GControl. Created the HTML and styles.
*	@return Returns container div.
**/
ProgressbarMapControl.prototype.initialize = function () {
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
*   @desc Return the default position for the control
*   @return GControlPosition
**/
ProgressbarMapControl.prototype.getDefaultPosition = function () {
		return new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(30,56));
};   



		
/**
*	@contructor
*	@param {GMap2}  Map object
*	@param  {ProgressbarOptions} opt_opts
*   Part of GeoStart (www.geostart.nl)
*   Author: Bjorn Brala SWIS BV
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
*    @desc Start the progress bar. Argumnent is the amount of operations the full bar will represent.
*    @param {int} iOperations Counter for the amount of operations that will be executed.
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
*   @desc  Update the progress. Adds Step amount of operations to the bar.
*   @param {int} iStep Add number of operations to progress.
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
*    @desc Remove control. Well, hide it actually, since the call to create a new one when its needed again would create to much overhead.
**/
ProgressbarControl.prototype.remove = function() {
    this.oContainer_.style.display = 'none';
}
