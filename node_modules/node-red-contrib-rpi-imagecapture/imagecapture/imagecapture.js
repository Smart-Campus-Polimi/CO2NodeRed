
module.exports = function(RED) {
    "use strict";
    var fs = require('fs');
    
    function Capture(n) {
        RED.nodes.createNode(this,n);
        this.name = n.name;
        this.configfile = n.configfile;

        var spawn = require('child_process').spawn;
    	var child;
        var node = this;
        
        node.status({fill:"green",shape:"dot",text:'waiting'});

        node.on("input", function(msg) {
        	try{
	        	if (msg) {
	        		if(!msg.hasOwnProperty('payload')) {
	        			msg.payload = {};
	        		}
	            	
	        		fs.stat(node.configfile, function(err, stats) {
	        			  if(err){
	        			    switch(err.code){
	        			      case 'ENOENT':
	        			    	var m = err.path + ' does not exist';
	        			        console.log(m);
	        			        node.status({fill:"red",shape:"dot",text:m});
	        			        node.error(m,msg);
	        			        break;
	        			    }
	        			  } else {
		        			  if (stats.isDirectory()) {
		        				var m = node.configfile + " need to be a file not a directory"
		        			    console.log(m);
	        			        node.status({fill:"red",shape:"dot",text:m});
	        			        node.error(m,msg);
		        			  } else {
		        				node.status({fill:"yellow",shape:"dot",text:'image capturing'});
		                    	var array = [];
		                    	child = spawn('fswebcam', ["-c",node.configfile,"-",""]);
	
		                    	child.stdout.on('data', function (data) {
		                    		array.push(data);                    		
		                    	});
	
		                    	child.stdout.on('end', function () {
		                    		node.status({fill:"green",shape:"dot",text:'waiting'});
		                    		var buffer = Buffer.concat(array);
		                    		msg.payload.capturedImg = buffer;
		                   			node.send(msg);
		                   			child.kill();
		                    	});
	
		        			  }
	        			  }
	        			});
	            	
	        	}
        	}catch(err) {
        		console.log(err.message);
        	}
            	
        });

        node.on("close",function() {
        	if(child!=null)
        		child.kill();
        });

    }
    RED.nodes.registerType("imagecapture",Capture);

}
