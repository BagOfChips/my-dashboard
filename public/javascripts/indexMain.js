
$(document).ready(function(){

    // fetch front page of reddit - done when loading page
    $.get("/redditRall", {
        limit: 25
    }, function(fetchedPosts){

        /**
         * Service will send null if failed to fetch data
         *  todo: display appropriate error message
         *
         * @type {Array}
         */

        // parse returned data
        var trimmedPosts = trimPosts(fetchedPosts);
        var formattedPosts = toHTML(trimmedPosts);
        displayPosts(formattedPosts, $.tabSelected);

        $.fetchedRedditPostsCount[$.tabSelected] += formattedPosts.length;
        $.tabLoaded[$.tabSelected] = true;
    });

    // hide nav bar if not hovered over
    document.addEventListener("mousemove", toggleNavBar);


    // todo: how to spawn the following click listeners upon custom user defined subreddit?
    // todo: look at addEventListener()

    $(document.getElementById("r/all")).click(function(){
         $.tabSelected = this.id;
         console.log("tabSelected: " + $.tabSelected);
    });

    $(document.getElementById("r/pics")).click(function(){
        $.tabSelected = this.id;
        console.log("tabSelected: " + $.tabSelected);

        // will only load first 25 posts if not already fetched
        loadFirst25Posts();
    });

    $(document.getElementById("r/programmerHumor")).click(function(){
        $.tabSelected = this.id;
        console.log("tabSelected: " + $.tabSelected);
        loadFirst25Posts();

    });

    $(document.getElementById("r/fitness")).click(function(){
        $.tabSelected = this.id;
        console.log("tabSelected: " + $.tabSelected);
        loadFirst25Posts();

    });

    $(document.getElementById("r/2007scape")).click(function(){
        $.tabSelected = this.id;
        console.log("tabSelected: " + $.tabSelected);
        loadFirst25Posts();

    });
});

function loadFirst25Posts(){
    if($.tabLoaded[$.tabSelected] == false){
        // fetch and display FIRST 25 posts from THIS subreddit
        loadPosts(25);
    }
}

function loadPosts(limit){
    $.get("/fetchHot", {
        limit: limit,
        subreddit: $.tabSelected.slice(2)
    }, function(fetchedPosts){

        // parse returned data
        var trimmedPosts = trimPosts(fetchedPosts);
        var formattedPosts = toHTML(trimmedPosts);
        displayPosts(formattedPosts, $.tabSelected);

        $.fetchedRedditPostsCount[$.tabSelected] += formattedPosts.length;
        $.tabLoaded[$.tabSelected] = true;
    });
}


/**
 * On mouseOver "near" top 10% of screen height AND left 45% of screen (~5 / 12)
 *  reveal nav bar
 *
 * @param event
 */
var navToggle = false;
function toggleNavBar(event){
    var windowWidth = $(window).width();
    // windowHeight not used, nav bar always 24px
    //var windowHeight = $(window).height();
    var mouseX = event.clientX;
    var mouseY = event.clientY;

    if(mouseX <= windowWidth * 0.44 && mouseY <= 40 && !navToggle){
        $("#nav").animate({
            marginTop: 0,
            opacity: "1.0"
        }, 500, "swing");

        // callback not working? but toggling the flag here works though
        navToggle = true;
        //console.log(navToggle);

    }else if(navToggle && (mouseX > windowWidth * 0.44 || mouseY > 40)){
        $("#nav").animate({
            opacity: "0.0",
            marginTop: "-40px"
        }, 500, "swing");

        navToggle = false;
        //console.log(navToggle);
    }
}

/**
 * .html() will overwrite everything
 *  We just want to append the returned results
 *
 * @param formattedPosts
 * @param subreddit
 */
function displayPosts(formattedPosts, subreddit){
    console.log("Displaying posts to: " + "#" + subreddit.slice(2) + "-body");

    /**
     * Apparently, I could not select #r/pics-body for some reason
     *  even though #r/all-body works
     *
     * Might be because r/all-body was NOT
     *  display: none
     *
     * Renamed *-body ids without "r/" and it works
     */

    $(document.getElementById(subreddit.slice(2) + "-body")).append(formattedPosts);
    //$("#" + "r\\/" + subreddit.slice(2) + "-body").append(formattedPosts);
}


/**
 * One bigass String concat
 *
 * @param redditPosts
 * @returns {Array}
 */
function toHTML(redditPosts){

    var posts = [];
    for(var i = 0; i < redditPosts.length; i++){
        var post = redditPosts[i];
        var formattedPost = "";

        if(i % 2 !== 0){
            formattedPost += "<div class=\"row border-bottom border-top single-post\">"
        }else{
            formattedPost += "<div class=\"row single-post\">"
        }

        formattedPost +=
            "<div class=\"col-md-2 col-xs-2 center-upvotes upvote-styling bold\">"
                + "<p>" + redditPosts[i].score + "</p>"
            + "</div>"

            + "<div class=\"col-md-10 col-xs-10\">"
                + "<a href=\"" + post.url + "\">"
                    + "<p class=\"reddit-title\">" + post.title + "</p>"
                + "</a>"

                + "<div class=\"row extra-post-info\">"
                    + "<div class=\"col-md-3 col-xs-3\">"
                        + "<a href=\"https://www.reddit.com/user/" + post.author + "\">"
                            + "<p>" + post.author + "</p>"
                        + "</a>"
                    + "</div>"

                    + "<div class=\"col-md-3 col-xs-3\">"
                        + "<p>" + post.created + "</p>"
                    + "</div>"

                    + "<div class=\"col-md-3 col-xs-3 bold\">"
                        + "<a href=\"https://www.reddit.com/" + post.subreddit + "\">"
                            + "<p>" + post.subreddit + "</p>"
                        + "</a>"
                    + "</div>"

                    + "<div class=\"col-md-3 col-xs-3 bold\">"
                        + "<a href=\"https://www.reddit.com/" + post.permalink + "\">"
                            + "<p>" + post.comments + " comments</p>"
                        + "</a>"
                    + "</div>"
                + "</div>"

                + "<div class=\"row extra-post-info\">"
                    + "<div class=\"col-md-3 col-xs-3 col-md-offset-9 col-xs-offset-9 bold nsfw\">"
                        + "<p>" + post.nsfw + "</p>"
                    + "</div>"
                + "</div>"
            + "</div>"
            + "</div>"
        ;

        posts.push(formattedPost);
    }

    //console.log(posts.toString());
    return posts;
}



/**
 * Original post data too big, only a couple parameters needed
 *  - author
 *  - title
 *  - subreddit
 *  - url
 *  - score (int)
 *  - nsfw (boolean)
 *
 * @param posts
 * @returns {Array}
 */
function trimPosts(posts){

    var post = {};
    var trimmedPosts = [];
    for(var i = 0; i < posts.length; i++){
        var postData = posts[i];
        post = {
            id: postData.id,
            author: postData.author,
            title: postData.title,
            subreddit: postData.subreddit_name_prefixed,
            score: postData.score,
            nsfw: postData.over_18,
            comments: postData.num_comments,
            permalink: postData.permalink,
            url: postData.url,
            created: postData.created_utc // todo: convert epoch to a human readable date
        };

        if(post.nsfw == false){
            post.nsfw = "";
        }else{
            post.nsfw = "NSFW";
        }
        trimmedPosts.push(post);
    }

    //printObjectArray(trimmedPosts);
    return trimmedPosts;
}

/**
 * Prints array of objects (line by line)
 *
 * @param array
 */
function printObjectArray(array){
    for(var i = 0; i < array.length; i++){
        console.log(JSON.stringify(array[i]));
    }
}

