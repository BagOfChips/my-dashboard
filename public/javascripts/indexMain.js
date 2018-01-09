
var socket = io();

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
    document.addEventListener("mousemove", toggleCommentsNavBar);

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

    /**
     * When we click the on the .comment-link class,
     *  we want to get its id and fetch top 100 comments
     *
     * class .comment-link dynamically added, use following structure below
     */
    $(document).on("click", "p.comment-link", function(){
        var postId = this.id.slice(0, -9); // removes "-comments"
        console.log("click on .comment-link with id: " + postId);

        getPostTitleWithId(postId, function(title){
            console.log("postTitle retrieved: " + title);

            // get comments in the callback - sometimes postTitle would be undefined
            // this slows fetching and displaying comments

            var getCommentsParameters = {
                limit: 5,
                depth: 2
            };

            // 1.1 - check if element exists first
            // this should be done BEFORE the get call
            if($(document.getElementById(postId + "-li-tab")).length){
                // we should probably check to make sure -body, -tab exists as well
                // but assume for now that they do

                console.log("tab already exists - switching over...");

                removeActiveClassFromCommentTabs();
                addActiveClassToCommentTabs(postId);
            }else{

                // need to display as tree structure
                getComments(
                    postId,
                    getCommentsParameters.limit,
                    getCommentsParameters.depth,

                    // callback
                    function(commentsArray){
                        addNewTabAndDisplayComments(commentsArray, postId, title);
                    }
                );
            }
        });
    });

    // socket io
    var interval = 10000;
    loopUpdatePostUpvotes(interval);

    socket.on("updatedPostData", function(data){
        displayUpdatedPosts(data);
    });

});

function loopUpdatePostUpvotes(interval){
    console.log("update posts through WS interval: " + interval);
    setInterval(function(){
        updatePostUpvotesThroughWS();
    }, interval);
}

/**
 * SOCKET.IO
 * We want to update posts' upvote value through websockets
 *
 *  1. Send which subreddit do we want to fetch for updated posts' data - $.tabSelected
 *  1.1 Also send limits - $.fetchedRedditPostsCount.r/...
 *  2. Retrieve here and update html based on id
 *  2.1 If id not found, ignore
 *  2.2 If id found, update data if changed accordingly
 *
 * May want to add some animations
 */
function updatePostUpvotesThroughWS(){
    var subredditPostsParameters = {
        subreddit: $.tabSelected,
        limit: $.fetchedRedditPostsCount[$.tabSelected]
    };
    socket.emit("fetchUpdatedPosts", subredditPostsParameters);
}


function displayUpdatedPosts(posts){
    for(var i = 0; i < posts.length; i++){
        // get current upvotes, time and comments
        var postIdToCheck = posts[i].id;
        var currentValues = {
            upvotes: $("#" + postIdToCheck + "-score").text(),
            time: $("#" + postIdToCheck + "-created").text(),
            comments: $("#" + postIdToCheck + "-comments").text()
        };

        var newValues = {
            upvotes: posts[i].score,
            time: posts[i].created_utc,
            comments: posts[i].num_comments + " comments"
        };

        if(currentValues.upvotes != newValues.upvotes){
            replaceTextValueGivenId(postIdToCheck + "-score", newValues.upvotes);
        }else if(currentValues.time != newValues.time){
            replaceTextValueGivenId(postIdToCheck + "-created", newValues.time);
        }else if(currentValues.comments != newValues.comments){
            replaceTextValueGivenId(postIdToCheck + "-comments", newValues.comments);
        }
    }
}

function replaceTextValueGivenId(id, newValue){
    console.log("updating " + id);
    $(document.getElementById(id)).animate({
        opacity: '0.0'
    }, 300).text(newValue).animate({
        opacity: '1.0'
    }, 300);

    if(id.slice(-6) == "-score"){
        // todo: if downvoted, flip arrow around

        // get upvote icon
        $(document.getElementById(id.slice(0, -6) + "-upvote-icon")).animate({
            opacity: '0.0',
            "top": '-=25px'
        }, 300).animate({
            "top": "+=25px"
        }, 100).animate({
            opacity: '1.0'
        }, 300);

    }
}

function addNewTabAndDisplayComments(commentsArray, postId, postTitle){
    // check if array
    if('length' in commentsArray){
        /**
         * 1. generate new tab - called postId + "-tab"
         *  1.1 check if tab already generated
         *      if so, "switch" to it
         *      if already displayed, do nothing
         *  1.2 switch to tab, set as: class="active"
         *      may have to remove 'class="active"' from other tabs' classes
         * 2. generate in tab-content: postId + "-body"
         * 3. display commentsArray in postId + "-body"
         *
         */
        var newTab =
            "<li class=\"active truncate-comment-tab\" id=\"" + postId + "-li-tab\">" +
            "<a data-toggle=\"tab\" href=\"#" + postId + "-body\" id=\"" + postId + "-tab\">" +
            postTitle +
            "</a>" +
            "</li>";

        var newTabBody =
            "<div id=\"" + postId + "-body" + "\" class=\"tab-pane fade in active\">" +
            "</div>";

        // 1.2 before appending any elements
        // remove class="active" from all other tabs which contains the class
        removeActiveClassFromCommentTabs();

        $(document.getElementById("comments-navbar")).append(newTab);
        $(document.getElementById("display-comments")).append(newTabBody);

        $.commentTabs.push(postId);
        console.log($.commentTabs);

        for(var i = 0; i < commentsArray.length; i++){
            displayComments(commentsArray[i], postId);
        }
    }
}


