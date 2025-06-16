const express = require("express");
const { verifyJWT } = require("../middleware/auth.middleware");
const { toggleLikeOnVideo,
    toggleLikeOnComment,
    toggleLikeOnTweet,
    getAllLikedVideos} = require("../controller/like.controller");

const likeRouter = express.Router();

likeRouter.route("/videoLike/:videoId").post(verifyJWT,toggleLikeOnVideo)

likeRouter.route("/commentLike/:commentId").post(verifyJWT,toggleLikeOnComment)

likeRouter.route("/tweetLike/:tweetId").post(verifyJWT,toggleLikeOnTweet)

likeRouter.route("/likedVideos").get(verifyJWT,getAllLikedVideos)


module.exports = likeRouter