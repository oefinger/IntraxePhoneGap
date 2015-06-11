/*
    SimpleSerial index.js
    Created 7 May 2013
    Modified 9 May 2013
    by Tom Igoe
	
	Modified 6/10/2015 by Matt Oefinger for Intraxe
*/

var PARTNER_NAME = 'HC-06';                                  // look for this Bluetooth partner name
var connectivity_interrupt;
var CONNECTIVITY_TIME_INTERVAL = 3000;
var HEARTBEAT_REPY_TIME = 1000;

function sendHeartbeat() {
		
		var success = function() {    
            app.clear();
			app.display(data);
        };

        var failure = function() {
            alert("Failed writing data to Bluetooth peripheral");
        };

        var data = 'H';                                     // Arduino expects H for heartbeat value
        bluetoothSerial.write(data, success, failure);
		
		heartbeatTimer = setTimeout(function(){ updateConnectStatus(3) }, HEARTBEAT_REPY_TIME);               // if no response within 1 s, 
}

function findPartner(results) {

	var count = 0;
	
    for(var i=0; i<results.length; i++) {
		if(results[i].name == PARTNER_NAME) {
			count++;
			app.macAddress = results[i].address;            // get the MAC address
		}
	}
	
	if(count == 0) {
		alert('Uh oh. I see no Intraxe guitars for pairing. Be sure your guitar is powered on and that Bluetooth is paired.')
	}
	else if(count > 1) {
		alert('Hm, I see more than 1 Intraxe guitar for pairing. Can you please turn off all except one guitar so I know which one to pair with?')
	}
	else {
		alert('Rock on! I can see your guitar and we are ready to roll.');
		app.manageConnection();
	}
}

var app = {
    macAddress: "AA:BB:CC:DD:EE:FF",  // get your mac address from bluetoothSerial.list
    chars: "",

/*
    Application constructor
 */
    initialize: function() {
        this.bindEvents();
    },
/*
    bind any events that are required on startup to listeners:
*/
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
		//sendButton.addEventListener('touchstart', this.sendData, false);
    },

/*
    this runs when the device is ready for user interaction:
*/
    onDeviceReady: function() {
        // check to see if Bluetooth is turned on.
        // this function is called only
        //if isEnabled(), below, returns success:
        var listPorts = function() {
					
            // list the available BT ports:
            bluetoothSerial.list(
                function(results) {
					
					findPartner(results);
                },
                function(error) {
                    app.display(JSON.stringify(error));
                }
            );
        }

        // if isEnabled returns failure, this function is called:
        var notEnabled = function() {
            app.display("Bluetooth is not enabled.")
        }

         // check if Bluetooth is on:
        bluetoothSerial.isEnabled(
            listPorts,
            notEnabled
        );
    },
/*
    Connects if not connected, and disconnects if connected:
*/
    manageConnection: function() {

        // connect() will get called only if isConnected() (below)
        // returns failure. In other words, if not connected, then connect:
        var connect = function () {
            // if not connected, do this:
            // clear the screen and display an attempt to connect
            app.clear();
            app.display("Attempting to connect. " +
                "Make sure the serial port is open on the target device.");
			updateConnectStatus(1);      // updateConnectStatus is in ui.js
            // attempt to connect:
            bluetoothSerial.connect(
                app.macAddress,  // device to connect to
                app.openPort,    // start listening if you succeed
                app.showError    // show the error if you fail
            );
        };

        // disconnect() will get called only if isConnected() (below)
        // returns success  In other words, if  connected, then disconnect:
        var disconnect = function () {
            app.display("attempting to disconnect");
            // if connected, do this:
            bluetoothSerial.disconnect(
                app.closePort,     // stop listening to the port
                app.showError      // show the error if you fail
            );
			updateConnectStatus(3);      // updateConnectStatus is in ui.js
        };

        // here's the real action of the manageConnection function:
        bluetoothSerial.isConnected(disconnect, connect);
    },
/*
    subscribes to a Bluetooth serial listener for newline
    and changes the button:
*/
    openPort: function() {
        // if you get a good Bluetooth serial connection:
        //app.display("Connected to: " + app.macAddress);
      
	    updateConnectStatus(2);      // updateConnectStatus is in ui.js
		
        // set up a listener to listen for newlines
		bluetoothSerial.subscribe('\n', app.onData, app.onError);

		// set up ongoing monitoring of the channel
		connectivity_interrupt = setInterval(sendHeartbeat,CONNECTIVITY_TIME_INTERVAL);
    },

/*
    unsubscribes from any Bluetooth serial listener and changes the button:
*/
    closePort: function() {
        // if you get a good Bluetooth serial connection:
        app.display("Disconnected from: " + app.macAddress);
    
        // unsubscribe from listening:
        bluetoothSerial.unsubscribe(
                function (data) {
                    app.display(data);
                },
                app.showError
        );
    },
	
	
	onData: function(data) { // data received from Arduino
        processData(data);
    },
	/*
	sendData: function(event) { // send data to Arduino

        var success = function() {    
            app.clear();
			app.display(data);
        };

        var failure = function() {
            alert("Failed writing data to Bluetooth peripheral");
        };

        var data = messageInput.value;
        bluetoothSerial.write(data, success, failure);
    },
	*/
	onError: function(reason) {
        alert("ERROR: " + reason); // real apps should use notification.alert
    },
/*
    appends @error to the message div:
*/
    showError: function(error) {
        app.display(error);
    },

/*
    appends @message to the message div:
*/
    display: function(message) {
        var display = document.getElementById("message"), // the message div
            lineBreak = document.createElement("br"),     // a line break
            label = document.createTextNode(message);     // create the label

        display.appendChild(lineBreak);          // add a line break
        display.appendChild(label);              // add the message node
    },
/*
    clears the message div:
*/
    clear: function() {
        var display = document.getElementById("message");
        display.innerHTML = "";
    }
};      // end of app