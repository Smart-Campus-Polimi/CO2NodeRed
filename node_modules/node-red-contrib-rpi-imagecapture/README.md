# node-red-contrib-rpi-imagecapture

This node allows to take picture from standard USB webcam connected to a Raspberry.

It uses the [fswebcam package](https://www.sanslogic.co.uk/fswebcam/).

### Prerequisites

Install the [fswebcam package](https://www.raspberrypi.org/documentation/usage/webcams/) on the Raspberry

### Install

From your node-red directory:

    npm install node-red-contrib-rpi-imagecapture
    
or
    
in the Node-red, Manage palette, Install node-red-contrib-rpi-imagecapture



### Usage

The fswebcam configuration needs to be defined into a file stored in the Raspberry.<br>
The available options can be found using the **fswebcam -help** command.

For example :

device /dev/video0<br>
resolution 640X480<br>
set brightness=70%<br>
set contrast=70%<br>
no-banner<br>
jpeg 95<br>
skip 10<br>
set "Focus, Auto"=False<br>
set "Focus (absolute)"=7<br>
rotate 180<br>

The path to the configuration file needs to be defined into the node properties.

### Input

The picture is captured when a **msg** arrived into the node.

### Output

The captured picture is stored in a **Buffer** object in **msg.payload.capturedImg**.

### License 

MIT License