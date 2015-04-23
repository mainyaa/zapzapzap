'use strict';
var ipc = require('ipc');

var jQuery = require('jquery');
var $ = jQuery;
$().ready(function(event) {
    System.paths = {
        'angular2/*':'/quickstart/angular2/*.js', // Angular
        'rtts_assert/*': '/quickstart/rtts_assert/*.js', //Runtime assertions
        '$':'/bower_components/jquery/dist/jquery.js', // Angular
        'jQuery.fn.contextMenu':'/bower_components/contextMenu/contextMenu.js', // Angular
        'todo': 'todo.js',
        'firebase/*': '/deps/firebase/*.js',
        'services/*': '/deps/services/*.js',
        'contextMenu': 'bower_components/contextMenu/contextMenu.js'
    };

    System.import('todo').then(function(module) {
        module.main();
    }, console.log.bind(console));
    System.import('jQuery.fn.contextMenu').then(function() {
        $('html').contextMenu(
            'menu',
            '.contextMenu',
            {
                'triggerOn': 'contextmenu',
                'afterOpen': function(){
                    $('.overlayMenu').show();
                    $('.overlayMenu').on('click', function(event){
                        event.preventDefault();
                        $('html').contextMenu(
                            'close',
                            '.contextMenu',
                            {'triggerOn': 'click'}
                        );
                    });
                }
            }
        );
        $('.contextmenu-devtools-button').on('click', function(evt){
            ipc.send('toggleDevTools', evt.offsetX, evt.offsetY);
        });
    }, console.log.bind(console));
});
