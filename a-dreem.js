import getDreemToAFrame from './init-dreem';
import AFRAME from 'aframe';


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}




AFRAME.registerComponent('a-dreem', {
  schema: {},
  init: function () { 
		console.log("initializing component");
		this.initializedADreem = false;
	},
	initWhenDreemReady: function () {
		if (this.initializedADreem) return;
		const DreemToAFrame = getDreemToAFrame();
		if (!DreemToAFrame) return;
		
		this.initializedADreem = true;
		
		console.log("initWhenDreemReady: ready");
		
		const canvasID = `dreem-to-aframe-${getRandomInt(0, 9000000000)}`;

		window.dreemToAFrame = new DreemToAFrame(defineDreem.rootComposition, undefined, undefined, canvasID);
		
		this.el.setAttribute("material", `shader: flat; src: #${canvasID}`);		
	},
  update: function () {},
  tick: function () {
		this.initWhenDreemReady();
    window.object3D = this.el.object3D;
  },
  remove: function () {},
  pause: function () {},
  play: function () {}
});




/*
<a-entity material="shader: flat; src: #helloWorldCanvas"
                geometry="primitive: plane; width: 160; height: 90"
                position="0 60 -250" rotation="0 35 0"
                draw-canvas-rectangles="#helloWorldCanvas">
*/

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