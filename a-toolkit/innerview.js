export default defineDreem.class("$ui/view", function(requireDreem, baseclass, $ui$, button) {
	this.init = function() {
		this.attributes={kids:Config({value:[]})};
	}
	
	this.render = function() {
		console.log("InnerView: Are we rendering?")
		return [
				button({
					name:"status",
					marginbottom:20,
					text:"Empty Screen"
				}),
				...this.kids
		]
	}	
});