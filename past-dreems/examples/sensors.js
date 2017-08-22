/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
 Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and limitations under the License.*/

export default defineDreem.class('$server/composition', function($ui$, screen, cadgrid, view, icon, label, $sensors$, gyroscope, accelerometer, light, proximity){

	this.render = function() {
		return [
			screen({name:'default', clearcolor:vec4('black')},
				proximity({
					name:"prox",
					onmin:function(ev,v,o) {
						o.find("min").text = v;
					},
					onmax:function(ev,v,o) {
						o.find("max").text = v;
					},
					ondistance:function(ev,v,o) {
						o.find("distance").text = v;
					},
					onsupported:function(ev,v,o) {
						o.find("proxsearching").visible = false;
						o.find("proxout").visible = true;
					}
				}),
				light({
					name:"lights",
					onluminosity:function(ev,v,o) {
						o.find("lux").text = v;
					},
					onsupported:function(ev,v,o) {
						o.find("lightsearching").visible = false;
						o.find("lightout").visible = true;
					}
				}),
				gyroscope({
					name:"gyro",
					onorientation:function(ev,v,o) {
						o.find("alpha").text = v[0];
						o.find("beta").text  = v[1];
						o.find("gamma").text = v[2];
					},
					oncompass:function(ev,v,o) {
						o.find("compass").text = v;
					},
					onaccuracy:function(ev,v,o) {
						o.find("accuracy").text = v;
					},
					onsupported:function(ev,v,o) {
						o.find("gyrosearching").visible = false;
						o.find("gyrout").visible = true;
					}
				}),
				accelerometer({
					name:"accel",
					onacceleration:function(ev,v,o) {
						o.find("x").text = v[0];
						o.find("y").text = v[1];
						o.find("z").text = v[2];
					},
					onsupported:function(ev,v,o) {
						o.find("accelsearching").visible = false;
						o.find("accelout").visible = true;
					}
				}),
				cadgrid({
						flex:1,
						flexdirection:"column",
						justifycontent:"flex-start",
						alignitems:"flex-start"
					},
					label({marginbottom:10, text:"Open this example on a device with motion,\norientation or ambient light sensors to see\nreadings below:", fgcolor:"#333", fontsize:14}),
					label({name:"gyrosearching", visible:true, text:"Searching for gyroscope ...", fgcolor:"#888", fontsize:10, margintop:10}),
					view({  name:"gyrout",
						    visible:false,
							flexdirection:"column",
							justifycontent:"space-around",
							alignitems:"center",
						    margintop:10
						},
						label({marginbottom:10, text:"Move your device to see\ngyroscope values change:", fgcolor:"#666", fontsize:12, margintop:10}),
						view({padding:5}, label({marginright:10, fgcolor:"red", text:"compass", fontsize:12}),  label({fgcolor:"blue", name:"compass", text:"0", fontsize:12}) ),
						view({padding:5}, label({marginright:10, fgcolor:"red", text:"accuracy", fontsize:12}), label({fgcolor:"blue", name:"accuracy", text:"0", fontsize:12}) ),
						view({padding:5}, label({marginright:10, fgcolor:"red", text:"alpha", fontsize:12}),    label({fgcolor:"blue", name:"alpha", text:"0", fontsize:12}) ),
						view({padding:5}, label({marginright:10, fgcolor:"red", text:"beta", fontsize:12}),     label({fgcolor:"blue", name:"beta", text:"0", fontsize:12}) ),
						view({padding:5}, label({marginright:10, fgcolor:"red", text:"gamma", fontsize:12}),    label({fgcolor:"blue", name:"gamma", text:"0", fontsize:12}) )
					),
					label({name:"accelsearching", visible:true, text:"Searching for accelerometer ...", fgcolor:"#888", fontsize:10, margintop:10}),
					view({  name:"accelout",
							visible:false,
							flexdirection:"column",
							justifycontent:"space-around",
							alignitems:"center",
						    margintop:10
						},
						label({marginbottom:10, text:"Move your device to see\naccelerometer values change:", fgcolor:"#666", fontsize:12, margintop:10}),
						view({padding:2}, label({marginright:10, fgcolor:"red", text:"x", fontsize:12}),     label({fgcolor:"blue", name:"x", text:"0", fontsize:12}) ),
						view({padding:2}, label({marginright:10, fgcolor:"red", text:"y", fontsize:12}),     label({fgcolor:"blue", name:"y", text:"0", fontsize:12}) ),
						view({padding:2}, label({marginright:10, fgcolor:"red", text:"z", fontsize:12}),     label({fgcolor:"blue", name:"z", text:"0", fontsize:12}) )
					),
					label({name:"lightsearching", visible:true, text:"Searching for ambient light sensor ...", fgcolor:"#888", fontsize:10, margintop:10}),
					view({  name:"lightout",
							visible:false,
							flexdirection:"column",
							justifycontent:"space-around",
							alignitems:"center"
						},
						label({marginbottom:10, text:"Move your device into\ndifferent light conditions to see\nluminosity values change:", fgcolor:"#666", fontsize:12, margintop:10}),
						view({padding:5}, label({marginright:10, fgcolor:"red", text:"luminosity"}),     label({fgcolor:"blue", name:"lux", text:"0", fontsize:12}) )
					)
					//,
					//label({name:"proxsearching", visible:true, text:"Searching objects in proximity ...", fgcolor:"#888", fontsize:20}),
					//view({  name:"proxout",
					//		visible:false,
					//		flexdirection:"column",
					//		justifycontent:"space-around",
					//		alignitems:"center",
					//		margintop:10
					//	},
					//	label({marginbottom:10, text:"Move your device object to change proximity:", fgcolor:"#666", fontsize:12}),
					//	view({padding:2}, label({marginright:10, fgcolor:"red", text:"min", fontsize:12}),      label({fgcolor:"blue", name:"min", text:"0", fontsize:12}) ),
					//	view({padding:2}, label({marginright:10, fgcolor:"red", text:"max", fontsize:12}),      label({fgcolor:"blue", name:"max", text:"0", fontsize:12}) ),
					//	view({padding:2}, label({marginright:10, fgcolor:"red", text:"distance", fontsize:12}), label({fgcolor:"blue", name:"distance", text:"0", fontsize:12}) )
					//)
				)
			)
		]
	}
});
