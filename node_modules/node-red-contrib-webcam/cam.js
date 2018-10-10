module.exports = function(RED) {
    var events = require("events");
    var eventEmitter = new events.EventEmitter();

    /*
    function TakePic(n) {
        RED.nodes.createNode(this, n);
        this.cam = RED.nodes.getNode(n.cam);
        this.name = n.name;
        this.topic = n.topic;
        this.device = n.device;
        this.resolution = n.resolution;
        this.rotate = n.rotate;
        var node = this;

        node.on('close', function(done) {
            node.status({});
            done();
        });
    }
    RED.nodes.registerType("motion-picture", TakePic);
    */
    function MotionDetector(n) {
        RED.nodes.createNode(this, n);
        this.cam = RED.nodes.getNode(n.cam);
        this.name = n.name;
        this.topic = n.topic;
        this.device = n.device;
        this.resolution = n.resolution;
        this.rotate = n.rotate;
        var node = this;

        node.on('close', function(done) {
            node.status({});
            done();
        });
        eventEmitter.on('event', function(data, data2) {
            var tmp = data.split(';');
            node.send({
                payload: {
                    event: tmp[0],
                    date: tmp[1],
                    eventNumber: tmp[2],
                    frameNumber: tmp[3],
                    camera: tmp[4],
                    changedPixels: tmp[5],
                    noise: tmp[6],
                    width: tmp[7],
                    height: tmp[8],
                    xMotion: tmp[9],
                    yMotion: tmp[10],
                    text: tmp[11],
                    filename: tmp[12],
                    filetype: tmp[13]
                }
            });
        });
    }
    RED.nodes.registerType("motion-event", MotionDetector);

    RED.httpNode.get('/webcam/trigger', function(req, res) {
        if (req.query.event !== undefined) {
            eventEmitter.emit('event', req.query.event);
            res.send('ok');
        }
        else {
            res.send('false');
        }
    });
};
