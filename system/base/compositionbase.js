/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/
// teem class

defineDreem.class('$system/base/node',function(requireDreem){

	var RpcHub = requireDreem('$system/rpc/rpchub')
	var Render = requireDreem('./render')

	this._atConstructor = function(){

	}

	this.atConstructor = function(){
		this.composition = this
		this._intervals = []
	}

	this.ondestroy = function(){
		for(var key in this.hub){
			prop = this.hub[key]
			if(typeof prop == 'object'){
				if(prop.destroy && typeof prop.destroy == 'function'){
					prop.destroy()
				}
				renderer.destroy(prop)
			}
		}
		for(var i = 0; i < this._intervals.length; i++){
			clearInterval(this._intervals[i])
		}
	}

	this.toString = function(){
		// lets dump our RPC objects
		var out = 'Teem RPC object:\n'
		for(var key in this){
			if(key in Node.prototype) continue
			out += key +'\n'
		}
		return out
	}

	this.setInterval = function(cb, timeout){
		var id = setInterval(cb, timeout)
		this._intervals.push(id)
		return id
	}

	this.clearInterval = function(id){
		var i = teem._intervals.indexOf(id)
		if(i != -1) teem._intervals.splice(i, 1)
		clearInterval(id)
	}

	this.renderComposition = function(){
		// we have to render the RPC bus
		Render.process(this, undefined, undefined, false, true)

		//this.children = this.render()

		this.names = {}
		// now lets rpc proxify them
		for(var i = 0; i < this.children.length; i++){
			// ok so as soon as we are stubbed, we need to proxify the object
			var child = this.children[i]
			if(!child.createRpcProxy) continue
			// add the proxy to the rpc object. Default screen name = 'default'
			var name = child.name || 'default' // || child.constructor.name
			this.rpc[name] = child.createRpcProxy(this.rpc)
			this.names[name] = child
		}
	}
})
