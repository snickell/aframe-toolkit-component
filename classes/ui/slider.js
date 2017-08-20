/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/
// Sprite class

export default defineDreem.class("$ui/view", function($ui$, view, icon) {
// Slider with customizable handle.  To customize the handle put views as the slider's constructor children.
// <br/><a href="/examples/sliders">examples &raquo;</a>

	this.attributes = {

		// The color for the value bar in the slider
		fgcolor:Config({type:vec4, value:"black", meta:"color"}),

		// The current value, between 0.0 ~ 1.0
		value:Config({value:0.5, persist:true}),

		// The size of each step between 0 ~ 1, e.g. 0.01 would create 100 discrete steps.  The value of 0 indicates a continuum.
		step:Config({value:0}),

		// Minimum value allowed, for restricting slider range
		minvalue:Config({value:0.0}),

		// Maximum value allowed, for restricting slider range
		maxvalue:Config({value:1.0}),

		// The interpolated range of the slider between min and max value
		range:Config({value:vec2(0, 100)}),

		// The current interpolated value, between range[0] and range[1]
		rangevalue:Config({value:50, persist:true}),

		// Horizontal or vertical arrangement
		horizontal:true,

		// Threshold at which to draw a handle if none is provided in the constructor.
		minhandlethreshold:10.0,

		// Smoothly mix the background/foreground color or draw a hard edge
		smooth:true
	};

	this.height = 5;
	this.alignitems = "center";
	this.justifycontent = "center";

	this.bgcolorfn = function(pos) {
		var axis = pos.x;
		if (!horizontal) {
			axis = pos.y;
		}
		var inrange = (axis > minvalue && axis < value && axis < maxvalue);
		if (inrange) {
			return smooth ? mix(bgcolor, fgcolor, value * axis) : fgcolor;
		}

		return bgcolor;
	};

	this.keydown = function(ev, v, o) {
		var value;
		if (ev.name === "rightarrow") {
			if (this._step) {
				value = this._value + this._step
			} else {
				if (this._horizontal) {
					value = this._value + 1.0 / this._layout.width;
				} else {
					value = this._value + 1.0 / this._layout.height;
				}
			}
		} else if (ev.name === "leftarrow") {
			if (this._step) {
				value = this._value - this._step
			} else {
				if (this._horizontal) {
					value = this._value - 1.0 / this._layout.width;
				} else {
					value = this._value - 1.0 / this._layout.height;
				}
			}
		}

		if (typeof(value) !== "undefined") {
			value = Math.max(this._minvalue, Math.min(this._maxvalue, value));

			value = this.stepValue(value)

			this.setHandle(value)

			if (this._value !== value) {
				this.value = value
			}
		}

	}

	this.stepValue = function(value) {
		if (this._step) {
			var size = Math.round(value / this._step)
			value = size * this._step
		}
		return value;
	}

	this.pointerstart = this.pointermove = function(ev) {
		this.focus = true;
		var pos = this.globalToLocal(ev.position);
		var value;
		if (this._horizontal) {
			value = pos.x / this._layout.width;
		} else {
			value = pos.y / this._layout.height;
		}

		value = Math.max(this._minvalue, Math.min(this._maxvalue, value));

		this.setHandle(value)

		value = this.stepValue(value)

		this.value = value
	};

	this.setHandle = function(value) {
		if (this.handlechildren) {
			for (var i=0;i<this.handlechildren.length;i++) {
				var child = this.handlechildren[i];
				if (this.horizontal) {
					child.x = this._layout.width * value - child.width * 0.5;
					child.y = this._layout.height * 0.5 - child.height * 0.5;
				} else {
					child.y = this._layout.height * value - child.height * 0.5;
					child.x = this._layout.width * 0.5 - child.width * 0.5;
				}
			}
		}
	}

	this.pointerend = function(ev) {
		var pos = this.globalToLocal(ev.position);
		var value;
		if (this._horizontal) {
			value = pos.x / this._layout.width;
		} else {
			value = pos.y / this._layout.height;
		}

		value = Math.max(this._minvalue, Math.min(this._maxvalue, value));

		value = this.stepValue(value)

		this.setHandle(value)

		this.value = value
	};

	this.onrange = function(ev,range,o) {
		if (range) {
			var distance = range[1] - range[0];
			var rangevalue = (distance * this._value) + range[0]
			if (this._rangevalue != rangevalue) {
				this.rangevalue = rangevalue
			}
		}
	}

	this.onvalue = function(ev,v,o) {
		var value = Math.max(this._minvalue, Math.min(this._maxvalue, v));

		var range = this._range;
		var distance = range[1] - range[0];
		var rangevalue = (distance * value) + range[0]
		if (this._rangevalue != rangevalue) {
			this.rangevalue = rangevalue
		}

		if (value != this.value) {
			this.value = value;
		} else {
			this.onsize(null,this.size,this);
			this.setHandle(value)
		}
	};

	this.onrangevalue = function(ev,v,o) {
		var range = this._range;
		var distance = range[1] - range[0];
		value = (v - range[0]) / distance;
		if (this._value !== value) {
			this.value = value
		}

	}

	this.render = function() {
		var views = [];

		this.handlechildren = this.constructor_children;

		if (!this.handlechildren.length
			&& ((this._horizontal && this.height <= this.minhandlethreshold)
			|| (!this._horizontal && this.width <= this._minhandlethreshold))) {
			this.handlechildren = [this.handle()]
		}

		for (var i=0;i<this.handlechildren.length;i++) {
			var child = this.handlechildren[i];
			child.position = "absolute";
			if (this.horizontal) {
				child.x = this.width * this._value - child.width * 0.5;
				child.y = this.height * 0.5 - child.height * 0.5;
			} else {
				child.y = this.height * this._value - child.height * 0.5;
				child.x = this.width * 0.5 - child.width * 0.5;
			}
			views.push(child);
		}
		return views;
	};

	defineDreem.class(this, "handle", view, function() {
		this.bgcolor = vec4(1,1,1,0.51);
		this.height = this.width = 26;
		this.borderradius = (this.height * 0.5) - 0.5;
	});

	var slider = this.constructor;
	this.constructor.examples = {

		Usage: function() {
			return [
				slider({x:30, y:30,width:150, bgcolor:"white", fgcolor:"red", value:0.9})
			]
		},

		CustomHandle: function() {
			return [
				slider({x:10, y:30,width:250, bgcolor:"white",smooth:false}, view({borderradius:2, width:30, height:20, bgimagemode:"stretch", bgimage:"$resources/textures/purplecloud.png"}))
			]
		}

	}


});
