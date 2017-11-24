
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

    /**
     * When we click the on the .comment-link class,
     *  we want to get its id and fetch top 100 comments
     *
     * class .comment-link dynamically added, use following structure below
     */
    $(document).on("click", "p.comment-link", function(){
        var postId = this.id;
        console.log("click on .comment-link with id: " + postId);

        var getCommentsParameters = {
            limit: 5,
            depth: 2
        };

        // need to display as tree structure
        getComments(
            postId,
            getCommentsParameters.limit,
            getCommentsParameters.depth,
            function(commentsArray){
                console.log(commentsArray);

                /**
                 * Why is this 0?
                 *
                 * Possible reasons:
                 *  1. some wacky async <-- this one
                 *  2. javascript is wack <-- this one too
                 */
                console.log("commmentsArray length: " + commentsArray.length);

                for(var i = 0; i < commentsArray.length; i++){
                    //console.log("attempting to display comment tree: " + i);
                    displayComments(commentsArray[i]);
                }
            }
        );


    });
});

/**
 * For each root comment
 *  1. append an empty .comment-box
 *  2. append root comment inside .comment-box
 *      with id=root_comment_id + "-box"
 *  3. for rest of the values,
 *      append each value to the parentId element
 *
 */
function displayComments(commentsArray){
    var commentBox = commentsArray[0];
    var rootComment = commentsArray[1];

    $(document.getElementById("display-comments"))
        .append(commentBox); // commentBox has an id=root_comment_id + "-box"

    //console.log("#" + rootComment["id"] + "-box");

    waitForElementToDisplay("#" + rootComment.id + "-box", 10, function(comment){
        $(document.getElementById(comment.id + "-box")).append(comment.html);

    }, rootComment);

    for(var i = 2; i < commentsArray.length; i++){
        waitForElementToDisplay("#" + commentsArray[i].parentId, 10, function(comment){
            $(document.getElementById(comment.parentId)).append(comment.html)
        }, commentsArray[i]);
    }
}

// unused
function waitForElementToDisplay(selector, time, f, comment){
    if(document.querySelector(selector) != null){
        f(comment);
        return;
    }else{
        setTimeout(function(){

            console.log("selector not ready yet, retrying in " + time + " ms...");

            waitForElementToDisplay(selector, time);
        }, time);
    }
}


function getComments(postId, limit, depth, callback){
    var htmlToOrder = [];

    $.get("/comments", {
        postId: postId,
        limit: limit,
        depth: depth
    }, function(data){

        /**
         * display comments on right hand side column
         */

        var comments = data.comments;
        //console.log(comments);

        for(var i = 0; i < comments.length; i++){
            htmlToOrder.push(commentsBFS(comments[i]));
        }

        // callback here - get is async
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
                        "<div class=\"comment-username col-xs-4 col-md-4\">" +
                            "<p>" +
                                node["author"] +
                            "</p>" +
                        "</div>" +

                        "<div class=\"comment-score col-xs-2 col-md-2 bold\">" +
                            "<p>" +
                                node["score"] +
                            "</p>" +
                        "</div>" +

                        "<div class=\"comment-time col-xs-6 col-md-6\">" +
                            "<p>" +
                                node["created_utc"] +
                            "</p>" +
                        "</div>" +
                    "</div>" +

                    "<div class=\"comment-body row\">" +
                        "<div class=\"col-xs-12 col-md-12 bold\">" +
                            "<p class=\"large-comment-font\">" +
                                node["body"] +
                            "</p>" +
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
    // windowHeight not used, nav bar always 24px
    //var windowHeight = $(window).height();
    var mouseX = event.clientX;
    var mouseY = event.clientY;

    if(mouseX <= windowWidth * 0.44 && mouseY <= 50 && !navToggle){
        $("#nav").animate({
            marginTop: 0
        }, 300, "swing");

        // callback not working? but toggling the flag here works though
        navToggle = true;
        //console.log(navToggle);

    }else if(navToggle && (mouseX > windowWidth * 0.44 || mouseY > 50)){

        $("#nav").animate({
            marginTop: "-40px"
        }, 300, "swing");

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

        /*if(i % 2 !== 0){
            formattedPost += "<div class=\"row border-bottom border-top single-post\">"
        }else{
            formattedPost += "<div class=\"row single-post\">"
        }*/
        formattedPost += "<div class=\"row single-post\">";
        formattedPost +=
            //"<div class=\"col-md-2 col-xs-2 center-upvotes upvote-styling bold\">"
                //+ "<p>" + redditPosts[i].score + "</p>"
            //+ "</div>"+
            "<div class=\"col-md-12 col-xs-12\">"
                + "<a href=\"" + post.url + "\">"
                    + "<p class=\"reddit-title\">" + post.title + "</p>"
                + "</a>"

                + "<div class=\"row extra-post-info\">"

                    + "<div class=\"col-md-2 col-xs-2 bold post-upvotes\">"
                        + "<img class=\"upvote-icon\" src=\"images/upvote-icon.png\" alt=\"upvotes\">"
                        + "<p> " + post.score + "</p>"
                    + "</div>"

                    + "<div class=\"col-md-2 col-xs-2\">"
                        + "<a href=\"https://www.reddit.com/user/" + post.author + "\">"
                            + "<p>" + post.author + "</p>"
                        + "</a>"
                    + "</div>"

                    + "<div class=\"col-md-2 col-xs-2\">"
                        + "<p>" + post.created + "</p>"
                    + "</div>"

                    + "<div class=\"col-md-3 col-xs-3 bold subreddit-link\">"
                        + "<a href=\"https://www.reddit.com/" + post.subreddit + "\">"
                            + "<p>" + post.subreddit + "</p>"
                        + "</a>"
                    + "</div>"

                    + "<div class=\"col-md-3 col-xs-3 bold \">"
                        //+ "<a href=\"https://www.reddit.com/" + post.permalink + "\">"
                        + "<a>"
                            + "<p class=\"comment-link\" id=\"" + post.id + "\">" + post.comments + " comments</p>"
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

