let DreemToAFrame = null;
let _requireDreem = null;

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}


console.log("defining defineDreem");
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
		
    setTimeout(function () {
      defineDreem.endLoader()
      const Mathy = requireDreem(modules[0]);
      console.log("Starting to dreem");
			
			DreemToAFrame = defineDreem.requireDreem("$atoolkit/dreem-to-aframe");
			
	    const serverattrs = undefined;
	    const renderTarget = undefined;
			const canvasID = `dreem-to-aframe-${getRandomInt(0, 9000000000)}`;
			
			//window.dreemToAFrame = new DreemToAFrame(defineDreem.rootComposition, undefined, serverattrs, renderTarget, canvasID);
			
			
      // window.aButton = new DreemToAFrame(defineDreem.rootComposition, undefined, serverattrs, renderTarget)

      //console.log("window.aButton = ", aButton)          
    }, 0);
    
  },
 atEnd:function(){
   defineDreem.startLoader()
  }
}

export default function getDreemToAFrame() {
	return DreemToAFrame;
};