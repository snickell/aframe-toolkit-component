/* DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except in compliance with the License.
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and limitations under the License.*/
// BusServer class, a package of websockets you can broadcast on (server side)

defineDreem.class(function(requireDreem, exports){

	this.atConstructor = function(){
		this.sockets = []
		this.binrpc_waiting = []
	}
	
	this.use_xhr_fallback_for_binary = true

	this.binRpcIncoming = function(binrpc){

	}

	// adds a WebSocket to the BusServer
	this.addWebSocket = function(sock, req, binrpc_outgoing, binrpc_incoming){
		this.sockets.push(sock)
		var origin = req.headers.origin
		var referer = req.headers.origin+req.url
		var remoteAddress = req.connection.remoteAddress
		
		sock.onclose = function(){
			this.sockets.splice(this.sockets.indexOf(sock), 1)
			sock.onclose = undefined			
			this.atClose(sock);
		}.bind(this)

		if(this.use_xhr_fallback_for_binary){
			var binary_xhr = []

			sock.onmessage = function(event){
				var message = event.data
				if(message.charAt(0) === '$'){
					binary_xhr.push(message.slice(1))
					return
				}
				for(var i = 0; i < binary_xhr.length; i++){
					var id = binary_xhr[i]
					binary_xhr[i] = binrpc_incoming[id]
					binrpc_incoming[id] = undefined
				}
				var jsonmsg = JSON.parse(message)
				jsonmsg = defineDreem.structFromJSON(jsonmsg, binary_xhr)
				binary_xhr.length = 0
				jsonmsg.origin = origin
				this.atMessage(jsonmsg, sock)
			}.bind(this)

			function rndhex4(){ return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1) }

			sock.sendJSON = function(msg){
				var binary = []
				var newmsg = defineDreem.makeJSONSafe(msg, binary)
				for(var i = 0; i < binary.length; i++){
					var data = binary[i].data

					var rpcrandom = rndhex4()+rndhex4()+rndhex4()+rndhex4()+rndhex4()+rndhex4()+rndhex4()+rndhex4()
					binrpc_outgoing[rpcrandom] = {
						data:data,
						remoteAddress:remoteAddress
					}

					sock.send("$"+rpcrandom)
				}
				var jsonmsg = JSON.stringify(newmsg)
				sock.send(jsonmsg)
			}
		}	
		else{
			sock.makeJSONSocket()
			sock.atJSONMessage = function(jsonmsg){
				jsonmsg.origin = origin
				this.atMessage(jsonmsg, sock)
			}.bind(this)
		}

		this.atConnect(sock)
	}

	// called when a new message arrives
	this.atMessage = function(message, socket){
	} 
	
	// called when a client disconnects
	this.atClose = function(socket){
	}

	// Called when a new socket appears on the bus
	this.atConnect = function(message, socket){
	}

    // Send a message to all connected sockets
	this.broadcast = function(message, ignore){
		for(var i = 0;i<this.sockets.length;i++){
			var socket = this.sockets[i]
			if(socket !== ignore) socket.sendJSON(message)
		}
	}

	// close all sockets
	this.closeAll = function(){
		for(var i = 0; i < this.sockets.length; i++){
			this.sockets[i].close()
		}
		this.sockets = []
	}
})	