chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('index.html', {bounds: {width: 700, height: 500}});
});

var socket = chrome.socket;
var serverIP = '0.0.0.0';
var udpPort = 9876;
var socketId;
var clientId;

socket.create('udp', {}, function(socketInfo) {
    socketId = socketInfo.socketId;
    socket.bind(socketId, serverIP, udpPort, function(result) {
        if (result < 0) {
            console.error("Could not bind listening UDP port " + serverIP + ':' + udpPort +
                         " (" + result + ")");
        }
    });

    setTimeout(readUDP, 1);
});

function readUDP() {
    socket.recvFrom(socketId, 1024, function(info) {
        if (info.resultCode < 0) {
            console.erro("Reader error", info);
            return;
        }
        if (info.data.byteLength != 0) {
            console.log("UDP From: " + info.address + ":" + info.port + ": '" +
                        bufferToString(info.data) + "'");
        }
        setTimeout(readUDP, 1);
    });
}

function sendSocketData(remoteIP, data) {
    socket.create('udp', null, function(createInfo) {
        clientId = createInfo.socketId;
        socket.connect(clientId, remoteIP, udpPort, function(result) {
            socket.write(clientId, stringToBuffer(data), function(result){
                if (result.bytesWritten < 0) {
                    console.error("Could not write string (" + result.bytesWritten + ")");
                    return;
                }
                console.log("UDP To: " + remoteIP + ":" + udpPort + ":'" +
                            data + "' (" + result.bytesWritten + " bytes)");
                socket.destroy(clientId);
            });
        });
    });
}

function stringToBuffer(s) {
    var v = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) {
        v[i] = s.charCodeAt(i);
    }
    return v.buffer;
}

function bufferToString(b) {
    var s = '';
    var v = new Uint8Array(b);
    for (var i = 0; i < v.length; i++) {
        s += String.fromCharCode(v[i]);
    }
    return s;
}

setTimeout(function () {
               sendSocketData(serverIP, "test data");
           },
           1000);
