/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/

// Micro AMD module loader for browser and node.js and basic system homogenisation library

// READ FIRST
// The nodejs server is CLIENT-SIDE-MIDDELWARE for prototyping and development
// not a web-facing backend.
// dreemGL is not optimized to be a neat NPM module, fit into browserify or express or otherwise
// be a grab-and-use JS thing that respects the constraints that this would requireDreem.
// Also any nodejs code is NOT deploy-safe because of the automatic RPC system and should
// NOT be put webfacing as is.
// And since it keeps websocket connections to all clients for live reloading
// and RPC, it will rapidly stop working if faced with any large number of connections.
// The RPC is by default broadcast and does NOT have cross client security considerations
// A packaging solution for deploying any dreemGL to a webpage is on the todo list

// Notes on the design and edgeconditions of dreemGL:
// dreemGL has a decent amount of global types and values. yes. globals.
// dreemGL is a prototyping toolkit, and aimed at quickly being able to do certain things
// having globals helps there and most have been carefully chosen to be global.
// Also all the math things are global, in math.js to be more GLSL-like in JS.
// The prototypes of Float32Array are modified to add the GLSL swizzle (.xyxy) apis.
// The nodeJS Module loader is hooked to allow for loading the custom AMD extension
// you see in dreemGL, which fuses classes with modules. And this may have some
// compatibility repercussions for some modules that assume 'define' works a certain way
// If you need to require nodejs modules using the require provided by define,
// use require('module') dont use './' or '/' these are interpreted as defineDreem.js modules
// The browser require will ignore require('module') so if you stick to a clean
// classdef it can safely load up 'nodejs' classes to inspect their interfaces for RPC
// All these choices are to support the design goals of dreemGL some of which are:
// - be a low cognitive overhead prototyping toolkit
// - symmetrical loading of the entire 'app' in both nodejs and browser for automatic
//   rpc interface handling
// - low jank, all rendering in JS (the timeline is super important here)
// - do not transcompile anything and run in browser and node with same files
// - optimized live editability and reloading of all class hierarchy parts (thats the reason
//   the modulesystem + classes are fused)

