/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/

//Pure JS based composition
define.class(function(requireDreem, $server$, composition, $ui$, button,screen, view, $widgets$, tracker){
	this.render = function(){ return [
		screen({name:'default', clearcolor:vec4('black')},[
		
		view({flexdirection:"row", bgcolor:"#9f9373", margin:1, padding:4},[
			button({buttoncolor1:"9f9373",fontsize:20,icon:"play", margin:2,textcolor:"lime",  padding:vec4(4,0,4,3)}),
			button({buttoncolor1:"9f9373",fontsize:20,icon:"pause", margin:2, textcolor:"#ffdf20", padding:vec4(4,0,4,3)}),
			button({buttoncolor1:"9f9373",fontsize:20,icon:"stop", margin:2,textcolor:"red",  padding:vec4(4,0,4,3)})
		])
		,
			tracker({
				flex:1, 
				overflow:'scroll',
			})
		])
	]}
})