// array to comment tabs
// has postId values of opened comments tabs
$.commentTabs = [];

function addActiveClassToCommentTabs(postId){
    $(document.getElementById(postId + "-body")).addClass("active");
    $(document.getElementById(postId + "-li-tab")).addClass("active");

    // the body is not being displayed properly - still not active?
    // might be an async issue

    // the timeout below does not help
    if(!$(document.getElementById(postId + "-body")).hasClass("active")
        || !$(document.getElementById(postId + "-li-tab")).hasClass("active")){

        console.log("still not active, trying again in 5ms...");
        // just call again in 5ms
        setTimeout(addActiveClassToCommentTabs(postId), 5);
    }

    console.log("comments for: " + postId + " should now be active (shown)");
}

/**
 * Use the global list above and remove elements with: class="active"
 */
function removeActiveClassFromCommentTabs(){
    for(var i = 0; i < $.commentTabs.length; i++){
        if($(document.getElementById($.commentTabs[i] + "-body")).hasClass("active")){
            $(document.getElementById($.commentTabs[i] + "-body")).removeClass("active");
            console.log("class=\"active\" removed from body");
        }

        if($(document.getElementById($.commentTabs[i] + "-li-tab")).hasClass("active")){
            $(document.getElementById($.commentTabs[i] + "-li-tab")).removeClass("active");
            console.log("class=\"active\" removed from li");
        }
    }
}


/**
 * For each root comment
 *  1. append an empty .comment-box
 *  2. append root comment inside .comment-box
 *      with id=root_comment_id + "-box"
 *  3. for rest of the values,
 *      append each value to the parentId element
 *
 */
function displayComments(commentsArray, postId){
    var commentBox = commentsArray[0];
    var rootComment = commentsArray[1];

    $(document.getElementById(postId + "-body"))
        .append(commentBox); // commentBox has an id=root_comment_id + "-box"

    waitForElementToDisplay("#" + rootComment.id + "-box", 10, function(comment){
        $(document.getElementById(comment.id + "-box")).append(comment.html);

    }, rootComment);

    for(var i = 2; i < commentsArray.length; i++){
        waitForElementToDisplay("#" + commentsArray[i].parentId, 10, function(comment){
            $(document.getElementById(comment.parentId)).append(comment.html)
        }, commentsArray[i]);
    }
}

function waitForElementToDisplay(selector, time, f, comment){
    if(document.querySelector(selector) != null){
        f(comment);
    }else{
        setTimeout(function(){

            console.log("selector not ready yet, retrying in " + time + " ms...");

            waitForElementToDisplay(selector, time);
        }, time);
    }
}

function getPostTitleWithId(postId, callback){
    getSpecificPostInfo(postId, "title", callback);
}

function getSpecificPostInfo(postId, attribute, callback){
    $.get("/postInfo", {
        postId: postId,
        attribute: attribute
    }, function(data){
        callback(data);
    });
}

/**
 * Given a postId, we want to return an html parsed list of comments to display
 *  Comments displayed on left hand side
 *
 * @param postId
 * @param limit
 * @param depth
 * @param callback
 */
function getComments(postId, limit, depth, callback){
    var htmlToOrder = [];

    $.get("/comments", {
        postId: postId,
        limit: limit,
        depth: depth
    }, function(data){
        var comments = data.comments;

        for(var i = 0; i < comments.length; i++){
            htmlToOrder.push(commentsBFS(comments[i]));
        }

        // callback here
        callback(htmlToOrder);
    });
}

// unused
function removeCommentKeys(keysToRemove, object){
    for(var i = 0; i < keysToRemove.length; i++){
        for(prop in object){
            if(prop == keysToRemove[i]){
                delete object[prop];
            }else if(typeof object[prop] == "object"){
                removeCommentKeys(keysToRemove, object[prop]);
            }
        }
    }
}

// unused
function renameKeyFromObject(oldKey, newKey, object){
    object[newKey] = object[oldKey];
    delete object[oldKey];
    return object;
}

/**
 * We want to perform BFS on a list of comments
 */
