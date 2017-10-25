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


router.use(function timeLog(req, res, next){
    //console.log("time: ", Date.now());
    next();
});

/* GET home page. */
router.get('/', function(req, res, next){
    res.render('index', {title: 'Express'});
});

router.get('/redditRall', function(req, res){
    var limit = parseInt(req.query.limit);
    console.log("limit: " + limit);
    console.log("typeof(limit): " + typeof limit);

    // have to wait generating before we send
    fetch10HotPostsAll(limit, function(hotPosts){
        res.send(hotPosts);
    });

});

function fetch10HotPostsAll(limit, callback){
    return fetchTopHotPosts('all', limit, callback);
}

function fetchTopHotPosts(subreddit, limit, callback){
    console.log("subreddit: " + subreddit);
    console.log("limit: " + limit);

    if(limit % 10 != 0){
        console.log("input limit: " + limit + " NOT DIVISIBLE BY 10");
    }

    r.getSubreddit(subreddit).getHot({
        limit: 10
    }).then(hotPosts => {

        var numberHotPosts = hotPosts.length;
        console.log("Number of hotPosts fetched: " + numberHotPosts);
        //console.log(hotPosts);

        if(numberHotPosts >= 10){
            //return hotPosts.slice(numberHotPosts - 10);
            hotPosts = hotPosts.slice(numberHotPosts - 10);
            callback(hotPosts);
        }else if(numberHotPosts >= 1){
            callback(hotPosts);
        }else{
            // failure to fetch >> error message generated
            console.log("fetchTopHotPosts WENT WRONG");
            callback(hotPosts);
        }

    });
}








module.exports = router;
