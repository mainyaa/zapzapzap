'use strict';


var index = {
    update: function () {
        console.log("update");
        jQuery('.button-fullscreen').click(function(event) {
            console.log("update:click");
            mainWindow.setFullScreen();
        });
    },
};
index.update();


