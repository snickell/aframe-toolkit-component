/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/

defineDreem.class(function(requireDreem, $server$, service){

	var BufferGen = requireDreem("$widgets/map/mapbuffers")();

	this.generatebuffer = function(targetfile, datastring){
		try{
			var thedata = JSON.parse(datastring);
			var targetobj = {}
			// BufferGen.build(targetobj, thedata);
			// console.log(targetobj.landVertexBuffer.length, targetobj.roadVertexBuffer.length, targetobj.buildingVertexBuffer.length);
		}
		catch(e){
			console.log("exception during bugger generation:", e)
		}
	}

	this.sessionstart = function(){
		console.log("[Map] Session started");
	}

	this.cachemap = defineDreem.classPath(this) + "../../../cache/map/"

	this.grabmap = function(x,y,z){
		var nodehttp = requireDreem('$system/server/nodehttp');
		var fs = requireDreem('fs');
		try{
			fs.mkdirSync(defineDreem.expandVariables(this.cachemap))
		}catch(e){}
		var cachedname = defineDreem.expandVariables(this.cachemap + x +"_"+y+"_" + z+".json");
		
		//var dogeneratebuffer = fs.existsSync(cachedbuffername)?false:true;

		if (fs.existsSync(cachedname)){
			//console.log("[Map] Cache:", x,y,z);
			var data = fs.readFileSync(cachedname).toString();
			
			// if (dogeneratebuffer) this.generatebuffer(cachedbuffername, data);
			//
			// small error check... mapzen returns html/xml pages for all its errors
			// if (data.slice(0, 100).indexOf("<?xml")<0){
				return data;
			//}
			console.log("[Map] Cached slice has an error... loading again");
		}

		console.log("[Map] Downloading from mapzen:",x,y,z,"..." );
		var fileurl = "http://vector.mapzen.com/osm/all/"+z+"/"+x+"/"+y+".topojson?api_key=vector-tiles-Qpvj7U4"
		var P = defineDreem.deferPromise()

		nodehttp.get(fileurl).then(function(data){

			try{
				var thedata = JSON.parse(data);

				fs.writeFileSync(cachedname, data);
				console.log(" -- done. Saved to cache: ",x,y,z,"!", cachedname);
				//if (dogeneratebuffer) this.generatebuffer(cachedbuffername, v);

				P.resolve(data);
			}
			catch(e){

					console.log("Mapzen returned error:" , e);
			}
			P.resolve("{}");

		})

		return P;
	}
})
