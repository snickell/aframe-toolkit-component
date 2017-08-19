/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/


/**
 * @class DaliGeometry
 * Layer between DreemGL and Dali. Although Dali has a complete api, this
 * class is used to encapsulate the api to simplify how it is embedded into
 * the dreemgl dali platform.
 *
 * Each instance of DaliGeometry contains a dali.Geometry object, which contains
 * vertex data for displaying a mesh actor.
 */

/**
 * @property daligeometry
 * dali.Geometry object
 */

export default defineDreem.class(function(requireDreem, exports){
	// internal, DaliApi is a static object to access the dali api
	DaliApi = requireDreem('./dali_api')

	var gltypes = requireDreem('$system/base/gltypes')

	// Assign a unique id to each daligeometry object
	var DaliGeometry = exports
	DaliGeometry.GlobalId = 0

	/**
	 * @method constructor
	 * Create a dali.Geometry object, using triangles
	 * You can access the dali.Geometry object as this.daligeometry
	 * @param {number} drawtype Line drawing type (webgl value).
     *                 DALi does NOT use the same values (but they are close)
	 *                 The default is dali.GEOMETRY_TRIANGLES.
	 */
	this.atConstructor = function(drawtype) {
		this.object_type = 'DaliGeometry'

		var dali = DaliApi.dali;

		// Keep track of all vertex_buffers added. This acts as a cache
		// Values = [format_hash, data_hash, vertex_index, vertex_buffer, buffer_id];
		this.vertex_buffers = {};

		this.id = ++DaliGeometry.GlobalId;
		this.daligeometry = new dali.Geometry();

		// Map the webgl values to DALi. Triangle fan and strip are different
		var drawmap = {};
		drawmap[gltypes.gl.POINTS]         = dali.GEOMETRY_POINTS;
		drawmap[gltypes.gl.LINES]          = dali.GEOMETRY_LINES;
		drawmap[gltypes.gl.LINE_LOOP]      = dali.GEOMETRY_LINE_LOOP;
		drawmap[gltypes.gl.LINE_STRIP]     = dali.GEOMETRY_LINE_STRIP;
		drawmap[gltypes.gl.TRIANGLES]      = dali.GEOMETRY_TRIANGLES;
		drawmap[gltypes.gl.TRIANGLE_STRIP] = dali.GEOMETRY_TRIANGLE_STRIP;
		drawmap[gltypes.gl.TRIANGLE_FAN]   = dali.GEOMETRY_TRIANGLE_FAN;

		drawtype = drawtype || gltypes.gl.TRIANGLES;
		var dali_drawtype = drawmap[drawtype];

		// console.log('drawtype', drawtype, dali_drawtype);
		this.daligeometry.setGeometryType(dali_drawtype);

		if (DaliApi.emitcode) {
			console.log('DALICODE: var ' + this.name() + ' = new dali.Geometry();');
			console.log('DALICODE: ' + this.name() + '.setGeometryType(' + this.drawtypeDali(dali_drawtype) + ');');
		}
	}

	// Internal, method to convert a drawtype into the dali value, if possible.
	// This is used when generating dali output to the console.
	this.drawtypeDali = function(drawtype) {
		var dali = DaliApi.dali;

		switch (drawtype) {
		case dali.GEOMETRY_LINES:
			drawtype = 'dali.GEOMETRY_LINES';
			break;
		case dali.GEOMETRY_LINE_LOOP:
			drawtype = 'GEOMETRY_LINE_LOOP';
			break;
		case dali.GEOMETRY_LINE_STRIP:
			drawtype = 'dali.GEOMETRY_LINE_STRIP';
			break;

		case dali.GEOMETRY_TRIANGLES:
			drawtype = 'dali.GEOMETRY_TRIANGLES';
			break;
		case dali.GEOMETRY_TRIANGLE_FAN:
			drawtype = 'dali.GEOMETRY_TRIANGLE_FAN';
			break;
		case dali.GEOMETRY_TRIANGLE_STRIP:
			drawtype = 'dali.GEOMETRY_TRIANGLE_STRIP';
			break;

		default:
			break;
		}

		return drawtype;
	}


	/**
	 * @method addGeometry
	 * Add geometries (vertex buffers) given a dreem shader object
	 * @param {Object} dreem_shader Compiled data structure. (see shaderdali.js)
	 */
	this.addGeometry = function(dreem_shader) {
		//console.trace('addGeometry');
		var dali = DaliApi.dali;

		// Make sure the correct object was passed. dreem_shader holds the
		// dreemgl compiled structures.
		if (!dreem_shader.vtx_state) {
			console.log('WARNING. Incorrect object passed to addGeometry', dreem_shader.object_type);
			return;
		}

		var dreem_attributes = dreem_shader.vtx_state.attributes;

		// If there are no keys, it means an object with no parameters
		var keys = Object.keys(dreem_attributes);
		for (var i in keys) {
			// The shader program uses a '_' at the beginning of the name
			var name = keys[i];
			var storedname = '_' + name;

			// I found that dreemgl keys with nested information (ie. has _DOT_)
			// do not require vertex.
			if (name.indexOf('_DOT_') > 0) {
				//console.log('DaliGeometry.addGeometry Skipping texture', name);
				continue;
			}


			// For each attribute, convert the data into an array
			var obj = dreem_attributes[name];
			var type = DaliApi.getDaliPropertyType(obj.bytes);
			var nslots = DaliApi.getDaliPropertySize(type);

			// dali format is a hash of {name: type}
			var format = {};
			format[storedname] = type;

			var data = [];
			var arr = dreem_shader[name];
			if (arr && arr.array) {
				// Do not take all the (allocated) array. Take only length
				var entries = nslots * arr.length;
				for (var i=0; i<entries; i++) {
					var val = parseFloat(arr.array[i]);
					data.push(val);
				}
			}

			// Add or update a vertex buffer
			//console.log('updating', format, nslots);
			this.updateVertexBuffer(storedname, data, format, nslots);
		}
	}


	/**
	 * @method addAttributeGeometryAlt
	 * Add other attribute geometries to a dali Actor. This version was used
	 * during testing to make sure DALi could handle the packed layout outlined
	 * in the docs.
	 *
	 * This version can be removed if no problems are found.
	 *
	 * @param {Object} shader_dali Compiled data structure
	 * @param {Object} attrlocs Compiled data structure
	 */
	this.addAttributeGeometryAlt = function(shader_dali, attrlocs) {
		var dali = DaliApi.dali;

		if (Object.keys(attrlocs) == 0)
			return;

		// Write each value separately, in order to test the dali API.
		// The original version (see below) writes a composite
		// dali.PropertyBuffer.

		var name;
        var nslots = 0;
		for(var key in attrlocs) {
			var format = {};
			var attrloc = attrlocs[key]
			name = attrloc.name

			var storedname = '_' + key;
			var type = dali.PROPERTY_FLOAT;

			// Skip invalid entries
			if (typeof attrloc.slots === 'undefined')
				continue;

			switch (attrloc.slots) {
			case 1:
				type = dali.PROPERTY_FLOAT;
				break;
			case 2:
				type = dali.PROPERTY_VECTOR2;
				break;
			case 3:
				type = dali.PROPERTY_VECTOR3;
				break;
			case 4:
				type = dali.PROPERTY_VECTOR4;
				break;
			default:
				console.log('addAttributeGeometry. Unknown type', attrloc.slots);
				//TODO This happens, do I ignore it?
				//return;
				break;
			}


			format[storedname] = type;

			if (attrloc.slots == 0)
				continue;

			// Extract the data from the array
			var arr = shader_dali[name];
			//console.trace('**** addAttributeGeometry', name, arr.array.length);

			var data = [];
			if (arr && arr.array) {
				// Find the offset and length of the data to extract
				var record_offset = arr.slots;
				var data_offset = attrloc.offset / 4; // attrloc.offset is bytes

				var offset = 0;
				for (var i=0; i<arr.length; i++) {
					var off = offset + data_offset;
					for (var j=0; j<attrloc.slots; j++) {
						var val = parseFloat(arr.array[off++]);
						data.push(val);
					}

					offset += record_offset;
				}

				if (data.length > 0) {
					this.updateVertexBuffer(key, data, format, attrloc.slots);
				}
			}
		}
	}


	/**
	 * @method addAttributeGeometry
	 * Add other attribute geometries to a dali Actor.
	 * @param {Object} shader_dali Compiled data structure
	 * @param {Object} attrlocs Compiled data structure
	 */
	this.addAttributeGeometry = function(shader_dali, attrlocs) {
		var dali = DaliApi.dali;

		var object_id = 'attribgeom_' + shader_dali.view.name;

		if (Object.keys(attrlocs) == 0)
			return;

		//TODO Support multiple names in the keys, like webgl
		var format = {};
		var name;
        var nslots = 0;

		// DO NOT iterate on key name. You need to iterate in offset order to
		// preserve the order.
		// Sort based on the offset, and then loop in this order. 
		var tosort = [];
		for(var key in attrlocs) {
			tosort.push([attrlocs[key].offset, key]);
		}
		tosort.sort(function(a,b) { return a[0]-b[0]});  // Numeric sort!
		//console.log('SORTED', tosort);
		
		for(var i in tosort) {
			key = tosort[i][1];

			var attrloc = attrlocs[key]
			name = attrloc.name

			var storedname = '_' + key;
			var type = dali.PROPERTY_FLOAT;

			// Skip invalid entries
			if (typeof attrloc.slots === 'undefined')
				continue;

			switch (attrloc.slots) {
			case 1:
				type = dali.PROPERTY_FLOAT;
				break;
			case 2:
				type = dali.PROPERTY_VECTOR2;
				break;
			case 3:
				type = dali.PROPERTY_VECTOR3;
				break;
			case 4:
				type = dali.PROPERTY_VECTOR4;
				break;
			default:
				console.log('addAttributeGeometry. Unknown type', attrloc.slots);
				//TODO This happens, do I ignore it?
				//return;
				break;
			}


			format[storedname] = type;
			nslots += attrloc.slots;
		}

		if (!name || (Object.keys(format).length == 0)) return;
		//console.log('***************addAttributeGeometry******************');
		//console.log(attrlocs);
		//console.log('*****************************************************');

		var arr = shader_dali[name];

		var data = [];

		if (arr && arr.array) {
			// Do not take all the (allocated) array. Take only length elements.
			// There can be gaps in the stored array, so only the first nslots
			// are used.
			var offset = 0;
			for (var i=0; i<arr.length; i++) {
				for (var j=0; j<nslots; j++) {
					var val = parseFloat(arr.array[offset++]);
					data.push(val);
				}
				offset += (arr.slots - nslots);
			}
		}

		// Add or update a vertex buffer
		if (data.length > 0)
			this.updateVertexBuffer(object_id, data, format, nslots);
	}


	/**
	 * @method updateVertexBuffer
	 * Add, or update a vertex buffer.
	 * @param {string} name Cached name
	 * @param {Object} data Object containing data to write
	 * @param {Object} format Hash of format information to write.
	 * @param {Number} nitems Number of items per record
	 */
	this.updateVertexBuffer = function(name, data, format, nitems) {
		var format_hash = DaliApi.getHash(format);
		var data_hash = DaliApi.getHash(data);

		// index, buffer, and bufferindex are either built or come from cache
		var index;
		var buffer;
		var bufferindex;

		// Cache [hash of format, hash of data, dali buffer index, dali.PropertyBuffer, our buffer id, length of data, number of items per data point ]
		var cache = this.vertex_buffers[name];
		if (cache) {
			var oformathash = cache[0];
			var odatahash = cache[1];
            var data_length = cache[5];
			var item_length = cache[6];
			if ((format_hash == oformathash) && (data.length == data_length) && (nitems == item_length)) {
				if (data_hash == odatahash) {
					// No change to the value
					return;
				}

				// Reuse the vertex buffer
				index = cache[2];
				buffer = cache[3];
				bufferindex = cache[4];
			}
			else {
				index = cache[2];
				console.log('addGeometry: vertex buffer already exists: ', name, index, '. Removing');

				//TODO daliwrite
				if (index) {
					this.daligeometry.removeVertexBuffer(index);
				}
				delete this.vertex_buffers[name];
				buffer = null;
			}
		}

		// Generate the buffer
		if (!buffer) {
			var ret = DaliApi.daliBuffer(data, format, data.length / nitems);
			var buffer = ret[0];
			bufferindex = ret[1];
			index = this.daligeometry.addVertexBuffer(buffer);

			if (DaliApi.emitcode) {
				console.log('DALICODE: ' + this.name() + '.addVertexBuffer(buffer' + bufferindex + ')');
			}

			// Store the index so it can be removed later
			this.vertex_buffers[name] = [format_hash, data_hash, index, buffer, bufferindex, data.length, nitems];
		}
		else {
			// Update an existing buffer using setData
			DaliApi.writeDaliBuffer(buffer, bufferindex, data)
			this.vertex_buffers[name] = [format_hash, data_hash, index, buffer, bufferindex, data.length, nitems];
		}


	}


	/**
	 * @method addVertices
	 * Add vertex attributes array to a dali Geometry. Format is very close
	 * to gl.vertexAttribPointer. Assumes float data
	 * @param {Object} array Buffer array
	 * @param {Number} index Index of attribute in the buffer
	 * @param {Number} size Number of components per attribute (1,2,3,4)
	 * @param {Number} stride Offset (bytes) between consecutive attributes
	 * @param {Number} offset Offset (bytes) to first attribute
	 * @param {Number} index Index of attribute in the buffer
	 * @return {Object} Index of vertex buffer
	 */
	this.addVertices = function(name, array, slots, stride, offset) {
		console.log('addVertices IS NOT IMPLEMENTED');
	}


	this.name = function() {
		return 'daligeometry' + this.id;
	}

	this.inspect = function(depth) {
		var obj = {daliGeometry: this.id};
		var util = requireDreem('util')
		return util.inspect(obj, {depth: null});
	}

});
