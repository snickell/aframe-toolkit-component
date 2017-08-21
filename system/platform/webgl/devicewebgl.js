/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/

export default defineDreem.class(function(requireDreem, exports){

	this.Keyboard = requireDreem('./keyboardwebgl')
	this.Pointer = requireDreem('./pointerwebgl')
	this.Midi = requireDreem('./midiwebgl')

	// require embedded classes
	this.Shader = requireDreem('./shaderwebgl')
	this.Texture = requireDreem('./texturewebgl')
	this.DrawPass = requireDreem('./drawpasswebgl')

	this.preserveDrawingBuffer = false
	this.premultipliedAlpha = false
	this.antialias = false
	this.debug_pick = false

	this.window =
	this.document = typeof window !== 'undefined'?window : null

  console.log("devicewebgl, creating class");


	this.atConstructor = function(previous, canvas){
    console.log("\n\ndevicewebgl()\n");
		this.extensions = previous && previous.extensions || {}
		this.shadercache = previous &&  previous.shadercache || {}
		this.drawpass_list = previous && previous.drawpass_list || []
		this.layout_list = previous && previous.layout_list || []
		this.pick_resolve = []
		this.anim_redraws = []
		this.animate_hooks = []
		this.doPick = this.doPick.bind(this)

		this.animFrame = function(time){
			if(this.doColor(time)){
				this.anim_req = true
				this.document.requestAnimationFrame(this.animFrame)
			}
			else this.anim_req = false
			//if(this.pick_resolve.length) this.doPick()
		}.bind(this)

		if(previous){
			this.canvas = previous.canvas
			this.gl = previous.gl
			this.keyboard = previous.keyboard
			this.pointer = previous.pointer
			this.midi = previous.midi
			this.parent = previous.parent
			this.drawtarget_pools = previous.drawtarget_pools
			this.frame = this.main_frame = previous.main_frame
		}
		else{
			this.frame =
			this.main_frame = this.Texture.fromType('rgb_depth')

			this.keyboard = new this.Keyboard(this)
			this.pointer = new this.Pointer(this)
			this.midi = new this.Midi(this)
			this.drawtarget_pools = {}

			this.createContext(canvas)
			this.createWakeupWatcher()
		}

		this.initResize()
	}

	this.createWakeupWatcher = function(){
		var last = Date.now()
		setInterval(function(){
			var now = Date.now()
			if(now - last > 1000 && this.screen){
				this.doSize()
 				this.redraw()
				this.screen.emit('wakeup')
			}
			last = now
		}.bind(this), 200)
	}

	this.createContext = function(canvas){
		if(!this.parent) this.parent = document.body

		if (canvas) {
			if (typeof(canvas) === "string") {
				canvas = document.getElementById(canvas)
			}
			this.canvas = canvas
			this.canvas.className = 'unselectable'
		} else {
			this.canvas = document.createElement("canvas")
			this.canvas.className = 'unselectable'
			this.parent.appendChild(this.canvas)
		}
    

    const aCanvas = document.getElementsByClassName("a-canvas")[0];
    console.warn("SETH DREW: Overriding this.canvas in devicewebgl.js with Aframe canvas: ", this.canvas);
    // this.canvas = aCanvas;
    
		var options = {
			alpha: this.frame.type.indexOf('rgba') != -1,
			depth: this.frame.type.indexOf('depth') != -1,
			stencil: this.frame.type.indexOf('stencil') != -1,
			antialias: this.antialias,
			premultipliedAlpha: this.premultipliedAlpha,
			preserveDrawingBuffer: this.preserveDrawingBuffer,
			preferLowPowerToHighPerformance: this.preferLowPowerToHighPerformance
		}

		this.gl = this.canvas.getContext('webgl', options) ||
			this.canvas.getContext('webgl-experimental', options) ||
			this.canvas.getContext('experimental-webgl', options)

		if(!this.gl){
			console.log(this.canvas)
			console.log("Could not get webGL context!")
		}

		// require derivatives
		this.getExtension('OES_standard_derivatives')
	}

	this.initResize = function(){
		//canvas.webkitRequestFullscreen()

		var resize = this.doSize = function(){
			var pixelRatio = window.devicePixelRatio

			var w = this.parent.offsetWidth
			var h = this.parent.offsetHeight

			var sw = w * pixelRatio
			var sh = h * pixelRatio

			this.canvas.width = sw
			this.canvas.height = sh
			this.canvas.style.width = w + 'px'
			this.canvas.style.height = h + 'px'

			this.gl.viewport(0, 0, sw, sh)
			// store our w/h and pixelratio on our frame

			this.main_frame.ratio = pixelRatio
			this.main_frame.size = vec2(sw, sh) // actual size

			this.size = vec2(w, h)
			this.ratio = this.main_frame.ratio

		}.bind(this)

		window.onresize = function(){
			resize()
			this.atResize()
			this.redraw()
		}.bind(this)

		resize()
	}

	this.clear = function(r, g, b, a){
		if(arguments.length === 1){
			a = r.length === 4? r[3]: 1, b = r[2], g = r[1], r = r[0]
		}
		if(arguments.length === 3) a = 1
		this.gl.clearColor(r, g, b, a)
		this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT|this.gl.STENCIL_BUFFER_BIT)
	}

	this.getExtension = function(name){
		var ext = this.extensions[name]
		if(ext) return ext
		ext = this.extensions[name] = this.gl.getExtension(name)
		return ext
	}

	this.redraw = function(){
		if(this.anim_req) return
		this.anim_req = true
		this.document.requestAnimationFrame(this.animFrame)
	}

	this.bindFramebuffer = function(frame){
		if(!frame) frame = this.main_frame

		this.frame = frame
		//this.size = vec2(frame.size[0]/frame.ratio, frame.size[1]/frame.ratio)

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frame.glframe_buf || null)
		this.gl.viewport(0, 0, frame.size[0], frame.size[1])
	}

	this.readPixels = function(x, y, w, h){
		var buf = new Uint8Array(w * h * 4)
		this.gl.readPixels(x , y , w , h, this.gl.RGBA, this.gl.UNSIGNED_BYTE, buf)
		return buf
	}

	this.doPick = function(resolve){
		this.pick_timer = undefined
		var x = this.pick_x, y = this.pick_y

		if(!this.first_draw_done){
			this.doColor(this.last_time)
		}
		for(var i = 0, len = this.drawpass_list.length; i < len; i++){
			var last = i === len - 1
			//var skip = false
			var view = this.drawpass_list[i]

			// little hack to dont use rtt if you only use a single view
			//if(view.parent == this.screen && view.flex ==1 && this.screen.children.length ===1){
			//	skip = last = true
			//}
			// lets set up glscissor on last
			// and then read the goddamn pixel
			if(last || view.draw_dirty & 2){
				view.draw_dirty &= 1
				view.drawpass.drawPick(last, i + 1, x, y, this.debug_pick)
			}
			//if(skip){
			//	this.screen.draw_dirty &= 1
			//	break
			//}
		}
		// now lets read the pixel under the pointer
		var pick_resolve = this.pick_resolve
		this.pick_resolve = []

		if(this.debug_pick){

			var data = this.readPixels(x * this.ratio, this.main_frame.size[1] - y * this.ratio, 1, 1)
		}
		else{
			var data = this.readPixels(0, 0, 1, 1)
		}

		// decode the pass and drawid
		var passid = data[0]//(data[0]*43)%256
		var drawid = (((data[2]<<8) | data[1]))//*60777)%65536
		// lets find the view.

		var passview = this.drawpass_list[passid - 1]
		var drawpass = passview && passview.drawpass
		var view = drawpass && drawpass.getDrawID(drawid)

		while(view && view.nopick){
			view = view.parent
		}

		if (resolve) {
			resolve(view)
		} else {
			for (var i = 0; i < pick_resolve.length; i++){
				pick_resolve[i](view)
			}
		}
	}

	this.pickScreen = function(pos, resolve, immediate){
		this.pick_x = pos[0]
		this.pick_y = pos[1]

		var callback = function () {
			this.doPick(resolve)
      this.pick_timer = undefined
		}.bind(this)

		// TODO(aki): remove sync picking
		if (immediate) {
			callback(resolve)
			return
		}

		// Throttle picking at 15 fps
		if (!this.pick_timer) {
			this.pick_timer = setTimeout(callback, 1000/15)
		}
	}

	this.doColor = function(time){

		if(!this.first_time) this.first_time = time
		this.last_time = time

		if(!this.screen) return

		this.first_draw_done = true

		var stime = (time - this.first_time) / 1000
		//console.log(this.last_time - stime)

		// lets layout shit that needs layouting.
		var anim_redraw = this.anim_redraws
		anim_redraw.length = 0
		this.screen.doAnimation(stime, anim_redraw)

		this.screen._maxsize =
		this.screen._size = vec2(this.main_frame.size[0] / this.ratio, this.main_frame.size[1] / this.ratio)

		// do all the animate hooks
		var animate_hooks = this.animate_hooks
		for(var i = 0; i < animate_hooks.length; i++){
			var item = animate_hooks[i]
			//console.log(item)
			if(item.atAnimate(stime)){
				anim_redraw.push(item)
			}
		}

		// do the dirty layouts
		for(var i = 0; i < this.layout_list.length; i++){
			// lets do a layout?
			var view = this.layout_list[i]
			if(view.layout_dirty){
				view.doLayout()
				view.layout_dirty = false
			}
		}

		// do the dirty matrix regen
		for(var i = 0; i < this.layout_list.length; i++){
			// lets do a layout?
			var view = this.layout_list[i]
			if(view.matrix_dirty){
				view.updateMatrices(view.parent? view.parent.totalmatrix: undefined, view._viewport)
			}
		}

		var clipview = undefined
		// lets draw draw all dirty passes.
		for(var i = 0, len = this.drawpass_list.length; i < len; i++){

			var view = this.drawpass_list[i]
			//var skip = false
			var last = i === len - 1
			//if(view.parent == this.screen && view.flex == 1 && this.screen.children.length ===1){
			//	skip = last = true
			//}

			if(view.draw_dirty & 1 || last){

				if(!last){
					if(clipview === undefined) clipview = view
					else clipview = null
				}
				var hastime = view.drawpass.drawColor(last, stime, clipview)
				view.draw_dirty &= 2
				if(hastime){
					anim_redraw.push(view)
				}
			}

			//if(skip){
			//	this.screen.drawpass.calculateDrawMatrices(false, this.screen.drawpass.colormatrices);
			//	this.screen.draw_dirty &= 2
			//	break
			//}
		}

		if(anim_redraw.length){
			//console.log("REDRAWIN", this.draw_hooks)
			var redraw = false
			for(var i = 0; i < anim_redraw.length; i++){
				var aredraw = anim_redraw[i]
				if(!aredraw.atAfterDraw || aredraw.atAfterDraw()){
					redraw = true
					aredraw.redraw()
				}
			}
			return redraw
		}
		return hastime
	}

	this.atNewlyRendered = function(view){

		// if view is not a layer we have to find the layer, and regenerate that whole layer.
		if(!view.parent) this.screen = view // its the screen
		// alright lets do this.
		var node = view
		while(!node._viewport){
			node = node.parent
		}

		if(!node.parent){ // fast path to chuck the whole setc


			for (var j = 0; j< this.pointer.hover.length;j++) {
				var p = this.pointer.hover[j];
				//console.log("Removing dangling hover pointer", p)
				this.pointer.hover.removePointer(p);
			}


			// lets put all the drawpasses in a pool for reuse
			for(var i = 0; i < this.drawpass_list.length; i++){
				var draw = this.drawpass_list[i]
				draw.drawpass.poolDrawTargets()
				draw.layout_dirty = true
				draw.draw_dirty = 3
			}
			this.drawpass_list = []
			this.layout_list = []
			this.drawpass_idx = 0
			this.layout_idx_first = 0
			this.layout_idx = 0
			this.addDrawPassRecursive(node)
			this.first_draw_done = false
			this.redraw()
		}
		else{ // else we remove drawpasses first then re-add them
			this.removeDrawPasses(node)
			this.layout_idx_first = this.layout_idx
			this.addDrawPassRecursive(node)
		}
		node.relayout()
	}

	// remove drawpasses related to a view
	this.removeDrawPasses = function(view){
		// we have to remove all the nodes which have view as their parent layer
		var drawpass_list = this.drawpass_list
		this.drawpass_idx = Infinity
		for(var i = 0; i < drawpass_list.length; i++){
			var node = drawpass_list[i]
			while(node.parent && node !== view){
				node = node.parent
			}
			if(node === view){
				if(i < this.drawpass_idx) this.drawpass_idx = i
				node.drawpass.poolDrawTargets()
				drawpass_list.splice(i, 1)
				break
			}
		}
		if(this.drawpass_idx === Infinity) this.drawpass_idx = 0
		// now remove all layouts too
		this.layout_idx = Infinity
		var layout_list = this.layout_list
		for(var i = 0; i < layout_list.length; i++){
			var pass = layout_list[i]
			var node = pass
			while(node.parent && node !== view){
				node = node.parent
			}
			if(node === view){
				if(i < this.layout_idx) this.layout_idx = i
				layout_list.splice(i, 1)
			}
		}
		if(this.layout_idx === Infinity) this.layout_idx = 0
	}

	// add drawpasses and layouts recursively from a view
	this.addDrawPassRecursive = function(view){
		// lets first walk our children( depth first)
		var children = view.children
		if(children) for(var i = 0; i < children.length; i++){
			this.addDrawPassRecursive(children[i])
		}

		// lets create a drawpass
		if(view._viewport){
			var pass = new this.DrawPass(this, view)
			this.drawpass_list.splice(this.drawpass_idx,0,view)
			this.drawpass_idx++
			// lets also add a layout pass
			if(isNaN(view._flex)){ // if not flex, make sure layout runs before the rest
				// we are self contained
				this.layout_list.splice(this.layout_idx_first,0,view)
			}
			else{ // we are flex, make sure we layout after
				this.layout_list.splice(this.layout_idx,0,view)
			}
			//this.layout_idx++
		}

	}

	this.relayout = function(){
		var layout_list = this.layout_list
		for(var i = 0; i < layout_list.length; i++){
			view = layout_list[i]
			if(!isNaN(view._flex) || view == this.screen){
				view.relayout()
			}
		}
	}

	this.atResize = function(){
		// lets relayout the whole fucker
		this.relayout()
		this.redraw()
		// do stuff
	}



})
