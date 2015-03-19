'use strict';

var colors   = require('colors');
var Promise = require('bluebird');
var httpServer = require('http-server');
var portScanner   = require('portscanner');
Promise.promisifyAll(portScanner);
Promise.promisifyAll(httpServer);

var utils = {

    /**
     * @param {Number} min
     * @param {Number} max
     * @returns {Function} Promise (Number)
     */
    getRandomInt: function (min, max) {
      return Promise.resolve(Math.floor( Math.random() * (max - min + 1) ) + min);
    },
    /**
     * @param {Object} options
     * @returns {Function} Promise(String, Function)
     */
    createServer: function (options) {
        var uri;
        var server;
        return new Promise(function(fulfill, reject) {
            utils.getRandomInt(3000,3994)
            .then(function(randomPort){
                return utils.getPorts(randomPort);
            }).done(function(port){
                if (port === undefined) {
                    reject(error);
                    return;
                }
                options.port = port;
                server = httpServer.createServer(options);
                server.listen(options.port, options.host);
                uri = utils.makeUrlAsync(options.ssl ? 'https' : 'http', options.host, options.port)
                console.log('Starting up http-server, serving '.yellow + 
                server.root.cyan +
                ' on: '.yellow +
                uri.cyan);
                fulfill(uri);
            }, function(error){
                console.log('error'.red + error);
                reject(error);
                return;
            });
        });
    },

    /**
     * @param {String} scheme
     * @param {String} host
     * @param {Number} port
     * @returns {String} uri
     */
    makeUrl: function (scheme, host, port) {
        return scheme + '://' + host + ':' + port;
    },

    /**
     * Get ports
     * @param {Number} port
     * @param {Function} callback
     * @returns {Function} Promise
     */
    getPorts: function (port, callback) {
        var max   = port + 5;
        return portScanner.findAPortNotInUseAsync(port, max, {
            host: 'localhost',
            timeout: 1000
        });
    },
};
Promise.promisifyAll(utils);

module.exports              = utils;
module.exports.getRandomInt = utils.getRandomInt;
module.exports.createServer = utils.createServer;
module.exports.getPorts     = utils.getPorts;
module.exports.makeUrl      = utils.makeUrl;