function commentsBFS(comment){
    /** Javascript Queues - note that shift() might be O(n)
     *
     * var q = [];
     * q.push(2);
     * q.push(5);
     *  // q is [2, 5]
     *
     * var firstOut = q.shift();
     *  // q becomes [5]
     *  // firstOut is 2
     *
     */

    var htmlOutput = [];
    htmlOutput.push("<div class=\"comment-box row\" id=\"" + comment["id"] + "-box\"></div>");

    var queue = [];
    queue.push(comment);

    while(queue.length > 0){
        var node = queue.shift();

        htmlOutput.push({
            id: node["id"],
            parentId: node.parentId, // root comment has 'undefined' parentId
            html:
                "<div class=\"comment row\" id=\"" + node["id"] + "\">" +
                    "<div class=\"comment-headers col-xs-12 col-md-12\">" +
                        "<div class=\"comment-username col-xs-8 col-md-8\">" +
                            "<p class=\"comment-author\">" +
                                node["author"] +
                            "</p>" +

                            "<p>&nbsp;&nbsp;</p>" + // spaces

                            "<p class=\"comment-score bold\">" +
                                node["score"] +
                            "</p>" +

                            "<p>&nbsp;</p>" +
                            "<img class=\"upvote-icon reverse-hue\" src=\"images/upvote-icon.png\" alt=\"\">" +
                        "</div>" +

                        "<div class=\"comment-time col-xs-4 col-md-4\">" +
                            "<p>" +
                                node["created_utc"] +
                            "</p>" +
                        "</div>" +
                    "</div>" +

                    "<div class=\"comment-body row\">" +
                        "<div class=\"col-xs-12 col-md-12 bold large-comment-font\">" +
                            node["body_html"] + // use body_html instead
                        "</div>" +
                    "</div>" +

                // we want to append replies (subsequent comments here)
                "</div>"
        });

        for(var i = 0; i < node["replies"].length; i++){
            node["replies"][i].parentId = node["id"];
            queue.push(node["replies"][i]);
        }
    }

    return htmlOutput;
}

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
    // windowHeight not used, nav bar always 40px
    //var windowHeight = $(window).height();
    var mouseX = event.clientX;
    var mouseY = event.clientY;

    if(mouseX <= windowWidth * 0.44 && mouseY <= 50 && !navToggle){
        $("#nav").animate({
            marginTop: 0
        }, 300, "swing");

        // callback not working? but toggling the flag here works though
        navToggle = true;

    }else if(navToggle && (mouseX > windowWidth * 0.44 || mouseY > 50)){

        $("#nav").animate({
            marginTop: "-35px"
        }, 300, "swing");

        navToggle = false;
    }
}

var commentsNavToggle = false;
function toggleCommentsNavBar(event){
    var windowWidth = $(window).width();
    var mouseX = event.clientX;
    var mouseY = event.clientY;

    if(mouseX >= windowWidth * 0.40 && mouseY <= 50 && !commentsNavToggle){
        $("#comments-navbar").animate({
            marginTop: 0
        }, 300, "swing");

        commentsNavToggle = true;

    }else if(commentsNavToggle && (mouseX < windowWidth * 0.40 || mouseY > 50)){

        $("#comments-navbar").animate({
            marginTop: "-35px"
        }, 300, "swing");

        commentsNavToggle = false;
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

        formattedPost += "<div class=\"row single-post\">"
            + "<div class=\"col-md-12 col-xs-12\">"
                + "<a href=\"" + post.url + "\">"
                    + "<p id=\"" + post.id + "\" class=\"reddit-title\">" + post.title + "</p>"
                + "</a>"

                + "<div class=\"row extra-post-info\">"

                    + "<div class=\"col-md-2 col-xs-2 bold post-upvotes\">"
                        + "<img id=\"" + post.id + "-upvote-icon\" class=\"upvote-icon\" src=\"images/upvote-icon.png\" alt=\"upvotes\">"
                        + "<p>&nbsp</p>"
                        + "<p id=\"" + post.id + "-score\">" + post.score + "</p>"
                    + "</div>"

                    + "<div class=\"col-md-2 col-xs-2\">"
                        + "<a href=\"https://www.reddit.com/user/" + post.author + "\">"
                            + "<p>" + post.author + "</p>"
                        + "</a>"
                    + "</div>"

                    + "<div class=\"col-md-2 col-xs-2\">"
                        + "<p id=\"" + post.id + "-created\">" + post.created + "</p>"
                    + "</div>"

                    + "<div class=\"col-md-3 col-xs-3 bold subreddit-link\">"
                        + "<a href=\"https://www.reddit.com/" + post.subreddit + "\">"
                            + "<p>" + post.subreddit + "</p>"
                        + "</a>"
                    + "</div>"

                    + "<div class=\"col-md-3 col-xs-3 bold \">"
                        + "<a>"
                            + "<p class=\"comment-link\" id=\"" + post.id + "-comments\">" + post.comments + " comments</p>"
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
            created: postData.created_utc // to convert epoch to a human readable date
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

