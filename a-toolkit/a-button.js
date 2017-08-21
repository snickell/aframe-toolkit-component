export default defineDreem.class("$ui/button",function(requireDreem, $ui$, button) {
		this.render = function() {
			return [
				button({
					text:"A Button",
					click:function(ev,v,o){
						this.screen.find("status").text = "Button clicked!";
				}})
			]
		}
	}
)
