import lookupInImportLibrary from 'library';
// window.lookupInImportLibrary = lookupInImportLibrary

function objectIsEmpty(obj) {
	for (var key in obj) {
		if (hasOwnProperty.call(obj, key)) return false;
	}
	return true;
}

window.defineDreem.localRequire = function (base_path, from_file) {
	let requireDreem = function (dep_path, ext) {

		// skip nodejs style includes
		var abs_path = defineDreem.joinPath(base_path, defineDreem.expandVariables(dep_path))
		if (!ext && !defineDreem.fileExt(abs_path)) abs_path = abs_path + '.js'

		// lets look it up
		var module = defineDreem.module[abs_path]
		if (module) return module.exports

		// otherwise lets initialize the module
		var factory = defineDreem.factory[abs_path]

		if (!factory && dep_path.indexOf('$') === -1 && dep_path.charAt(0) !== '.') {
			//console.log(abs_path)
			//console.log('skipping', dep_path)
			return null
		}

		// SETH AND DREW IMPORT HERE
		if (!factory) {
      factory = lookupInImportLibrary(abs_path);

  		if (factory) {
        // seth drew uncomment for debug
  			// console.log("\tloaded ", abs_path);
  			if (objectIsEmpty(factory)) {
  				console.warn("\tgot an empty module back for ", abs_path, " probably means we don't have a proper export default in the module yet??? Need to figure out how to rig this into all files, ugh.");
  			}
  		} else {
  			console.error("couldn't find factory for ", abs_path, base_path);
  		}
    }
		// END SETH AND DREW HA><0RY	

		// lets reverse our path


		module = { exports: {}, factory: factory, id: abs_path, filename: abs_path }
		defineDreem.module[abs_path] = module
		if (factory === null) return null // its not an AMD module, but accept that
		if (!factory) throw new Error("Cannot find factory for module (file not found): " + dep_path + " > " + abs_path)




		// call the factory
		if (typeof factory == 'function') {
			var localreq = defineDreem.localRequire(defineDreem.filePath(abs_path), abs_path)

			localreq.module = module

			defineDreem.local_require_stack.push(localreq)
			try {
				var ret = factory.call(module.exports, localreq, module.exports, module)
			}
			finally {
				defineDreem.local_require_stack.pop()
			}
			if (ret !== undefined) module.exports = ret
		}
		else module.exports = factory
		// post process hook
		if (defineDreem.atModule) defineDreem.atModule(module)

		return module.exports
	}

	requireDreem.loaded = function (path, ext) {
		var dep_path = defineDreem.joinPath(base_path, defineDreem.expandVariables(path))
		if (defineDreem.factory[dep_path]) {
			return true
		}
	}

	requireDreem.async = function (path, ext) {
		var dep_path = defineDreem.joinPath(base_path, defineDreem.expandVariables(path))
		return new defineDreem.Promise(function (resolve, reject) {
			if (defineDreem.factory[dep_path]) {
				// if its already asynchronously loading..
				var module = requireDreem(path, ext)
				return resolve(module)
			}
			defineDreem.loadAsync(dep_path, from_file, ext).then(function () {
				var module = requireDreem(path, ext)
				resolve(module)
			}, reject)
		})
	}

	requireDreem.reloadAsync = function (path) {

		return new defineDreem.Promise(function (resolve, reject) {

			defineDreem.reload_id++

			// lets wipe the old module
			var old_module = defineDreem.module[path]
			var old_factory = defineDreem.factory[path]

			defineDreem.module[path] = defineDreem.factory[path] = undefined

			// lets require it async
			defineDreem.requireDreem.async(path).then(function (new_class) {
				// fetch all modules dependent on this class, and all dependent on those
				// and cause them to reinitialize
				function wipe_module(name) {
					//console.log("Reloading "+defineDreem.fileName(name))
					for (var key in defineDreem.factory) {
						var fac = defineDreem.factory[key]
						if (!fac) continue
						var deps = fac.deps
						if (key !== name && defineDreem.module[key] && deps && deps.indexOf(name) !== -1) {
							// remove module
							defineDreem.module[key] = undefined
							// try to wipe all modules that depend our this one
							wipe_module(key)
						}
					}
				}
				wipe_module(path)

				resolve(defineDreem.module[path])
			}).catch(function (error) {

				defineDreem.module[path] = old_module
				defineDreem.factory[path] = old_factory

				reject(error)
			})
		})
	}

	return requireDreem
}

