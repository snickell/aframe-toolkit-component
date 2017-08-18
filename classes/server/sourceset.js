/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/

define.class(function(requireDreem, $server$, dataset){
	// internal, Sourceset is a dataset-api on source
	var jsparser = requireDreem('$system/parse/onejsparser')
	var jsformatter = requireDreem('$system/parse/jsformatter')
	var astscanner = requireDreem('$system/parse/astscanner')
	var WiredWalker = requireDreem('$system/parse/wiredwalker')

	this.attributes = {
		change: Config({type:Event})
	}

	function findRenderFunction(ast){
		var steps = ast.steps[0].body.steps
		for(var i = 0; i < steps.length; i++){
			var step = steps[i]
			if(step.type === 'Assign' && step.left.type === 'Key' &&
				step.left.key.name === 'render'){
				return step.right
			}
		}
	}

	function findReturnArray(body){
		var steps = body.steps
		for(var i = 0; i < steps.length; i++){
			var step = steps[i]
			if(step.type === 'Return'){
				return step.arg
			}
		}
	}

	this.atConstructor = function(source){
		if(source) this.parse(source)
		this.last_source = source
	}

	this.fork = function(callback){
		this.undo_stack.push(this.last_source)
		this.redo_stack.length = 0
		callback(this)
		// lets reserialize
		this.last_source = this.stringify()
		this.process()
		this.notifyAssignedAttributes()
		// save to disk.
		this.emit('change')
	}

	this.addBlock = function(folder, classname){

		var id = 0
		var uname = classname + id
		while(uname in this.data.childnames){
			id++
			uname = classname + id
		}

		if (folder) {
			// add it to the deplist.
			var deps = this.ast.steps[0].params
			var $folder = '$'+folder.replace(/\//g,'$')+'$'

			var dir = '$$'
			for(var i = 0; i < deps.length; i ++){
				var name = deps[i].id.name
				if(name === $folder) break
			}
			if(i === deps.length){
				deps.push(
					{type:'Def',id:{type:'Id', name:$folder}},
					{type:'Def',id:{type:'Id', name:classname}}
				)
			}
			else{
				for(var j = i; j < deps.length; j ++){
					if(deps[j].id.name === classname) break
				}
				if(j === deps.length){
					deps.splice(i,0,
						{type:'Def',id:{type:'Id', name:classname}}
					)
				}
			}
		}

		this.data.retarray.elems.push({
			type:"Call",
			fn:{type:"Id",name:classname},
			args:[{
				type:"Object",
				keys:[
					{
						key:{type:"Id",name:"name"},
					 	value:{type:"Value",kind:"string",value:uname}
					},
					{key:{type:"Id",name:"flowdata"}, value:genFlowDataObject({x:20,y:420})}
				]
			}]
		})
	}

	this.removeBlock = function(blockname){
		// lets remove this thing
		node = this.data.childnames[blockname]
		// lets find it
		var id = this.data.retarray.elems.indexOf(node.node)
		this.data.retarray.elems.splice(id, 1)
	}

	function genFlowDataObject(data){
		var obj = {
			type:"Object",
			keys:[]
		}
		for(var key in data){
			obj.keys.push({
				kind:"init",
				key:{type:"Id",name:key},
				value:{type:"Value",kind:"num",value:data[key]}
			})
		}
		return obj
	}

	this.setFlowData = function(block, data){
		var target = this.data.childnames[block]
		var fdn = target.flowdatanode

		if (!fdn) {
			return;
		}

		fdn.value = genFlowDataObject(data)
	}

	this.extractRPCCalls = function(str) {
		var found = []
		var mast = jsparser.parse(str)
		if (mast) {
			var wiredwalker = new WiredWalker()
			var state = wiredwalker.newState()
			wiredwalker.expand(mast, null, state)
			var refs = state.references;
			for (var k = 0;k < refs.length;k++) {
				var con = refs[k].join('.')
				if (found.indexOf(con) < 0) {
					found.push(con)
				}
			}
		}

		if (!found.length) {
			var r = /(this\.rpc\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+)/g
			var m;
			while (m = r.exec(str)) {
				found.push(m[1])
			}
		}

		return found;
	}

	this.generateRPCKV = function(key, block, port) {
		return {
			kind:"init",
			key:{type:"Value", kind:"string", value:key, multi:false, raw:JSON.stringify(key)},
			value:{type:"Key",key:{type:"Property", name:port},
				object:{type:"Key",key:{type:"Property", name:block},
					object:{type:"Key",key:{type:"Property", name:"rpc"},
						object:{type:"This"}
					}
				}
			}
		}
	}

	this.generateWire = function(key, value) {
		return {
			key:{name:key, type:'Id'},
			value:{
				type:"Call",
				fn:{
					type:"Id",
					name:"wire"
				},
				args:[{
					type:"Value",
					kind:"string",
					value:value
				}]
			}
		}
	}

	this.deleteWire = function(sblock, soutput, tblock, tinput){
		if (!tblock) {
			return
		}
		var target = this.data.childnames[tblock]
		if(!target) return console.error("cannot find target " + tblock)
		// ok we need to do keys
		var props = target.propobj.keys
		for(var i = 0; i < props.length; i++){
			var ast = props[i]
			if (ast.key.name == tinput) {

				if (sblock && soutput) {
					var scanner = new astscanner(ast.value, [{type:"Call", fn:{type:"Id", name:"wire"}}, {type:"Value", kind:"string"}])
					var at = scanner.at;
					if (at && at.type && at.type === "Value") {
						var objname = sblock + "." + soutput;
						var rpcstr = "this.rpc." + objname;
						var connections = this.extractRPCCalls(at.value)
						var index = connections.indexOf(rpcstr)
						if (index >= 0) {
							connections.splice(index, 1)
						}
						var isarray = false;
						var isobject = false;
						if (connections.length === 1) {
							var con = connections[0].split('.');
							var blockname = con[con.length - 2];
							var outputname = con[con.length - 1];
							var block = this.data.childnames[blockname]
							if (block) {
								var outputs = block.outputs;
								for (var b=0;b<outputs.length;b++) {
									var output = outputs[b];
									if (output.name === outputname) {
										isarray = output.type === Array
										isobject = output.type === Object
									}
								}
							}
						}
						if (connections.length === 1 && ((at.value[0] === '[' && isarray) || (at.value[0] === '{' && isobject))) {
							at.value = connections[0]
							at.raw = JSON.stringify(at.value)
						} else if (connections.length) {
							if (at.value[0] === '{') {
								var mast = jsparser.parse(at.value)
								var obj = new astscanner(mast, [{type:"Object"}])
								obj.scan([{type:"Value", value:objname}])
								if (typeof(obj.atindex) !== "undefined") {
									obj.atparent.keys.splice(obj.atindex, 1)
								}
								at.value = obj.toSource(obj.atparent)
								at.raw = JSON.stringify(at.value)
							} else {
								var endcap = ']'
								var lix = at.value.lastIndexOf(']')
								if (lix > -1 && lix !== at.value.length - 1) {
									endcap = at.value.substring(lix)
								}
								at.value = "[" + connections.join(",") + endcap
								at.raw = JSON.stringify(at.value)
							}

						} else {
							props.splice(i,1)
						}
					}

				} else {
					props.splice(i,1)
				}

				break
			}
		}
	}

	this.insertWire = function(sblock, soutput, stype, tblock, tinput) {
		var target = this.data.childnames[tblock]
		if (target) {
			var props = target.propobj.keys
			for (var i = 0; i < props.length; i++) {
				if(props[i].key.name == tinput){
					var ast = props[i];
					var scanner = new astscanner(ast.value, [{type:"Call", fn:{type:"Id", name:"wire"}}, {type:"Value", kind:"string"}])
					var at = scanner.at;
					if (at && at.type && at.type === "Value") {
						var value = at.value;
						var rpcstr = "this.rpc." + sblock + "." + soutput;
						if (value) {
							var connections = this.extractRPCCalls(value)
							if (connections.indexOf(rpcstr) < 0) {
								connections.push(rpcstr)
							}
							var endcap = ']'
							var lix = at.value.lastIndexOf(']')
							if (lix > -1 && lix !== at.value.length - 1) {
								endcap = at.value.substring(lix)
							}
							at.value = "[" + connections.join(",") + endcap
							at.raw = JSON.stringify(at.value)
							return true;
						}
					}
					console.log("is this really possible?", ast)
				}
			}
			if (stype === "Array") {
				props.push(this.generateWire(tinput, "this.rpc." + sblock + '.' + soutput))
			} else {
				props.push(this.generateWire(tinput, "[this.rpc." + sblock + '.' + soutput + "]"))
			}
			return true;
		}
		return false;
	}

	this.mergeWire = function(sblock, soutput, stype, tblock, tinput) {
		var target = this.data.childnames[tblock]
		if (target) {
			var props = target.propobj.keys
			for (var i = 0; i < props.length; i++) {
				if(props[i].key.name == tinput){
					var ast = props[i];
					var scanner = new astscanner(ast.value, [{type:"Call", fn:{type:"Id", name:"wire"}}, {type:"Value", kind:"string"}])
					var at = scanner.at;
					if (at && at.type && at.type === "Value") {
						var value = at.value;
						var objname = sblock + "." + soutput;

						if (value) {
							var mast = jsparser.parse(value)
							var obj = new astscanner(mast, [{type:"Object"}])
							obj.scan([{type:"Value", value:objname}])

							if (obj.at && obj.at.type === "Value") {
								obj.atparent.keys.splice(obj.atindex, 1, this.generateRPCKV(objname, sblock, soutput))
							} else if (obj.at && obj.at.type === "Object") {
								if (!obj.at.keys) {
									obj.at.keys = []
								}
								var newkey = this.generateRPCKV(objname, sblock, soutput)
								obj.at.keys.push(newkey)
								at.value = obj.toSource()
								at.raw = JSON.stringify(at.value)
							} else {
								var connections = this.extractRPCCalls(value)
								var newobj = {type:"Object", keys:[]}
								newobj.keys.push(this.generateRPCKV(objname, sblock, soutput))
								for (var z=0;z<connections.length;z++) {
									var con = connections[z]
									var parts = con.split(".")
									var block = parts[parts.length - 2]
									var port = parts[parts.length - 1]
									var conname = block + "." + port
									newobj.keys.push(this.generateRPCKV(conname, block, port))
								}

								at.value = obj.toSource(newobj)
								at.raw = JSON.stringify(at.value)
							}
							return true;
						}
					}
				}
			}
			if (stype === "Object") {
				props.push(this.generateWire(tinput, "this.rpc." + sblock + '.' + soutput))
			} else {
				props.push(this.generateWire(tinput, '{\\"' + sblock + "." + soutput + '\\":this.rpc.' + sblock + '.' + soutput + "}"))
			}
			return true;

		}
		return false;
	}

	this.createWire = function(sblock, soutput, tblock, tinput){
		var target = this.data.childnames[tblock]
		if(!target) return console.error("cannot find target " + tblock)
		// ok we need to do keys
		var props = target.propobj.keys
		for(var i = 0; i < props.length; i++){
			if(props[i].key.name == tinput) break
		}

		var wire = this.generateWire(tinput, 'this.rpc.' + sblock + '.' + soutput)

		if(i === props.length){
			props.push(wire)
		} else{
			props[i].value.value = wire.value
		}
	}

	this.process = function(){
		var resolver = {}

		var deps = this.ast.steps[0].params
		var args = this.classconstr.module.factory.body.class_args

		for(var i = 0; i < deps.length; i++){
			resolver[ deps[i].id.name ] = args[i]
		}

		// we need to find the render function in the composition root
		// so how shall we do that.
		// well..
		// lets write the code

		// lets find the return array
		var ret = findReturnArray(findRenderFunction(this.ast).body)

		var data = this.data = {
			retarray: ret,
			name:'root',
			node:ret.elems,
			children:[],
			childnames:{}
		}

		// now we need to walk this fucker.
		function walkArgs(array, output){
			for(var i = 0; i < array.length; i++){
				var item = array[i]
				if(item.type === 'Object'){
					output.propobj = item
					// lets put some props on there
					// whats the name of this thing?
					var keys = item.keys
					for(var j = 0; j < keys.length; j++){
						var key = keys[j]
						var name = key.key.name
						var value = key.value
						if(name === 'flowdata'){
							var fdoutput = output.flowdata = {}
							output.flowdatanode = key
							var flowdata = value

							for(var k = 0; k < flowdata.keys.length; k++){
								var fditem = flowdata.keys[k]
								var value
								if(fditem.value.type === 'Unary'){
									value = fditem.value.op === '-'? -fditem.value.arg.value: fditem.value.arg.value
								}
								else{
									value = fditem.value.value
								}
								fdoutput[fditem.key.name] = value
							}
						}
						else if(name === 'name'){
							output.name = key.value.value
							data.childnames[output.name] = output
						}
						else if(key.value.type === 'Call' && key.value.fn.name === 'wire'){
							var wire = key.value
							var str = wire.args[0].value

							var containsrpc = str.indexOf('this.rpc')

							if (containsrpc > -1) {
								if(!output.wires) output.wires = []

								var parts = str.slice(9).split('.')
								if (parts.length === 2) {
									output.wires.push({
										from:parts[0],
										output:parts[1],
										input:name
									})
								} else {
									var r = /this\.rpc\.([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)/g
									var m;
									while (m = r.exec(str)) {
										if(!output.wires) output.wires = []
										output.wires.push({
											from:m[1],
											output:m[2],
											input:name,
											multi:true
										})
									}
								}
							}
						}
					}
					continue
				}
			}
		}

		function walkComposition(array, output){
			for(var i = 0; i < array.length; i++){
				var item = array[i]

				if(item.type !== 'Call') continue
				var classname
				if(item.fn.type === 'Key' && item.fn.object.type === 'This'){
					classname = 'this.' + item.fn.key.name
				}
				else if(item.fn.type === 'Id'){
					classname = item.fn.name
				}
				else {
					console.error(classname = "Please implement in sourceset.js")
				}

				var child = {
					classname: classname,
					node: item,
					children:[],
					inputs:[],
					outputs:[],
					editables:[]
				}

				// we haz classname.
				var clazz = resolver[classname]
				var attribs = clazz.prototype._attributes
				for(var key in attribs){
					if (attribs.hasOwnProperty(key)) {
						var attrib = attribs[key]

						if(attrib.flow){
							var con = {
								name: key,
								title: key,
								type: attrib.type,
								attrib: attrib
							};

							if (attrib.flow === 'in'){
								child.inputs.push(con)
							} else if(attrib.flow === 'out'){
								child.outputs.push(con)
							} else if(attrib.flow === 'inout'){
								child.inputs.push(con);
								child.outputs.push({
									name:con.name,
									title:con.title,
									type:con.type,
									attrib:con.attrib
								})
							} else if (attrib.flow === 'edit') {
								child.editables.push(con);
							}
						}
					}
				}

				output.children.push(child)
				walkArgs(item.args, child)
				//walkTree(item.args, child)
			}
		}
		walkComposition(ret.elems, this.data)
	}

	// convert a string in to a meaningful javascript object for this dataset. The default is JSON, but you could use this function to accept any format of choice.
	this.parse = function(classconstr){
		var source = classconstr.module.factory.body.toString()
		this.classconstr = classconstr

		// lets create an AST
		this.ast = jsparser.parse(source)
		this.process()
		this.notifyAssignedAttributes()
	}

	// convert an object in to a string. Defaults to standard JSON, but you could overload this function to provide a more efficient fileformat. Do not forget to convert the JSONParse function as well.
	this.stringify = function(){
		var buf = {
			out:'',
			charCodeAt: function(i){return this.out.charCodeAt(i)},
			char_count:0
		};

		jsformatter.walk(this.ast, buf, {}, function(str){

			if(str === '\n'){
				this.last_is_newline = true;
				return
			}
			if(str === '\t' && this.last_is_newline){
				str = '\n';
				for (var i = 0; i < this.actual_indent;i++) {
					str += '  '
				}
			}
			this.last_is_newline = false;

			buf.char_count += str.length;
			buf.out += str
		});
		return buf.out
	}
})
