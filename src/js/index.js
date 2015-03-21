'use strict';

var ipc = require('ipc');
var webview = document.getElementById("webview");
console.log(ipc.sendSync('synchronous-message', 'ping')); // prints "pong"

ipc.on('asynchronous-reply', function(arg) {
  console.log(arg); // prints "pong"
});
ipc.on('webview-loadurl', function(arg) {
  console.log(arg); // prints "pong"
  webview.src = arg;
  console.log(webview); // prints "pong"
  webview.openDevTools();
});
ipc.send('asynchronous-message', 'ping');

