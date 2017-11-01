
(function($){

    var defaultScrollSettings = {
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
        theme: "light-thin"
    };

    // copy object
    var redditScrollSettings = JSON.parse(JSON.stringify(defaultScrollSettings));
    redditScrollSettings.callbacks.onTotalScroll = function(){
        console.log("Scrolled to the bottom - fetching 25 more posts");

        if(fetchedRedditPostsCount < 100){
            $.get("/redditRall", {
                limit: fetchedRedditPostsCount + 25
            }, function(fetchedPosts){
                var trimmedPosts = trimPosts(fetchedPosts);
                var formattedPosts = toHTML(trimmedPosts);
                displayPosts(formattedPosts);
                fetchedRedditPostsCount += formattedPosts.length;

                console.log("fetchedRedditPostsCount: " + fetchedRedditPostsCount);
            });
        }else{
            // todo: stop searching for too many things
            console.log("100 posts fetched limit reached");
        }


    };

    $(window).on("load", function(){
        $("#left-column-0").mCustomScrollbar(redditScrollSettings);
        $("#right-column-0").mCustomScrollbar(defaultScrollSettings);
        $("#right-column-1").mCustomScrollbar(defaultScrollSettings);
    });
})(jQuery);

var fetchedRedditPostsCount = 0;
