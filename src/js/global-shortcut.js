'use strict';

var globalShortcut = require('global-shortcut');
var Promise        = require('bluebird');

/**
 * @param {Object} window
 * @returns {Function} Promise
 */
module.exports.globalShortcut = {
    register: function(window){
        return new Promise(function(fulfill, reject) {

            var success = globalShortcut.register('cmd+alt+i', function() {
                window.toggleDevTools();
            });
            if (!success) {
                return reject();
            }
            success = globalShortcut.register('ctrl+alt+i', function() {
                window.toggleDevTools();
            });
            if (!success) {
                return reject();
            }
            return fulfill();
        });
    }
};
