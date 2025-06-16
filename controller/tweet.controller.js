const { default: mongoose, Types, isValidObjectId } = require("mongoose");
const Tweet = require("../model/tweet.model");
const { apiResponse } = require("../utils/apiResponse");
const { apiError } = require("../utils/apiError");
const { asyncHandler } = require("../utils/asyncHandler");

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user?._id;

  if (!content) {
    throw new apiError(401, "Tweet content is required");
  }

  const tweet = await Tweet.create({
    content: content,
    owner: userId,
  });

  if (!tweet) {
    throw new apiError(401, "Error in creating tweet");
  }

  return res
    .status(201)
    .json(new apiResponse(201, tweet, "tweet created successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const tweetId = req.params.tweetId;
  const userId = req.user?._id;
  if (!content) {
    throw new apiError(401, "Tweet content is required");
  }

  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "tweet Id is invalid");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new apiError(404, "Tweet not found!");
  }

  if (tweet.owner.toString() !== userId.toString()) {
    throw new apiError(400, "User unauthorized to update this tweet");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!updatedTweet) {
    throw new apiError(400, "Something went wrong while updating");
  }

  return res
    .status(201)
    .json(
      new apiResponse(
        201,
        { tweet: updatedTweet },
        "Tweet updated successfully"
      )
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params.tweetId;
  const userId = req.user?._id;

  if (!isValidObjectId(tweetId)) {
    throw new apiError(401, "Tweet Id is not valid");
  }

  const tweetdetails = await Tweet.findById(tweetId);

  if (tweetdetails.owner.toString() !== userId.toString()) {
    throw new apiError(
      403,
      "You do not have permission to perform this action"
    );
  }

  const tweet = await Tweet.findByIdAndDelete(tweetId);

  if (!tweet) {
    throw new apiError(401, "Could not delete the Tweet");
  }

  return res.status(200).json(200, [], "Tweet deleted successfully");
});

const getUserTweets = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const tweet = await Tweet.find({ owner: userId });

  if (!tweet) {
    throw new apiError(400, "Could not find any tweet with this user");
  }

  return res
    .status(200)
    .json(new apiResponse(200, tweet, "Tweets fetched successfully"));
});

module.exports = {
  createTweet,
  updateTweet,
  deleteTweet,
  getUserTweets,
};
//create tweet
//update tweet
//delete tweet
//get user tweets
