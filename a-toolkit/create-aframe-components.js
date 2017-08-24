import { getUIWidgets } from './dreem-imports';

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

// Maps A-Frame elements to corresponding Dreem instances
const elToDreemInstance = new Map();

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





let initialized = false;
function createAFrameComponents() {
	if (initialized) return;
	initialized = true;
	
	const uiWidgets = getUIWidgets();
	const widgetNameToPath = new Map(
		uiWidgets.map(path => [path.split('/').slice(1).join('-'), path])
	);
	widgetNameToPath.set('ui-entity', false);	

	// Go through all the dreem classes marked as UI and register A-Frame components for them
	Array.from(widgetNameToPath.entries()).forEach(([widgetName, dreemPath]) => {
		// console.log("registering " + widgetName);
		AFRAME.registerComponent(widgetName, {
		  schema: {
		    dreem: {type: 'string', default: ''}
			},
			init() {
				// If they set <ui-entity dreemClass="$ui/some-dreem-class"> manually, use it
				dreemPath = this.data.dreem.length > 0 ? this.data.dreem : dreemPath;
				const DreemClass = requireDreem(dreemPath);
				const dreemInstance = new DreemClass(props(this.el));
				
				appendToParentEl(dreemInstance, this.el);
				this.dreem = dreemInstance;					
			}
		});
		const defaultComponents = {};
		defaultComponents[widgetName] = {};
		AFRAME.registerPrimitive('a-' + widgetName, {
		  defaultComponents,
		  mappings: {
				dreem: widgetName + '.dreem'
		  }
		});			
	});
};


export {createAFrameComponents, elToDreemInstance};