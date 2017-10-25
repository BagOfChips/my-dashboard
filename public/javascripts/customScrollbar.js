
(function($){

    var scrollSettings = {
        autoHideScrollbar: true,
        autoDraggerLength: true,
        mouseWheel: {
            preventDefault: true
        },
        keyboard: {
            enable: true
        },
        advanced: {
            updateOnContentResize: true,
            updateOnImageLoad: true
        },
        callbacks: {
            onCreate: function(){
                console.log("Loaded custom scrollbar plugin");
            },
            onInit: function(){
                console.log("Custom scrollbar initialized");
            }
        },
        theme: "dark-thin"
    };

    $(window).on("load", function(){
        $("#left-column-0").mCustomScrollbar(scrollSettings);
        $("#right-column-0").mCustomScrollbar(scrollSettings);
        $("#right-column-1").mCustomScrollbar(scrollSettings);
    });
})(jQuery);
