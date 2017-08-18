/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/

define.class(function(requireDreem, $ui$, view){
// internal, A simple UI label for displaying text

//	require("$fonts/arial_bold.glf")

	var TypeFace = requireDreem('$system/typeface/typefaceshader')

	this.bgcolor = vec4("transparent")
	this.textpositionfn = function(pos,tag) {return pos;};
	this.polygonoffset = 0.0;

	this.attributes = {
		// the text color
		fgcolor: Config({type:vec4, value: vec4(1,1,1,1), meta:"color" }),

		// The strings to display. Each array item should be in the form of {text:"somestring", pos:vec3(x,y,z), multiline:false}
		labels: [],

		// Size of the font in pixels
		fontsize: Config({type:float, value: 18, meta:"fontsize"}),

		// the boldness of the font (try values 0 - 1)
		boldness: Config({type:float, value: 0.}),

		// reference to the font typeface, require it with requireDreem('font:')
		font: Config({type:Object, value: undefined, meta:"font"}),

		// turn on subpixel aa, this requieres a bgcolor to be present
		subpixel: Config({type:Boolean, value: false}),

		// Alignment of the bodytext.
		align: Config({type: Enum('left','right','center', 'justify'),  value: "left"}),
		bold: false,
		outline: true,
		outlinethickness: 0.0,
		outlinecolor: vec4("black"),

		bgcolor: vec4("white")
	}

	this.measure_with_cursor = false

	this.bold = function(){
		if (this.bold) {
			this.font = requireDreem('$resources/fonts/opensans_bold_256.glf')
		}
		else{
			this.font = requireDreem('$resources/fonts/opensans_regular_256.glf')
		}
	}

	this.textstyle = function(style, tag){
		style.fgcolor = "white";
		style.outlinecolor = "black" ;
		style.outlinethickness = 120.0;
		style.outline = true;
		return style
		//return vec4(tag.yzw, 1.0);
	}

	// the normal font
	define.class(this, 'typefacenormal', TypeFace, function(){
		this.updateorder = 3
		this.draworder = 5
		this.subpixel = false
		
		// set the right shaders
		this.glyphy_mesh = this.glyphy_mesh_sdf
		this.glyphy_pixel = this.glyphy_sdf_draw

		this.update = function(){
			var view = this.view

			var mesh = this.newText()

			if(view.font) mesh.font = view.font

			mesh.fontsize = view.fontsize
			//mesh.boldness = view.boldness
			mesh.add_y = mesh.line_height
			//mesh.outline = view.outline;
			//mesh.outline_thickness = view.outline_thickness;
			mesh.align = view.align
			mesh.start_x = view.padding[0]
			mesh.start_y = mesh.line_height + view.padding[1]
			mesh.clear()

			for (var i = 0;i < view.labels.length;i++){
				mesh.start_x = view.padding[0]
				mesh.start_y = mesh.line_height + view.padding[1]

				var l = view.labels[i];
				var r = 0, g = 0, b = 0;
				if (l.fontsize) mesh.fontsize = l.fontsize;
				//if (l.outline) mesh.outline = l.outline;
				if (l.color){ r = l.color[0], g = l.color[1], b = l.color[2]};
				if (l.multiline){
					mesh.addWithinWidthAtPos(l.text, l.pos, maxwidth? maxwidth: this.layout.width)
				}
				else{
					mesh.addAtPos(l.text,l.pos, r ,g ,b)
				}
				mesh.fontsize = view.fontsize;
				mesh.outline = view.outline;
			}

			if(view.measure_with_cursor){
				mesh.computeBounds(true)
			}

			this.mesh = mesh
		}
	})

	// the subpixel font used to render with subpixel antialiasing
	define.class(this, 'typefacesubpixelaa', this.typefacenormal, function(){
		this.glyphy_mesh = this.glyphy_mesh_sdf
		this.glyphy_pixel = this.glyphy_sdf_draw_subpixel_aa
		this.subpixel = true
		this.boldness = 0.6
	})

	define.class(this, 'typefaceglyphy', this.typefacenormal, function(){
		this.glyphy_pixel = this.glyphy_atlas_draw
		this.glyphy_mesh = this.glyphy_mesh_atlas
	})

	// the font which is set to fontsubpixelaa and fontnormal depending on the value of subpixel
	define.class(this, 'typeface', this.typefacenormal, function(){
	})

	this.typeface = true

	this.selectShader = function(){
		if(this._font && this._font.baked){
			if(this._subpixel){
				this.typeface = this.typefacesubpixelaa
			}
			else{
				this.typeface = this.typefacenormal
			}
		}
		else{
			this.typeface = this.typefaceglyphy
		}
	}

	this.font = function(event){
		this.selectShader()
	}

	this.subpixel = function(event){
		this.selectShader()
	}

	this.measure = function(width){
		if(this.shaders.typeface.update_dirty){
			this.shaders.typeface.update()
			this.shaders.typeface.update_dirty = true
		}
		return {
			width: this.measured_width = this.shaders.typeface.mesh.bound_w,
			height: this.measured_height =this.shaders.typeface.mesh.bound_h
		};
	}

	if (define.$platform === 'dali')
		this.font = requireDreem('$resources/fonts/ubuntu_monospace_ascii_baked.glf')
	else
		this.font = requireDreem('$resources/fonts/opensans_regular_ascii.glf')

	var labelset = this.constructor
	// A label.
	this.constructor.examples = {
		Usage: function(){
			return [labelset({labels:[{text:"I am a textlabel!", pos:vec3(0), multiline:false}],fgcolor:"purple", fontsize: 30 })]
		}
	}
})