window.defineDreem.requireDreem = defineDreem.localRequire('', 'root')

// loadAsync is the resource loader
defineDreem.loadAsync = function (files, from_file, inext) {
  // console.log("loadAsync()");
	function loadResource(url, from_file, recurblock, module_deps) {
    // console.log("loadResource(", url, ")");
		var ext = inext === undefined ? defineDreem.fileExt(url) : inext;
		var abs_url, fac_url

		if (url.indexOf('http:') === 0 || url.indexOf('https:') === 0) { // we are fetching a url..
			fac_url = url
			abs_url = defineDreem.$root + '/proxy?' + encodeURIComponent(url)
		}
		else {
			abs_url = defineDreem.expandVariables(url)
			if (!ext) ext = 'js', abs_url += '.' + ext
			fac_url = abs_url
		}

		if (defineDreem.reload_id) abs_url += '?' + defineDreem.getReloadID()

		if (module_deps && module_deps.indexOf(fac_url) === -1) module_deps.push(fac_url)

		if (defineDreem.factory[fac_url]) return new defineDreem.Promise(function (resolve) { resolve() })

		var prom = defineDreem.download_queue[abs_url]

		if (prom) {
			if (recurblock) return new defineDreem.Promise(function (resolve) { resolve() })
			return prom
		}

		if (ext === 'js') {
			prom = loadScript(fac_url, abs_url, from_file)
		}
		else if (ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'png') {
			prom = loadImage(fac_url, abs_url, from_file)
		}
		else {
			prom = loadXHR(fac_url, abs_url, from_file, ext)
		}
		defineDreem.download_queue[abs_url] = prom
		return prom
	}

	function loadImage(facurl, url, from_file) {
		return new defineDreem.Promise(function (resolve, reject) {
			var img = new Image()
			img.src = url
			img.onerror = function () {
				var err = "Error loading " + url + " from " + from_file
				reject(err)
			}
			img.onload = function () {
				defineDreem.factory[facurl] = img
				resolve(img)
			}
		})
	}

	function loadXHR(facurl, url, from_file, type) {
		return new defineDreem.Promise(function (resolve, reject) {
			var req = new XMLHttpRequest()
			// todo, make type do other things
			req.responseType = defineDreem.lookupFileType(type)

			req.open("GET", url, true)
			req.onerror = function () {
				var err = "Error loading " + url + " from " + from_file
				console.error(err)
				reject(err)
			}
			req.onreadystatechange = function () {
				if (req.readyState == 4) {
					if (req.status != 200) {
						var err = "Error loading " + url + " from " + from_file
						console.error(err)
						return reject(err)
					}
					var blob = defineDreem.processFileType(type, req.response)
					defineDreem.factory[facurl] = blob

					// do a post process on the file type
					resolve(blob)
				}
			}
			req.send()
		})
	}

	// insert by script tag
	function loadScript(facurl, url, from_file) {

		return new defineDreem.Promise(function (resolve, reject) {
			var base_path = defineDreem.filePath(url);
      
			var factory = lookupInImportLibrary(facurl);
			// console.log(`loadScript(${facurl})`);
      
      
			defineDreem.factory[facurl] = factory

			if (!factory) return reject(new Error("Factory is null for " + url + " from file " + from_file + " : " + facurl))

			var module_deps = factory.deps = []

			defineDreem.last_factory = undefined

			// parse the function for other requires
			Promise.all(defineDreem.findRequiresInFactory(factory).map(function (path) {
				// ignore nodejs style module requires
				if (path.indexOf('$') === -1 && path.charAt(0) !== '.') {
					return null
				}

				var dep_path = defineDreem.joinPath(base_path, defineDreem.expandVariables(path))

				return loadResource(dep_path, url, true, module_deps)
			})).then(function () {
				resolve(factory)
				reject = undefined
			},
				function (err) {
					reject(err)
			});
		});
    /*
		return new defineDreem.Promise(function (resolve, reject) {

			var script = document.createElement('script')
			var base_path = defineDreem.filePath(url)

			defineDreem.script_tags[location.origin + url] = script

			script.type = 'text/javascript'

			//defineDreem.script_tags[url] = script
			window.onerror = function (error, url, line) {
				var script = defineDreem.script_tags[url]
				if (script) script.onerror(error, url, line)
			}
      

			function onLoad() {
				//for(var key in this)console.log(keys)
				//console.log("ONLOAD!", Object.keys(this))
				if (this.rejected) return
				// pull out the last factor
				var factory = defineDreem.last_factory

				defineDreem.factory[facurl] = factory


				if (!factory) return reject("Factory is null for " + url + " from file " + from_file + " : " + facurl)

				var module_deps = factory.deps = []

				defineDreem.last_factory = undefined

				// parse the function for other requires
				Promise.all(defineDreem.findRequiresInFactory(factory).map(function (path) {
					// ignore nodejs style module requires
					if (path.indexOf('$') === -1 && path.charAt(0) !== '.') {
						return null
					}

					var dep_path = defineDreem.joinPath(base_path, defineDreem.expandVariables(path))

					return loadResource(dep_path, url, true, module_deps)
				})).then(function () {
					console.log(factory)
					debugger
					resolve(factory)
					reject = undefined
				},
					function (err) {
						reject(err)
					})
			}

			script.onerror = function (exception, path, line) {
				var error = "Error loading " + url + " from " + from_file
				console.error(error)
				this.rejected = true
				if (reject) reject({ error: error, exception: exception, path: path, line: line })
				else {
					defineDreem.showException({ error: error, exception: exception, path: path, line: line })
				}
			}
			script.onload = onLoad
			script.onreadystatechange = function () {
				console.log(script.readyState)
				if (script.readyState == 'loaded' || script.readyState == 'complete') onLoad()
			}
			defineDreem.in_body_exec = false

			script.src = url

			document.getElementsByTagName('head')[0].appendChild(script)
		})
    */
	}

	if (Array.isArray(files)) {
		return Promise.all(files.map(function (file) {
			return loadResource(file, from_file)
		}))
	}
	else return loadResource(files, from_file)
}

//  require implementation

defineDreem.findRequiresInFactory = function (factory, req) {
	var search = factory.toString()

	if (factory.body) search += '\n' + factory.body.toString()
	if (factory.depstring) search += '\n' + factory.depstring.toString()

	req = req || []
	// bail out if we redefine require
	if (search.match(/function\s+requireDreem/) || search.match(/var\s+requireDreem/)) {
		return req
	}

	search.replace(/\/\*[\s\S]*?\*\//g, '').replace(/([^:]|^)\/\/[^\n]*/g, '$1').replace(/requireDreem\s*\(\s*["']([^"']+)["']\s*\)/g, function (m, path) {

		req.push(path)
	})

	// fetch string baseclasses for nested classes and add them
	var baserx = new RegExp(/defineDreem\.class\s*\(\s*(?:this\s*,\s*['"][$_\w]+['"]\s*,\s*)?(?:['"]([^"']+)['"]\s*,\s*)function/g)

	let result;
	while ((result = baserx.exec(search)) !== null) {
		req.push(result[1])
	}


	return req
}


