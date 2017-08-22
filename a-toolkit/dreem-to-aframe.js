export default defineDreem.class("$server/composition",function(requireDreem, baseclass, $ui$, slider, button, radiobutton, screen, label, view, icon, cadgrid) {
	this.atConstructor = function(previous, parent, precached, id){
		
	  console.log("atConstructor", arguments);
		this.canvas = document.createElement("canvas")
		this.canvas.className = 'unselectable'
		this.canvas.style.display = 'none';
		this.canvas.id = id;
		const aAssets = document.getElementsByTagName("a-assets")[0];
		aAssets.appendChild(this.canvas)

		baseclass.atConstructor.call(this, previous, parent, precached, this.canvas)
	}

	this.render = function() {
		return [
			screen(
				cadgrid({
						name:"grid",
						gridsize:8,
						majorevery:5,
						majorline:vec4(0.34117648005485535,0.34117648005485535,0.34117648005485535,1),
						minorline:vec4(0.2823529541492462,0.2823529541492462,0.2823529541492462,1),
						alignself:'stretch',
						flexdirection:'column',
						alignitems:"stretch",
						justifycontent:'space-around'
					},
					view({flex:1, alignitems:"flex-start", justifycontent:"space-around", margintop:100},
						view({ flex:0, flexdirection:"column" },
							label({
								name:"status",
								marginbottom:20,
								text:"Basic Usage"
							}),
							button({
								text:"Click Button",
								click:function(ev,v,o){
									this.screen.find("status").text = "Button clicked!";
								}})
						),
						view({ flex:0, flexdirection:"column" },
						slider({
							flex:0,
							width:300,
							minhandlethreshold:26,
							height:5,
							value:0.1,
							bgcolor:"darkyellow",
							fgcolor:"white",
							onvalue:function(ev,v,o) {
								var current = this.find("current");
								if (current) {
									current.text = "The current value is: " + v.toFixed(4)
								}
								this.height = 5 + 30 * v
							}
						}),						
							label({
								marginbottom:20,
								text:"Text Alignment"
							}),
							view({margintop:10},
								button({width:150, height:100, padding:10,
									text:"Top Left", alignitems:"flex-start", justifycontent:"flex-start"}),
								button({marginleft:10, width:150, height:100, padding:10,
									text:"Top Center", alignitems:"flex-start", justifycontent:"center"}),
								button({marginleft:10, width:150, height:100, padding:10,
									text:"Top Right", alignitems:"flex-start", justifycontent:"flex-end"})
							),
							view({margintop:10},
								button({width:150, height:100, padding:10,
									text:"Left", justifycontent:"flex-start"}),
								button({marginleft:10, width:150, height:100,
									text:"Center"}),
								button({marginleft:10, width:150, height:100, padding:10,
									text:"Right", justifycontent:"flex-end"})
							),
							view({margintop:10},
								button({width:150, height:100, padding:10,
									text:"Bottom Left", alignitems:"flex-end", justifycontent:"flex-start"}),
								button({marginleft:10, width:150, height:100, padding:10,
									text:"Bottom Center", alignitems:"flex-end", justifycontent:"center"}),
								button({marginleft:10, width:150, height:100, padding:10,
									text:"Bottom Right", alignitems:"flex-end", justifycontent:"flex-end"})
							)
						),
						view({ flex:0, flexdirection:"column" },
							label({text:"Background Images", marginbottom:20}),
							button({
								padding:40,
								text:"Click To Change",
								textcolor:"white",
								textactivecolor:"#666",
								bgimage:"$resources/textures/redcloud.png",
								bgimagemode:"stretch",

								selected:false,

								click:function() { this.selected = !this.selected; },

								statenormal:function() {
									if (this.selected) {
										this.bgimage = "$resources/textures/bluecloud.png";
										this.setTextColor(this.textactivecolor)
									} else {
										this.bgimage = "$resources/textures/redcloud.png";
										this.setTextColor(this.textcolor)
									}
								},
								statehover:function() {
									if (!this.selected) {
										this.bgimage = "$resources/textures/greencloud.png";
										this.setTextColor(this.textactivecolor)
									}
								},
								stateclick:function() {
									this.bgimage = "$resources/textures/purplecloud.png";
									this.setTextColor(this.textcolor)
								},
								onselected:function() { this.statenormal() }
							})
						)
					),
					view({flex:1, alignitems:"center", justifycontent:"space-around", bgolor:"red", margintop:100},
						view({flexdirection:"column"},
							label({text:"Radio Buttons - Group A", marginbottom:20}),
							radiobutton({
								marginbottom:10,
								group:"a",
								icon:"circle-o",
								onselected:function(ev,v,o) { o.icon = v ? "circle" : "circle-o" },
								hovercolor1:"transparent",
								hovercolor2:"transparent",
								buttoncolor1:"transparent",
								buttoncolor2:"transparent",
								selectedcolor1:"transparent",
								selectedcolor2:"transparent",
								borderwidth:0,
								text:"first"
							}),
							radiobutton({
								marginbottom:10,
								group:"a",
								icon:"circle-o",
								onselected:function(ev,v,o) { o.icon = v ? "circle" : "circle-o" },
								hovercolor1:"transparent",
								hovercolor2:"transparent",
								buttoncolor1:"transparent",
								buttoncolor2:"transparent",
								selectedcolor1:"transparent",
								selectedcolor2:"transparent",
								borderwidth:0,
								text:"second"
							}),
							radiobutton({
								selected:true,
								icon:"circle-o",
								group:"a",
								onselected:function(ev,v,o) { o.icon = v ? "circle" : "circle-o" },
								hovercolor1:"transparent",
								hovercolor2:"transparent",
								buttoncolor1:"transparent",
								buttoncolor2:"transparent",
								selectedcolor1:"transparent",
								selectedcolor2:"transparent",
								borderwidth:0,
								text:"third"
							})
						),
						view({flexdirection:"column"},
							label({text:"Radio Buttons - Group B", marginbottom:20}),
							radiobutton({
								group:"b",
								marginbottom:10,
								textselectedcolor:"red",
								text:"first"
							}),
							radiobutton({
								group:"b",
								marginbottom:10,
								selected:true,
								text:"second"
							}),
							radiobutton({
								group:"b",
								text:"third"
							})
						),
						view({flexdirection:"column"},
							label({text:"Radio Buttons - Group C (unselect callback)", marginbottom:20}),
							radiobutton({
								group:"c",
								selected:true,
								marginbottom:10,
								text:"first",
								onselected:function(ev,v,o) {
									o.text = v ? "I am selected" : "I have lost selection!"
								}
							}),
							radiobutton({
								group:"c",
								marginbottom:10,
								text:"second",
								onselected:function(ev,v,o) {
									o.text = v ? "Now I am selected" : "I have lost selection!"
								}
							}),
							radiobutton({
								group:"c",
								text:"third",
								onselected:function(ev,v,o) {
									o.text = v ? "Now I am selected" : "I have also lost selection!"
								}
							})
						)
					)
				)
			)
		]
	}
});
