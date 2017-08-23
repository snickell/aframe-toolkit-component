

export default defineDreem.class("$server/composition",function(requireDreem, baseclass, $ui$, slider, button, radiobutton, screen, label, view, icon, cadgrid, $widgets$, colorpicker, $atoolkit$, innerview) {
	
	this.atConstructor = function(previous, parent, precached, canvas, pointerEvtSrc){
		baseclass.atConstructor.call(this, previous, parent, precached, canvas, pointerEvtSrc);
	}

	this.init = function() {
		//this.attributes={kids:Config({value:[]})};
	}

	this.render = function() {
		const iv = requireDreem("$atoolkit/innerview")		
		return [				
			screen(iv()),
		]
	}
});
