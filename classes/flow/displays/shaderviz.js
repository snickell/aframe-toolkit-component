/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/

defineDreem.class('$ui/screen', function(requireDreem, $ui$, view){

    this.attributes = {
        shaderpos: Config({
            type:vec2,
            flow:"in"
        })
    }

    this.style = {
        view_myview:{
            flex:1,
            attributes:{
                mypos:vec2(0,0),
            },
            bgcolorfn: function(pos){
                return pal.pal1(sin(pos.y * mypos.y*0.1))
            }
        }
    }

    this.render = function(){
        return view({
            mypos: wire('this.parent.shaderpos'),
            name:'myview',
            class:'myclass'
        })
    }

});
