import getDreemToAFrame from './init-dreem';
import AFRAME from 'aframe';

// FIXME: this is used by the example, should live there
import 'aframe-mouse-cursor-component';

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

console.log("Registering a-toolkit");

AFRAME.registerComponent('a-toolkit', {
  schema: {
    widthPx: {type: 'int', default: 800},
    heightPx: {type: 'int', default: 600}
  },
  init: function () { 
		console.log("Initialzing component");
		this.initializedADreem = false;
		
		const addPageXYToMouseEvent = (evt) => {
			evt.pageX = Math.round(this.data.widthPx * evt.detail.intersection.uv.x);
			evt.pageY = Math.round(this.data.heightPx * (1.0 - evt.detail.intersection.uv.y));
			// console.log(`${evt.type} event at ${evt.pageX},${evt.pageY}`);
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
		console.log("initWhenDreemReady")
		const canvasID = `dreem-to-aframe-${getRandomInt(0, 90000000000)}`;
		this.canvas = document.createElement("canvas")
		this.canvas.className = 'unselectable'
		this.canvas.style.display = 'none';
		this.canvas.id = canvasID;
		this.canvas.width = this.data.widthPx; console.log(this.canvas.width)
		this.canvas.height = this.data.heightPx;

		const aAssets = document.getElementsByTagName("a-assets")[0];
		aAssets.appendChild(this.canvas)
		
		const pointerEvtSrc = this.el;
		window.dreemToAFrame = new DreemToAFrame(defineDreem.rootComposition, undefined, undefined, this.canvas, pointerEvtSrc);
		
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

AFRAME.registerPrimitive('a-toolkit', {
  // Attaches the `ocean` component by default.
  // Defaults the ocean to be parallel to the ground.
  defaultComponents: {
    "a-toolkit": {},
	  geometry: {primitive: 'box', width: 1.33333333, height: 1, depth: 0.02, color: 'white' }		
  },
  // Maps HTML attributes to the `ocean` component's properties.
  mappings: {
    widtpx: 'a-toolkit.widthPx',
    heightpx: 'a-toolkit.depthPx',  },
		depth: 'geometry.depth',
  	height: 'geometry.height',
  	width: 'geometry.width'		
});
