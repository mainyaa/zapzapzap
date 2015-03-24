'use strict';

var Promise = require('bluebird');
var httpServer = require('http-server');
var portfinder = require('portfinder');
Promise.promisifyAll(httpServer);

var server = {

    /**
     * @param {Number} min
     * @param {Number} max
     * @returns {Function} Promise (Number)
     */
    getRandomInt: function (min, max) {
      return Math.floor( Math.random() * (max - min + 1) ) + min;
    },
    /**
     * @param {Object} options
     * @returns {Function} Promise(String, Function)
     */
    createServer: function (options) {
        var uri;
        var httpd;
        return new Promise(function(fulfill, reject) {
            portfinder.basePort = server.getRandomInt(3000,3999);
            portfinder.getPort(function (err, port) {
                if (err) throw err;
                options.port = port;
                console.log(options);
                httpd = httpServer.createServer(options);
                httpd.listen(options.port, options.host, function() {
                    uri = server.makeUrl(options.ssl ? 'https' : 'http', options.host, options.port);
                    console.log(httpd);
                    console.log(uri);
                    console.log('Starting up http-server, serving '.yellow + 
                                options.root.cyan +
                                ' on: '.yellow +
                                uri.cyan);
                    fulfill(uri, httpd);
                });
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

};
Promise.promisifyAll(server);

module.exports              = server;
module.exports.getRandomInt = server.getRandomInt;
module.exports.createServer = server.createServer;
module.exports.makeUrl      = server.makeUrl;