(function define_module(){

	var config_define
	if(typeof window !== 'undefined') config_define =  window.defineDreem
	else if(typeof self !== 'undefined') config_define = self.defineDreem
	else if(typeof global !== 'undefined') config_define = global.defineDreem

	// the main define function
	function defineDreem(factory, pkg){
		if(pkg !== undefined){ // precompiled version
			defineDreem.factory[pkg] = factory
			return factory;
		}
		defineDreem.last_factory = factory // store for the script tag
		// continue calling
		if(defineDreem.defineDreem) defineDreem.defineDreem(factory)
		return factory;
	}

	if(typeof window !== 'undefined') window.defineDreem = defineDreem, defineDreem.$environment = 'browser'
	else if(typeof self !== 'undefined') self.defineDreem = defineDreem, defineDreem.$environment = 'worker'
	else if (typeof global !== 'undefined'){
		Object.defineProperty(global, "defineDreem", {
		    value: defineDreem,
		    writable: false
		})
		defineDreem.$environment = 'nodejs'
	}
	else defineDreem.$environment = 'v8'
    
	// default config variables
	defineDreem.inner = define_module

	defineDreem.$root = ''
	defineDreem.$system = '$root/system'

	defineDreem.local_classes = {}
	defineDreem.local_require_stack = []
	defineDreem.ignore_reload = {}

	defineDreem.partial_reload = true
	defineDreem.reload_id = 0

	// turns on debug naming of classes (very useful)
	defineDreem.debug = true

	// copy configuration onto define
	if(typeof config_define == 'object') for(var key in config_define){
		defineDreem[key] = config_define[key]
	}


	// storage structures
	defineDreem.module = {}
	defineDreem.factory = {}








	// File path handling utilities









	defineDreem.fileName = function(file){
		file = file.replace(/\\/g,'/')
		var file = file.slice(defineDreem.filePath(file).length)
		if(file.charAt(0) == '/') return file.slice(1)
		return file
	}

	defineDreem.filePath = function(file){
		if(!file) return ''
		file = file.replace(/\.\//g, '')
		var m = file.match(/([\s\S]*)\/[^\/]*$/)
		return m ? m[1] : ''
	}

	defineDreem.fileExt = function(file){
		// parse from the last . to end
		var m = file.match(/\.([^.\/]+)($|\?)/)
		if(!m) return ''
		return m[1].toLowerCase()
	}

	defineDreem.fileBase = function(file){
		var fn = defineDreem.fileName(file)
		var idx = fn.lastIndexOf('.')
		if(idx !== -1) return fn.slice(0, idx)
		return fn
	}

	defineDreem.cleanPath = function(path){
		return path.replace(/^\/+/,'/').replace(/([^:])\/+/g,'$1/')
	}

	defineDreem.joinPath = function(base, relative, rx){
		if(relative.charAt(0) != '.'){ // relative is already absolute
			if(relative.charAt(0) == '/' || relative.indexOf(':') != -1){
				return relative
			}
			var path = base + '/' + relative
			return defineDreem.cleanPath(path)
		}
		base = base.split(rx || /\//)
		relative = relative.replace(/\.\.\//g,function(){ base.pop(); return ''}).replace(/\.\//g, '')
		return defineDreem.cleanPath(base.join('/') + '/' + relative)
	}

	// constrain the path to any $symbol/ directory
	defineDreem.safePath = function(name){
		name = name.replace(/\\/g,'/')
		var id = name.indexOf('..')
		if(id !== -1){
			var base = name.slice(0,id)
			var rel= name.slice(id)
			var path = defineDreem.joinPath(base, rel)
			if(path.indexOf('..') !== -1) return undefined
			if(path.indexOf('./') !== -1) return undefined
			if(path.charAt(0)!=='$') return undefined
			return path
		}
		if(name.charAt(0) !== '$') return undefined
		if(name.indexOf('./') !== -1) return undefined
		return name
	}

	defineDreem.expandVariables = function(str){
		return defineDreem.cleanPath(str.replace(/(\$[a-zA-Z0-9]+[a-zA-Z0-9]*)/g, function(all, lut){
			if(!(lut in defineDreem)){
				//throw new Error("Cannot find " + lut + " used in requireDreem")
        console.warn("Cannot find " + lut + " used in requireDreem");
        return;
			}
			return defineDreem.expandVariables(defineDreem[lut])
		}))
	}

	defineDreem.lookupFileType = function(type){
		type = type.toLowerCase()

		if(type === 'json')	return 'json'
		if(type === 'txt' || type === 'obj' || type === 'text' || type === 'md') return 'text'

		return 'arraybuffer'
	}

	defineDreem.processFileType = function(type, blob){
		if(type === 'glf') return defineDreem.parseGLF(blob)
		return blob
	}
/*
	defineDreem.global = function(object){
		var glob = typeof process !== 'undefined'? global: typeof window !=='undefined'? window: self
		for(var key in object){
			glob[key] = object[key]
		}
	}
*/
	// returns a class dir you can use, has / appended already
	defineDreem.classPath = function(cls){
		if(cls.prototype) cls = cls.prototype
		var mod = cls.constructor.module
		var fn = mod.filename.replace(/\\/g,'/')
		for(var key in defineDreem.paths){
			var path = defineDreem.expandVariables(defineDreem['$'+key])
			if(fn.indexOf(path) === 0){
				// Return the class path as a symbol base
				var ext = fn.slice(path.length)
				return defineDreem.filePath('$'+key+(ext.charAt(0)!=='/'?'/':'')+ext) + '/'
			}
		}
	}

	defineDreem.deferPromise = function(){
		var res, rej
		var prom = new defineDreem.Promise(function(ires, irej){
			res = ires, rej = irej
		})
		prom.resolve = res
		prom.reject = rej
		return prom
	}


	defineDreem.buildClassArgs = function (fn) {
		// Ideally these regexps are better, not vastly slower but maybe proper specwise matching for stuff, its a bit rough now
		// This is otherwise known as a 'really bad idea'. However this makes the modules work easily, with a relatively small collision risk.
		var str = fn.toString()
	
		str = str.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
	
		var result;
		var output = []
		var result = str.match(/function\s*[$_\w]*\s*\(([$_\w,\s]*)\)/)
	
		var map = result[1].split(/\s*,\s*/)
		for (var i = 0; i < map.length; i++) if (map[i] !== '') output.push(map[i].trim())
	
		// now fetch all the fast classdeps
		var matchrx = new RegExp(/define\.class\s*\(\s*(?:this\s*,\s*['"][$_\w]+['"]\s*,\s*)?(?:(?:['"][[^"']+['"]|[$_\w]+)\s*,\s*)?function\s*[$_\w]*\s*\(([$_\w,\s]*)\)\s*\{/g)
	
		while ((result = matchrx.exec(str)) !== null) {
			output.push('$$')
			var map = result[1].split(/\s*,\s*/)
			for (var i = 0; i < map.length; i++)if (map[i] !== '') output.push(map[i])
		}
	
		return output
	}

	// Class implementation
	defineDreem.builtinClassArgs = {
		exports:1, module:2, requireDreem:3, constructor:1, baseclass:5, outer:6
	}

	defineDreem.walkClassArgs = function(map, callback){
		var path = './'
		for(var i = 0; i < map.length; i++){
			var arg = map[i]
			var builtin = defineDreem.builtinClassArgs[arg]
			if(builtin){
				callback(builtin, undefined, i)
				continue
			}
			if(arg === '$$'){
				path = './'
			}
			else if(arg.charAt(0) === '$'){
				if(arg.charAt(arg.length - 1) === '$'){ // $blabla$
					path = '$' + arg.slice(1).replace(/\$/g, '/')
				}
				else{
					if(arg.charAt(1) ==='$'){
						callback(undefined, './' + arg.slice(2).replace(/\$/g,'/'), i) // local absolute path
					}
					else{
						callback(undefined, '$' + arg.slice(1).replace(/\$/g,'/'), i) // absolute path
					}
				}

			} // relative path processor
			else if(arg.charAt(arg.length - 1) === '$'){
				path += arg.replace(/\$/g,'/')
			}
			else{ // callback
				callback(undefined, path + arg.replace(/\$/g,'/'), i)
			}
		}
	}


	defineDreem.applyBody = function(body, Constructor, baseclass, requireDreem){
		if(typeof body == 'object' && body){
			for(var key in body) Constructor.prototype[key] = body[key]
			return
		}
		if(typeof body !== 'function') return

		// named arguments for the class body
		var classargs = body.classargs
		if(!classargs) classargs = body.classargs = defineDreem.buildClassArgs(body)

		// allright lets go figure out our body arguments.
		var args = []
		this.walkClassArgs(classargs, function(builtin, path, i){
			if(builtin){
				if(builtin === 1) args[i] = Constructor
				else if(builtin === 2) args[i] = Constructor.module
				else if(builtin === 3){
					if(!requireDreem) throw new Error('You cant get require on the class body as argument here')
					args[i] = requireDreem
				}
				else if(builtin === 4) args[i] = Constructor.prototype
				else if(builtin === 5) args[i] = baseclass? baseclass.prototype: undefined
				else if(builtin === 6) args[i] = body.outer
			}
			else{

				args[i] = requireDreem(path)
				args[i].nested_module = Constructor.module
			}
		})
		Object.defineProperty(Constructor, 'body', {value:body})
		body.class_args = args
		return body.apply(Constructor.prototype, args)
	}

	defineDreem.EnvironmentStub = function(dep){ this.dep = dep }

	defineDreem.makeClass = function(baseclass, body, requireDreem, module, nested_module, outer_this, in_name){

		function MyConstructor(){
			// if called without new, just do a new
			var obj = this

			if(!(obj instanceof MyConstructor)){
				var constructor = defineDreem.atConstructor? defineDreem.atConstructor(MyConstructor, arguments[0]): MyConstructor
				obj = Object.create(constructor.prototype)
				Object.defineProperty(obj, 'constructor', {value:constructor})
			}

			var outer = MyConstructor.outer
			// pass on the classroot property
			if(outer !== undefined){
				if(obj.outer === undefined) obj.outer = outer
			}

			if(obj._atConstructor) obj._atConstructor.apply(obj, arguments)

			if(obj.atConstructor){
				obj.atConstructor.apply(obj, arguments)
			}

			return obj
		}

		if(defineDreem.debug){
			var fnname
			if(in_name){
				fnname = in_name
			}
			else if(body && (body.classname || body.name)){
				fnname = (body.classname || body.name)
			}
			else if(module){
				 fnname = defineDreem.fileBase(module.filename).replace(/\.|\-|\s/g,'_')//.replace(/\.js/g,'').replace(/\./g,'_').replace(/\//g,'_')
			}
			else{
				// lets make an fnname based on our callstack
				var origin = new Error().stack.split(/\n/)[3].match(/\/([a-zA-Z0-9\.]+)\:(\d+)\:\d+\)/)
				if(!origin || origin[1] === 'defineDreem.js'){
					fnname = 'extend'
					if(baseclass && baseclass.prototype.constructor) fnname += '_' + baseclass.prototype.constructor.name
				}
				else fnname = origin[1].replace(/\.js/g,'').replace(/\.|\-|\s/g,'_').replace(/\//g,'_') + '_' + origin[2]
			}
			var code = 'return ' + MyConstructor.toString().replace(/MyConstructor/g, fnname)
			var Constructor = new Function(code)()
		}
		else{
			var Constructor = MyConstructor
		}

		var final_at_extend = Array.isArray(body)? body: []

		if(baseclass){
			Constructor.prototype = Object.create(baseclass.prototype)
			Object.defineProperty(Constructor.prototype, 'constructor', {value:Constructor})
		}

		Object.defineProperty(Constructor, 'extend', {value:function(body, outer_this, in_name){
			//if(this.prototype.constructor === defineDreem.StubbedClass) return defineDreem.StubbedClass
			return defineDreem.makeClass(this, body, requireDreem, undefined, this.nested_module, outer_this, in_name)
		}})

		Object.defineProperty(Constructor, 'overlay', {value:function(body){
			return defineDreem.applyBody(body, this, baseclass)
		}})

		Object.defineProperty(Constructor, 'mixin', {value:function(body){
			var obj = body
			if(typeof body === 'function') obj = body.prototype
			var out = this.prototype
			for(var key in obj){
				out[key] = obj[key]
			}
		}})

		Object.defineProperty(Constructor, 'body', {value:body})

		if(outer_this) Constructor.outer = outer_this

		if(Array.isArray(body)){
			if(Constructor.prototype.atExtend) body.push(Constructor.prototype)
		}
		else{
			if(module){
				if(body && body.mixin) module.exports = Constructor.prototype
				else module.exports = Constructor

				Object.defineProperty(Constructor, 'module', {value:module})

				defineDreem.applyBody(body, Constructor, baseclass, requireDreem)
			}
			else if(nested_module){
				Object.defineProperty(Constructor, 'module', {value:nested_module})
				defineDreem.applyBody(body, Constructor, baseclass)
			}
			else {
				defineDreem.applyBody(body, Constructor, baseclass)
			}

			if(Constructor.prototype.atExtend) Constructor.prototype.atExtend()

			// call atExtend on nested classes so outer class bodies can apply properties on nested classes
			if(final_at_extend.length){
				for(var i = 0; i < final_at_extend.length; i++){
					final_at_extend[i].atExtend()
				}
			}
		}

		return Constructor
	}

	defineDreem.mixin = function(body, body2){
		if(typeof body2 === 'function') body = body2
		body.mixin = true
		return defineDreem.class.apply(defineDreem, arguments)
	}

	defineDreem.packagedClass = function(packaged, args){
		args[args.length - 1].packaged = packaged
		defineDreem.class.apply(defineDreem, args)
	}

	// export default defineDreem.class('base', function(){})                2
	// export default defineDreem.class(function(){})                        1
	// export default defineDreem.class(this, 'prop', 'base', function(){})  4

	defineDreem.class = function(){
		// lets make a class
		var base_class
		var body
		var is_inner
		if(arguments.length >= 3){ // inner class
			is_inner = true
			var outer_this = arguments[0]
			var classname = arguments[1]
			Object.defineProperty(outer_this, classname, {
				get:function(){
					var cls = this['_' + classname]
					if(cls) cls.outer = this
					return cls
				},
				set:function(value){
					// lets kick the class off
					if(this.atInnerClassAssign) return this.atInnerClassAssign(classname, value)

					// default
					if(value === undefined || value === null || value === 0){
						this['_' + classname] = undefined
						if(this.atInnerClassAssign) this.atInnerClassAssign(classname, undefined)
						return
					}
					if(typeof value === 'function' && Object.getPrototypeOf(value.prototype) !== Object.prototype){
						this['_' + classname] = value
						return
					}
					// otherwise use it as an extend
					var cls = this['_' + classname]
					// ok so the problem here is, that if we are inherited
					this['_' + classname] = cls.extend(value, this)
				}
			})

			if(arguments.length>3){
				base_class = arguments[2]
				body = arguments[3]
			}
			else{
				body = arguments[2]
			}
			if(typeof body === 'function'){
				body.classname = classname
				body.outer = outer_this
			}
		}
		else if(arguments.length > 1){ // class with baseclass
			base_class = arguments[0]
			body = arguments[1]
		}
		else{
			body = arguments[0]
		}

		function moduleFactory(requireDreem, exports, module){
			var base
			if(typeof base_class === 'string') base = requireDreem(base_class)
			else if (base_class) base = base_class
			defineDreem.makeClass(base, body, requireDreem, module, undefined, outer_this)
		}

		// make an argmap
		body.classargs = defineDreem.buildClassArgs(body)
		// lets parse the named argument pattern for the body
		moduleFactory.body = body
		moduleFactory.deps = []

		// put the baseclass on the deps
		if(base_class && typeof base_class === 'string'){
			moduleFactory.baseclass = defineDreem.expandVariables(base_class)
			moduleFactory.deps.push(defineDreem.expandVariables(base_class))
			moduleFactory.depstring = 'requireDreem("' + base_class + '")'
		}

		// add automatic requires
		if(body.classargs){
			defineDreem.walkClassArgs(body.classargs, function(builtin, requirepath){
				if(builtin) return
				if(!moduleFactory.depstring) moduleFactory.depstring = ''
				moduleFactory.deps.push(defineDreem.expandVariables(requirepath))
				moduleFactory.depstring += 'requireDreem("' + requirepath + '")'
				if(!base_class) base_class = requirepath
			})
		}

		// if we have a local_require_stack we are a define inside a class or module body
		// so then treat it as a local class
		if(defineDreem.local_require_stack.length){
			var outer_require = defineDreem.local_require_stack[defineDreem.local_require_stack.length - 1]
			var outer_module = outer_require.module
			var module = {exports:{}, filename:outer_module.filename, factory:moduleFactory, outer:outer_module}
			moduleFactory(outer_require, module.exports, module)

			if(outer_this){
				outer_this['_' + classname] = module.exports
				if(outer_this.atInnerClassAssign) outer_this.atInnerClassAssign(classname, module.exports)
				if(!outer_this.hasOwnProperty('_inner_classes')) outer_this._inner_classes = Object.create(outer_this._inner_classes || {})
				outer_this._inner_classes[classname] = module.exports
			}

			return module.exports
		}
		//if(typeof arguments[arguments.length - 1] == 'string'){ // packaged
		//	defineDreem(moduleFactory, arguments[arguments.length - 1])
		//}
		//else{ // unpackaged
		return defineDreem(moduleFactory, body.packaged)
		//}
	}









	// Implementation of a debug promise












	defineDreem.debugPromiseLib = function(exports){
		// Use polyfill for setImmediate for performance gains
		var asap = Promise.immediateFn || (typeof setImmediate === 'function' && setImmediate) ||
			function(fn) { setTimeout(fn, 1); }

		// Polyfill for Function.prototype.bind
		function bind(fn, thisArg) {
			return function() {
				fn.apply(thisArg, arguments)
			}
		}

		var isArray = Array.isArray || function(value) { return Object.prototype.toString.call(value) === "[object Array]" }

		function Promise(fn) {
			if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new')
			if (typeof fn !== 'function') throw new TypeError('not a function')
			this._state = null
			this._value = null
			this._deferreds = []

			doResolve(fn, bind(resolve, this), bind(reject, this))
		}

		function handle(deferred) {
			var me = this
			if (this._state === null) {
				this._deferreds.push(deferred)
				return
			}
			asap(function() {
				var cb = me._state ? deferred.onFulfilled : deferred.onRejected
				if (cb === null) {
					(me._state ? deferred.resolve : deferred.reject)(me._value)
					return
				}
				var ret;
				//try {
					ret = cb(me._value)
				//}
				//catch (e) {
				//	deferred.reject(e)
				//	return;
				//}
				deferred.resolve(ret)
			})
		}

		function resolve(newValue) {
			//try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
				if (newValue === this) throw new TypeError('A promise cannot be resolved with itself.')
				if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
					var then = newValue.then
					if (typeof then === 'function') {
						doResolve(bind(then, newValue), bind(resolve, this), bind(reject, this))
						return;
					}
				}
				this._state = true
				this._value = newValue
				finale.call(this)
			//} catch (e) { reject.call(this, e); }
		}

		function reject(newValue) {
			this._state = false
			this._value = newValue
			finale.call(this)
		}

		function finale() {
			for (var i = 0, len = this._deferreds.length; i < len; i++) {
				handle.call(this, this._deferreds[i])
			}
			this._deferreds = null
		}

		function Handler(onFulfilled, onRejected, resolve, reject){
			this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
			this.onRejected = typeof onRejected === 'function' ? onRejected : null
			this.resolve = resolve
			this.reject = reject
		}

		function doResolve(fn, onFulfilled, onRejected) {
			var done = false;
			try {
				fn(function (value) {
					if (done) return
					done = true
					onFulfilled(value)
				}, function (reason) {
					if (done) return
					done = true
					onRejected(reason)
				})
			} catch (ex) {
				if (done) return
				done = true
				onRejected(ex)
			}
		}

		Promise.prototype['catch'] = function (onRejected) {
			return this.then(null, onRejected);
		}

		Promise.prototype.then = function(onFulfilled, onRejected) {
			var me = this;
			return new Promise(function(resolve, reject) {
				handle.call(me, new Handler(onFulfilled, onRejected, resolve, reject))
			})
		}

		Promise.all = function () {
			var args = Array.prototype.slice.call(arguments.length === 1 && isArray(arguments[0]) ? arguments[0] : arguments)

			return new Promise(function (resolve, reject) {
				if (args.length === 0) return resolve([])
				var remaining = args.length
				function res(i, val) {
					//try {
						if (val && (typeof val === 'object' || typeof val === 'function')) {
							var then = val.then
							if (typeof then === 'function') {
								then.call(val, function (val) { res(i, val) }, reject)
								return
							}
						}
						args[i] = val
						if (--remaining === 0) {
							resolve(args)
						}
					//} catch (ex) {
					//	reject(ex)
					//}
				}
				for (var i = 0; i < args.length; i++) {
					res(i, args[i])
				}
			})
		}

		Promise.resolve = function (value) {
			if (value && typeof value === 'object' && value.constructor === Promise) {
				return value
			}

			return new Promise(function (resolve) {
				resolve(value)
			})
		}

		Promise.reject = function (value) {
			return new Promise(function (resolve, reject) {
				reject(value)
			})
		}

		Promise.race = function (values) {
			return new Promise(function (resolve, reject) {
				for(var i = 0, len = values.length; i < len; i++) {
					values[i].then(resolve, reject)
				}
			})
		}

		return Promise
	}
	// check if we are in debug mode
	defineDreem.Promise = defineDreem.debugPromiseLib()








	defineDreem.startLoader = function(){

	}

	defineDreem.endLoader = function(){

	}

	defineDreem.getReloadID = function(){
		var num = defineDreem.reload_id
		var s = ''
		while(num%26){
			s += String.fromCharCode(num%26 +97)
			num = Math.floor(num/26)
		}
		return s
	}








	// Packaged






	function define_packaged(){
		defineDreem.requireDreem = defineDreem.localRequire('')
	}







	// Browser








	function define_browser(){ // browser implementation
		// if define was already defined use it as a config store
		// storage structures
		defineDreem.cputhreads = navigator.hardwareConcurrency || 2
		defineDreem.download_queue = {}
		defineDreem.script_tags = {}
		// the require function passed into the factory is local
		var app_root = defineDreem.filePath(window.location.href)

		defineDreem.getModule = function(name){
			var expanded = defineDreem.expandVariables(name)
			return defineDreem.module[expanded]
		}

		// make it available globally
		window.defineDreem = defineDreem

		defineDreem.hideException = function(){
			if(defineDreem.exception_div){
				defineDreem.exception_div.parentNode.removeChild(defineDreem.exception_div)
				defineDreem.exception_div = undefined
			}
		}

		defineDreem.showException = function(exc){
			if(Object.keys(exc).length === 0) exc = {error:exc.stack, exception:exc.toString(), path:"", line:""}
			// lets append the div
			var div = defineDreem.exception_div = document.createElement('div')
			div.style.cssText ='position:absolute;left:10;top:10;padding:30px;background-color:white;border-radius:10px;border:2px dotted #ffc0c0;color:#202020;margin:20px;margin-left:20px;font-size:14pt;font-family:arial, helvetica;'

			div.innerHTML = "<b>DreemGL has encountered a problem!</b><br/>"+exc.error+"<br/><div>"+exc.exception+"<br/><br/><div style='color:black'><a href='view-source:"+exc.path+"#"+exc.line+"'>in "+exc.path+" on line "+exc.line+"</a></div>"
			document.body.appendChild(div)
		}

		// boot up using the MAIN property
		if(defineDreem.main){
			setTimeout(function () {
				console.log("starting defineDreem.loadAsync()");
				defineDreem.loadAsync(defineDreem.main, 'main').then(function(){
					if(defineDreem.atMain) setTimeout(function(){
						defineDreem.atMain(defineDreem.requireDreem, defineDreem.main)
					},0)
				}, function(exc){
					if(defineDreem.atException) defineDreem.atException(exc)
					else{
						defineDreem.showException(exc)
					}
				})	
			}, 500);
		}

		var backoff = 1
		defineDreem.autoreloadConnect = function(){
			return; // SETH: don't reconnect, we don't want RPC
			if(this.reload_socket){
				this.reload_socket.onclose = undefined
				this.reload_socket.onerror = undefined
				this.reload_socket.onmessage = undefined
				this.reload_socket.onopen = undefined
				this.reload_socket.close()
				this.reload_socket = undefined
			}
			this.reload_socket = new WebSocket((location.href.indexOf('https') === 0?'wss://':'ws://') + location.host)

			this.reload_socket.onopen = function(){
				backoff = 1
			}

			this.reload_socket.onerror = function(){
			}

			this.reload_socket.onclose = function(){
				if((backoff*=2) > 1000) backoff = 1000
				setTimeout(function(){ defineDreem.autoreloadConnect() }, backoff)
			}

			this.reload_socket.onmessage = function(event){
				var msg = JSON.parse(event.data)
				if (msg.type === 'filechange'){
					if(defineDreem.ignore_reload && defineDreem.ignore_reload[msg.file]) return console.log("Ignoring file change on "+msg.file)
					var old_module = defineDreem.module[msg.file]
					defineDreem.hideException()
					if(defineDreem.partial_reload && old_module && typeof old_module.exports === 'function'){
						defineDreem.requireDreem.reloadAsync(msg.file).then(function(){
							if(defineDreem.atMain) defineDreem.atMain(defineDreem.requireDreem, defineDreem.main)
						}).catch(function(exception){
							defineDreem.showException(exception)
						})
					}
					else {//if (old_module){
						//alert('filechange!' + msg.file)
						console.clear()
						location.href = location.href  // reload on filechange
					}
				}
				else if (msg.type === 'close') {
					window.close() // close the window
				}
				else if (msg.type === 'delay') { // a delay refresh message
					console.log('Got delay refresh from server!');
					setTimeout(function() {
						console.clear()
						location.href = location.href
					}, 1500)
				}
			}
		}
		defineDreem.autoreloadConnect()
	}









	// NodeJS







  // SETH: we don't need the nodejs version, and cannot webpack it
/*
	function define_nodejs(){ // nodeJS implementation
		module.exports = global.define = define

		defineDreem.$root = defineDreem.filePath(process.mainModule.filename.replace(/\\/g,'/'))

		var http = requireDreem("http")
		var url = requireDreem("url")
		var fs = requireDreem("fs")
		var path = requireDreem("path")

		var root = defineDreem.expandVariables(defineDreem.$root)

		defineDreem.makeCacheDir = function(name){
			var cache_dir = path.join(root+'/cache')
			if(!fs.existsSync(cache_dir)) fs.mkdirSync(cache_dir)

			var cache_node =  path.join(root+'/cache/'+name)
			if(!fs.existsSync(cache_node)) fs.mkdirSync(cache_node)
			return cache_node
		}

		var cache_path_root = defineDreem.makeCacheDir('node')

		defineDreem.mapToCacheDir = function(name){
			return cache_path_root + url.parse(defineDreem.expandVariables(name)).path
		}

		defineDreem.getModule = function(name){
			var expanded = defineDreem.expandVariables(name)
			if(expanded.indexOf('://')!==-1){
				expanded = defineDreem.mapToCacheDir(expanded)
			}
			var module = defineDreem.module[expanded]
			return module
		}

		// fetch it async!
		defineDreem.httpGetCached = function(httpurl){
			return new defineDreem.Promise(function(resolve, reject){
				var myurl = url.parse(httpurl)
				// ok turn this url into a cachepath

				// lets make some dirs
				var path = defineDreem.filePath(myurl.path)
				var dirs = path.split('/')
				var total = cache_path_root + '/'
				for(var i = 0; i < dirs.length; i++){
					total += dirs[i]
					if(!fs.existsSync(total)) fs.mkdirSync(total)
					total += '/'
				}

				var cache_path = cache_path_root + myurl.path

				// then we read our files ETag
				var headers = {'client-type':'nodejs'}
				fs.stat(cache_path, function(err, stat){
					if(!err){ // build etag
						headers['if-none-match'] = stat.mtime.getTime() + '_' + stat.size
					}
					http.get({
						host: myurl.hostname,
						port: myurl.port,
						path: myurl.path,
						headers:headers
					},
					function(res){
						//console.log(res)
						if(res.statusCode === 200){

						}
						else if(res.statusCode === 304){ // cached
							return resolve({path:cache_path, type:res.headers['content-type']})
						}
						else reject({path:myurl.path,code:res.statusCode})
						if(res.headers['content-type'] === 'text/json' && defineDreem.fileExt(cache_path) === '') cache_path += '.json'
						// lets write it to disk
						var str = fs.createWriteStream(cache_path)
						res.pipe(str)

						str.on('finish', function(){
							// lets set the exact timestamp on our file
							if(res.headers.mtime){
								var time = res.headers.mtime / 1000
								fs.utimes(cache_path, time, time)
							}
							resolve({path:cache_path, type:res.headers['content-type']})
						})
					})
				})
			})
		}

		// hook compile to keep track of module objects
		var Module = requireDreem("module")
		var modules = []
		var original_paths = []
		var _compile = Module.prototype._compile
		Module.prototype._compile = function(content, filename){
			modules.push(this)
			try {
				var ret = _compile.call(this, content, filename)
			}
			//catch(e){ throw e}
			//catch(e){
			//	console.log(e.linenumber)
		//	}
			finally {
				modules.pop()
			}
			return ret
		}

		defineDreem.download_queue = {}

		defineDreem.define = function(factory) {

			if(factory instanceof Array) throw new Error("injects-style not supported")

			var module = modules[modules.length - 1] || requireDreem.main
			//console.log(original_paths)
			// store module and factory just like in the other envs
			defineDreem.module[module.filename] = module
			defineDreem.factory[module.filename] = factory

			function loadModuleAsync(modurl, includefrom){
				modurl = modurl.replace(/\\/g , '/' );
				var parsedmodurl = url.parse(modurl)
				var base_path = defineDreem.filePath(modurl)

				// block reentry
				if(defineDreem.download_queue[modurl]){
					return new defineDreem.Promise(function(resolve, reject){

						resolve( cache_path_root + url.parse(modurl).path )
					})
					//return defineDreem.download_queue[modurl]//
				}

				// we need to fetch the url, then look at its dependencies, fetch those
				return defineDreem.download_queue[modurl] = new defineDreem.Promise(function(resolve, reject){
					// lets make sure we dont already have the module in our system
					defineDreem.httpGetCached(modurl).then(function(result){

						// the root
						if(result.type === 'text/json' && defineDreem.fileExt(parsedmodurl.path) === ''){
							var data = JSON.parse(fs.readFileSync(result.path).toString())
							// alright we get a boot file
							// set our root properly
							var mathmodule = defineDreem.getModule('$system/base/math.js')

							// lets re-assign math
							defineDreem.paths = data.paths
							for(var key in data.paths){
								define['$'+key] = '$root/'+key
							}

							defineDreem.paths.root =
							defineDreem.$root = 'http://'+parsedmodurl.hostname+':'+parsedmodurl.port+'/'
							var math2 = defineDreem.mapToCacheDir('$system/base/math.js')
							defineDreem.module[math2] = mathmodule


							// alright now, lets load up the root
							loadModuleAsync(defineDreem.expandVariables(data.boot), modurl).then(function(result){
								// ok so,
								resolve(result)
							})
							return
						}
						if(result.type.indexOf('javascript') !== -1){
							// lets load up the module, without initializing it
							defineDreem.process_factory = true

							// open the fucker
							try{
								//!TODO, make a neater way to fetch the module dependencies (dont require it twice)
								require(result.path)
								// and lets remove it again immediately
								delete Module._cache[result.path.indexOf("\\") !== -1?result.path.replace(/\//g, '\\'):result.path]
							}
							catch(e){
								console.log(e.stack)
							}
							var factory = defineDreem.process_factory
							defineDreem.process_factory = false
							// alright we have a defineDreem.process_factory call we can now use.
							if(factory === true){
								return resolve(result.path)
							}

							Promise.all(defineDreem.findRequiresInFactory(factory).map(function(path){

								// ignore nodejs style module requires
								var dep_path
								if(path.indexOf('://') !== -1){
									dep_path = path
								}
								else if(path.indexOf('$') === -1 && path.charAt(0) !== '.'){
									return null
								}
								else dep_path = defineDreem.joinPath(base_path, defineDreem.expandVariables(path))

								var ext = defineDreem.fileExt(dep_path)
								if(!ext) dep_path += '.js'

								return loadModuleAsync(dep_path, modurl)

							})).then(function(){
								// lets finish up our factory
								resolve(result.path)
							}).catch(function(error){
								console.log("CAUGHT ERROR ", error)
							})

							return
							// lets initialize the module
						}
						return resolve(result.path)

					}).catch(function(err){
						console.log("Error in "+modurl+" from "+includefrom,err,err.stack)
					})
				})
			}


			function noderequirewrapper(iname) {
				var name = iname
				if(arguments.length != 1) throw new Error("Unsupported require style")
				try{
					name = defineDreem.expandVariables(name)
				}
				catch(e){
					console.log("Cannot find "+e+" in module "+module.filename)
					throw e
				}

				if(name.indexOf('://') !== -1){
					name = defineDreem.mapToCacheDir(name)
				}

				var full_name = name;
				try{
					full_name = Module._resolveFilename(name, module)
				}
				catch(e){
					// Don't generate an error becaues the image might be
					// remote, or a relative path was specified.
				}
				if (full_name instanceof Array) full_name = full_name[0]

				if(defineDreem.atRequire && ((full_name.charAt(0) == '/') || (full_name.indexOf('\\') >= 0)) ){
					defineDreem.atRequire(full_name)
				}

				// we cant require non js files
				var ext = defineDreem.fileExt(full_name)
				if(ext !== '' && ext !== 'js'){
					if(ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'png'){
						// Construct a Texture.Image object given its path
						if(defineDreem.loadImage) return defineDreem.loadImage(full_name)
						return undefined
					}
					else{
						// read it as an arraybuffer
						var buffer = fs.readFileSync(full_name)
						var ab = new ArrayBuffer(buffer.length)
						var view = new Uint8Array(ab)
						for (var i = 0; i < buffer.length; ++i) {
						    view[i] = buffer[i]
						}
						return defineDreem.processFileType(ext, ab)
						//console.log(full_name)
					}
					return undefined
				}

				var old_stack = defineDreem.local_require_stack
				defineDreem.local_require_stack = []

				try{
					var ret = require(full_name)
				}
				//catch(e){

				//	console.log(e.stack)
				finally{
					defineDreem.local_require_stack = old_stack
				}
				return ret
			}

			noderequirewrapper.clearCache = function(name){
				Module._cache = {}
			}

			noderequirewrapper.module = module

			noderequirewrapper.loaded = function(path, ext){
				var dep_path = defineDreem.joinPath(cache_path_root, defineDreem.expandVariables(path))
				if(defineDreem.factory[dep_path]){
					return true
				}
			}

			noderequirewrapper.async = function(modname){
				// For dali (and probably nodejs) relative paths must be made
				// absolute to where the example is located. Retrieval
				// method is different if running from a remote server
				var remote = (defineDreem.$example.indexOf('://') !== -1);

				if (defineDreem.$platform == 'dali') {
					// Remote, relative
					if (remote && modname.indexOf('./') == 0) {
						modname = defineDreem.$example + modname.substring(2)
						return defineDreem.httpGetCached(modname);
					}

					// Remote, absolute
					if (remote && modname.indexOf('/') == 0) {
						var p = defineDreem.$example.indexOf('/', 8);
						modname = defineDreem.$example.substring(0, p) + modname;
						return defineDreem.httpGetCached(modname);
					}

					// Local, relative
					if (modname.indexOf('./') == 0) {
						modname = '$root/' + defineDreem.$example + modname.substring(2)
						modname = defineDreem.expandVariables(modname);

						return new defineDreem.Promise(function(resolve, reject) {
							return resolve(defineDreem.loadImage(modname));
						});
					}

					// Local, absolute
					if (modname.indexOf('/') == 0) {
						modname = '$root' + modname
						modname = defineDreem.expandVariables(modname);

						return new defineDreem.Promise(function(resolve, reject) {
							return resolve(defineDreem.loadImage(modname));
						});
					}

					if (remote && modname.indexOf('://') === -1)
						modname = defineDreem.$example + '/' + modname

					modname = defineDreem.expandVariables(modname)
				}

				if (defineDreem.$platform == 'dali' && modname.indexOf('./') == 0)
					modname = '$root' + '/' + defineDreem.$example + '/' + modname;

				if(typeof modname !== 'string') throw new Error("module name in requireDreem.async not a string")
				modname = defineDreem.expandVariables(modname)

				// Query if module is in local file system (DALI)
				var fs = requireDreem("fs")
				try {
					stats = fs.lstatSync(modname)
					var data = fs.readFileSync(modname)
					return new defineDreem.Promise(function(resolve, reject){
						resolve(data)
					})
				}
				catch(e) {
				}

				return new defineDreem.Promise(function(resolve, reject){
					loadModuleAsync(modname, "root").then(function(path){
						resolve(noderequirewrapper(path))
					}).catch(function(e){
						console.log("ERROR", e.stack)
					})
				})
			}

			module.factory = factory

			if (typeof factory !== "function") return module.exports = factory

			// we are being used for requireDreem.async
			if(defineDreem.process_factory){
				defineDreem.process_factory = factory
				return
			}

			defineDreem.local_require_stack.push(noderequirewrapper)
			try{
				var ret = factory.call(module.exports, noderequirewrapper, module.exports, module)
			}
			finally{
				defineDreem.local_require_stack.pop()
			}

			if(ret !== undefined) module.exports = ret

			if(defineDreem.atModule) defineDreem.atModule(module)
		}

		global.defineDreem.require = require
		global.defineDreem.module = {}
		global.defineDreem.factory = {}
		// fetch a new require for the main module and return that
		defineDreem.defineDreem(function(requireDreem){
			module.exports = require
		})
	}
*/





	// Worker







	function define_worker(){
		self.defineDreem = defineDreem

		defineDreem.defineDreem = function(body){
		}
	}







	// Struct implementation







	defineDreem.prim = {
		int8:function int8(value){
			if(value && value.isArray) return value
			return parseInt(value)
		},
		uint8:function uint8(value){
			if(value && value.isArray) return value
			return parseInt(value)
		},
		int16:function int16(value){
			if(value && value.isArray) return value
			return parseInt(value)
		},
		uint16:function uint16(value){
			if(value && value.isArray) return value
			return parseInt(value)
		},
		int32:function int32(value){
			if(value && value.isArray) return value
			return parseInt(value)
		},
		uint32:function uint32(value){
			if(value && value.isArray) return value
			return parseInt(value)
		},
		half:function half(value){
			if(value && value.isArray) return value
			return parseFloat(value)
		},
		float32:function float32(value){
			if(value && value.isArray) return value
			return parseFloat(value)
		},
		float64:function float64(value){
			if(value && value.isArray) return value
			return parseFloat(value)
		},
		bool:function boolean(value){
			if(value && value.isArray) return value
			return value? true: false
		}
	}

	defineDreem.struct = function(def, id){

		function getStructArrayType(type){
			var def = type.def
			if(def.prim) return type
			var tt, mt
			for(var key in def) if(typeof def[key] !== 'string'){
				mt = getStructArrayType(def[key])
				if(mt !== tt){
					if(tt=== undefined) tt = mt
					else return null // mixed type
				}
				else tt = mt
			}
			return tt
		}

		function getStructSize(def){
			if(def.prim) return 1
			var size = 0
			for(var key in def) if(typeof def[key] !== 'string') size += getStructSize(def[key].def)
			return size
		}

		var myprim = getStructArrayType({def:def})
		var myarray = myprim?myprim.def.array:null
		var mysize = getStructSize(def)
		var Struct
		if(def.prim){
			Struct = defineDreem.prim[id]
			Struct.bytes = def.bytes
			Struct.primitive = true
		}
		else{
			function MyStruct(){
				var out = new myarray(mysize), len = arguments.length
				out.toJSON = function(){

					var res = [];
					res.push.apply(res, this);
					return {____struct: this.struct.id, data: res};
				}
				out.struct = MyStruct
				if(len === 0) return out
				var arg0 = arguments[0]
				if(len === 1 && typeof arg0 !== 'string'){
					if(arg0 && arg0.isArray) return arg0
					if(typeof arg0 === 'number'){ // copy struct
						for(var i = 0; i < mysize; i++) out[i] = arg0
						return out
					}
					// treat as array
					if(arg0 === null  || arg0 === undefined) return out
					if(Array.isArray(arg0)){
						var iter = Math.min(mysize, arg0.length)
						for(var i = 0; i < iter; i++) out[i] = arg0[i]
						for(;i<mysize;i++) out[i] = 1
						return out
					}
					if(arg0.struct){
						var iter = Math.min(mysize, arg0.struct.slots)
						for(var i = 0; i < iter; i++) out[i] = arg0[i]
						for(;i<mysize;i++) out[i] = 1
						return out
					}
					if(arg0.____struct && arg0.data){
						var data = arg0.data
						for(var i = 0; i < mysize; i++) out[i] = data[i]
						return out
					}
					throw new Error("TODO implement object constructing for type: " + typeof arg0)
					return out
				}
				if(len === mysize){
					for(var i = 0; i < len; i++) out[i] = arguments[i]
					return out
				}
				if(typeof arg0 === 'string'){
					MyStruct.fromString.apply(out, arguments)
					return out
				}

				var outoff = 0
				for(var i = 0; i < len; i++){
					var item = arguments[i]
					if(typeof item == 'number') out[outoff++] = item
					else outoff = defineDreem.arraySplat(out, outoff, item, 0, 1)
				}
				return out
			}
			if(defineDreem.debug && id){ // give the thing a name we can read
				var fnname = id
				var code = 'return '+MyStruct.toString().replace(/MyStruct/g,fnname)
				Struct = new Function('myarray','mysize', code)(myarray, mysize)
			}
			else{
				Struct = MyStruct
			}
			if(myprim) Struct.bytes = mysize * myprim.bytes
		}

		Struct.slots = mysize
		Struct.struct = Struct
		Struct.def = def
		Struct.primary = myprim

		Struct.copy = function(src, o){
			if(!o){
				o = new myarray(src.buffer.slice(0))
				o.struct = Struct
				return o
			}
			for(var i = 0; i < o.length; i++){
				o[i] = src[i]
			}
		}

		Struct.keyInfo = function(key){
			var type = this.def[key]
			if(typeof type === 'string') type = this.def[type]
			// ok lets compute the offset of type
			var offset = 0
			for(var ikey in this.def){
				if(ikey == key) break
				var itype = this.def[ikey]
				offset += itype.bytes
			}
			return {offset:offset, type:type}
		}

		Struct.keyType = function(key){
			// look it up normally
			var type = this.def[key]
			if(typeof type === 'string') return this.def[type]
			if(type !== undefined) return type
			// parse swizzled vector and gl types
			var i = 0, ch, l = key.length
			if(l <= 1 && l > 4) return

			if(mysize === 2){
				while(i < l){ // xy
					ch = key.charCodeAt(i++)
					if(ch !== 120 && ch !== 121){i = 0;break}
				}
				while(i < l){ // rg
					ch = key.charCodeAt(i++)
					if(ch !== 114 && ch !== 103){i = 0;break}
				}
				while(i < l){ // st
					ch = key.charCodeAt(i++)
					if(ch !== 115 && ch !== 116){i = 0;break}
				}
			}
			else if(mysize === 3){
				while(i < l){ // xyz
					ch = key.charCodeAt(i++)
					if(ch !== 120 && ch !== 121 && ch !== 122) {i = 0;break}
				}
				while(i < l){ // rgb
					ch = key.charCodeAt(i++)
					if(ch !== 114 && ch !== 103 && ch !== 98) {i = 0;break}
				}
				while(i < l){ // stp
					ch = key.charCodeAt(i++)
					if(ch !== 115 && ch !== 116 && ch !== 112) {i = 0;break}
				}
			}
			else if(mysize === 4){
				while(i < l){ // xyzw
					ch = key.charCodeAt(i++)
					if(ch !== 120 && ch !== 121 && ch !== 122 && ch !== 119){i = 0;break}
				}
				while(i < l){ // rgba
					ch = key.charCodeAt(i++)
					if(ch !== 114 && ch !== 103 && ch !== 98 && ch !== 97){i = 0;break}
				}
				while(i < l){ // stpq
					ch = key.charCodeAt(i++)
					if(ch !== 115 && ch !== 116 && ch !== 112 && ch !== 113){i = 0;break}
				}
			}
			if(i == l){
				var swiz = defineDreem.typemap.swizzle[myprim.def.type]
				if(!swiz) return
				return swiz[l]
			}
		}

		if(id !== undefined) Struct.id = id

		Struct.chunked = function(chunk_size){
			var obj = Object.create(this.chunked_type)
			obj.constructor = this
		}

		Struct.array = function(length){
			if(!length) length = 0
			var init_array
			if(typeof length == 'object'){// constructor
				if(!Array.isArray(length)) throw new Error('Can only initialize arrays with arrays')
				init_array = length
				length = init_array.length
				if(typeof init_array[0] == 'number') length /= mysize
			}

			// fixed size wrapper
			var obj = Object.create(this.array_type)
			obj.constructor = Struct
			obj.arrayconstructor = myarray
			obj.array = new myarray(mysize * length)
			obj.length = 0
			obj.allocated = length
			obj.slots = mysize
			obj.stride = mysize * myprim.bytes
			obj.struct = this

			if(init_array){
				if(typeof init_array[0] == 'number'){
					for(var i = 0; i < init_array.length; i++) obj.array[i] = init_array[i]
					obj.length = length
				}
				else length = parseInt(defineDreem.arraySplat(this.array, 0, init_array, 0, 1) / mysize)
			}
			return obj
		}

		Struct.quad = function(){
			if(arguments.length == 1) return this.array( arguments[0] * 6)
			var array = this.array(6)
			array.pushQuad.apply(array, arguments)
			return array
		}

		Struct.array_type  = Object.create(defineDreem.struct.array_type)
		Struct.chunked_type = Object.create(Struct.array_type)
		// copy over chunked functions
		for(var keys = Object.keys(defineDreem.struct.chunked_type), i = 0; i < keys.length; i++){
			var key = keys[i]
			Struct.chunked_type[key] = defineDreem.struct.chunked_type[key]
		}

		Struct.extend = function(body){
			var PrevConstruct = this
			function InheritStruct(){
				return PrevConstruct.apply(null, arguments)
			}
			// copy over prevConstruct
			for(var key in PrevConstruct){
				InheritStruct[key] = PrevConstruct[key]
			}
			var array = InheritStruct.array_type = Object.create(PrevConstruct.array_type)
			var chunk = InheritStruct.chunked_type = Object.create(array)
			// copy over chunked keys
			for(var keys = Object.keys(PrevConstruct.chunked_type), i = 0; i < keys.length; i++){
				var key = keys[i]
				chunk[key] = PrevConstruct.chunked_type[key]
			}

			body.call(array, InheritStruct, array, chunk)
			return InheritStruct
		}

		return Struct
	}

	defineDreem.arraySplat = function(out, ioutoff, inp, inpoff, depth){
		var outoff = ioutoff
		for(var i = inpoff, len = inp.length; i < len; i++){
			var item = inp[i]
			if(typeof item == 'number') out[outoff++] = item
			else if(typeof item === 'string'){
				defineDreem.arraySplat(out, outoff, vec4(item), 0, depth++)
			}
			else if(typeof item === 'object') outoff = defineDreem.arraySplat(out, outoff, item, 0, depth++)
		}
		return outoff
	}


	defineDreem.structFromJSON = function(node, binary){
		if (typeof(node) === "object" && node){
			if  (node.____struct){
				var lookup  = defineDreem.typemap.types[node.____struct] ;
				return lookup.apply(null, node.data);
			}
			else if(node.____binary !== undefined){
				return new defineDreem.typedArrayTypes[node.type](binary[node.____binary])
			}
			else{
				if(Array.isArray(node)){
					for(var i = 0; i < node.length; i++){
						node[i] = defineDreem.structFromJSON(node[i], binary)
					}
				}
				else for(var key in node){
					node[key] = defineDreem.structFromJSON(node[key], binary)
				}
			}
		}
		return node;
	}

	defineDreem.typedArrayTypes = {
		Float32Array:Float32Array,
		Float64Array:Float64Array,
		Int32Array:Int32Array,
		Uint32Array:Uint32Array,
		Int8Array:Int8Array,
		Uint8Array:Uint8Array,
		Int16Array:Int16Array,
		Uint16Array:Uint16Array,
	}

	defineDreem.makeJSONSafe = function(obj, binary, stack){
		if(obj === undefined || obj === null) return obj
		if(typeof obj === 'function') return null
		if(typeof obj !== 'object') return obj
		if(!stack) stack = []
		stack.push(obj)

		if(Array.isArray(obj)){
			var out = []
			for(var i = 0; i < obj.length; i++){
				var prop = obj[i]
				if(stack.indexOf(prop) === -1){
					out[i] = defineDreem.makeJSONSafe(prop, binary, stack)
				}
				else {
					out[i] = null
				}
			}
			stack.pop()
			return out
		}

		if(typeof obj.toJSON === 'function'){
			stack.pop()
			return obj
		}

		if(obj.buffer instanceof ArrayBuffer){
			var msg =  {____binary:binary.length, type:obj.constructor.name}
			binary.push({data:obj, msg:msg})
			stack.pop()
			return msg
		}

		var out = {}
		for(var key in obj){
			var prop = obj[key]
			if(typeof prop == 'object'){
				if(stack.indexOf(prop) === -1){
					out[key] = defineDreem.makeJSONSafe(prop, binary, stack)
				}
				else {
					out[key] = null
				}
			}
			else if(typeof prop == 'function') out[key] = null
			else out[key] = prop
		}
		stack.pop()
		return out
	}


	defineDreem.isSafeJSON = function(obj, stack){
		if(obj === undefined || obj === null) return true
		if(typeof obj === 'function') return false
		if(typeof obj !== 'object') return true
		if(!stack) stack = []
		stack.push(obj)

		if(Array.isArray(obj)){
			for(var i = 0; i < obj.length; i++){
				if(!defineDreem.isSafeJSON(obj[i])) return false
			}
			stack.pop()
			return true
		}

		if(typeof obj.toJSON === 'function') return true

		if(Object.getPrototypeOf(obj) !== Object.prototype) return false

		for(var key in obj){
			var prop = obj[key]
			if(typeof prop == 'object'){
				if(stack.indexOf(prop) != -1) return false // circular
				if(!defineDreem.isSafeJSON(prop, stack)) return false
			}
			else if(typeof prop == 'function') return false
			// probably json safe then
		}
		stack.pop()
		return true
	}


	defineDreem.struct.array_type = {}
	function structArray(self){

		// lets return the struct at index
		self.get = function(index){
			var out = this.array.subarray(this.slots * index)
			out.struct = Struct
			return out
		}

		self.ensureSize = function(length){
			if(length > this.allocated){
				// lets double the size of the buffer
				var oldsize = this.allocated * this.slots

				if(length > this.allocated * 2) this.allocated = length
				else this.allocated = this.allocated * 2 // exponential strategy

				var oldarray = this.array
				var newarray = new this.arrayconstructor(this.allocated * this.slots)
				for(var i = 0; i < oldsize; i++) newarray[i] = oldarray[i]
				this.array = newarray
			}
		}

		self.set = function(index){
			if(index >= this.allocated) this.ensureSize(index)
			if(index >= this.length) this.length = index + 1
			var len = arguments.length - 1, base = index * this.slots
			this.clean = false
			if(len === this.slots) for(var i = 0; i < len; i++) this.array[base + i] = arguments[i + 1]
			else defineDreem.arraySplat(this.array, base, arguments, 1)
			return this
		}

		self.push = function(){
			this.length ++
			if(this.length >= this.allocated) this.ensureSize(this.length)
			this.clean = false
			var base = (this.length -1) * this.slots
			var len = arguments.length
			if(len === this.slots) for(var i = 0; i < len;i++) this.array[base + i] = arguments[i]
			else defineDreem.arraySplat(this.array, base, arguments, 0)
		}

		// triangle strip
		self.lengthStrip = function(){
			if(this.length % 2) throw new Error('Non aligned strip size')
			return this.length / 2
		}

		self.setStrip = function(index){
			this.clean = false
			var arglen = arguments.length - 1
			var slots = this.slots
			if(arglen !== slots * 2) throw new Error('Please use individual components to set a quad')
			var needed = index * 2
			if(needed >= this.allocated) this.ensureSize(needed)
			if(needed >= this.length) this.length = needed + 2
			var off = needed * slots
			var out = this.array
			for(var i = 0; i < slots; i++){ // iterate the components
				out[off + i      ] = arguments[i + 1]
				out[off + i + 1*slots] = arguments[i + 1*slots + 1]
			}
		}

		self.pushStrip = function(){
			this.clean = false
			var slots = this.slots
			if(arguments.length !== slots * 2) throw new Error('Please use individual components to set a quad for '+slots)
			var off = this.length * slots
			this.length += 2
			if(this.length >= this.allocated){
				this.ensureSize(this.length)
			}
			// ok so lets just write it out
			var out = this.array
			for(var i = 0; i < slots; i++){ // iterate the components
				out[off + i      ] = arguments[i]
				out[off + i + slots] = arguments[i + slots]
			}
		}

		// Simple quad geometry api
		// 0___14
		// |   /|
		// |  / |
		// | /  |
		// |/   |
		// 23---5

		// lets return a single slot
		self.getQuad = function(pos){
			// can we return a Float32Array on one of the quad corners?
			console.log('implement getquad')
		}

		self.lengthQuad = function(){
			if(this.length % 6) throw new Error('Non aligned quad size')
			return this.length / 6
		}

		self.setQuad = function(index){
			this.clean = false
			var arglen = arguments.length - 1
			var slots = this.slots
			if(arglen !== slots * 4) throw new Error('Please use individual components to set a quad')
			var needed = index * 6
			if(needed >= this.allocated) this.ensureSize(needed)
			if(needed >= this.length) this.length = needed + 6
			// ok so lets just write it out
			var off = needed * slots
			var out = this.array
			for(var i = 0; i < slots; i++){ // iterate the components
				out[off + i      ] = arguments[i + 1]
				out[off + i + 1*slots] = out[off + i + 4*slots] = arguments[i + 1*slots + 1]
				out[off + i + 2*slots] = out[off + i + 3*slots] = arguments[i + 2*slots + 1]
				out[off + i + 5*slots] = arguments[i + 3*slots + 1]
			}
		}

		// Optional params: topleft, topright, bottomleft, bottomright
		self.pushQuad = function(){
			this.clean = false
			var slots = this.slots
			if(arguments.length !== slots * 4) throw new Error('Please use individual components to set a quad for '+slots)
			var off = this.length * slots
			this.length += 6
			if(this.length >= this.allocated){
				this.ensureSize(this.length)
			}
			// ok so lets just write it out
			var out = this.array
			for(var i = 0; i < slots; i++){ // iterate the components
				out[off + i      ] = arguments[i]
				out[off + i + 1*slots] = out[off + i + 4*slots] = arguments[i + 1*slots]
				out[off + i + 2*slots] = out[off + i + 3*slots] = arguments[i + 2*slots]
				out[off + i + 5*slots] = arguments[i + 3*slots]
			}
		}

		self.isArray = true

		return self
	}

	// we inherit from array
	structArray(defineDreem.struct.array_type)
	defineDreem.struct.chunked_type = Object.create(defineDreem.struct.array_type)
	function structChunked(self){
		self.isChunked = true
		return self
	}

	structChunked(defineDreem.struct.chunked_type)










	// Font loader. Yes i know this file is getting too large, but otherwise i get need loader-loaders.








	defineDreem.parseGLF = function(blob){
		// arg. we need to forward ref vec2 and ivec2
		// how do we do this.

		if(!blob) return
		if(blob._parsedFont) return blob._parsedFont

		// lets parse the font
		var vuint16 = new Uint16Array(blob)
		var vuint32 = new Uint32Array(blob)
		var vfloat32 = new Float32Array(blob)
		var vuint8 = new Uint8Array(blob)

		var font = {}
		var pixel_type
		if(vuint32[0] == 0x02F01175){ // baked format
			font.baked = true
			// lets parse the glyph set
			font.tex_geom = ivec2(vuint16[2], vuint16[3])
			font.tex_geom_f = vec2(font.tex_geom[0], font.tex_geom[1])
			var length = font.count = vuint32[2]

			if(length>10000) throw new Error('Font seems incorrect')
			var off = 3

			var glyphs = font.glyphs = {}
			for(var i = 0; i < length; i++){
				var unicode = vuint32[off++]
				var glyph = {
					min_x: vfloat32[off++],
					min_y: vfloat32[off++],
					max_x: vfloat32[off++],
					max_y: vfloat32[off++],
					advance: vfloat32[off++],
					tmin_x: vfloat32[off++],
					tmin_y: vfloat32[off++],
					tmax_x: vfloat32[off++],
					tmax_y: vfloat32[off++]
				}
				glyphs[unicode] = glyph
				glyph.width = glyph.max_x - glyph.min_x
				glyph.height = glyph.max_y - glyph.min_y
			}
			font.tex_array = blob.slice(off * 4)
			if(font.tex_array.byteLength === font.tex_geom[0] * font.tex_geom[1]){
				pixel_type = 1 << 6 // luminance
			}
			else{
				pixel_type = 1 << 1 // RGBA
			}
		}
		else if(vuint32[0] == 0x01F01175){ // glyphy format
			// lets parse the glyph set
			font.tex_geom = ivec2(vuint16[2], vuint16[3])
			font.item_geom = ivec2(vuint16[4], vuint16[5])
			font.tex_geom_f = vec2(font.tex_geom[0], font.tex_geom[1])
			font.item_geom_f = vec2(font.item_geom[0], font.item_geom[1])

			var length = font.count = vuint32[3] / (7*4)

			if(length>10000) throw new Error('Font seems incorrect')
			var off = 4

			var glyphs = font.glyphs = Object.create(null)
			for(var i = 0;i < length; i++){
				var unicode = vuint32[off++]
				var glyph = glyphs[unicode] = {
					min_x: vfloat32[off++],
					min_y: vfloat32[off++],
					max_x: vfloat32[off++],
					max_y: vfloat32[off++],
					advance: vfloat32[off++],
					nominal_w: vuint8[off*4],
					nominal_h: vuint8[off*4+1],
					atlas_x: vuint8[off*4+2],
					atlas_y: vuint8[off*4+3]
				}
				off++
				glyph.width = glyph.max_x - glyph.min_x
				glyph.height = glyph.max_y - glyph.min_y
			}
			font.tex_array = blob.slice(off * 4)
			pixel_type = 1 << 1 // RGBA
		}
		else throw new Error('Error in font file')

		if(!(32 in font.glyphs)) font.count++
		font.glyphs[32] = { // space
			min_x: 0,
			min_y: -0.3,
			max_x: 0.5,
			max_y: 1.,
			tmin_x: 0,
			tmin_y: 0,
			tmax_x: 24,
			tmax_y: 24,
			nominal_w:24,
			nominal_h:24,
			advance: 0.5,
			width: 0,
			height: 0,
		}
		if(!(10 in font.glyphs)) font.count++
		font.glyphs[10] = { // tab
			min_x: 0,
			min_y: -0.3,
			max_x: 2,
			max_y: 1.,
			tmin_x:0,
			tmin_y:0,
			tmax_x:24*4,
			tmax_y:24,
			nominal_w:24 * 4,
			nominal_h:24,
			advance:2,
			width: 2,
			height: 1
		}
		if(!(9 in font.glyphs)) font.count++
		font.glyphs[9] = { // tab
			min_x: 0,
			min_y: -0.3,
			max_x: 2,
			max_y: 1.,
			tmin_x:0,
			tmin_y:0,
			tmax_x:24*4,
			tmax_y:24,
			nominal_w:24 * 4,
			nominal_h:24,
			advance:2,
			width: 2,
			height: 1
		}

		font.texture = {type:pixel_type, array:font.tex_array, size:font.tex_geom}

		return font
	}















	function defineGlobals(exports){
		exports.RAD = 1
		exports.DEG = 0.017453292519943295
		exports.PI = 3.141592653589793
		exports.PI2 = 6.283185307179586
		exports.E = 2.718281828459045
		exports.LN2 = 0.6931471805599453
		exports.LN10 = 2.302585092994046
		exports.LOG2E = 1.4426950408889634
		exports.LOG10E = 0.4342944819032518
		exports.SQRT_1_2 = 0.70710678118654757
		exports.SQRT2 = 1.4142135623730951

		// primitive types
		exports.string = String
		exports.boolean =
		exports.bool = defineDreem.struct({prim:true, type:'bool', bytes:4, array:Int32Array},'bool')
		exports.float =
		exports.float32 = defineDreem.struct({prim:true, type:'float32',bytes:4, array:Float32Array},'float32')
		exports.double =
		exports.float64 = defineDreem.struct({prim:true, type:'float64', bytes:8, array:Float64Array},'float64')
		exports.int8 = defineDreem.struct({prim:true, type:'int8', bytes:1, array:Int8Array},'int8')
		exports.uint8 = defineDreem.struct({prim:true, type:'uint8', bytes:1, array:Uint8Array},'uint8')
		exports.half = defineDreem.struct({prim:true, type:'half', bytes:2, array:Int16Array},'half')
		exports.short =
		exports.int16 = defineDreem.struct({prim:true, type:'int16', bytes:2, array:Int16Array},'int16')
		exports.uint16 = defineDreem.struct({prim:true, type:'uint16', bytes:1, array:Uint16Array},'uint16')
		exports.long =
		exports.int =
		exports.int32 = defineDreem.struct({prim:true, type:'int32', bytes:4, array:Int32Array},'int32')
		exports.uint32 = defineDreem.struct({prim:true, type:'uint32', bytes:4, array:Uint32Array},'uint32')

		// Int vectors
		exports.ivec2 = defineDreem.struct({
			r:'x',g:'y',
			s:'x',t:'y',
			x:exports.int32,
			y:exports.int32
		}, 'ivec2')

		exports.ivec3 = defineDreem.struct({
			r:'x',g:'y',b:'z',
			s:'x',t:'y',p:'z',
			x:exports.int32,
			y:exports.int32,
			z:exports.int32
		}, 'ivec3')

		exports.ivec4 = defineDreem.struct({
			r:'x',g:'y',b:'z',a:'w',
			s:'x',t:'y',p:'z',q:'w',
			x:exports.int32,
			y:exports.int32,
			z:exports.int32,
			w:exports.int32,
		}, 'ivec4')

		// Bool vectors
		exports.bvec2 = defineDreem.struct({
			x:exports.boolean,
			y:exports.boolean
		}, 'bvec2')

		exports.bvec3 = defineDreem.struct({
			x:exports.boolean,
			y:exports.boolean,
			z:exports.boolean
		}, 'bvec3')

		exports.bvec4 = defineDreem.struct({
			x:exports.boolean,
			y:exports.boolean,
			z:exports.boolean,
			w:exports.boolean,
		}, 'bvec4')

		// vec2 type
		exports.vec2 = defineDreem.struct({
			r:'x',g:'y',
			s:'x',t:'y',
			x:exports.float32,
			y:exports.float32
		}, 'vec2')

		// vec3 API
		exports.vec3 = defineDreem.struct({
			r:'x',g:'y',b:'z',
			s:'x',t:'y',p:'z',
			x:exports.float32, y:exports.float32, z:exports.float32
		}, 'vec3')

		// vec4 API
		exports.vec4 = defineDreem.struct({
			r:'x',g:'y',b:'z',a:'w',
			s:'x',t:'y',p:'z',q:'w',
			x:exports.float32, y:exports.float32, z:exports.float32, w:exports.float32
		}, 'vec4')

		exports.mat2 = defineDreem.struct({
			a:exports.float32, b:exports.float32, c:exports.float32, d:exports.float32
		}, 'mat2')

		// mat3
		exports.mat3 = defineDreem.struct({
			a:exports.float32, b:exports.float32, c:exports.float32,
			d:exports.float32, e:exports.float32, f:exports.float32,
			g:exports.float32, h:exports.float32, i:exports.float32
		}, 'mat3')

		// mat4
		exports.mat4 = defineDreem.struct({
			a:exports.float32, b:exports.float32, c:exports.float32, d:exports.float32,
			e:exports.float32, f:exports.float32, g:exports.float32, h:exports.float32,
			i:exports.float32, j:exports.float32, k:exports.float32, l:exports.float32,
			m:exports.float32, n:exports.float32, o:exports.float32, p:exports.float32
		}, 'mat4')


		exports.quat = defineDreem.struct({
			x:exports.float32,
			y:exports.float32,
			z:exports.float32,
			w:exports.float32
		}, 'quat')


		exports.Enum = function Enum(){
			var matchset = Array.prototype.slice.call(arguments)
			var origset = Array.prototype.slice.call(arguments)

			function enumCanon(v){
				if(v.indexOf('-') !== -1) v = v.replace(/\-/g,'')
				return v.toLowerCase()
			}

			for(var i = 0; i < matchset.length; i++) matchset[i] = enumCanon(matchset[i])

			function Enum(value){
				var index = -1
				if(typeof value !== 'string'){
					if(typeof value === 'number'){
						index = value
					}
					else if(typeof value === 'boolean'){
						if(value) index = 1
						else index = 0
					}
					else index = matchset.indexOf(enumCanon(value))
				}
				else index = matchset.indexOf(enumCanon(value))

				if(index === -1){
					console.error('Invalid enum value: "' + value + '" ' + origset.join('|'))
					return types[0]
				}
				return origset[index]
			}
			Enum.values = origset
			return Enum
		}

		// global functions
		exports.flow = function(value){
			console.log('global>', value)
			return value
		}

		// basic math API
		function typeFn(fn){
			return function(v){
				if(typeof v == 'number') return fn(v)
				var out = v.struct()
				for(var i = 0; i < v.length; i++) out[i] = fn(v[i])
				return out
			}
		}
		function typeFn2(fn){
			return function(v, w){
				if(typeof v == 'number') return fn(v, w)
				var out = v.struct()
				for(var i = 0; i < v.length; i++) out[i] = fn(v[i], w[i])
				return out
			}
		}
		function typeFn3(fn){
			return function(v, w, x){
				if(typeof v == 'number') return fn(v, w, x)
				var out = v.struct()
				if(typeof w == 'number'){
					for(var i = 0; i < v.length; i++) out[i] = fn(v[i], w, x)
				}
				else{
					for(var i = 0; i < v.length; i++) out[i] = fn(v[i], w[i], x[i])
				}
				return out
			}
		}

		exports.sin = typeFn(Math.sin)
		exports.cos = typeFn(Math.cos)
		exports.tan = typeFn(Math.tan)
		exports.asin = typeFn(Math.asin)
		exports.acos = typeFn(Math.acos)
		exports.atan = typeFn(Math.atan)
		exports.atan2 = typeFn2(Math.atan2)
		exports.pow = typeFn2(Math.pow)
		exports.exp = typeFn(Math.exp)
		exports.log = typeFn(Math.log)
		exports.exp2 = typeFn(function(v){return Math.pow(2, v)})
		exports.log2 = typeFn(Math.log2)
		exports.sqrt = typeFn(Math.sqrt)
		exports.inversesqrt = typeFn(function(v){ return 1/Math.sqrt(v)})
		exports.abs = typeFn(Math.abs)
		exports.floor = typeFn(Math.floor)
		exports.round = typeFn(Math.round)
		exports.ceil = typeFn(Math.ceil)
		exports.min = typeFn2(Math.min)
		exports.max = typeFn2(Math.max)
		exports.mod = typeFn2(function(a,b){
			return a%b
		})
		exports.random = Math.random

		exports.sign = typeFn(function(v){
			if(v === 0) return 0
			if(v < 0 ) return -1
			return 1
		})

		exports.fract = typeFn(function(v){
			return v - Math.floor(v)
		})

		exports.clamp = typeFn3(function(v, mi, ma){
			if(v < mi) return mi
			if(v > ma) return ma
			return v
		})

		exports.mix = function(a, b, f, o){
			if(typeof a === 'number'){
				return a + f * (b - a)
			}
			o = o || a.struct()
			for(var i = 0; i < a.length; i++){
				o[i] = a[i] + f * (b[i] - a[i])
			}
			return o
		}

		exports.smoothstep = function(e0, e1, v){

		}

		exports.length = function(){
		}

		exports.distance = function(a, b){
		}

		exports.dot = function(a, b){
		}

		exports.cross = function(a, b){
		}

		exports.normalize = function(){
		}

		// events are passthrough types
		exports.Event = function Event(arg){
			return arg
		}

		// mark is a class that holds a mark and a value, use it to mark values going into a setter
		exports.Mark = function Mark(value, mark){
			var obj = this
			if(!(obj instanceof Mark)){
				obj = Object.create(Mark.prototype)
				Object.defineProperty(obj, 'constructor', {value:Mark})
			}
			obj.value = value
			obj.mark = arguments.length>1? mark: true
			return obj
		}

		// parsing a wired function as string
		exports.wire = function wire(fn){
			if (typeof(fn) !== 'function') {
				src = "return " + fn.toString()
				fn = new Function('find','rpc', src)
			}
			fn.is_wired = true;
			return fn
		}

		exports.Config = function Config(object){
			var obj = Object.create(Config.prototype)
			obj.constructor = Config
			obj.config = object
			return obj
		}

		exports.Animate = function(track){
			var obj = Object.create(Animate.prototype)
			obj.constructor = Animate
			obj.track = track
			return obj
		}
	}

	defineGlobals(typeof process !== 'undefined'? global: typeof window !== 'undefined'? window: self)

	// store the types on defineDreem
	defineDreem.typeToString = function(type){
		if(type === String) return 'String'
		if(type === Object) return 'Object'
		return type.id
	}

	defineDreem.stringToType = function(str){
		if(str === 'String') return String
		if(str === 'Object') return Object
		return defineDreem.typemap.types[str]
	}

	defineDreem.typemap = {
		types:{
			int:int,
			int32:int32,
			uint32:uint32,
			float:float,
			float32:float32,
			float64:float64,
			vec2:vec2,
			vec3:vec3,
			vec4:vec4,
			ivec2:ivec2,
			ivec3:ivec3,
			ivec4:ivec4,
			bvec2:bvec2,
			bvec3:bvec3,
			bvec4:bvec4,
			mat2:mat2,
			mat3:mat3,
			mat4:mat4
		},
		swizzle:{
			bool:{2:bvec2, 3:bvec3, 4:bvec4},
			int32:{2:ivec2, 3:ivec3, 4:ivec4},
			float32:{2:vec2, 3:vec3, 4:vec4},
		}
	}

	function defineComponent(proto, name, index){
		Object.defineProperty(proto, name, {get:function(){ return this[index] },set:function(v){
			this[index] = v
			if(this.atChange) this.atChange(index)
		}})
	}

	function defineSwiz2(proto, name, i0, i1, vec){
		Object.defineProperty(proto, name, {get:function(){ return vec(this[i0], this[i1]) },set:function(v){
			this[i0] = v[0], this[i1] = v[1]
			if(this.atChange) this.atChange(-1)
		}})
	}

	function defineSwiz3(proto, name, i0, i1, i2, vec){
		Object.defineProperty(proto, name, {get:function(){ return vec(this[i0], this[i1], this[i2]) },set:function(v){
			this[i0] = v[0], this[i1] = v[1], this[i2] = v[2]
			if(this.atChange) this.atChange(-1)
		}})
	}

	function defineSwiz4(proto, name, i0, i1, i2, i3, vec){
		Object.defineProperty(proto, name, {get:function(){ return vec(this[i0], this[i1], this[i2], this[i3]) },set:function(v){
			this[i0] = v[0], this[i1] = v[1], this[i2] = v[2], this[i3] = v[3]
			if(this.atChange) this.atChange(-1)
		}})
	}

	function defineArrayProp(proto, propset, vectypes){
		for(var prop in propset){
			defineComponent(proto, prop, propset[prop])
		}
		// create swizzles
		for(var key1 in propset) for(var key2 in propset){
			defineSwiz2(proto, key1+key2, propset[key1], propset[key2], vectypes[0])
		}
		for(var key1 in propset) for(var key2 in propset) for(var key3 in propset){
			defineSwiz3(proto, key1+key2+key3, propset[key1], propset[key2], propset[key3], vectypes[1])
		}
		for(var key1 in propset) for(var key2 in propset) for(var key3 in propset) for(var key4 in propset){
			defineSwiz4(proto, key1+key2+key3+key4, propset[key1], propset[key2], propset[key3], propset[key4], vectypes[2])
		}
	}

	defineArrayProp(Float32Array.prototype, {x:0, y:1, z:2, w:3}, [vec2, vec3, vec4])
	//defineArrayProp(Float32Array.prototype, {r:0, g:1, b:2, a:3}, [exports.vec2, exports.vec3, exports.vec4])
	defineArrayProp(Int32Array.prototype, {x:0, y:1, z:2, w:3}, [ivec2, ivec3, ivec4])
	//defineArrayProp(Int32Array.prototype, {r:0, g:1, b:2, a:3}, [exports.ivec2, exports.ivec3, exports.ivec4])
	if(defineDreem.packaged) define_packaged()
	else if(defineDreem.$environment === 'nodejs') define_nodejs()
	else if(defineDreem.$environment === 'browser') define_browser()
	else if(defineDreem.$environment === 'worker') define_worker()
    
  return defineDreem;
})()

// use the switchable promise

if(defineDreem.atEnd) defineDreem.atEnd()
  
export default defineDreem;
