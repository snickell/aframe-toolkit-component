import AFRAME from 'aframe';

AFRAME.registerComponent('a-dreem', {
  schema: {},
  init: function () { },
  update: function () {},
  tick: function () {
    window.object3D = this.el.object3D;
  },
  remove: function () {},
  pause: function () {},
  play: function () {}
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