import getDreemToAFrame from './init-dreem';
import AFRAME from 'aframe';
import 'aframe-mouse-cursor-component';

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}





AFRAME.registerComponent('a-dreem', {
  schema: {
    widthPx: {type: 'int', default: 1700},
    heightPx: {type: 'int', default: 1500}
  },
  init: function () { 
		this.initializedADreem = false;
		
		const addPageXYToMouseEvent = (evt) => {
			evt.pageX = Math.round(this.data.widthPx * evt.detail.intersection.uv.x);
			evt.pageY = Math.round(this.data.heightPx * (1.0 - evt.detail.intersection.uv.y));
			console.log(`${evt.type} event at ${evt.pageX},${evt.pageY}`);
		};
		
		this.el.addEventListener('mousemove',   addPageXYToMouseEvent)
		this.el.addEventListener('mousedown',   addPageXYToMouseEvent)
		this.el.addEventListener('mousemove',   addPageXYToMouseEvent)
		this.el.addEventListener('mouseup',     addPageXYToMouseEvent)
		this.el.addEventListener('contextmenu', addPageXYToMouseEvent)		
	},
	initWhenDreemReady: function () {
		if (this.initializedADreem) return;
		const DreemToAFrame = getDreemToAFrame();
		if (!DreemToAFrame) return;
		
		this.initializedADreem = true;
				
		const canvasID = `dreem-to-aframe-${getRandomInt(0, 9000000000)}`;

		const pointerEvtSrc = this.el;
		window.dreemToAFrame = new DreemToAFrame(defineDreem.rootComposition, undefined, undefined, canvasID, pointerEvtSrc);
		
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