const express = require("express");
const { verifyJWT } = require("../middleware/auth.middleware");
const {createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets}= require("../controller/tweet.controller");

const tweetRouter = express.Router();

tweetRouter.route("/create-tweet").post(verifyJWT,createTweet);

tweetRouter.route("/update-tweet/:tweetId").patch(verifyJWT,updateTweet);

tweetRouter.route("/delete-tweet/:tweetId").delete(verifyJWT,deleteTweet);

tweetRouter.route("/user-tweet").get(verifyJWT,getUserTweets);


module.exports = tweetRouter