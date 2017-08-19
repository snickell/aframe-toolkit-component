/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/

// Copied from compositionserver.js for dali. This assumes that the
// node server is running on the same machine where dali is running.

export default defineDreem.class(function(requireDreem){

	console.log('Loading bootdali', defineDreem.$environment);

	// composition_client references WebSocket
	//WebSocket = requireDreem('$system/base/nodewebsocket')

	//var Render = requireDreem('$system/platform/render')

	var path = requireDreem('path')
	var fs = requireDreem('fs')

	var ExternalApps = requireDreem('$system/server/externalapps')
	var FileWatcher = requireDreem('$system/server/filewatcher')

	var BusServer = requireDreem('$system/rpc/busserver')
	var HTMLParser = requireDreem('$system/parse/htmlparser')
	var ScriptError = requireDreem('$system/parse/scripterror')
	var legacy_support = 0

	var Texture = requireDreem('$system/platform/$platform/texture$platform')

	this.atConstructor = function(
		args, //Object: Process arguments
		compname, //String: name of the composition
		rootserver){ //TeemServer: teem server object

		defineDreem.$platform = 'dali'

		// Called from defineDreem.noderequirewrapper to load a texture
		defineDreem.loadImage = function(name){
			//console.log('loadImage', name);
			return Texture.fromImage({path:name});
		}

		// Dali stage settings (from command-line), or defaults
		this.width = parseInt(args['-width']) || 1920;
		this.height = parseInt(args['-height']) || 1080;
		this.name = args['-name'] || 'dreemgl';

		// Check if a remote composition is used
		if (compname.indexOf('http') >= 0) {
			this.server = compname;
			console.log('remote dreemgl server', compname);
		}

		// Detect location for Dali Node.js add-on. On Tizen
		// it can be required like any npm module, on Ubuntu
		// it's in the /dali-toolkit/node-addon/build/Release/dali
		// relative to Dali's root folder.
		this.onTizen = false;
		this.dalilib = 'dali';
		try {
			this.onTizen = fs.statSync('/etc/tizen-release').isFile();
		} catch (e) {
		}

		// Dali/nodejs interface (nodejs package at top-level of dreemgl repository)
		if (! this.onTizen ) {
			var daliRoot = process.env['DESKTOP_PREFIX'].replace('/dali-env/opt', '');
			this.dalilib = daliRoot + '/dali-toolkit/node-addon/build/Release/dali'
		}

		if ('-dumpprog' in args) {
			var dp = args['-dumpprog'];
			this.dumpprog = (dp.length > 0) ? args['-dumpprog'] : 'stdout';
		}

		this.args = args
		this.compname = compname
		this.rootserver = rootserver

		this.busserver = new BusServer()

		// Initialize dali early. Otherwise, some composition can fail
		// when run from a remote server.
		this.initDali();

		// lets give it a session
		this.session = Math.random() * 1000000

		this.slow_watcher = new FileWatcher()

		this.slow_watcher.atChange = function(){
			// lets reload this app
			this.reload()
		}.bind(this)

		this.components = {}

		this.paths = ""
		for(var key in defineDreem.paths){
			if(this.paths) this.paths += ',\n\t\t'
			this.paths += '$'+key+':"$root/'+key+'"'
		}

		// lets compile and run the dreem composition
		defineDreem.atRequire = function(filename){
			this.slow_watcher.watch(filename)
		}.bind(this)
		//
		this.reload()
	}

	// Called when any of the dependent files change for this composition
	this.atChange = function(){
	}

	// Destroys all objects maintained by the composition
	this.destroy = function(){
		if(this.mycomposition && this.mycomposition.destroy) this.mycomposition.destroy()
		this.mycomposition = undefined
	}

	// initialize dali runtime. This should be run before the composition is
	// loaded.
	this.initDali = function() {
		// Load DALi module
		this.DaliApi = requireDreem('./dali_api');
		this.DaliApi.initialize({width: this.width, height: this.height, name: this.name, dalilib: this.dalilib, dumpprog: this.dumpprog});
	}

	// Load the composition. If composition is defined, load it remotely
	this.loadComposition = function(composition){
		requireDreem.clearCache()

		if (composition) {
			// Remote server
			this.composition = new composition(undefined, undefined, this.server)
		}
		else {
			// Local assets
			var Composition = requireDreem(defineDreem.expandVariables(this.filename))
			this.composition = new Composition(this.busserver, this.session)
		}
	}

	this.reload = function(){
		this.destroy()

		// lets fill
		requireDreem.clearCache()

		// lets see if our composition is a dir or a jsfile
		if (this.server) {
			// Remote server
			var self = this;
			requireDreem.async(self.server).then(function(composition){
				return self.loadComposition(composition);
			}).catch(function(error){
				console.log('Composition load failure', error.stack)
			})
		}
		else {
			// Use local files

			var dir = '$root/'
			var jsname = dir + this.compname+'.js'
			try {
				if(fs.existsSync(defineDreem.expandVariables(jsname))){
					this.filename = jsname
					return this.loadComposition()
				}
				else{
					var jsname = dir + this.compname + '/index.js'
					if(fs.existsSync(defineDreem.expandVariables(jsname))){
						this.filename = jsname
						return this.loadComposition()
					}
				}
			}
			finally{
				//console.log(e.stack)
			}
		}


  		this.screenname = this.compname;

		// Reaching here indicates the path does not exist
		console.log('bootdali.reload: Unable to load', this.compname);
	}

	this.loadHTML = function(title, boot){
	    return '';
	}

	this.loadTemplate = function(title, boot){
	    console.warn('warning: bootdali.loadTemplate not written');
	    return '';
	}

})
