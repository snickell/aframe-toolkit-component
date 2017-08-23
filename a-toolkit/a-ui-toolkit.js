import getDreemToAFrame from './init-dreem';
import { getUIWidgets } from './dreem-imports';
import AFRAME from 'aframe';

// FIXME: this is used by the example, should live there
import 'aframe-mouse-cursor-component';

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

console.log("Registering a-ui-toolkit");
const requireDreem = path => window.defineDreem.requireDreem(path);

const dreemAppendChild = function(parent, child){
	var Render = requireDreem('$system/base/render');
	
	child.parent = parent
	child.rpc = parent.rpc
	child.screen = parent.screen
	if (!child.screen.initialized) {
		throw new Error("INVALID SCREEN FOUND ON ", parent, parent.screen);
	}
	child.parent_viewport = parent._viewport?parent:parent.parent_viewport

	parent.children.push(child);

	// render it
	Render.process(child, undefined, undefined, false)


	parent.relayout();
}

AFRAME.registerComponent('ui-entity', {
	
});

AFRAME.registerComponent('ui-toolkit', {
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

		this.el.addEventListener('click',   addPageXYToMouseEvent);
		this.el.addEventListener('mousemove',   addPageXYToMouseEvent);
		this.el.addEventListener('mousedown',   addPageXYToMouseEvent);
		this.el.addEventListener('mousemove',   addPageXYToMouseEvent);
		this.el.addEventListener('mouseup',     addPageXYToMouseEvent);
		this.el.addEventListener('contextmenu', addPageXYToMouseEvent);	
		
		this.widgetNameToPath = new Map();
	},
	registerUIWidgets: function () {
		const uiWidgets = getUIWidgets();
		const widgetNameToPath = new Map(
			uiWidgets.map(path => [path.split('/').slice(1).join('-'), path])
		);
		
		let attrBlacklist = new Set(["position", "scale", "rotation", "visible"]);
		let attrNames = aComponent => Array.from(aComponent.attributes).filter(x => !attrBlacklist.has(x.name));
		
		function strMapToObj(strMap) {
		    let obj = {};
		    for (let [k,v] of strMap) {
		        // We don’t escape the key '__proto__'
		        // which can cause problems on older engines
		        obj[k] = v;
		    }
		    return obj;
		}		
		
		let props = aComponent => strMapToObj(new Map( 
				attrNames(aComponent).map(attr => [attr.name, aComponent.getAttribute(attr.name)])
		));
				
		
		const dreemToAFrame = this.dreemToAFrame;
		window.dreemToAFrame = dreemToAFrame;
		
		// Sometimes we add a dreem before its parents are processed
		// we need to wait to process them at this point
		const waitingForParents = new Set();
		const processIfParentsAppeared = () => {
			// Try to append elements, see if their parents appeared yet
			const parentsFoundFor = Array.from(waitingForParents).filter(
				({ dreemObj, el }) => appendToParentEl(dreemObj, el, false)
			);
			
			
			// recurse if we found anyone's parents, maybe somebody was waiting for THEM
			if (parentsFoundFor.length > 0) {
				// If anyone's parents appeared, remove them from the waitlist
				parentsFoundFor.forEach(item => waitingForParents.delete(item));
				processIfParentsAppeared();
			}
		};
		
		window.waitingForParents = waitingForParents;
		window.processIfParentsAppeared = processIfParentsAppeared;
		
		const appendToParentEl = (dreemObj, el, notInWaitQueue=true) => {
			// first lets register outselves...
			elToDreemInstance.set(el, dreemObj);
			
			const parentDreem = elToDreemInstance.get(el.parentEl);
			
			if (parentDreem) {
				dreemAppendChild(parentDreem, dreemObj);
				
				if (notInWaitQueue) processIfParentsAppeared();
			
				return true;				
			} else {
				// uhoh, we don't have parents yet, lets wait for them to appear
				if (notInWaitQueue) waitingForParents.add({ dreemObj, el });
				return false;			
			}
		};
		
		window.props = props;
		window.aToolkit = this;
		
		const InnerView = requireDreem("$atoolkit/innerview");
		const elToDreemInstance = new Map();
		elToDreemInstance.set(this.el, dreemToAFrame.children[0].children[0]);

		window.widgies = [];
		Array.from(widgetNameToPath.entries()).forEach(([widgetName, dreemPath]) => {
			AFRAME.registerComponent(widgetName, {
				init() {					
					const DreemClass = requireDreem(dreemPath);
					const dreemInstance = new DreemClass(props(this.el));
					
					appendToParentEl(dreemInstance, this.el);
					
					window.widgies.push(dreemInstance); // 4 debug
				}
			});
			const defaultComponents = {};
			defaultComponents[widgetName] = {};
			AFRAME.registerPrimitive('a-' + widgetName, {
			  defaultComponents,
			  mappings: {}
			});			
		});
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


		
		this.dreemToAFrame = new DreemToAFrame(defineDreem.rootComposition, undefined, undefined, this.canvas, pointerEvtSrc);


		this.registerUIWidgets();		
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

AFRAME.registerPrimitive('a-ui-toolkit', {
  defaultComponents: {
    "ui-toolkit": {},
	  geometry: {primitive: 'box', width: 1.33333333, height: 1, depth: 0.02, color: 'white' }		
  },
  // Maps HTML attributes to the `ocean` component's properties.
  mappings: {
    widtpx: 'ui-toolkit.widthPx',
    heightpx: 'ui-toolkit.depthPx',  },
		depth: 'geometry.depth',
  	height: 'geometry.height',
  	width: 'geometry.width'		
});
