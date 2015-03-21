'use strict';

var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var globalShortcut = require('global-shortcut');
var utils = require('./js/utils');

var requestLogger = function(req, res, error) {
    var date = (new Date()).toUTCString();
    if (error) {
        console.log('[%s] "%s %s" Error (%s): "%s"', date, req.method.red, req.url.red, error.status.toString().red, error.message.red);
    } else {
        console.log('[%s] "%s %s" "%s"', date, req.method.cyan, req.url.cyan, req.headers['user-agent']);
    }
};
var options = {
    host: '127.0.0.1', // only access local
    ssl: false,
    root: 'build',
    cache: '-1',  // nocache
    showDir: false,
    autoIndex: false,
    robots: false,
    logFn: requestLogger,
    proxy: 'http://localhost:3000',
};
var isFullScreen = false;

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// This method will be called when atom-shell has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
    console.log('ready');
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 800, height: 600});

    utils.createServer(options).done(function (uri, server) {
        console.log(uri+'/index.html');
        mainWindow.loadUrl(uri+'/index.html');
        // Register a 'ctrl+x' shortcut listener.
        var ret = globalShortcut.register('ctrl+x', function() {
            console.log('ctrl+x is pressed');
            mainWindow.setFullScreen(true);
        });
        if (!ret) {
            console.log('registerion fails');
        }
        // Register a 'ctrl+z' shortcut listener.
        var ret = globalShortcut.register('ctrl+z', function() {
            console.log('ctrl+z is pressed');
            isFullScreen = !isFullScreen
            mainWindow.FullScreen(isFullScreen);
        });
        if (!ret) {
            console.log('registerion fails');
        }
    }, function (error) {
        console.log(error);

    });
    //console.log('file://' + __dirname + '/index.html');
    //mainWindow.loadUrl('file://' + __dirname + '/index.html');

    // and load the index.html of the app.

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
});




module.exports = mainWindow;

