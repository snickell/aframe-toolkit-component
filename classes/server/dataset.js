/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/

defineDreem.class('$system/base/node', function(requireDreem, $ui$, label){
	// The dataset class allows you to share a single "document" between various parts of your application.
	// The dataset provides undo/redo functionality by serializing its contents to a JSON string.
	// To modify a dataset you need to use the "fork" method. The fork method saves the current instance to the undo stack, calls back to your code and then notifies all objects that have this dataset instance bound to them to update themselves.

	this._atConstructor = function(data){
		this.undo_stack = []
		this.redo_stack = []
		this.connected_objects = []
		this.data = data
	}

	// internal, Handles the binding of this dataset to the attribute of something else.
	this.atAttributeAssign = function(obj, key){
		for(var i = 0; i < this.connected_objects.length; i++){
			var co = this.connected_objects[i];
			if (co.obj === obj) return;
		}
		this.connected_objects.push({obj:obj, key:key})
	}

	// Fork starts a new modification on a dataset;
	this.fork = function(callback){	// the function that will be called with a modifyable javascript object. DO NOT under any circumstances directly modify this data property!
		this.undo_stack.push(this.stringify(this.data))
		this.redo_stack.length = 0
		callback(this.data)
		this.notifyAssignedAttributes()
	}

	// internal, Silent operates much the same as `fork`, but does not notify listeners bound to this dataset. This can be used in case you are CERTAIN that this object is the only object in your application that listens to your changed property, but you still need to save the state to the undo stack
	// 'callback' the function that will be called with a modifyable javascript object. DO NOT under any circumstances directly modify this data property!
	this.silent = function(callback /*function*/){
		this.undo_stack.push(this.stringify(this.data))
		this.redo_stack.length = 0
		callback(this.data)
		if (this.atChange) this.atChange()
	}

	// internal, Cause objects that have us assigned to reload
	this.notifyAssignedAttributes = function(){
		for(var i = 0; i < this.connected_objects.length; i++){
			var o = this.connected_objects[i]
			o.obj[o.key] = this
		}
		if (this.atChange) this.atChange()
	}

	// Convert all javascript binary arrays in to their correct objects.
	// <node> the node to clean up.


	// convert a string in to a meaningful javascript object for this dataset. The default is JSON, but you could use this function to accept any format of choice.
	this.parse = function(stringdata){
		var data = JSON.parse(stringdata)
		data = define.structFromJSON(data);
		return data;
	}

	// convert an object in to a string. Defaults to standard JSON, but you could overload this function to provide a more efficient fileformat. Do not forget to convert the JSONParse function as well.
	this.stringify = function(data /*Object*/) /*String*/ {
		return JSON.stringify(data);
	}

	// Go back to the previous state. All classes that have this dataset bound will get their assignment updated
	this.undo = function(){
		if(!this.undo_stack.length) return
		this.redo_stack.push(this.stringify(this.data))
		this.data = this.parse(this.undo_stack.pop());
		this.notifyAssignedAttributes();
	}

	// Go forward to the next state. All classes that have this dataset bound will get their assignment updated
	this.redo = function(){
		if(!this.redo_stack.length) return
		this.undo_stack.push(this.stringify(this.data))
		this.data = this.parse(this.redo_stack.pop())
		this.notifyAssignedAttributes()
	}

	// Basic dataset modification example:
	var dataset = this.constructor
	this.constructor.examples = {
		Usage:function(){
			var results = [];

			var dset = dataset({something:1});

			results.push(label({fgcolor:'green', text:'Value before fork is: ' + dset.data.something}));

			dset.fork(function(data){ data.something = "some new value"; });

			results.push(label({fgcolor:'red', text:'Current value is: ' + dset.data.something}));

			return results;
		}
	}

})
