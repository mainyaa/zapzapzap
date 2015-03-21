'use strict';

var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var globalShortcut = require('global-shortcut');
var server = require('./js/server');
var open = require('open');
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
    showDir: false,
    autoIndex: false,
    robots: false,
    logFn: requestLogger,
};
var isFullScreen = false;

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


//app.commandLine.appendSwitch('remote-debugging-port', '8315');
//app.commandLine.appendSwitch('host-rules', 'MAP * 127.0.0.1');
app.on('ready', function() {
    console.log('app:ready');
    server.createServer(options).done(function (uri, server) {
        console.log('server:ready');
        // Create the browser window.
        window = new BrowserWindow({width: 1140, height: 900});
        //window.openDevTools()
        // waiting server up in 3 sec
        _.delay(function () {
            //console.log('file://' + __dirname + '/index.html');
            //window.loadUrl('file://' + __dirname + '/index.html');
            console.log(uri+'/index.html');
            //window.webContents.send('webview-loadUrl', uri+'/index.html');
            //open(uri+'/index.html');
            window.loadUrl(uri+'/index.html');
        }, 3000);

        // Emitted when the window is closed.
        window.on('closed', function() {
            window = null;
        });
    });

});


module.exports = window;


