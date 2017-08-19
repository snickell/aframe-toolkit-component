/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/

export default defineDreem.class(function(requireDreem, shape3d){
	var GLGeom = requireDreem('$system/geometry/basicgeometry')

	this.attributes = {
		// Size of the teapot
		radius: Config({type:float, value:1}),
		// Level of detail. 1 = cubic teapot, 10+ = very very smooth teapot.
		detail: Config({type:float, value:10})
	}

	this.shape3d = {
		update:function(){
			var view = this.view
			this.mesh = this.vertexstruct.array();
			GLGeom.createTeapot(view.radius, view.detail, function(triidx,v1,v2,v3,n1,n2,n3,t1,t2,t3,faceidx){
				this.mesh.push(v1,n1,t1);
				this.mesh.push(v2,n2,t2);
				this.mesh.push(v3,n3,t3);
			}.bind(this))
		}
	}
})


