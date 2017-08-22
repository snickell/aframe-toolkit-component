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

		this.el.addEventListener('click',   addPageXYToMouseEvent)		
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
				
		const canvasID = `dreem-to-aframe-${getRandomInt(0, 90000000000)}`;

		const pointerEvtSrc = this.el;
		window.dreemToAFrame = new DreemToAFrame(defineDreem.rootComposition, undefined, undefined, canvasID, pointerEvtSrc);
		
		this.el.setAttribute("material", `shader: flat; src: #${canvasID}`);		
	},
  update: function () {},
  tick: function () {
		this.initWhenDreemReady();
  },
  remove: function () {},
  pause: function () {},
  play: function () {}
});
