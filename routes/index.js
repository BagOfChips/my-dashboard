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


router.use(function timeLog(req, res, next){
    //console.log("time: ", Date.now());
    next();
});

/* GET home page. */
router.get('/', function(req, res, next){
    res.render('index', {title: 'Express'});
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
            // failure to fetch >> error message generated
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
