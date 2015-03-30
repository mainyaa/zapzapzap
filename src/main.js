'use strict';

var app            = require('app');  // Module to control application life.
var BrowserWindow  = require('browser-window');  // Module to create native browser window.
var ipc            = require('ipc');
var colors         = require('colors');
var server         = require('./js/server');
var open           = require('open');
var _              = require('lodash');
var minimist       = require('minimist');
var argv           = require('minimist')(process.argv.slice(2));
var globalShortcut = require('./js/global-shortcut').globalShortcut;
console.dir(argv);
var dev = false;
if (!_.isEmpty(argv._) && argv._[0] !== './dist/osx/Zapzapzap.app/Contents/Resources/app') {
    dev = true;
    console.log("dev: true");
}

var requestLogger = function(req, res, error) {
    var date = (new Date()).toUTCString();
    if (error) {
        console.log('[%s] "%s %s" Error (%s): "%s"', date, req.method.red, req.url.red, error.status.toString().red, error.message.red);
    } else {
        console.log('[%s] "%s %s" "%s"', date, req.method.cyan, req.url.cyan, req.headers['user-agent']);
    }
};
var options = {
    host:      'localhost', // only access local
    ssl:       false,
    root:      __dirname+'/browser',
    showDir:   false,
    autoIndex: false,
    robots:    false,
    logFn:     requestLogger,
    dev:       dev,
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


if (dev) {
    app.commandLine.appendSwitch('remote-debugging-port', '8315');
    app.commandLine.appendSwitch('host-rules', 'MAP * 127.0.0.1');
}
app.on('ready', function() {
    console.log('app:ready');
    server.createServer(options).done(function (uri, server) {
        console.log('server:ready');
        // Create the browser window.
        window = new BrowserWindow({width: 1140, height: 900});
        if (dev) {
            window.openDevTools();
        }
        console.log('file://' + __dirname + '/index.html');
        window.loadUrl('file://' + __dirname + '/index.html');
        globalShortcut.register(window);
        // waiting server up in 3 sec
        _.delay(function () {
            //console.log('file://' + __dirname + '/index.html');
            //window.loadUrl('file://' + __dirname + '/index.html');
            console.log(uri+'/index.html');
            //window.webContents.send('webview-loadUrl', uri+'/index.html');
            //open(uri+'/index.html');
            window.loadUrl(uri+'/index.html');
        }, 5000);

        // Emitted when the window is closed.
        window.on('closed', function() {
            window = null;
        });
    });
});

ipc.on('toggleDevTools', function(event) {
    window.toggleDevTools();
});

module.exports = window;


