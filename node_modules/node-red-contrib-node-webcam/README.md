# node-red-contrib-node-webcam
A <a href="http://nodered.org" target="_new">Node-RED</a> node to take photos on a Raspberry Pi with a USB camera. This node will only work on an Raspberry Pi with a USB Camera.

## Install

Run the following command in the root directory of your Node-RED install or home directory (usually ~/.node-red) and will also install needed libraries.

        npm install node-red-contrib-node-webcam

### Additionally you have to install on the Raspberry Pi 

You have to install fswebcam by following command.

        sudo apt install fswebcam

If you are using the default path - the /home/pi/Pictures will be used.

### Runtime information
This node was tested to Node.js v6.11.3 and NPM 3.10.10 on Node-Red v0.17.5 

## Usage

### node-webcam

This node is to take a photo in a given format directly from a USB camera on Raspberry Pi. The image of the photo is stored into the file-system and <b>msg.payload</b> will give you the path and the filename including extension to the photo or Buffer object.

This node was tested to Node.js v6.11.3 and NPM 3.10.10 on Node-Red v0.17.5. 
