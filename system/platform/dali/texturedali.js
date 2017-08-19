/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/


export default defineDreem.class('$system/base/texture', function(requireDreem, exports){
	// internal, DaliApi is a static object to access the dali api
	DaliApi = requireDreem('./dali_api')

	var Texture = exports

	Texture.GlobalId = 0

	Texture.Image = function(path) {
		//console.log('setting path to ', path);
		this.path = path;
	}

	// Map hash of texture to an existing texture
	Texture.Cache = {};

	fs = requireDreem('fs');

	this.atConstructor = function(type, w, h, device){
		this.id = ++Texture.GlobalId;
		this.device = device
		this.type = type
		this.size = vec2(w, h)
	}

	this.ratio = 1
	this.frame_buf = null

	Texture.fromStub = function(stub){
		return Texture.buildDaliTexture(stub.array, stub.type, stub.size[0], stub.size[1]);
	}

	Texture.fromType = function(type){
		//console.log('********** fromType', type);
		return new Texture(type,0,0)
	}

	// Load from a local image file. Returns the Texture
	Texture.fromLocalImage = function(path){
		var dali = DaliApi.dali;

		var img = new dali.ResourceImage({url: path});

		var tex = new Texture(Texture.RGBA, img.getWidth(), img.getHeight())
		tex.path = path;
		tex.image = img

		if (DaliApi.emitcode) {
			console.log('DALICODE: var texture' + tex.id + ' = new dali.ResourceImage({url: \'' + path + '\'});');
		}

		return tex
	}


	// Load texture from a local file or remote url.
	// If imagedata is a texture, it is returned immediately.
	// If the image is loaded remotely, the callback function is called when
	// the texture is loaded.
	Texture.fromImage = function(imagedata, callback){
		// Return immediately if a texture was specified
		if (imagedata.image || imagedata.array)
			return imagedata;

		var dali = DaliApi.dali;		

		// With dali, the references should either be absolute, or relative
		// to the path where dali runs.
		var fullpath = imagedata.path;
		if (!fullpath) {
			console.error('Error: Use requireDreem() to load images for DALi platform');
			return new Texture(Texture.RGBA, 0, 0);
		}

		if (imagedata.path[0] !== '/') fullpath = defineDreem.$example + fullpath;

		if (fullpath.indexOf('http') < 0) {
			// Local assets
			return Texture.fromLocalImage(fullpath);
		}

		// Remote assets are loaded into the cache
		var localpath = defineDreem.mapToCacheDir(fullpath);
		try {
			if (fs.statSync(localpath).isFile()) {
				// File is already in the cache
				return Texture.fromLocalImage(localpath);
			}
		}
		catch (e) {
		}

		// Load the image into the cache.
		defineDreem.httpGetCached(fullpath).then(function(result){
			var img = new dali.ResourceImage({url: result.path});
			var tex = new Texture(Texture.RGBA, img.getWidth(), img.getHeight());
			tex.image = img;

			if (callback)
				callback(tex);
		});
	}

	Texture.fromArray = function(array, w, h){
		return Texture.buildDaliTexture(array, Texture.RGBA, w, h);
	}


	// Construct a texture from a ArrayBuffer, with a width/height (DALI)
	Texture.buildDaliTexture = function(array, type, w, h){
		var dali = DaliApi.dali;		

		var tex = new Texture(type, w, h)
		tex.array = array

		// Dali wants a byte array. Use a checksum + size to cache the data
		var uint8 = new Uint8Array(array);

		var sum = 0;
		var offset = 0;
		var nbytes = w * h * ((type == Texture.RGBA) ? 4 : 1);
		for (var i=0; i<nbytes; i++) {
			sum += uint8[offset++];
		}

		// Cache the texture based upon its size and texture data
		var texture_key = w + ':' + h + ':' + sum;
		if (texture_key in Texture.Cache) {
			tex = Texture.Cache[texture_key];
			//console.log('Found cached texture', type, w, h, texture_key);
			return tex;
		}

		//console.log('buildDaliTexture', type, w, h, texture_key);

		// Support 1-byte per pixel and 4-byte per pixel textures.
		var pixel_type = (type == Texture.LUMINANCE) ? dali.PIXEL_FORMAT_L8 : dali.PIXEL_FORMAT_RGBA8888;

		var image_options = {
			width: w,
			height: h,
			pixelFormat : pixel_type
		};
		//console.log('********** fromArray', image_options, uint8.length);

		var img = new dali.BufferImage(uint8, image_options);
		tex.image = img;

		Texture.Cache[texture_key] = tex;

		if (DaliApi.emitcode) {
			// Write font_<INDEX>.bin
			var buffer = new Buffer(uint8);
			fs.writeFile('font_' + tex.id + '.bin', buffer, 'binary', function(err) {
				if (err) {
					console.log('File ERROR', err);
					throw err;
				}
				//console.log('File Saved');
			});

			console.log('DALICODE: var texture' + tex.id + ';');
			console.log('DALICODE: var fs = requireDreem(\'fs\');');
			console.log('DALICODE: var texturedata' + tex.id + ' = fs.readFileSync(\'font_' + tex.id + '.bin\');');

			console.log('DALICODE: var image_options' + tex.id + ' = {width: ' + w + ', height: ' + h + ', pixelFormat : ' + pixel_type + '}');
			console.log('DALICODE: var uint8_' + tex.id + ' = new Uint8Array(texturedata' + tex.id + ');');
			console.log('DALICODE: var texture' + tex.id + ' = new dali.BufferImage(uint8_' + tex.id + ', image_options' + tex.id + ')');
			tex.img = img;
		}		

		return tex
	}


	Texture.createRenderTarget = function(type, width, height, device){
		var tex = new Texture(type, width, height, device)
		tex.initAsRendertarget()
		return tex
	}

	// type flags
	Texture.RGB = 1 <<0
	Texture.RGBA = 1 << 1
	Texture.ALPHA = 1 << 3
	Texture.DEPTH = 1 << 4
	Texture.STENCIL = 1 << 5
	Texture.LUMINANCE = 1<< 6

	Texture.FLOAT = 1<<10
	Texture.HALF_FLOAT = 1<<11
	Texture.FLOAT_LINEAR = 1<<12
	Texture.HALF_FLOAT_LINEAR = 1<<13

	this.typeString = function(){
		var str = ''
		for(var key in Texture){
			var value = Texture[key]
			if(typeof value === 'number' && value & this.type){
				if(str) str += '|'
				str +=  'Texture.'+key
			}
		}
		return str
	}

	this.initAsRendertarget = function(){
		var gl = this.device.gl
		
		if(!this.type) this.type = Texture.RGBA|Texture.DEPTH|Texture.STENCIL
		var type = this.type

		this.glframe_buf = gl.createFramebuffer()
		this.gltex = this.IL_AL_SC_TC = gl.createTexture()

		// our normal render to texture thing
		gl.bindTexture(gl.TEXTURE_2D, this.gltex)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

		this.glbuf_type = gl.RGB
		if(type & Texture.LUMINANCE){
			this.glbuf_type = gl.LUMINANCE
			if(type & TEXTURE.ALPHA) this.glbuf_type = gl.LUMINANCE_ALPHA
		}
		else if(type & Texture.ALPHA) this.glbuf_type = gl.ALPHA
		else if(type & Texture.RGBA) this.glbuf_type = gl.RGBA

		this.gldata_type = gl.UNSIGNED_BYTE
		if(type & Texture.HALF_FLOAT_LINEAR){
			var ext = gl._getExtension('OES_texture_half_float_linear')
			if(!ext) throw new Error('No OES_texture_half_float_linear')
			this.gldata_type = ext.HALF_FLOAT_LINEAR_OES
		}
		else if(type & Texture.FLOAT_LINEAR){
			var ext = gl._getExtension('OES_texture_float_linear')
			if(!ext) throw new Error('No OES_texture_float_linear')
			this.gldata_type = ext.FLOAT_LINEAR_OES
		}
		else if(type & Texture.HALF_FLOAT){
			var ext = gl._getExtension('OES_texture_half_float')
			if(!ext) throw new Error('No OES_texture_half_float')
			this.gldata_type = ext.HALF_FLOAT_OES
		}
		else if(type & Texture.HALF_FLOAT){
			var ext = gl._getExtension('OES_texture_float')
			if(!ext) throw new Error('No OES_texture_float')
			this.gldata_type = gl.FLOAT
		}

		
		// Create a layer object and attach to the texture. This will be
		// activated when dalidevice#bindFramebuffer is called. The layer's
		// parent will be the current layer
		DaliLayer = requireDreem('./dali_layer')
		this.dali_layer = new DaliLayer(DaliApi.currentlayer, this.size[0], this.size[1]);

		console.log('texturedali.initAsRendertarget texture NOT implemented');

		gl.texImage2D(gl.TEXTURE_2D, 0, this.glbuf_type, this.size[0], this.size[1], 0, this.glbuf_type, this.gldata_type, null)
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.glframe_buf)
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.gltex, 0)

		if(type & Texture.DEPTH || type & Texture.STENCIL){
			this.gldepth_buf = gl.createRenderbuffer()
	
			this.gldepth_type = gl.DEPTH_COMPONENT16
			this.glattach_type = gl.DEPTH_ATTACHMENT

			if(type & Texture.DEPTH && type & Texture.STENCIL){
				this.gldepth_type = gl.DEPTH_STENCIL
				this.glattach_type = gl.DEPTH_STENCIL_ATTACHMENT
			}
			else if(type & Texture.STENCIL){
				this.gldepth_type = gl.STENCIL_INDEX
				this.glattach_type = gl.STENCIL_ATTACHMENT
			}
			gl.bindRenderbuffer(gl.RENDERBUFFER, this.gldepth_buf)
			gl.renderbufferStorage(gl.RENDERBUFFER, this.gldepth_type, this.size[0], this.size[1])
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, this.glattach_type, gl.RENDERBUFFER, this.gldepth_buf)

			gl.bindRenderbuffer(gl.RENDERBUFFER, null)
		}
		gl.bindTexture(gl.TEXTURE_2D, null)
		gl.bindFramebuffer(gl.FRAMEBUFFER, null)

	}
	
	this.delete = function(){
		if(!this.device) return
		var gl = this.device.gl
		if(this.glframe_buf){
			gl.deleteFramebuffer(this.glframe_buf)
			this.glframe_buf = undefined
		}
		if(this.gltex){
			gl.deleteTexture(this.gltex)
			this.gltex = undefined
		}
		if(this.depth_buf){
			gl.deleteRenderbuffer(this.gldepth_buf)
		}
	}

	this.resize = function(width, height){
		this.delete
		this.size = vec2(width, height)
		this.initAsRendertarget()
	}

	this.size = vec2(0, 0)
	
	this.createGLTexture = function(gl, texid, texinfo){
		var samplerid = texinfo.samplerid
		//console.log('**** createGLTexture', samplerid)

		if(this.image && this.image[samplerid]){
			this[samplerid] = this.image[samplerid]
		}

		var gltex = this[samplerid]
		if(gltex){
			gl.activeTexture(gl.TEXTURE0 + texid)
			gl.bindTexture(gl.TEXTURE_2D, gltex)
			return gltex
		}

		// Add to material
		//TODO

		var samplerdef = texinfo.samplerdef
		var gltex = gl.createTexture()
		gl.activeTexture(gl.TEXTURE0 + texid)
		gl.bindTexture(gl.TEXTURE_2D, gltex)
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, samplerdef.UNPACK_FLIP_Y_WEBGL || false)
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, samplerdef.UNPACK_PREMULTIPLY_ALPHA_WEBGL || false)

		if(this.array){
			//console.log('texturedali.createGLTexture texture NOT implemented from array', this.size[0], this.size[1]);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.size[0], this.size[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(this.array))
		}
		else if(this.image){
			//console.log('texturedali.createGLTexture texture NOT implemented from image', this.size[0], this.size[1]);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image)
			this.image[samplerid] = gltex
		}
		else{
			return undefined
		}
		
		gltex.updateid = this.updateid
		// set up sampler parameters
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[samplerdef.MIN_FILTER])
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[samplerdef.MAG_FILTER])

		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[samplerdef.WRAP_S])
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[samplerdef.WRAP_T])

		this[samplerid] = gltex
		return gltex
	}

	this.updateGLTexture = function(gl, gltex){
		//console.log('+++++updateGLTexture');
		if(this.array){
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.size[0], this.size[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(this.data)) 
		}
		else if(this.image){
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image)
		}
		gltex.updateid = this.updateid
	}

	// Shders
	this.sample2 = function(x, y){ return sample(vec2(x, y)) }
	this.sample = function(v){
		return texture2D(this, v, {
			MIN_FILTER: 'LINEAR',
			MAG_FILTER: 'LINEAR',
			WRAP_S: 'CLAMP_TO_EDGE',
			WRAP_T: 'CLAMP_TO_EDGE'
		})
	}

	this.samplemip = function(v){
		return texture2D(this, v, {
			MIN_FILTER: 'LINEAR_MIPMAP_NEAREST',
			MAG_FILTER: 'LINEAR',
			WRAP_S: 'CLAMP_TO_EDGE',
			WRAP_T: 'CLAMP_TO_EDGE'
		})
	}

	this.flipped2 = function(x,y){ return flipped(vec2(x,y)) }
	this.flipped = function(v){
		return texture2D(this, vec2(v.x, 1. - v.y), {
			MIN_FILTER: 'LINEAR',
			MAG_FILTER: 'LINEAR',
			WRAP_S: 'CLAMP_TO_EDGE',
			WRAP_T: 'CLAMP_TO_EDGE'
		})
	}

	this.point2 = function(x, y){ return point(vec2(x, y)) }
	this.point = function(v){
		return texture2D(this, vec2(v.x, v.y), {
			MIN_FILTER: 'NEAREST',
			MAG_FILTER: 'NEAREST',
			WRAP_S: 'CLAMP_TO_EDGE',
			WRAP_T: 'CLAMP_TO_EDGE'
		})
	}

	this.point_flipped2 = function(x, y){ return point_flipped(vec2(x, y)) }
	this.point_flipped = function(v){
		return texture2D(this, vec2(v.x, 1. - v.y), {
			MIN_FILTER: 'NEAREST',
			MAG_FILTER: 'NEAREST',
			WRAP_S: 'CLAMP_TO_EDGE',
			WRAP_T: 'CLAMP_TO_EDGE'
		})
	}

	this.array1d = function(index){
		return texture2D(this, vec2(mod(index, this.size.x), floor(index / this.size.x)), {
			MIN_FILTER: 'NEAREST',
			MAG_FILTER: 'NEAREST',
			WRAP_S: 'CLAMP_TO_EDGE',
			WRAP_T: 'CLAMP_TO_EDGE'
		})
	}

	this.array2d = function(v){
		return texture2D(this, vec2(v.x * this.size.x, v.y * this.size.y), {
			MIN_FILTER: 'NEAREST',
			MAG_FILTER: 'NEAREST',
			WRAP_S: 'CLAMP_TO_EDGE',
			WRAP_T: 'CLAMP_TO_EDGE'
		})
	}

})
