'use strict';

var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var globalShortcut = require('global-shortcut');
var utils = require('./js/utils');
var open = require('open');
var ipc = require('ipc');
var _ = require('lodash');

var requestLogger = function(req, res, error) {
    var date = (new Date()).toUTCString();
    if (error) {
        console.log('[%s] "%s %s" Error (%s): "%s"', date, req.method.red, req.url.red, error.status.toString().red, error.message.red);
    } else {
        console.log('[%s] "%s %s" "%s"', date, req.method.cyan, req.url.cyan, req.headers['user-agent']);
    }
};
var options = {
    host: 'localhost', // only access local
    ssl: false,
    root: 'build',
    cache: '-1',  // nocache
    showDir: false,
    autoIndex: false,
    robots: false,
    logFn: requestLogger,
};
var isFullScreen = false;
var ipc = require('ipc');
ipc.on('asynchronous-message', function(event, arg) {
    console.log(arg);  // prints "ping"
    event.sender.send('asynchronous-reply', 'pong');
});

ipc.on('synchronous-message', function(event, arg) {
    console.log(arg);  // prints "ping"
    event.returnValue = 'pong';
});

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var window = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// This method will be called when atom-shell has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
    utils.createServer(options).done(function (uri, server) {
        console.log('ready');
        // Create the browser window.
        window = new BrowserWindow({width: 1140, height: 900});
        //window.openDevTools()
        var ret = globalShortcut.register('ctrl+x', function() {
            console.log('ctrl+x is pressed');
            window.setFullScreen(true);
        });
        var ret = globalShortcut.register('ctrl+z', function() {
            console.log('ctrl+z is pressed');
            isFullScreen = !isFullScreen
            window.FullScreen(isFullScreen);
        });

        //console.log('file://' + __dirname + '/index.html');
        //window.loadUrl('file://' + __dirname + '/index.html');
        console.log(uri+'/index.html');
        console.log(ipc);
        //window.webContents.send('webview-loadUrl', uri+'/index.html');
        open('http://localhost:3000/index.html');
        window.loadUrl('http://localhost:3000/index.html');
        // and load the index.html of the app.

        // Emitted when the window is closed.
        window.on('closed', function() {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            window = null;
        });
    });

});


module.exports = window;


