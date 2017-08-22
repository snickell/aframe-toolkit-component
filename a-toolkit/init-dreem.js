let DreemToAFrame = null;
let _requireDreem = null;

console.log("Initializing dreem...");

window.defineDreem = {
 	$platform:"webgl",
  paths:{"system":1,"resources":1,"3d":1,"behaviors":1,"server":1,"ui":1,"flow":1,"testing":1,"widgets":1,"sensors":1,"iot":1,"examples":1,"apps":1,"docs":1,"test":1},
	$system:"$root/system",
	$resources:"$root/resources",
	$3d:"$root/3d",
	$behaviors:"$root/behaviors",
	$server:"$root/server",
	$ui:"$root/ui",
	$flow:"$root/flow",
	$testing:"$root/testing",
	$widgets:"$root/widgets",
	$sensors:"$root/sensors",
	$iot:"$root/iot",
	$examples:"$root/examples",
	$apps:"$root/apps",
	$docs:"$root/docs",
  $atoolkit: "$root/a-toolkit",
	$test:"$root/test",
  main:["$system/base/math", "$atoolkit/dreem-to-aframe"],
  atMain:function(requireDreem, modules){
    _requireDreem = requireDreem;
		
		console.log("At main");
		
    setTimeout(function () {
      defineDreem.endLoader()
			requireDreem(modules[0]);
			
			DreemToAFrame = defineDreem.requireDreem("$atoolkit/dreem-to-aframe");     
    }, 0);
    
  },
 atEnd:function(){
   defineDreem.startLoader()
  }
}

export default function getDreemToAFrame() {
	return DreemToAFrame;
};