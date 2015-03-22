'use strict';

var Promise = require('bluebird');
var httpServer = require('http-server');
var portScanner   = require('portscanner');
Promise.promisifyAll(portScanner);
Promise.promisifyAll(httpServer);

var server = {

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
        var httpd;
        return new Promise(function(fulfill, reject) {
            server.getRandomInt(3000,3994)
            .then(function(randomPort){
                return server.getPorts(randomPort);
            }).done(function(port){
                if (port === undefined) {
                    reject('port is undefined');
                    return;
                }
                options.port = port;
                console.log(options);
                httpd = httpServer.createServer(options);
                httpd.listen(options.port, options.host);
                uri = server.makeUrl(options.ssl ? 'https' : 'http', options.host, options.port);
                console.log(httpd);
                console.log(uri);
                console.log('Starting up http-server, serving '.yellow + 
                options.root.cyan +
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
    getPorts: function (port) {
        var max   = port + 5;
        return portScanner.findAPortNotInUseAsync(port, max, {
            host: 'localhost',
            timeout: 1000
        });
    },
};
Promise.promisifyAll(server);

module.exports              = server;
module.exports.getRandomInt = server.getRandomInt;
module.exports.createServer = server.createServer;
module.exports.getPorts     = server.getPorts;
module.exports.makeUrl      = server.makeUrl;
