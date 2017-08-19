/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/

defineDreem.class('$system/base/worker', function(requireDreem, exports){
 	var rpchub = requireDreem('$system/rpc/rpchub')

	this._allocPromise = rpchub.allocPromise
	this._resolveReturn = rpchub.resolveReturn

	this._startWorkers = function(head, tail, count){
		if(!count) count = 1
		var source = head + '\n\n\n;// Worker includes \nself.define = {packaged:true,$platform:"webgl"};(' + defineDreem.inner.toString() + ')();\n'
		source += '(' + defineDreem.getModule('$system/base/math.js').factory.toString() + ')();\n'
		for(var key in defineDreem.paths){
			source += 'defineDreem.$'+key + ' = "'+define['$'+key]+'";\n'
		}
		source += tail
		var blob = new Blob([source], { type: "text/javascript" })
		var worker_url = URL.createObjectURL(blob)
		var workers = []
		for(var i = 0; i < count; i ++){
			var worker = new Worker(worker_url)
			worker.postMessage({initid:true, workerid:i})
			worker.source = source
			worker.stack = 0
			workers.push(worker)
		}
		return workers
	}

	this._collectDeps = function(factory, extradeps){

		// lets serialize our module system into a worker
		var outdeps = {}

		function collectBodyDeps(body){
			var intreq = defineDreem.findRequiresInFactory(body)
			for(var j = 0 ; j < intreq.length; j++){
				intreq[j] = defineDreem.expandVariables(intreq[j])
			}
			if(intreq.length) collectDeps(intreq)
		}

		function collectDeps(deps){
			if(!deps) return
			for(var i = 0; i < deps.length; i++){
				var dep = deps[i]
				if(outdeps[dep] || outdeps[dep+'.js']) continue
				var module = defineDreem.getModule(dep)//module[dep]
				if(!module) module = defineDreem.getModule(dep+'.js'), dep += '.js'
				if(!module || !module.factory || typeof module.factory !== 'function') continue

				// alright so lets recur on deps
				outdeps[dep] = 1

				if(module.factory.body){
					collectBodyDeps(module.factory.body)
				}
				//console.log("COLLECTING", module.factory.deps)

				collectDeps(module.factory.deps)

				// and now add our module
				if(module.factory.body){
					var str = 'defineDreem.packagedClass("'+dep+'",['
					if(module.factory.baseclass) str +=  '"'+module.factory.baseclass+'",'
					str += module.factory.body.toString() + ']);\n'
					outdeps[dep] = str
				}
				else{
					outdeps[dep] = 'defineDreem(' + module.factory.toString() + ',"'+dep+'");\n'
				}
			}
		}
		collectDeps(factory.deps)
		collectDeps(extradeps)
		collectBodyDeps(factory.body)

		return outdeps
	}

	this._transformThisToRPC = function(){
		for(var key in this){
			var prop = this[key]
			if(key === 'onmessage'){

			}
			else if(key === 'atConstructor'){
				this[key] = undefined
			}
			else if(typeof prop === 'function' && key[0] !== '_'){
				this[key] = function(key){
					// alright lets pick the lowest-queue worker from the set
					var min = Infinity, tgtid = 0
					for(var i = 0; i < this._workers.length; i++){
						var stack = this._workers[i].stack
						if(stack < min) min = stack, tgtid = i
					}
					var msg = {type:'call', name:key, args:[], workerid:tgtid}
					for(var i = 1; i < arguments.length; i++){
						msg.args[i - 1] = arguments[i]
						//!TODO add typed array transfer feature
					}
					var worker = this._workers[tgtid]
					if(!worker) return new defineDreem.Promise(function(resolve){resolve()})

					var prom = this._allocPromise()
					msg.uid = prom.uid
					this._workers[tgtid].stack++
					this._workers[tgtid].postMessage(msg)
					return prom
				}.bind(this,key)
			}
		}
	}

	this._atConstructor = function(cores){
		if(cores === undefined) cores = 1
		else if(cores < 1){
			if(defineDreem.cputhreads === 2) cores = 1
			else cores = defineDreem.cputhreads - 2
		}
		
		var deps = this._collectDeps(this.constructor.module.factory)

		var head = 'var _myworker = ' + this.constructor.body.toString() + ';\n'
		var tail = ''
		for(var key in deps){
			//console.log(key)
			tail += deps[key]
		}

		tail += 'defineDreem.packagedClass("/myworker.js",["$system/base/worker",_myworker]);\n'
		// lets start with requiring /myworker

		tail += 'var _worker = defineDreem.requireDreem(\'/myworker\')();\n'
		tail += '_worker.postMessage = function(msg,transfer){self.postMessage({message:msg,workerid:_worker.workerid},transfer)};\n'
		tail += _worker_return.toString() + ';\n'
		
		function workermsg(event){
			var msg = event.data
			if(msg.initid){
				_worker.workerid = msg.workerid
				return
			}
			if(msg.message){
				_worker.onmessage(msg.message)
				return
			}
			var ret = _worker[msg.name].apply(_worker, msg.args);
			if(ret && ret.then) ret.then(function(value){
				_worker_return(value, msg.uid, msg.workerid)
			})
			else _worker_return(ret, msg.uid, msg.workerid)
		}

		function _worker_return(ret, uid, workerid){
			// fix the typed object handling
			var transfer
			if(ret && (typeof ret === 'object' || Array.isArray(ret))){
				for(var key in ret){
					var prop = ret[key]
					if(prop && typeof prop.struct === 'function' && prop.array){
						transfer = transfer || []
						transfer.push(prop.array.buffer)
						ret[key] = {
							allocated: prop.allocated,
							array:prop.array,
							length: prop.length,
							slots: prop.slots,
							stride: prop.stride,
							__structarray__: prop.struct.name
						}		
					}
				}
			}
			self.postMessage({value:ret, uid:uid, workerid:workerid}, transfer)
		}

		tail += 'self.onmessage = ' + workermsg.toString() + '\n'

		var onmessage = function(event){
			// lets plug the struct arrays
			var dt = Date.now()
			var data = event.data
			if(data.message){
				return this.onmessage(data.message)
			}
			//if(Date.now() - dt > 50) console.log(data)

			var workerid = data.workerid
			
			this._workers[workerid].stack --

			this._resolveReturn(data)

		}.bind(this)

		this._workers = this._startWorkers(head, tail, cores)

		for(var i = 0; i < this._workers.length; i++){
			this._workers[i].onmessage = onmessage
		}

		this._transformThisToRPC()

		this.postMessage = function(msg, transfer, tgtid){
			// post to a worker
			var workerid = tgtid || 0
			this._workers[workerid].postMessage({message:msg}, transfer)
		}
	}
})
