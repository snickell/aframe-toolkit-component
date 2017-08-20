/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/

// The server uses flickrlib to retrieve flickr images

export default defineDreem.class.class(function($server$, composition, service, $ui$, screen, view, label, require){

	export default defineDreem.class.class(this, "demo", "$ui/view", function(){
		this.flex = 1
		this.flexdirection = 'column'
		this.overflow = 'scroll'
		this.attributes = {
			imagelist: []
		}
		this.render = function () {
			var dynviews = []
			for (var n = 0; n < this.imagelist.length; n++) {
				dynviews.push(view({
					size: vec2(256, 256),
					bgimage: this.imagelist[n].url
				},
				[
					label({position: 'absolute', fontsize: 12, top: 0, bgcolor: NaN, fgcolor: 'yellow', text: this.imagelist[n].title}),
					label({position: 'absolute', fontsize: 12, top: 14, bgcolor: NaN, fgcolor: 'yellow', text: this.imagelist[n].latitude}),
					label({position: 'absolute', fontsize: 12, top: 28, bgcolor: NaN, fgcolor: 'yellow', text: this.imagelist[n].longitude}),
					label({position: 'absolute', fontsize: 12, top: 42, bgcolor: NaN, fgcolor: 'yellow', text: this.imagelist[n].date})
				]))
			}
			return	dynviews
		}
	})

	this.render = function(){
		return [
			service({
				name:'flickrservice',
				runflickr: function() {
					var FlickrLib = require('../../system/lib/flickrlib')
					this.flickr = new FlickrLib()
					// The flickrlib returns an array of photos
					var callback = (function(images) {
						this.rpc.default.imageupdate(images)
					}).bind(this)
					// The second argument will specify search parameters
					this.flickr.search(callback)
				}

			}),
			screen({
				name:'default',
				clearcolor:'white',
				init: function() {
					this.rpc.flickrservice.runflickr()
				},
				imageupdate: function(images) {
					this.find('demo').imagelist = images
				}
			}, [
				this.demo({name: 'demo'})
			])
		]
	}
})
