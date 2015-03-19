'use strict';

var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var utils = require('./js/utils');
var options = {
    host: 'localhost',
    ssl: false,
    dist: 'build'
};

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

    utils.createServerAsync(options).done(function (uri, server) {
        mainWindow.loadUrl(uri+'/dist/index.html');
    }, function (error) {
        console.log(error);
    });

    // and load the index.html of the app.

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
    mainWindow.loadUrl('file://' + __dirname + '/index.html');
});
