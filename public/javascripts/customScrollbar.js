
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

        // get which tab is selected first
        console.log("tabSelected: " + $.tabSelected);
        console.log("fetchedRedditPostsCount[tabSelected]: " + $.fetchedRedditPostsCount[$.tabSelected]);

        if($.fetchedRedditPostsCount[$.tabSelected] < 100){
            $.get("/fetchHot", {
                // get current subreddit "limit"
                limit: $.fetchedRedditPostsCount[$.tabSelected] + 25,
                subreddit: $.tabSelected
            }, function(fetchedPosts){
                var trimmedPosts = trimPosts(fetchedPosts);
                var formattedPosts = toHTML(trimmedPosts);
                displayPosts(formattedPosts, $.tabSelected);
                $.fetchedRedditPostsCount[$.tabSelected] += formattedPosts.length;

                //console.log("fetchedRedditPostsCount: " + fetchedRedditPostsCount);
            });
        }else{
            // stop searching for too many things
            console.log("100 posts fetched limit reached");
        }
    };

    var navScrollSettings = JSON.parse(JSON.stringify(defaultScrollSettings));

    navScrollSettings.axis = "x";
    //navScrollSettings.scrollbarPosition = "outside";
    navScrollSettings.advanced.autoExpandScrollbar = true;

    $(window).on("load", function(){
        //$("#nav").mCustomScrollbar(navScrollSettings);
        $("#left-column-0").mCustomScrollbar(redditScrollSettings);
        $("#right-column-0").mCustomScrollbar(defaultScrollSettings);
        //$("#right-column-1").mCustomScrollbar(defaultScrollSettings);
    });
})(jQuery);


// jquery global variables
$.tabSelected = "r/all";

$.fetchedRedditPostsCount = {
    'r/all': 0,
    'r/pics': 0,
    'r/programmerHumor': 0,
    'r/2007scape': 0,
    'r/fitness': 0
};

// we can just use the variable above
// 0 = false, otherwise true
$.tabLoaded = {
    'r/all': false,
    'r/pics': false,
    'r/programmerHumor': false,
    'r/2007scape': false,
    'r/fitness': false
};