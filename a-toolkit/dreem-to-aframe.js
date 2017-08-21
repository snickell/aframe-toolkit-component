export default defineDreem.class('$ui/view', function(requireDreem, baseclass, $ui$, button, radiobutton, screen,){
  console.log("initting dreem-to-aframe");
	var Device = requireDreem('$system/platform/$platform/device$platform');
	var Render = requireDreem('$system/base/render');
  
    
	this.atConstructor = function(previous, parent, precached){
    console.log("atConstructor");
		this.parent = parent;
    this.composition = this;
    
    this.screen = null;
		Render.process(this, undefined, undefined, false, true);    
    this.screen = this.children[0];
    this.screen.screen = this.screen;
        
    console.log(this.screen, this.screen.screen, this.screen === this.screen.screen)

    this.canvas = document.getElementsByClassName("a-canvas")[0];
		this.device = new Device(undefined, this.canvas);
    this.doRender();
  }
  
	this.doRender = function(previous, parent){
    console.log("Screen is ", this.screen, " Device is: ", this.device);
		this.screen.device = this.device
    
		Render.process(this.screen);
    this.device.redraw();
		this.rendered = true
	}
  
	this.render = function() {
    
    // throw new Error("START WORK HERE, WHAT WE NEED TO DO IS FIGURE OUT HOW TO CALL RENDER.PROCESS ON OURSELF!!!! SEE compositionclient.js for example, or compositionwebgl.js")
    console.log("this.render()");
    
		return [
			screen(
      
					button({
						text:"Click Button to be Awesome",
						click:function(ev,v,o){
              alert("Hello world")
						}})
      )
		]
	}
  
  
});




// in drawpasswebgl.js:
// where draw is probably our component?
// this.drawNormal(draw, view, matrices)

// in render.js
// 		Render.process(this.screen, previous && previous.screen)


// from compositionclient.js:
/*

	this.doRender = function(previous, parent){

 		this.screen.screen = this.screen
		this.screen.device = this.device
		this.screen.rpc = this.rpc
		this.screen.composition = this.composition

		if(parent){
			this.screen.device = parent.screen.device
			this.screen.parent = parent
		}
		//this.screen.teem = this

		Render.process(this.screen, previous && previous.screen)

		if(typeof document !== 'undefined' && this.screen.title !== undefined) document.title = this.screen.title

		this.screen.device.redraw()

		this.rendered = true
	}

*/