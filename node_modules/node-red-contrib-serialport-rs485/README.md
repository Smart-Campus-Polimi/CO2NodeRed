node-red-node-serialport-rs485
========================

<a href="http://nodered.org" target="_new">Node-RED</a> nodes to talk to
hardware Serial ports, with optional RS485 RTS/DTR flow control

This is a modified node based on the source code of the original node-red serialport nodes <a href="https://www.npmjs.com/package/node-red-node-serialport">node-red-node-serialport</a>

Install
-------

Run the following command in your Node-RED user directory (typically `~/.node-red`):

        npm i node-red-node-serialport-rs485

For versions on node.js prior to 4.x (ie v0.10.x and v0.12.x) please install using

        sudo npm i -g npm@2.x
        npm i node-red-node-serialport-rs485

You may also have to install or upgrade GCC to be version 4.8 or better.


During install there may be multiple messages about optional compilation.
These may look like failures... as they report as failure to compile errors -
but often are warnings and the node will continue to install and, assuming nothing else
failed, you should be able to use it. Occasionally some platforms *will* require
you to install the full set of tools in order to compile the underlying package.


Usage
-----

Provides two nodes - one to receive messages, and one to send.

<b>In the serial interface settings, there is a parameter called "Flow control", which can be used to set the flow control:</b>
- None
- Send: RTS-On, Receive: RTS-Off
- Send: RTS-Off, Receive: RTS-On
- Send: DTR-On, Receive: DTR-Off
- Send: DTR-Off, Receive: DTR-On

The timing will be done automatically, depend on the baud rate.

### Input

Reads data from a local serial port.

Clicking on the search icon will attempt to autodetect serial ports attached to
the device, however you many need to manually specify it. COM1, /dev/ttyUSB0, etc

It can either

 - wait for a "split" character (default \n). Also accepts hex notation (0x0a).
 - wait for a timeout in milliseconds for the first character received
 - wait to fill a fixed sized buffer
 
It then outputs `msg.payload` as either a UTF8 ascii string or a binary Buffer object.

If no split character is specified, or a timeout or buffer size of 0, then a stream
of single characters is sent - again either as ascii chars or size 1 binary buffers.

### Output

Provides a connection to an outbound serial port.

Only the `msg.payload` is sent.

Optionally the new line character used to split the input can be appended to every message sent out to the serial port.