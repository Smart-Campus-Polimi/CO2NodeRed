# node-red-contrib-webcam
Webcam Node for Node Red. Use Motion package.

First version and now is just experiment.

This node configure motion with our REST API and receive events by REST too.

If you want restore original motion config, just restart daemon.

Motion could run locally or remotely, remember this when you need to use the image files.

Roadmap:
- Better config handling(now you need delete node and add again to call motion rest api)
- Take snapshot, take image and take movie.
- Take timelapse :-D
- Support other motion configuration (contrast, brightness, hue, saturation)
- track camera movement

Any help is welcome.
