/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/

defineDreem.class('$ui/screen', function(requireDreem, $ui$,screen, cadgrid, numberbox,view, icon, label){

	this.attributes = {
		string: Config({type:String, flow:"in", value:0}),
		float: Config({type:float, flow:"in", value:0}),
		vec2: Config({type:vec2, flow:"in", value:vec2(0)}),
		text: Config({ type:Object, flow:"in"})
	}

	this.clearcolor = "red";
	this.render = function(){ return[
		cadgrid({bgcolor:"#000030", majorline: "#003040", minorline: "#002030" },
			view({bg:false, flexdirection:"column", flex:1, justifycontent:"center" },
				view({bg:false, flexdirection:"row" , justifycontent:"center" },
					view({bgcolor:vec4(1,1,1,0.2),padding:40,borderradius:50,  flexdirection:"column" ,alignitems:"center", justifycontent:"center" },
						label({text:this.string, bgcolor:'transparent'}),
						numberbox({margin:10, value:this.float, fontsize:50,alignself:"flex-start", alignself:"center",  alignitems:"center", justifycontent:"flex-start"}) ,
						view({bg:false, alignself:"center", margin:10},
							numberbox({value:this.vec2[0], decimals:2, fontsize:50,alignself:"flex-start", alignself:"center",  alignitems:"center", justifycontent:"flex-start"}) ,
							numberbox({value:this.vec2[1], decimals:2, fontsize:50,alignself:"flex-start", alignself:"center",  alignitems:"center", justifycontent:"flex-start"})
						),

						label({margin:10, fgcolor:"white", text: JSON.stringify(this.text), bg:false, alignself:"center", fontsize:30})
					)
				)
			)
		)
	]}
})
