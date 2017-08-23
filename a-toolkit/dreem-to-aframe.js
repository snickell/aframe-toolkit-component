export default defineDreem.class("$server/composition",function(requireDreem, baseclass, $ui$, slider, button, radiobutton, screen, label, view, icon, cadgrid, $widgets$, colorpicker) {
	
	this.atConstructor = function(previous, parent, precached, canvas, pointerEvtSrc){
		baseclass.atConstructor.call(this, previous, parent, precached, canvas, pointerEvtSrc);
	}

	this.init = function() {
		this.attributes={propname:Config({value:10})};
	}

	this.render = function() {
		return [				
			screen(
				button({
					name:"status",
					marginbottom:20,
					text:"Empty Screen"
				})
			)
		]
	}
});
