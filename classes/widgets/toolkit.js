/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/

defineDreem.class("$ui/view", function(requireDreem,
								  $ui$, view, label, textbox, icon, checkbox, treeview, button, tabbar,
								  $widgets$, palette, propviewer, jseditor,
								  $server$, astio){

// The DreemGL Visual Toolkit allows for visual manipulation of a running composition
// <br/><a href="/examples/usingtoolkit">examples &raquo;</a>

	this.name = "toolkit";
	this.clearcolor = "#565656";
	this.bgcolor = "#565656";
	this.flex = 1;
	this.flexdirection = "column";
	this.alignitems = "stretch";
	this.tooltarget = false;

	this.position = "absolute";
	this.width = 400;
	this.height = 800;
	this.opacity = 0.7;
	this.visible = false;

	this.borderradius = 7;
	this.bordercolor = vec4(0.3,0.6,0.8,0.4);
	this.borderwidth = 1;

	this.defaultcomponents = {
		Views:[
			{
				label:"View",
				icon:"sticky-note",
				desc:"A rectangular view",
				classname:"view",
				classdir:"$ui$",
				params:{
					height:150,
					width:200,
					pickalpha:-1,
					bgcolor:'white'
				}
			},
			{
				label:"Text",
				text:"Aa",
				desc:"A text label",
				classname:"label",
				classdir:"$ui$",
				params:{
					fontsize:44,
					pickalpha:-1,
					bgcolor:"transparent",
					fgcolor:'#999',
					text:'Label'
				}
			},
			//{
			//	label:"Check Button",
			//	icon:"check-square-o",
			//	desc:"A check button",
			//	classname:"checkbox",
			//	classdir:"$ui$",
			//	params:{
			//		tooldragroot:true,
			//		fontsize:24,
			//		bgcolor:"transparent",
			//		buttoncolor1:"transparent",
			//		buttoncolor2:"transparent",
			//		hovercolor1:"transparent",
			//		hovercolor2:"transparent",
			//		pressedcolor1:"transparent",
			//		pressedcolor2:"transparent",
			//		pickalpha:-1,
			//		fgcolor:'white'
			//	}
			//},
			//{
			//	label:"Button",
			//	icon:"stop",
			//	desc:"A basic button",
			//	classname:"button",
			//	classdir:"$ui$",
			//	params:{
			//		tooldragroot:true,
			//		fontsize:24,
			//		pickalpha:-1,
			//		text:'Button'
			//	}
			//},
			{
				label:"Icon",
				icon:"flag",
				desc:"A Fontawesome icon",
				classname:"icon",
				classdir:"$ui$",
				params:{
					fgcolor:'#e22',
					bgcolor:'transparent',
					pickalpha:-1,
					icon:'flag',
					fontsize:80
				}
			},
			//{
			//	label:"Input",
			//	icon:"italic",
			//	desc:"An input box",
			//	classname:"textbox",
			//	classdir:"$ui$",
			//	params:{
			//		value:"Input Text"
			//	}
			//}
		],
		//Behaviors:[
		//	{
		//		label:"Hover Border",
		//		icon:"square",
		//		desc:"Adds a hover event that turns on and off a border",
		//		behaviors:{
		//			pointerhover:function(ev,v,o) {
		//				o.borderwidth = 3;
		//				o.bordercolor = "yellow";
		//			},
		//			pointerout:function(ev,v,o) {
		//				o.borderwidth = 0;
		//				o.bordercolor = NaN;
		//			}
		//		}
		//	}
		//]
	};

	this.attributes = {

		// The target for the property inspector
		inspect:Config({type:Object}),

		// Components available to be dragged into compositions.
		components:this.defaultcomponents,

		// When in 'design' mode buttons in compositions no longer become clickable, text fields become immutable,
		// and views can be resized and manipulated.  In 'live' mode views lock into place the composition regains
		// it's active behaviors
		mode:Config({type:Enum('design','live'), value:'design'}),

		// Should views be dropped as absolute or relative children
		dropmode:Config({type:Enum('absolute','relative'), value:'absolute'}),

		// The size of the reticle hot corners inside of a view
		reticlesize: 9,

		// When dragging multiple selections, `groupdrag:true` will result in all selected views dragging together
		// whereas `groupdrag:false` will only move the view under the cursor
		groupdrag:true,

		// When dropping a multiple selection into a view, should all views be reparented into the view that the
		// mouse is over, or should they drop exactly where they are physically locate don the canvas.
		groupreparent:false,

		// Show or hide the rules when selecting and dragging
		rulers:true,

		// Show or hide the rotatation handle
		handles:true,

		// Show guide bars
		guides:true,

		// Snap to guides
		snap:true,

		// Show guidelines when moving
		movelines:true,

		// Always center guideline crosshairs on the mouse cursor
		hoverlines:false,

		// internal
		clipboard:Config({persist:true, value:[], meta:"hidden"}),

		// internal
		selection:Config({value:[], meta:"hidden"}),

		// internal
		selected:Config({persist:true, value:[], meta:"hidden"})
	};

	this.setupFileDrop = function () {
		var doc = document.documentElement;
		doc.ondragover = function (e) { return !this.visible; }.bind(this);
		doc.ondragend = function (e) { return !this.visible; }.bind(this);
		doc.ondrop = function (e) {
			if (!this.visible) { return; }
			e.preventDefault && e.preventDefault();
			var files = e.dataTransfer.files;

			var formData = new FormData();
			var imagename;
			for (var i = 0; i < files.length; i++) {
				var file = files[i];

				if (file.type && file.type.indexOf("image/") === 0) {
					imagename = file.name
				}

				formData.append('file', file);
			}

			var xhr = new XMLHttpRequest();
			xhr.open('POST', window.location.pathname, true);
			xhr.onload = function() {
				if (xhr.status === 200) {
					if (imagename) {
						this.screen.device.doPick(function(v) {
							if (v) {
								var compfile = v.screen.composition.constructor.module.filename;
								var compdir = compfile.substring(0, compfile.lastIndexOf('/'));
								var filename = compdir + "/" + imagename;
								this.setASTObjectProperty(v, "bgimage", filename);
								this.commit();
							}
						}.bind(this))
					}
				} else {
					console.log('Oops, upload failed', xhr, files);
				}
			}.bind(this);
			xhr.send(formData);

			return false;
		}.bind(this);
	};

	this.init = function() {
		this.sourcefile = astio(this.screen.composition.constructor);
		this.sourcefile.onchange = this.onchange.bind(this);

		this.onselected(null, this.selected, this);

		this.ensureDeps();
		this.screen.globalpointerstart = this.globalpointerstart.bind(this);
		this.screen.globalpointermove = this.globalpointermove.bind(this);
		this.screen.globalpointerend = this.globalpointerend.bind(this);
		this.screen.globalpointerhover = this.globalpointerhover.bind(this);
		this.screen.globalpointerout = this.globalpointerout.bind(this);
		this.screen.globalkeydown = this.globalkeydown.bind(this);

		this.setupFileDrop();
	};

	this.onchange = function(ev,src,o) {

		var xhr = new XMLHttpRequest();
		var formData = new FormData();

		var fullpath = this.screen.composition.constructor.module.filename;
		var filename = fullpath.substring(fullpath.lastIndexOf('/') + 1);
		var source = 'defineDreem.class("$server/composition",' + src + ');'
		var blob = new Blob([source], {type: 'plain/text'});
		formData.append('file', blob, filename);

		xhr.open("POST", window.location.pathname, true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4 && xhr.status == 200) {
				console.log("[COMMIT]");//, src);
			}
		};
		xhr.send(formData);
	};

	this.onselected = function(ev,v,o) {
		var selection = [];
		if (v && v.length && this.sourcefile) {
			var find = function(a, b) {
				if (a === this.sourcefile.nodeFor(b)) return b;
				if (b.children) {
					for (var i = 0;i < b.children.length;i++) {
						var c = find(a, b.children[i]);
						if (c) return c;
					}
				}
			}.bind(this);

			for (var i=0;i< v.length;i++) {
				var astpath = JSON.parse(v[i]);
				this.sourcefile.reset();
				var node = this.sourcefile.nodeForPath(astpath);
				var found = find(node, this.screen);

				if (found !== this.screen) {
					selection.push(found)
				}
			}
		}
		this.selection = selection;
	};

	this.onselection = function(ev,v,o) {
		var i;

		var inspector = this.find('inspector');

		if (this.__selrects) {
			for (i = 0; i < this.__selrects.length; i++) {
				var selrect = this.__selrects[i];
				selrect.closeOverlay();
			}
		}

		if (this.selection) {
			this.__selrects = [];

			if (inspector) {
				if (this.selection.length <= 1) {
					var selected = this.selection[0];
					if (selected && inspector.target != selected) {
						inspector.astarget = JSON.stringify(this.sourcefile.nodePathFor(selected));
					}
				} else {
					inspector.target = null;
				}
			}

			for (i=0;i<this.selection.length;i++) {
				var target = this.selection[i];
				if (target.toolrect !== false && this.testView(target)) {
					var selectrect = this.screen.openOverlay(this.selectedrect);
					selectrect.target = target;
					this.__selrects.push(selectrect);
				}
			}

		} else {
			inspector.target = null;
		}

		var tree = this.find("structure");
		if (tree && tree.reload) {
			tree.reload();
		}
	};

	this.globalpointerstart = function(ev) {
		if (!this.visible) {
			return;
		}

		if (this.__ruler) {
			this.__ruler.rulermarkstart = ev.pointer.position;
		}

		if (ev.view == this) {
			this.__startpos = ev.view.globalToLocal(ev.pointer.position);

			this.__originalpos = {
				x:ev.view.x,
				y:ev.view.y
			};

			this.__originalsize = {
				w:ev.view.width,
				h:ev.view.height
			};

			this.__resizecorner = this.resetCursor(ev);

			if (!this.__resizecorner) {
				var inspector = this.find('inspector');
				if (inspector) {
					inspector.astarget = JSON.stringify(this.sourcefile.nodePathFor(this));
				}
			}

		} else if (this.testView(ev.view)) {

			var astpath = JSON.stringify(this.sourcefile.nodePathFor(ev.view));
			if (!this.selected || this.selected.indexOf(astpath) < 0) {
				if (this.selected && (ev.pointer.meta || ev.pointer.ctrl)) {
					this.selected = this.selected.concat([astpath]);
				} else {
					this.selected = [astpath];
				}
			}

			var dragview = ev.view;
			if (!dragview.tooldragroot) {
				var p = dragview;
				while (p = p.parent) {
					if (p.tooldragroot) {
						dragview = p;
						break;
					}
				}
			}

			if (dragview.toolmove === false){
				dragview.cursor = "crosshair";
				this.__startrect = ev.pointer.position;
			} else {
				// This may be a drag

				this.__startpos = dragview.globalToLocal(ev.pointer.position);

				this.__originalpos = {
					x:dragview.x,
					y:dragview.y
				};

				this.__originalsize = {
					w:dragview.width,
					h:dragview.height
				};

				this.__resizecorner = this.resetCursor(ev, dragview);
				this.screen.pointer.cursor = "move";
				dragview.cursor = "move";
				dragview.drawtarget = "color";
				ev.pointer.pickview = true;
			}
		}

	};

	this.globalpointermove = function(ev) {
		if (!this.visible) {
			return;
		}

		if (this.__ruler) {
			if (ev.pointer.pick && this.testView(ev.pointer.pick) && this.__ruler.target !== ev.pointer.pick) {
				this.__ruler.target = ev.pointer.pick;
			}
			if (this.__ruler.target == ev.view) {
				this.__ruler.target = ev.view.parent;
			}

			this.__ruler.rulermarkstart = ev.view.pos;
			this.__ruler.rulermarkend = vec3(ev.view._layout.left + ev.view._layout.width, ev.view._layout.top + ev.view._layout.height,0);
			this.__ruler.guides = this.guides;
		}

		var dragview = ev.view;
		if (!dragview.tooldragroot) {
			var p = dragview;
			while (p = p.parent) {
				if (p.tooldragroot) {
					dragview = p;
					break;
				}
			}
		}

		if (this.__resizecorner) {

			// Resize

			if (this.__resizecorner === "bottom-right") {
				dragview.width = this.__originalsize.w + ev.pointer.delta.x;
				dragview.height = this.__originalsize.h + ev.pointer.delta.y;
			} else if (this.__resizecorner === "bottom") {
				dragview.height = this.__originalsize.h + ev.pointer.delta.y;
			} else if (this.__resizecorner === "right") {
				dragview.width = this.__originalsize.w + ev.pointer.delta.x;
			} else if (this.__resizecorner === "top-left") {
				dragview.x = ev.pointer.position.x - this.__startpos.x;
				dragview.y = ev.pointer.position.y - this.__startpos.y;
				dragview.width = this.__originalsize.w - ev.pointer.delta.x;
				dragview.height = this.__originalsize.h - ev.pointer.delta.y;
			} else if (this.__resizecorner === "left") {
				dragview.x = ev.pointer.position.x - this.__startpos.x;
				dragview.width = this.__originalsize.w - ev.pointer.delta.x;
			} else if (this.__resizecorner === "top") {
				dragview.y = ev.pointer.position.y - this.__startpos.y;
				dragview.height = this.__originalsize.h - ev.pointer.delta.y;
			} else if (this.__resizecorner === "bottom-left") {
				dragview.x = ev.pointer.position.x - this.__startpos.x;
				dragview.width = this.__originalsize.w - ev.pointer.delta.x;
				dragview.height = this.__originalsize.h + ev.pointer.delta.y;
			} else if (this.__resizecorner === "top-right") {
				dragview.y = ev.pointer.position.y - this.__startpos.y;
				dragview.height = this.__originalsize.h - ev.pointer.delta.y;
				dragview.width = this.__originalsize.w + ev.pointer.delta.x;
			}

		} else if (this.__startpos && this.testView(ev.view) && ev.view.toolmove !== false) {

			// Move

			this.screen.pointer.cursor = "move";
			ev.view.cursor = "move";

			if (dragview.parent) {
				if (dragview.position != "absolute") {
					dragview.position = "absolute";
				}
			}

			var ax,ay,bx,by;
			if (this.selection) {
				ev.view.pos = vec3(ev.view.pos.x + ev.pointer.movement.x, ev.view.pos.y + ev.pointer.movement.y,0);
				ax = ev.view.pos[0];
				ay = ev.view.pos[1];
				bx = ax + ev.view._layout.width;
				by = ay + ev.view._layout.height;

				if (this.__ruler && this.__ruler.target && this.movelines !== false) {
					this.__ruler.lines = vec4(ax,ay,bx,by)
				}

				if (this.groupdrag) {
					for (var i=0;i<this.selection.length;i++) {
						var selected = this.selection[i];

						if (this.__input) {
							if (this.__input.target === selected) {
								this.__input.pos = vec3(this.__input.pos.x + ev.pointer.movement.x, this.__input.pos.y + ev.pointer.movement.y,0);
							}
						}

						if (selected === ev.view) {
							continue;
						}
						selected.pos = vec3(selected.pos.x + ev.pointer.movement.x, selected.pos.y + ev.pointer.movement.y,0);
					}
				}
			}

			this.__lastpick = ev.pointer.pick;

		} else if (this.__startrect) {

			//select rect

			var select = this.__selectrect || this.find('selectorrect');
			if (!select) {
				select = this.__selectrect = this.screen.openOverlay(this.selectorrect);
				this.__selectrect.pos = this.__startrect;
			}

			var pos = ev.pointer.position;

			var a = this.__startrect;
			var b = pos;

			if (a.x < b.x && a.y < b.y) { //normal
				select.pos = a;
				select.size = vec3(b.x - a.x, b.y - a.y,0);
			} else if (b.x < a.x && a.y < b.y) { // b lower left, a upper right
				select.pos = vec3(b.x, a.y,0);
				select.size = vec3(a.x - b.x, b.y - a.y);
			} else if (a.x < b.x && b.y < a.y) { // a lower left, b upper right
				select.pos = vec3(a.x, b.y,0);
				select.size = vec3(b.x - a.x, a.y - b.y,0);
			} else {
				select.pos = vec3(b.x, b.y);
				select.size = vec3(a.x - b.x, a.y - b.y,0);
			}
		}

	};

	this.globalpointerend = function(ev) {
		if (ev.view.drawtarget != "both") {
			ev.view.drawtarget = "both";
		}

		if (!this.visible) {
			return;
		}

		if (this.__ruler && this.__ruler.target !== ev.view && this.testView(ev.view)) {
			this.__ruler.lines = vec4(0,0,0,0);
			this.__ruler.target = ev.view;
			this.__ruler.guides = false;
		}

		if (this.__handle && this.__handle.target !== ev.view && this.testView(ev.view)) {
			this.__handle.target = ev.view;
		}

		var evview = ev.view;
		evview.cursor = 'arrow';
		var commit = false;
		if (this.__resizecorner && (evview == this || this.testView(evview)) && evview.toolresize !== false) {

			// Resize

			if (this.__resizecorner === "top-left") {
				evview.x = ev.pointer.position.x - this.__startpos.x;
				evview.y = ev.pointer.position.y - this.__startpos.y;
			} else if (this.__resizecorner === "top") {
				evview.y = ev.pointer.position.y - this.__startpos.y;
			} else if (this.__resizecorner === "left") {
				evview.x = ev.pointer.position.x - this.__startpos.x;
			} else if (this.__resizecorner === "bottom-left") {
				evview.x = ev.pointer.position.x - this.__startpos.x;
			}

			this.setASTObjectProperty(evview, "position", "absolute");
			this.setASTObjectProperty(evview, "x", evview._layout.absx);
			this.setASTObjectProperty(evview, "y", evview._layout.absy);
			this.setASTObjectProperty(evview, "width", evview._layout.width);
			this.setASTObjectProperty(evview, "height", evview._layout.height);

			commit = (Math.abs(evview.x - this.__originalpos.x) > 0.5)
				|| (Math.abs(evview.y - this.__originalpos.y) > 0.5)
				|| (Math.abs(evview._layout.width - this.__originalsize.w) > 0.5)
				|| (Math.abs(evview._layout.height - this.__originalsize.h) > 0.5);

		} else if (this.__startpos && this.testView(evview) && evview.toolmove !== false) {

			// Move view

			var pos = ev.pointer.position;
			if (evview.parent) {
				//if (evview.position != "absolute") {
				//	evview.position = "absolute";
				//}
				pos = evview.parent.globalToLocal(ev.pointer.position)
			}

			var nx = pos.x - this.__startpos.x;
			var dx = Math.abs(evview.pos.x - this.__originalpos.x);
			if (dx > 0.5) {
				commit = true;
			}

			var ny = pos.y - this.__startpos.y;
			var dy = Math.abs(evview.pos.y - this.__originalpos.y);
			if (dy > 0.5) {
				commit = true;
			}

			if (commit && this.selection) {
				if (this.testView(evview) && evview.toolmove !== false && evview.position === "absolute") {
					nx = evview.pos.x + ev.pointer.movement.x;
					this.setASTObjectProperty(evview, "x", nx);

					ny = evview.pos.y + ev.pointer.movement.y;
					this.setASTObjectProperty(evview, "y", ny);
				}
				if (this.groupdrag) {
					for (var i=0;i<this.selection.length;i++) {
						var selected = this.selection[i];
						if (selected === evview) {
							continue;
						}
						if (this.testView(selected) && selected.toolmove !== false && selected.position === "absolute") {
							this.setASTObjectProperty(selected, "x", selected.pos.x + ev.pointer.movement.x);
							this.setASTObjectProperty(selected, "y", selected.pos.y + ev.pointer.movement.y);
						}
					}
				}
			}

			if (this.__lastpick && this.__lastpick !== evview.parent && this.testView(this.__lastpick) && this.__lastpick.tooldrop !== false) {

				// Reparent because we dropped into a new view

				pos = this.__lastpick.globalToLocal(ev.pointer.position);

				nx = pos.x - this.__startpos.x;
				ny = pos.y - this.__startpos.y;

				this.setASTObjectProperty(evview, "x", nx, false);
				this.setASTObjectProperty(evview, "y", ny, false);

				this.appendASTNodeOn(this.__lastpick, evview);
				this.removeASTNodeFor(evview);

				if (this.selection && this.groupdrag && this.groupreparent) {
					for (var j=0;j<this.selection.length;j++) {
						var sel = this.selection[j];
						if (sel === evview) {
							continue;
						}
						this.appendASTNodeOn(this.__lastpick, sel);
						this.removeASTNodeFor(selected)
					}
				}

				commit = true;
			}

			if (!commit) {
				// Just a click ending, let's target what we clicked

				var inspector = this.find('inspector');
				if (inspector) {
					inspector.astarget = JSON.stringify(this.sourcefile.nodePathFor(evview));
				}

			}

		} else if (this.__startrect) {

			// Selection rectangle

			var pos = ev.pointer.position;

			var a = this.__startrect;
			var b = pos;

			var rect = vec4();

			if (a.x < b.x && a.y < b.y) { //normal
				rect.x = a.x;
				rect.y = a.y;
				rect.w = b.x - a.x;
				rect.z = b.y - a.y;
			} else if (b.x < a.x && a.y < b.y) { // b lower left, a upper right
				rect.x = b.x;
				rect.y = a.y;
				rect.w = a.x - b.x;
				rect.z = b.y - a.y;
			} else if (a.x < b.x && b.y < a.y) { // a lower left, b upper right
				rect.x = a.x;
				rect.y = b.y;
				rect.w = b.x - a.x;
				rect.z = a.y - b.y;
			} else {
				rect.x = b.x;
				rect.y = b.y;
				rect.w = a.x - b.x;
				rect.z = a.y - b.y;
			}
			var select = this.__selectrect || this.find('selectorrect');
			if (select) {
				select.closeOverlay();
				this.__selectrect = undefined;
			}

			if (rect.w > 0.5 || rect.z > 0.5) {
				var selection = this.screen.childrenInRect(rect, [select]);
				var selctedinrect = [];
				for (var i=0;i<selection.length;i++) {
					var selected = selection[i];
					if (selected !== this && this.testView(selected) && this.toolselect !== false) {
						var astpath = JSON.stringify(this.sourcefile.nodePathFor(selected));
						selctedinrect.push(astpath);
					}
				}
				if (this.selected && (ev.pointer.meta || ev.pointer.ctrl)) {
					this.selected = this.selected.concat(selctedinrect);
				} else {
					this.selected = selctedinrect;
				}
			}

		}

		if (commit) {
			this.ensureDeps();
			this.commit();
		}

		this.__lastpick = this.__startrect = this.__startpos = this.__originalpos = this.__resizecorner = this.__originalsize = undefined;
	};

	this.globalpointerout = function(ev) {
		if (ev.view.emit_block_set) {
			ev.view.emit_block_set = null;
		}
	};

	this.globalpointerhover = function(ev) {
		if (!this.visible) {
			return;
		}

		var pointer = ev.pointer;

		this.__lasthover = pointer.position;
		this.__lastover = ev.view;

		if (this.mode === "design" && this.testView(ev.view)) {
			if (ev.view.constructor.name === "button"
				|| ev.view.constructor.module.factory.baseclass === "/ui/button"
				|| ev.view.constructor.name === "checkbox"
				|| ev.view.constructor.module.factory.baseclass === "/ui/checkbox")
			{
				ev.view.emit_block_set = ["pointerhover", "pointerover", "pointerstart", "pointerend", "pointerout"]
			}
		}

		var text = ev.view.constructor.name;
		if (ev.view.name) {
			text = ev.view.name + " (" + text + ")"
		}

		var pos = ev.view.globalToLocal(pointer.position);

		if (this.__ruler && this.__ruler.target) {
			this.__ruler.rulermarkstart = this.__ruler.target.globalToLocal(pointer.position);
			if (this.hoverlines !== false) {
				var rpos = this.__ruler.target.globalToLocal(pointer.position)
				this.__ruler.lines = vec4(rpos.x,rpos.y,0,0)
			}
		}

		text = text + " @ " + ev.pointer.position.x.toFixed(0) + ", " + ev.pointer.position.y.toFixed(0);
		text = text + " <" + pos.x.toFixed(0) + ", " + pos.y.toFixed(0) + ">";

		this.find("pointer").text = text;

		this.resetCursor(ev);

		if (this.__selectrect) {
			var m = this.__selectrect;
			this.__selectrect = undefined;
			m.closeOverlay();
		}

	};

	this.globalkeydown = function(ev) {
		if (ev.name === "t" && ev.ctrl && ev.shift) {
			this.setASTObjectProperty(this, "visible", !this.visible);
			this.ensureDeps();
			this.commit();
			return;
		}

		if (!this.visible) {
			return;
		}

		if (ev.name === "z" && (ev.ctrl || ev.meta) && ev.shift) {
			this.selected = [];
			this.sourcefile.redo();
		} else if (ev.name === "z" && (ev.ctrl || ev.meta)) {
			this.selected = [];
			this.sourcefile.undo();
		} else if (ev.name === "backspace" && this.selection && this.selection.length) {
			var candelete = !this.screen.focus_view || (["textbox", "jseditor"].indexOf(this.screen.focus_view.constructor.name) === -1 && this.screen.focus_view.constructor.name !== "input");
			if (candelete) {
				this.deleteselection();
			}
		} else if (ev.name === "x" && (ev.ctrl || ev.meta)) {
			this.copyselection();
			var candelete = !this.screen.focus_view || (["textbox", "jseditor"].indexOf(this.screen.focus_view.constructor.name) === -1 && this.screen.focus_view.constructor.name !== "input");
			if (candelete) {
				this.deleteselection();
			}
		} else if (ev.name === "c" && (ev.ctrl || ev.meta)) {
			this.copyselection();
		} else if (ev.name === "v" && (ev.ctrl || ev.meta)) {
			var commit = false;
			if (this.clipboard && this.clipboard.length) {
				var pastetargets = this.selection || [];

				if (this.__lastover && !pastetargets.length) {
					pastetargets.push(this.__lastover)
				}

				for (var i=0;i<pastetargets.length;i++) {
					var v = pastetargets[i];
					if (this.testView(v)) {
						for (var j=0;j<this.clipboard.length;j++) {
							var ast = JSON.parse(this.clipboard[j]);
							if (this.dropmode === "absolute") {
								this.sourcefile.setCallNodeValue(ast, "position", "absolute");
								var indent = j * 10;
								if (this.__lasthover) {
									var pos = v.globalToLocal(this.__lasthover);
									this.sourcefile.setCallNodeValue(ast, "x", pos[0] + indent);
									this.sourcefile.setCallNodeValue(ast, "y", pos[1] + indent)
								} else {
									this.sourcefile.setCallNodeValue(ast, "x", indent);
									this.sourcefile.setCallNodeValue(ast, "y", indent)
								}

							} else {

								this.sourcefile.deleteCallNodeKey(ast, "position");
								this.sourcefile.deleteCallNodeKey(ast, "x");
								this.sourcefile.deleteCallNodeKey(ast, "y");
							}

							this.appendASTArgOn(v, ast);
							commit = true;
						}
					}
				}
			}
			if (commit) {
				this.ensureDeps();
				this.commit();
			}
		}
	};

	this.deleteselection = function() {
		var commit = false;
		for (var i=this.selection.length - 1; i>=0; i--) {
			var v = this.selection[i];
			if (this.testView(v) && v.toolremove !== false) {
				this.removeASTNodeFor(v);
				commit = true;
			}
		}
		if (commit) {
			this.ensureDeps();
			this.commit();
		}
	};

	this.copyselection = function() {
		var copied = [];
		for (var i=this.selection.length - 1; i>=0; i--) {
			var v = this.selection[i];
			if (this.testView(v)) {
				copied.push(JSON.stringify(this.sourcefile.nodeFor(v)));
			}
		}
		this.clipboard = copied;
	};

	this.ensureDeps = function() {
		var at = "";
		var arglist = [];
		var plist = {};

		var main = this.sourcefile.nodeFor(this.screen.composition);
//		console.log('AST', main);
		if (main && main.params) {
			for (var i=0;i<main.params.length;i++) {
				var param = main.params[i];
				if (param && param.id && param.id.name) {
					var name = param.id.name;
					if (name[0] === '$' && name[name.length - 1] === '$') {
						at = name;
					} else {
						if (!plist[at]) {
							plist[at] = [];
						}
						plist[at].push(name)
					}
					arglist.push(name);
				}
			}

			if (this.components) {
				var missing = {};
				if (Array.isArray(this.components)) {

					for (var i=0;i<this.components.length;i++) {
						var compdef = this.components[i];

						var classname = compdef.classname;
						if (classname) {
							var cdir = compdef.classdir || "$$";

							var included = plist[cdir];
							if (!included) {
								included = [];
							}

							if (included.indexOf(classname) < 0) {
								if (!missing[cdir]) {
									missing[cdir] = []
								}
								missing[cdir].push(classname)
							}
						}
					}

				} else {

					for (var key in this.components) {
						if (this.components.hasOwnProperty(key)) {
							var section = this.components[key];
							for (var s=0;s<section.length;s++) {
								var compdef = section[s];

								var classname = compdef.classname;
								if (classname) {
									var cdir = compdef.classdir || "$$";

									var included = plist[cdir];
									if (!included) {
										included = [];
									}

									if (included.indexOf(classname) < 0) {
										if (!missing[cdir]) {
											missing[cdir] = []
										}
										missing[cdir].push(classname)
									}
								}
							}
						}
					}
				}

				for (var dir in missing) {
					if (missing.hasOwnProperty(dir)) {
						var position = arglist.indexOf(dir);
						if (position < 0) {
							position = arglist.length;
							arglist.push(dir);
							this.spliceASTParam(dir)
						}
						var missed = missing[dir];
						for (var m = 0; m < missed.length; m++) {
							var item = missed[m];
							arglist.splice(position + 1, 0, item);
							this.spliceASTParam(item, position + 1)
						}
					}
				}
			}
		}

	};

	this.resetCursor = function (ev, useview) {
		var resize = false;

		var vw = useview || ev.view;

		if (vw === this || (this.testView(vw) && ev.view.toolmove !== false && ev.view.toolresize !== false)) {
			var pos = vw.globalToLocal(ev.pointer.position);
			var edge = this.reticlesize;

 			if (vw._layout.width < edge * 2) {
				edge = Math.max(3, vw._layout.width * 0.25)
			}
			if (vw._layout.height < edge * 2) {
				edge = Math.max(3, vw._layout.height * 0.25)
			}

			vw.cursor = 'arrow';

			if (pos.x < edge && pos.y < edge) {
				resize = "top-left";
				vw.cursor = 'nwse-resize'

			} else if (pos.x > vw.width - edge && pos.y < edge) {
				resize = "top-right";
				vw.cursor = 'nesw-resize'

			} else if (pos.x < edge && pos.y > vw.height - edge) {
				resize = "bottom-left";
				vw.cursor = 'nesw-resize'

			} else if (pos.x > vw.width - edge && pos.y > vw.height - edge) {
				resize = "bottom-right";
				vw.cursor = 'nwse-resize'

			} else if (pos.x < edge) {
				resize = "left";
				vw.cursor = 'ew-resize'

			} else if (pos.y < edge) {
				resize = "top";
				vw.cursor = 'ns-resize'

			} else if (pos.x > vw.width - edge) {
				resize = "right";
				vw.cursor = 'ew-resize'

			} else if (pos.y > vw.height - edge) {
				resize = "bottom";
				vw.cursor = 'ns-resize'
			}

			if (!resize) {
				vw.cursor = 'arrow';
			}

		} else if (vw.toolallow === false) {
			vw.cursor = 'not-allowed';
		} else {
			vw.cursor = 'arrow';
		}

		return resize;
	};

	this.testView = function(v) {
		var ok = v != this.screen;
		var p = v;
		while (p && ok) {
			ok = p.tooltarget !== false;
			p = p.parent;
		}
		return ok;
	};

	this.pointerstart = function(ev,v,o) {
		var at = this.globalToLocal(ev.position);
		var lowest;
		for (var i=0;i<this.children.length;i++) {
			var child = this.children[i];
			var layout = child.layout;
			var childbottom = layout.top + layout.height;
			if (childbottom < at.y) {
				if (child.title !== "Cursor" && (!lowest || lowest._layout.top + lowest._layout.height < childbottom)) {
					lowest = child;
				}
			}
		}

		this.__movepanel = lowest;
	};

	this.pointermove = function(ev,v,o) {
		if (this.__movepanel) {
			this.__movepanel.flex = 0;
			this.__movepanel.height = this.__movepanel._layout.height + ev.movement.y;
//			this.height = this._layout.height + ev.movement.y;
		}
	};

	this.pointerend = function() {
		this.__movepanel = undefined;
	};

	this.paletteDropTest = function(ev, v, item, orig, dv) {
		return v !== this && this.testView(v);
	};

	this.paletteDrop = function(ev, v, item, orig, dv) {
		if (!v) {
			v = this.screen
		}

		if (item.behaviors) {
			for (var o in item.behaviors) {
				if (item.behaviors.hasOwnProperty(o)) {
					var behave = item.behaviors[o];
					this.setASTObjectProperty(v, o, behave, true);
				}
			}
		}

		if (item.classname && item.params) {
			var params = JSON.parse(JSON.stringify(item.params));

			if (v != this.screen) {
				var pos = v.globalToLocal(ev.position);
				params.position = this.dropmode;
				if (this.dropmode === 'absolute') {
					params.x = pos.x;
					params.y = pos.y;
				}
			}

			this.createASTNodeOn(v, {classname:item.classname, params:params})
		}


		this.ensureDeps();
		this.commit();

		//TODO(mason) set propviewer to inspect new object on reload?
	};

	this.render = function() {
		var views = [];

		var vertical = this.flexdirection === "column";

		if (vertical) {
			views = [
				view({
					justifycontent:'space-between',
					bgcolor:"white",
					hardrect:{pickonly:true},
					pointerstart:function(p) {
						this.__grabpos = p.view.globalToLocal(p.position);
					},
					pointermove:function(p) {
						if (this.parent.position === "absolute") {
							this.screen.pointer.cursor = "move";

							// TODO(mason) Figure out why this fixes the bug (comment the following and drag toolkit to see the bug)
							this.parent.find("components").pos = vec3(0,0,0);
							this.parent.find("structure").pos = vec3(0,0,0);
							this.parent.find("inspector").pos = vec3(0,0,0);
							this.parent.find("code").pos = vec3(0,0,0);

							if (this.__grabpos) {
								this.parent.pos = vec3(p.position.x - this.__grabpos.x, p.position.y - this.__grabpos.y,0)
							}
						}
					},
					pointerend:function(p) {
						var parent = this.parent;
						if (parent.testView && parent.toolmove !== false  && parent.position === "absolute") {

							parent.pos = vec3(p.position.x - this.__grabpos.x, p.position.y - this.__grabpos.y, 0);

							parent.setASTObjectProperty(parent, "position", "absolute");
							parent.setASTObjectProperty(parent, "x", parent._layout.absx);
							parent.setASTObjectProperty(parent, "y", parent._layout.absy);
							parent.setASTObjectProperty(parent, "width", parent._layout.width);
							parent.setASTObjectProperty(parent, "height", parent._layout.height);
							parent.ensureDeps();
							parent.commit();
						}
						this.screen.pointer.cursor = "arrow";
						this.__grabpos = undefined;
					}
				},
				icon({
					icon:"gears",
					fgcolor:vec4(0.8,0.8,0.8,0.6),
					marginleft:5,
					padding:5,
					drawtarget:'color'
				}),
				label({
					name:"title",
					text:"DreemGL Visual Toolkit",
					bgcolor:NaN,
					fgcolor:vec4(0.8,0.8,0.8,0.8),
					padding:5,
					drawtarget:'color'
				}),
				button({
					fontsize:16,
					icon:"times",
					pickalpha:-1,
					bgcolor:"transparent",
					borderwidth:0,
					margintop:0,
					marginright:7,
					textactivecolor:"white",
					textcolor:vec4(0.8,0.8,0.8,0.8),
					buttoncolor1:"transparent",
					buttoncolor2:"transparent",
					hovercolor1:"transparent",
					hovercolor2:"transparent",
					pressedcolor1:"transparent",
					pressedcolor2:"transparent",
					click:function(ev,v,o) {
						this.setASTObjectProperty(this, "visible", false);
						this.ensureDeps();
						this.commit();
					}.bind(this)
				}))
			]
		}

		views.push(this.panel({flex:1.0},
			palette({
				name:"components",
				flex:1,
				bgcolor:"#4e4e4e",
				items:this.components,
				dropTest:this.paletteDropTest.bind(this),
				drop:this.paletteDrop.bind(this)
			})
		));

		views.push(this.panel({flex:vertical ? 0 : 2},
			label({name:"pointer", text:"", padding:5, paddingleft:10, bgcolor:"#4e4e4e"})
		));

		views.push(this.panel({flex:1},
			treeview({
				flex:1,
				name:"structure",
				bgcolor:"#4e4e4e",
				style:{
					$:{
						buttoncolor1:"transparent",
						buttoncolor2:"transparent",
						borderwidth:0,
						bgcolor:"#4e4e4e"
					},
					treeline:{
						bgcolor:"#4e4e4e"
					}
				},
				reload:function() {
					var swalk = function (v) {
						if (v.tooltarget !== false) {
							var children = [];
							for (var i = 0; i < v.children.length; i++) {
								var child = swalk(v.children[i]);
								if (child) {
									children.push(child);
								}
							}

							var name = v.constructor.name;
							if (v.name) {
								name = v.name + " (" + name + ")"
							}
							var selected = (!!(this.selection) && this.selection.indexOf(v) > -1);

							var itemview = view({
								bgcolor:NaN,
								padding:0,
								margin:0,
								height:25,
								alignitems:"center"
							},
								checkbox({
									icon:"lock",
									pickalpha:-1,
									textactivecolor:vec4(0.1,0.6,0.8,1),
									textcolor:"#666",
									bgcolor:"transparent",
									fontsize:14,
									borderwidth:0,
									padding:0,
									value: v.toolmove === false,
									click:function() {
										v.toolmove = !this.value;
									}
								}),
								button({
									text:name,
									bgcolor:"#4e4e4e",
									buttoncolor1:"transparent",
									buttoncolor2:"transparent",
									hovercolor1:"transparent",
									hovercolor2:"transparent",
									pressedcolor1:"transparent",
									pressedcolor2:"transparent",
									textcolor: "#ddd",
									textactivecolor:"#fff",
									borderwidth:0,
									click:function(ev, val, o) {
										var astpath = JSON.stringify(this.sourcefile.nodePathFor(v));
										if (!this.selected || this.selected.indexOf(astpath) < 0) {
											this.selected = [astpath]
										}
										//o.state = "selected"
									}.bind(this),
									margintop:5,
									padding:5,
									fontsize:14,
									pickalpha:-1
								}),
								checkbox({
									icon:"eye-slash",
									pickalpha:-1,
									fontsize:14,
									textactivecolor:vec4(1,0.5,0.5,1),
									textcolor:"#666",
									bgcolor:"transparent",
									borderwidth:0,
									padding:0,
									value: !v.visible,
									click:function() {
										v.visible = !v.visible;
									}
								}),
								checkbox({
									icon:"warning",
									pickalpha:-1,
									textactivecolor:"yellow",
									textcolor:"#444",
									bgcolor:"transparent",
									fontsize:12,
									//margintop:7,
									marginleft:3,
									borderwidth:0,
									padding:0,
									value: v.tooltarget === false,
									click:function() {
										v.tooltarget = !this.value;
									}
								})
							);

							return {
								itemview: itemview,
								children: children,
								selected: selected,
								collapsed:false,
								view:v
							}
						}
					}.bind(this.parent.outer);
					this.data = swalk(this.screen);
				},
				init:function() {
					this.reload();
				}
			})
		));

		views.push(this.panel(
			{flex:1.7},
			propviewer({
				name:"inspector",
				target:this.inspect,
				flex:1,
				overflow:"scroll",
				bgcolor:"#4e4e4e",
				callback:function(val, editor, commit) {
					if (editor && editor.target && editor.propertyname) {
						var t = editor.target;
						if (typeof(t) === 'string') {
							t = editor.find(t);
						}

						if (t && (t == this || this.testView(t)) && t.tooledit !== false) {
							if (commit === "file") {
								var formData = new FormData();
								var fileobjname;
								for (var i = 0; i < val.length; i++) {
									var file = val[i];
									fileobjname = file.name;
									formData.append('file', file);
								}
								if (fileobjname) {
									var xhr = new XMLHttpRequest();
									xhr.open('POST', window.location.pathname, true);
									xhr.onload = function() {
										if (xhr.status === 200) {
											var compfile = t.screen.composition.constructor.module.filename;
											var compdir = compfile.substring(0, compfile.lastIndexOf('/'));
											var filename = compdir + "/" + fileobjname;
											this.setASTObjectProperty(t, editor.propertyname, filename);
											this.ensureDeps();
											this.commit();
										} else {
											console.log('Oops, upload failed', xhr, val);
										}
									}.bind(this);
									xhr.send(formData);
								}
							} else {
								this.setASTObjectProperty(t, editor.propertyname, val);
								this.__needscommit = true;
							}
						}
					}
					if (commit && this.__needscommit) {
						this.__needscommit = false;
						this.ensureDeps();
						this.commit();
					}
				}.bind(this),
				ontarget:function(ev,v,o) {
					if (v) {
						if (this.__ruler) {
							this.__ruler.closeOverlay();
						}
						if (this.rulers && this.testView(v)) {
							this.__ruler = this.screen.openOverlay(this.ruler);
							this.__ruler.target = v;
						}

						if (this.__input) {
							if (this.__input.target) {
								this.__input.target.opacity = 1.0 * this.__input.target.__toolkitopacity;
							}
							this.__input.closeOverlay();
						}
						if (this.testView(v)
							&& v.tooltextedit !== false
							&& (v.constructor.name === "label" || v.constructor.module.factory.baseclass === "/ui/label")) {
							this.__input = this.screen.openOverlay(this.input);
							this.__input.target = v;
						}

						if (this.__handle) {
							this.__handle.closeOverlay();
						}
						if (this.handles && this.testView(v) && v.toolrotate !== false) {
							this.__handle = this.screen.openOverlay(this.handle);
							this.__handle.target = v;
						}

						if (v === this || this.testView(v)) {
							var editor = this.find("code");
							if (editor) {
								// todo(mason) remove this ugly hack when jseditor events exist
								editor.__lasttarget = editor.__target;
								editor.__target = v;
								editor.ast = this.sourcefile.nodeFor(v);
							}
						}
					}
				}.bind(this),
				astarget:Config({type:String, persist:true}),
				onastarget:function(ev,v,o) {
					if (v) {
						var find = function(a, b) {
							if (a === this.sourcefile.nodeFor(b)) return b;
							if (b.children) {
								for (var i = 0;i < b.children.length;i++) {
									var c = find(a, b.children[i]);
									if (c) return c;
								}
							}
						}.bind(this);

						var astpath = JSON.parse(v);
						this.sourcefile.reset();
						var node = this.sourcefile.nodeForPath(astpath);
						o.target = find(node, this.screen);
					}
				}.bind(this)
			}),
			jseditor({
				name:"code",
				flex:1,
				overflow:'scroll',
				margin:vec4(2,7,2,2),
				fontsize:12,
				boldness:0.1,
				wrap:true,
				format_options: {
					force_newlines_array:false,
					force_newlines_object:true
				},
				onfocus:function(ev,v,o){
					if (!v && o._value && o.__lasttarget) {
						var newsource = o._value;
						var newast = this.sourcefile.parse(newsource);
						if (newast) {
							// TODO(mason) make this less of a terrible hack
							this.sourcefile.fork(function(src) {
								var currentnode =  src.nodeFor(o.__lasttarget);
								var parentnode =  src.nodeFor(o.__lasttarget.parent);
								var index = parentnode.args.indexOf(currentnode);
								var node = newast.steps[0];
								parentnode.args.splice(index, 1, node);
							})
						}
					}
				}.bind(this)
			})
		));

		return views;
	};

	this.spliceASTParam = function(param, pos) {

		if (!this.__changes) {
			this.__changes = [];
		}

		var change = {
			param:param
		};

		if (pos) {
			change.pos = pos
		}

		this.__changes.push(change);
	};

	this.createASTNodeOn = function(parent, params) {
		if (!this.__changes) {
			this.__changes = [];
		}

		this.__changes.push({ parent:parent, params:params });
	};

	this.appendASTNodeOn = function(parent, child) {

		if (!this.__changes) {
			this.__changes = [];
		}

		this.__changes.push({ parent:parent, child:child });

	};

	this.appendASTArgOn = function(parent, arg) {

		if (!this.__changes) {
			this.__changes = [];
		}

		this.__changes.push({ parent:parent, arg:arg });

	};

	this.removeASTNodeFor = function(v) {

		if (!this.__changes) {
			this.__changes = [];
		}

		this.__changes.push({ remove:v });
	};

	this.setASTObjectProperty = function(v, name, value, setval) {
		if (v == this.screen || v.constructor.name === "screen") {
			console.error("how did a screen get selected to be edited?")
			return;
		}
		if (setval !== false) {
			v[name] = value;
		}

		if (!this.__changes) {
			this.__changes = [];
		}

		var changes;
		for (var i=0;i<this.__changes.length;i++) {
			var ch = this.__changes[i];
			if (ch.view === v) {
				changes = ch;
				break;
			}
		}

		if (!changes) {
			changes = { view:v, changes:[] };
			this.__changes.push(changes)
		}

		changes.changes.push({key:name, value:value});
	};

	this.commit = function() {
		if (this.__changes && this.__changes.length) {
			this.sourcefile.fork(function(src) {
				while (this.__changes.length) {
					var changes = this.__changes;
					this.__changes = [];
					for (var i=0;i<changes.length;i++){
						var changeset = changes[i];
						src.reset();
						if (changeset.changes) {
							for (var j=0;j<changeset.changes.length;j++) {
								var change = changeset.changes[j];
								src.reset();
								src.seekNodeFor(changeset.view);
								src.setArgValue(change.key, change.value);
							}
						} else if (changeset.remove) {
							var v = changeset.remove;
							var node = src.nodeFor(v);
							src.seekNodeFor(v.parent);
							src.removeArgNode(node);
						} else if (changeset.param) {
							var param = changeset.param;
							var def = src.build.Def(src.build.Id(param));
							var main = this.sourcefile.nodeFor(this.screen.composition);
							if (changeset.pos) {
								main.params.splice(changeset.pos, 0, def)
							} else {
								main.params.push(def)
							}
						} else if (changeset.parent) {
							src.seekNodeFor(changeset.parent);
							if (changeset.child) {
								src.pushArg(src.nodeFor(changeset.child));
							}
							if (changeset.params) {
								var item = changeset.params;
//								console.log("build", item.params)
								var newo = src.createASTNode(item.params)
//								console.log("build2", newo)
								var obj = src.build.Call(src.build.Id(item.classname),[newo]);
//								console.log("build3", obj)
								src.pushArg(obj);
							}
							if (changeset.arg) {
								src.pushArg(changeset.arg);
							}
						} else {
							console.log("bad change?", changeset)
						}
					}
				}
			}.bind(this));
		}
	};

	defineDreem.class(this, "selectorrect", view, function() {
		this.name = "selectorrect";
		this.drawtarget = "color";
		this.bordercolorfn = function(pos) {
			var speed = time * 27.0;
			var size = 0.0008;
			var slices = 3.5;
			var v = int(mod(size * (gl_FragCoord.x - gl_FragCoord.y + speed), slices));
			return vec4((v + 0.45) * vec3(0.5, 0.9, 0.9), 0.8);
		}
		this.borderwidth = 1;
		this.bgcolor = vec4(0.7,0.7,0.7,0.07);
		this.borderradius = 7;
		this.position = "absolute";
		this.tooltarget = false;
	});

	defineDreem.class(this, "selectedrect", view, function() {
		this.visible = wire('this.outer.visible');
		this.drawtarget = "color";
		this.attributes = {
			borderseed:Math.random() + 17.0,
			target:Config({persist:true, type:Object})
		};
		this.bordercolorfn = function(pos) {
			var size = 0.02;
			var slices = 2.0;
			var v = int(mod(size * (gl_FragCoord.x - gl_FragCoord.y + this.borderseed), slices));
			return vec4((v + 1) * vec3(0.9, 0.5, 0.8), 0.8);
		};

		this.minimumborderradius = 3;
		this.borderradius = this.minimumborderradius;
		this.onborderradius = function(ev,v,o) {
			if (v) {
				for (var i = 0; i < v.length; i++) {
					if (!v[i]) {
						v[i] = this.minimumborderradius;
					}
				}
			}
		};

		this.borderwidth = 1.5;
		this.bgcolor = NaN;
		this.position = "absolute";
		this.tooltarget = false;
		this.ontarget = function(ev,v,o) {
			this.pos = vec3(v._layout.absx - this.borderwidth[0] / 2.0, v._layout.absy - this.borderwidth[0] / 2.0, 0);
			this.size = vec3(v._layout.width + this.borderwidth[0], v._layout.height + this.borderwidth[0], 0);
			this.rotate = v.rotate;

			var p = v;
			while (p = p.parent) {
				for (var i=0;i<this.rotate.length;i++) {
					this.rotate[i] += p.rotate[i]
				}
			}

			if (v.borderradius && v.borderradius[0] + v.borderradius[1] + v.borderradius[2] + v.borderradius[3]) {
				this.borderradius = v.borderradius;
			}

			//TODO (mason) these events maybe need to be cleaned up later, not sure yet

			v.onsize = function(ev,v,o) {
				this.size = vec3(v.x + this.borderwidth[0], v.y + this.borderwidth[0], v.z)
			}.bind(this);

			v.onpos = function(ev,v,o) {
				var x = v.x - (this.borderwidth[0] + this.borderwidth[1]) / 2.0;
				var y = v.y - (this.borderwidth[2] + this.borderwidth[3]) / 2.0;
				var p = o;
				while (p = p.parent) {
					x = x + p.x;
					y = y + p.y;
				}
				this.pos = vec3(x, y, v.z);
			}.bind(this);

			v.onfontsize = function(ev,fs,o) {
				var v = o.layout;
				this.size = vec3(v.width + this.borderwidth[0], v.height + this.borderwidth[0], 0)
				var x = v.left - (this.borderwidth[0] + this.borderwidth[1]) / 2.0;
				var y = v.top - (this.borderwidth[2] + this.borderwidth[3]) / 2.0;
				var p = o;
				while (p = p.parent) {
					x = x + p.x;
					y = y + p.y;
				}
				this.pos = vec3(x, y, 0);
			}.bind(this);

			v.onrotate = function(ev,v,o) {
				this.rotate = v;
				var p = o;
				while (p = p.parent) {
					for (var i=0;i<this.rotate.length;i++) {
						this.rotate[i] += p.rotate[i]
					}
				}
			}.bind(this);

			v.onborderradius = function(ev,v,o) {
				this.borderradius = v;
			}.bind(this);
		}
	});

	defineDreem.class(this, "ruler", view, function() {
		this.visible = wire('this.outer.visible');
		this.drawtarget = "color";
		this.bgcolor = "transparent";
		this.position = "absolute";
		this.tooltarget = false;
		this.borderwidth = vec4(5.0,5.0,5.0,5.0);
		this.attributes = {
			target:Config({type:Object}),
			rulertickwidth:1,
			rulertickspacing:10.0,
			rulermajorevery:10,
			rulermajorcolor:vec4("#F9F6F4"),
			rulerminorcolor:vec4("#B0C4DE"),
			rulermarkstartcolor:vec4("#00CCDD"),
			rulermarkstart:vec3(0,0,0),
			rulermarkendcolor:vec4("#DD00BB"),
			rulermarkend:vec3(0,0,0),
			linecolor:vec4("#00CCDD"),
			lines:vec4(0,0,0,0),
			linedotspacing:10.0,
			guidecolor:vec4("#FFDD00"),
			edges:vec4(0,0,0,0),
			guides:false,
			centertrigger:100.0
		};

		this.calculateEdges = function() {

		};

		this.bgcolorfn = function(p) {
			var px = width * p.x;

			var py = height * p.y;

			if (guides) {
				if (abs(layout.width * 0.5 - px) < 0.5 && abs(layout.width * 0.5 - (lines[0] + ((lines[2] - lines[0]) * 0.5))) < 1.0
					|| abs(layout.height * 0.5 - py) < 0.5 && abs(layout.height * 0.5 - (lines[1] + ((lines[3] - lines[1]) * 0.5))) < 1.0) {
					return guidecolor;
				}

				if (abs(layout.width * 0.5 - px) < 0.5 && abs(layout.width * 0.5 - (lines[0] + ((lines[2] - lines[0]) * 0.5))) < centertrigger) {
					return vec4(guidecolor.rgb, 0.5 + (((1.0 - abs(layout.width * 0.5 - (lines[0] + ((lines[2] - lines[0]) * 0.5)))) / centertrigger) * 0.5));
				}


				if (abs(layout.height * 0.5 - py) < 0.5 && abs(layout.height * 0.5 - (lines[1] + ((lines[3] - lines[1]) * 0.5))) < centertrigger) {
					return vec4(guidecolor.rgb, 0.5 + (((1.0 - abs(layout.height * 0.5 - (lines[1] + ((lines[3] - lines[1]) * 0.5)))) / centertrigger) * 0.5));
				}
			}

			if (lines[0] > 0.0 && abs(px - lines[0]) < 0.5 && int(mod(py, linedotspacing)) == 0) {
				return rulermarkstartcolor;
			} else if (lines[1] > 0.0 && abs(py - lines[1]) < 0.5 && int(mod(px, linedotspacing)) == 0) {
				return rulermarkstartcolor;
			} else if (lines[2] > 0.0 && abs(px - lines[2]) < 0.5 && int(mod(py, linedotspacing)) == 0) {
				return rulermarkendcolor;
			} else if (lines[3] > 0.0 && abs(py - lines[3]) < 0.5 && int(mod(px, linedotspacing)) == 0) {
				return rulermarkendcolor;
			} else {
				return bgcolor;
			}
		};

		this.bordercolorfn = function(p) {
			var atx = p.x * layout.width;
			var aty = p.y * layout.height;
			if ((aty > borderwidth[2] && aty < layout.height - borderwidth[3]) && (atx < borderwidth[0] || atx > layout.width - borderwidth[1])) {
				if (aty > rulermarkstart[1] - rulertickwidth * 0.5 && aty < rulermarkstart[1] + rulertickwidth * 0.5) {
					return rulermarkstartcolor;
				} else if (aty > rulermarkend[1] - rulertickwidth * 0.5 && aty < rulermarkend[1] + rulertickwidth * 0.5) {
					return rulermarkendcolor;
				}

				var c = int(mod(gl_FragCoord.y, rulertickspacing * rulermajorevery));
				if (c < int(rulertickwidth * 2.0)) {
					return rulermajorcolor;
				}

				if (atx < borderwidth[0] * 0.5 || atx > layout.width - borderwidth[1] * 0.5) {
					var m = int(mod(gl_FragCoord.y, rulertickspacing));
					if (m < int(rulertickwidth)) {
						return rulerminorcolor;
					}
				}
			}
			else if ((atx > borderwidth[0] && atx < layout.width - borderwidth[1]) && (aty < borderwidth[2] || aty > layout.height - borderwidth[3])) {

				if (atx > rulermarkstart[0] - rulertickwidth * 0.5 && atx < rulermarkstart[0] + rulertickwidth * 0.5) {
					return rulermarkstartcolor;
				} else if (atx > rulermarkend[0] - rulertickwidth * 0.5 && atx < rulermarkend[0] + rulertickwidth * 0.5) {
					return rulermarkendcolor;
				}

				var b = int(mod(gl_FragCoord.x, rulertickspacing * rulermajorevery));
				if (b < int(rulertickwidth * 2.0)) {
					return rulermajorcolor;
				}

				if (aty < borderwidth[2] * 0.5 || aty > layout.height - borderwidth[3] * 0.5) {
					var n = int(mod(gl_FragCoord.x, rulertickspacing));
					if (n < int(rulertickwidth)) {
						return rulerminorcolor;
					}
				}

			}
			return bordercolor;
		};

		this.ontarget = function(ev,v,o) {
			if (!v) {
				this.visible = false;
				return;
			}
			this.visible = wire('this.outer.visible');
			this.pos = vec3(v._layout.absx, v._layout.absy, 0);
			this.size = vec3(v._layout.width, v._layout.height, 0);
			this.rotate = v.rotate;

			var p = v;
			while (p = p.parent) {
				for (var i=0;i<this.rotate.length;i++) {
					this.rotate[i] += p.rotate[i]
				}
			}
		}
	});

	defineDreem.class(this, "handle", icon, function() {
		this.tooltarget = false;
		this.visible = wire('this.outer.visible');
		this.position = "absolute";
		this.width = 50;
		this.height = 50;
		this.pickalpha = -1;
		this.bgcolor = "transparent";
		this.fgcolor = vec4(1,1,1,0.3);
		this.fontsize = 50;

		this.icon = "compass";

		this.attributes = {
			target:Config({type:Object}),
			spinmode:true
		};

		this.onspinmode = function(ev,v,o) {
			this.icon = v ? "compass" : "arrows"
		};

		this.pointertap = function(ev,v,o) {
			this.spinmode = !this.spinmode;
		};

		this.pointerstart = function(ev,v,o) {
			this.__startrotation = this.target.rotate;
		};

		this.pointermove = function(ev,v,o) {
			var cx = this.target._layout.absx + this.target._layout.width * 0.5;
			var cy = this.target._layout.absy + this.target._layout.height * 0.5;

			this.pos = vec3(this.pos[0] + ev.movement.x, this.pos[1] + ev.movement.y);

			if (this.spinmode) {
				var d;
				if (this.pos.y < cy && this.pos.x < cx) {
					d = ev.movement.x * 0.01 - ev.movement.y * 0.01
				} else if (this.pos.y < cy && this.pos.x > cx) {
					d = ev.movement.x * 0.01 + ev.movement.y * 0.01
				} else if (this.pos.y > cy && this.pos.x < cx) {
					d = - ev.movement.x * 0.01 - ev.movement.y * 0.01
				} else if (this.pos.y > cy && this.pos.x > cx) {
					d = - ev.movement.x * 0.01 + ev.movement.y * 0.01
				}

				if (d) {
					this.target.rotate = vec3(this.target.rotate[0],this.target.rotate[1],this.target.rotate[2] + d);
				}
			} else {
				this.target.rotate = vec3(this.target.rotate[0]+ ev.movement.y* 0.01,this.target.rotate[1]+ ev.movement.x* 0.01,this.target.rotate[2]);
			}
			if (this.outer.__ruler) {
				this.outer.__ruler.rotate = this.target.rotate;
			}
		};

		this.pointerend = function(ev,v,o) {

			if (Math.abs(this.target.rotate[0] - this.__startrotation[0]) >= 0.01
			    || Math.abs(this.target.rotate[1] - this.__startrotation[1]) >= 0.01
				|| Math.abs(this.target.rotate[2] - this.__startrotation[2]) >= 0.01)
			{
				this.outer.setASTObjectProperty(this.target, "rotate", this.target.rotate, false);
				this.outer.commit();
			} else {
				this.resetPosition()
			}
		};

		this.resetPosition = function() {
			this.pos = vec3(this.target._layout.absx + this.target._layout.width + 20, this.target._layout.absy - 20 , 0);
		};

		this.ontarget = function(ev,v,o) {
			if (!v) {
				this.visible = false;
				return;
			}
			this.visible = wire('this.outer.visible');
			this.resetPosition();
		}
	});

	defineDreem.class(this, "input", textbox, function() {
		this.tooltarget = false;
		this.visible = wire('this.outer.visible');
		this.position = "absolute";
		this.bgcolor = "transparent";
		this.fgcolor = vec4(1,0,0,1);

		this.attributes = {
			target: Config({type: Object})
		};

		this.onvalue = function(ev,v,o) {
            var rect;
			if (this.outer.__selrects) {
				for (i = 0; i < this.outer.__selrects.length; i++) {
					var selrect = this.outer.__selrects[i];
					if (selrect.target === this.target) {
						rect = selrect;
					}
				}
			}

			if (rect) {
				rect.size = vec3(this._layout.width, this._layout.height, 0);
			}
			if (this.outer.__ruler) {
				this.outer.__ruler.size = vec3(this._layout.width, this._layout.height, 0);
			}

		};

		this.reset = function() {
			this.pos = vec3(this.target._layout.absx, this.target._layout.absy, 0);
			this.size = vec3(this.target._layout.width, this.target._layout.height,0);

			this.fgcolor = this.target.fgcolor;
			this.bgcolor = this.target.bgcolor;
			this.text = this.target.text;
			this.fontsize = this.target.fontsize;
			this.boldness = this.target.boldness;
			this.font = this.target.font;
			this.multiline = this.target.multiline;
			this.outline = this.target.outline;
			this.outline_thickness = this.target.outline_thickness;
			this.outline_color = this.target.outline_color;
			this.subpixel = this.target.subpixel;
			this.bold = this.target.bold;
			this.borderwidth = this.target.borderwidth;
			this.borderradius = this.target.borderrdius;
			this.bordercolor = this.target.bordercolor;
			this.padding = this.target.padding;
			this.margin = this.target.margin;
			this.scale = this.target.scale;
			this.rotate = this.target.rotate;
			this.linespacing = this.target.linespacing;
			this.align = this.target.align;
		};

		this.onfocus = function(ev,v,o) {
			if (!v && this.value && this.value !== this.target.text) {
				this.outer.setASTObjectProperty(this.target, "text", this.value, true)
				this.outer.commit();
			}
			this.target.opacity = this.target.__toolkitopacity * (!(v) ? 1.0 : 0.1);
		};

		this.ontarget = function(ev,v,o) {
			if (!v) {
				this.visible = false;
				return;
			}
			this.visible = wire('this.outer.visible');
			this.reset();
			this.target.__toolkitopacity = this.target.opacity;
			this.target.opacity = this.target.__toolkitopacity * 0.1;
		}
	});

	defineDreem.class(this, 'panel', view, function(){
		this.attributes = {
			fontsize: Config({type:float, value:12, meta:"fontsize"}),
			activechild: Config({type:int, value:0})
		};

		this.padding = 0;
		this.margin = 4;
		this.borderradius = vec4(10,10,1,1);
		this.bgcolor = NaN;
		this.flex = 1;
		this.flexdirection ="column";
		this.alignitems = "stretch";

		this.init = function() {
			this.tabs = [];

			for (var i=0;i<this.constructor_children.length;i++) {
				var child = this.constructor_children[i];
				child.visible = (i === 0);
				var name = child.name;
				name = name[0].toUpperCase() + name.substring(1);

				this.tabs.push({
					text:name,
					fontsize:this.fontsize,
					padding:vec4(7,7,7,5)
				})
			}

		};

		this.render = function() {

			return [
				tabbar({
					tabclass:"folder",
					tabcolor:"#3e3e3e",
					activetabcolor:"#4e4e4e",
					textcolor:vec4(0.8,0.8,0.8,1),
					activetextcolor:"white",
					tabs:this.tabs,
					onactivetab:function(ev,tab,bar) {
						for (var i=0;i<this.constructor_children.length;i++) {
							var child = this.constructor_children[i];
							child.visible = (i === tab);
						}
					}.bind(this)
				}),
				this.constructor_children
			];
		}
	});

});
