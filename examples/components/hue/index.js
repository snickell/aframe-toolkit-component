/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
 Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and limitations under the License.*/

export default defineDreem.class("$server/composition", function (requireDreem, $ui$, icon, slider, button, checkbox, label, screen, view, cadgrid, $widgets$, colorpicker, $$, basestation, bulb) {

		this.render = function () {

			return [
				basestation(
					{username:"6ba5c7d32222e31f779722a818296a09"}
				),
				screen({
					name:"desktop",
					clearcolor: '#888'
				},
					cadgrid({
						name:"main",
						bgcolor: vec4(0.07999999821186066, 0.10000000149011612, 0.10000000149011612, 1),
						toolselect: false,
						toolmove: false,
						gridsize: 5,
						majorevery: 10,
						majorline: vec4(0, 0.20000000298023224, 0.30000001192092896, 1),
						minorline: vec4(0, 0.19792191684246063, 0.17214606702327728, 1),
						flexdirection: "row",
						justifycontent: "space-around",
						alignitems: "center",
						render:function() {
							var lights = [];

							var baselights = this.rpc.basestation.lights;

							console.log("Base has lights:", baselights)

							for (var uid in baselights) {
								if (baselights.hasOwnProperty(uid)) {
									var light = baselights[uid];

									var huebulb = bulb(light);
									huebulb.click = function(ev,v,o){
										o.on = !o.on;
										this.rpc
											.basestation
											.setLightState(o.id, {on: o.on });
									}.bind(this);

									lights.push(
										view({
												flex:0,
												padding:10,
												flexdirection:"column",
											    aligncontent: "stretch",
												justifycontent: "center",
												bgcolor:vec4(0.4)
											},
											huebulb,
											slider({
												flex:1,
												height:10,
												margin:40,
												width:250,
												value:light.bri / 255.0,
												bgcolor:"black",
												fgcolor:"white",
												smooth:false,
												bulb:huebulb,
												onvalue:function(ev,v,o) {
													if (!this.__lock) {
														this.__lock = true;

														o.bulb.bri = v * 255;
														o.bulb.reset();

														this.rpc
															.basestation
															.setLightState(o.bulb.id, {transitiontime:0, bri: o.bulb.bri})
															.then(function(){
																this.__lock = false;
															}.bind(this), function(){
																this.__lock = false;
															}.bind(this))
														;
													}
												}.bind(this)
											}),
											colorpicker({
												flex:1,
												alignself:"center",
												colorwheel:true,
												colorsliders:false,
												colorbox:false,
												value:huebulb.textcolor,
												bulb:huebulb,
												valuechange:function(ev, v, o) {

													var red = o._value[0];
													var green = o._value[1];
													var blue = o._value[2];

													// This magic is how to get the right color on a hue bulb
													// http://www.developers.meethue.com/documentation/color-conversions-rgb-xy

													red = (red > 0.04045) ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : (red / 12.92);
													green = (green > 0.04045) ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : (green / 12.92);
													blue = (blue > 0.04045) ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : (blue / 12.92);

													var xx = red * 0.664511 + green * 0.154324 + blue * 0.162028;
													var yy = red * 0.283881 + green * 0.668433 + blue * 0.047685;
													var zz = red * 0.000088 + green * 0.072310 + blue * 0.986039;

													var x = xx / (xx + yy + zz);
													var y = yy / (xx + yy + zz);

													if (!this.__lock) {
														this.__lock = true;

														o.bulb.rgb = [red * 255, green * 255, blue * 255];
														o.bulb.reset();

														this.rpc
															.basestation
															.setLightState(o.bulb.id, { transitiontime:0, xy:[x,y] })
															.then(function(){
																this.__lock = false;
															}.bind(this), function(){
																this.__lock = false;
															}.bind(this))
													}
												}.bind(this)
											})
										)
									)
								}
							}

							lights.push(view({
								visible:this.rpc.basestation.linkalert,
								position:"absolute",
								x:200,
								y:100,
								width:300,
								height:300,
								borderradius:30,
								bgcolor:"white",
								flexdirection:"column",
								justifycontent:"center",
								alignitems:"center"
							},
								view({alignitems:"center"},icon({fontsize:40, marginright:20, fgcolor:"cornflowerblue", icon:"link"}),label({fontsize:30, fgcolor:"#888", text:"Missing Link!"})),
								label({
									padding:20,
									marginleft:20,
									fgcolor:"#888",
						    		text:"Press the Link button on top\nof your base station and then\n quickly press this button:"
								}),
								button({
									text:"Link To Basestation",
									click:function() {
										this.rpc.basestation.linkalert = false;
										this.rerender();
									}.bind(this)
								}))
							);

							return lights;
						}
					}))
			]
		}
	}
)
