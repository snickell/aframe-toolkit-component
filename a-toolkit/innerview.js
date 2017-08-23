export default defineDreem.class("$ui/view", function(requireDreem, baseclass, $ui$, button) {
	this.init = function() {
		this.attributes={kids:Config({value:[]})};
	}
	
	this.render = function() {
		return [
				...this.kids
		]
	}	
});