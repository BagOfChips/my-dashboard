
$(document).ready(function(){

    // todo: animate loading page


    // fetch front page of reddit
    $.get("/redditRall", {
        limit: 10
    }, function(fetchedPosts){

        /**
         * tests:
         *  1. is front page fetched? - DONE
         *  2. is it displayed on the screen?
         */

        // parse returned data
        var trimmedPosts = trimPosts(fetchedPosts);


    });
});


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
            author: postData.author,
            title: postData.title,
            subreddit: postData.subreddit_name_prefixed,
            url: postData.url,
            score: postData.score,
            nsfw: postData.over_18,
        };
        trimmedPosts.push(post);
    }

    printObjectArray(trimmedPosts);
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

