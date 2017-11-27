var express = require('express');
var router = express.Router();

// import reddit api wrapper
var snoowrap = require('snoowrap');
const r = new snoowrap({
    userAgent: process.env.reddit_userAgent,
    clientId: process.env.reddit_clientId,
    clientSecret: process.env.reddit_clientSecret,
    refreshToken: process.env.reddit_refreshToken
});

var timeAgo = require('epoch-to-timeago').timeAgo;
var finish = require('finish');


router.use(function timeLog(req, res, next){
    //console.log("time: ", Date.now());
    next();
});

/* GET home page. */
router.get('/', function(req, res, next){
    res.render('index', {title: 'Reddit - on one page'});
});



// implement multiple tabs
router.get("/fetchHot", function(req, res){
    var subreddit = req.query.subreddit;
    var limit = parseInt(req.query.limit);
    console.log("limit: " + limit);
    console.log("typeof(limit): " + typeof limit);

    // have to wait generating before we send
    fetchTopHotPosts(subreddit, limit, function(hotPosts){
        res.send(hotPosts);
    });

});


router.get('/redditRall', function(req, res){
    var limit = parseInt(req.query.limit);
    console.log("limit: " + limit);
    console.log("typeof(limit): " + typeof limit);

    // have to wait generating before we send
    fetch25HotPostsAll(limit, function(hotPosts){
        res.send(hotPosts);
    });

});



// get comments, given id and # of comments (limit)
router.get('/comments', function(req, res){
    var limit = parseInt(req.query.limit);
    console.log("limit: " + limit);
    console.log("typeof(limit): " + typeof limit);

    var depth = parseInt(req.query.depth);
    console.log("depth: " + depth);
    console.log("typeof(depth): " + typeof depth);

    var postId = req.query.postId;
    console.log(postId);

    fetchTopComments(postId, limit, depth, function(comments){
        res.send(comments);
    });
});

router.get("/postInfo", function(req, res){
    var postId = req.query.postId;
    console.log(postId);

    var attribute = req.query.attribute;
    console.log("attribute to fetch from: " + postId + "\n  " + attribute);

    fetchPostAttribute(postId, attribute, function(data){
        res.send(data);
    });
});

function fetchPostAttribute(postId, attribute, callback){
    r.getSubmission(postId)[attribute]
        .then(post => {
            //console.log("sending postInfo: " + post[attribute]);
            //callback(post[attribute]);
            console.log("sending postInfo: " + post);
            callback(post);
        });
}

function fetchTopComments(postId, limit, depth, callback){
    console.log("limit: " + limit);

    r.getSubmission(postId).expandReplies({
        limit: limit,
        depth: depth // limit this as well
    }).then(comments => {

        var numberComments = comments.comments.length;
        console.log("Number of comments fetched: " + numberComments);
        //console.log(comments);

        /**
         * reddit API will not always fetch
         *  - wanted # of comments (limit)
         *  - wanted # of subsequent replies (depth)
         *
         * leave as front end issue - LOL
         */

        if(numberComments > 0){

            // use finish module to handle for loops async
            finish(function(async){
                  comments.comments.forEach(function(commentTree){
                      async(function(done){
                            convertRedditCommentsEpochTimes(commentTree, done);
                      });
                  });
            }, function(err, res){
                // err and res are "returned" as null by default, ignore
                callback(comments);
            });

        }else{
            // failure to fetch >> todo: error message generated
            console.log("fetchTopComments WENT WRONG");
            callback(null);
        }
    });
}

/**
 * Implement dfs on a list tree
 * f# pseudo code below
 * ****************************
 * ****************************

     // depth first traversal on a ListTree graph
     let rec depthFirstIter f (Node(x, ts)) =
         (printf "\n");
         (f x);  // print node
         (List.iter (depthFirstIter f) ts)

 * ****************************
 * Note: there may be a speed issue
 *  because the internet told me javascript sucks as recursion
 *
 * Tested:
 *  Fetching 400 comments
 *
 *  w/o this method: 1.21 seconds
 *  w/ this method 1.29 seconds
 *
 * Conclusion:
 *  Dont give a shit
 *  Cuz the reddit api will always be the upper bound when a get call is made
 *
 * @param comments
 * @returns {*}
 */
function convertRedditCommentsEpochTimes(commentRoot, callback){
    var now = new Date().getTime();
    //console.log("now: " + now);

    commentRoot.created_utc = timeAgo(commentRoot.created_utc * 1000, now);
    for(var i = 0; i < commentRoot.replies.length; i++){

        // use finish module to handle for loops async
        finish(function(async){
            async(function(done){
                convertRedditCommentsEpochTimes(commentRoot.replies[i], done);
            });
        }, function(err, res){
            // nothing happens here?
            //console.log(res);
        })
    }

    callback(null, null);
}


// removing keys seems to be REALLY slow when done recursively on deep objects
// unused
var keysToRemove = [
    "approved_at_utc",
    "approved_by",
    "archived",
    "author_flair_css_class",
    "author_flair_text",
    "banned_at_utc",
    "banned_by",
    "body_html",
    "can_gild",
    "can_mod_post",
    "collapsed",
    "collapsed_reason",
    "controversiality",
    "distinguished",
    "likes",
    "mod_reports",
    "num_reports",
    "removal_reason",
    "report_reasons",
    "saved",
    "subreddit_type",
    "user_reports"
];

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

function fetch25HotPostsAll(limit, callback){
    return fetchTopHotPosts('all', limit, callback);
}

function fetchTopHotPosts(subreddit, limit, callback){
    console.log("subreddit: " + subreddit);
    console.log("limit: " + limit);

    r.getSubreddit(subreddit).getHot({
        limit: limit
    }).then(hotPosts => {

        // convert epoch times to readable human string
        hotPosts = convertRedditListEpochTimes(hotPosts);

        var numberHotPosts = hotPosts.length;
        console.log("Number of hotPosts fetched: " + numberHotPosts);
        //console.log(hotPosts);

        if(numberHotPosts = limit){
            hotPosts = hotPosts.slice(numberHotPosts - 25);
            callback(hotPosts);
        }else if(numberHotPosts >= limit - 25){
            hotPosts = hotPosts.slice(numberHotPosts - (limit - 25));
            callback(hotPosts);
        }else{
            // failure to fetch >> todo: error message generated
            console.log("fetchTopHotPosts WENT WRONG");
            callback(null);
        }

    });
}

function convertRedditListEpochTimes(posts){
    var now = new Date().getTime();
    console.log("now: " + now);
    for(var i = 0; i < posts.length; i++){
        //console.log("created: " + posts[i].created_utc);
        posts[i].created_utc = timeAgo(posts[i].created_utc * 1000, now);
    }
    return posts;
}

module.exports = router;
