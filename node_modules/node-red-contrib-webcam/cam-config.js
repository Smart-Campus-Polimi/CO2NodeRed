module.exports = function(RED) {
    function CamConfig(n) {
        RED.nodes.createNode(this, n);
        this.name = n.name;
        this.host = n.host;
        this.number = n.number;
        this.callback = n.callback;
        var node = this;
        var options = {
            'on_event_start': 'curl "' + node.callback + '?event=on_event_start;%Y%m%d%H%M%S;%v;%q;%t;%D;%N;%i;%J;%K;%L;%C;%f;%n"',
            'on_event_end': 'curl "' + node.callback + '?event=on_event_end;%Y%m%d%H%M%S;%v;%q;%t;%D;%N;%i;%J;%K;%L;%C;%f;%n"',
            'on_picture_save': 'curl "' + node.callback + '?event=on_picture_save;%Y%m%d%H%M%S;%v;%q;%t;%D;%N;%i;%J;%K;%L;%C;%f;%n"',
            'on_movie_start': 'curl "' + node.callback + '?event=on_movie_start;%Y%m%d%H%M%S;%v;%q;%t;%D;%N;%i;%J;%K;%L;%C;%f;%n"',
            'on_movie_end': 'curl "' + node.callback + '?event=on_movie_end;%Y%m%d%H%M%S;%v;%q;%t;%D;%N;%i;%J;%K;%L;%C;%f;%n"',
            'on_motion_detected': 'curl "' + node.callback + '?event=on_motion_detected;%Y%m%d%H%M%S;%v;%q;%t;%D;%N;%i;%J;%K;%L;%C;%f;%n"',
            'on_area_detected': 'curl "' + node.callback + '?event=on_area_detected;%Y%m%d%H%M%S;%v;%q;%t;%D;%N;%i;%J;%K;%L;%C;%f;%n"',
            'on_camera_lost': 'curl "' + node.callback + '?event=on_camera_lost;%Y%m%d%H%M%S;%v;%q;%t;%D;%N;%i;%J;%K;%L;%C;%f;%n"'
        };

        node.on('*', function(ev) {
            console.log(ev);
        });

        var request = require('request');
        var prop = null;
        for (prop in options) {
            var qr = {};
            qr[prop] = options[prop];
            request.get({
                url: node.host + '/' + node.number + '/config/set',
                qs: qr
            });
        }
        node.on('close', function(done) {
            var prop = null;
            for (prop in options) {
                request.get(node.host + '/' + node.number + '/config/set?' + prop + '=null');
            }
        });
    }
    RED.nodes.registerType("motion-config", CamConfig);
};
