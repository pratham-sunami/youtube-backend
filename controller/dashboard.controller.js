const { default: mongoose, Types, isValidObjectId } = require("mongoose");
const { apiError } = require("../utils/apiError");
const { apiResponse } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const Like = require("../model/like.model");
const Subscription = require("../model/subscription.model");
const Video = require("../model/video.model");
const Tweet = require("../model/tweet.model");
const Comment = require("../model/comment.model");

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes, total tweets etc.

    if(!req.user?._id) throw new apiError(404, "Unauthorized request");
    const userId = req.user?._id;

    const channelStats = [];

    // total video views
    const videos = await Video.find({ owner: userId });

    channelStats.push({totalVideos : videos.length});
    const totalViews = videos.reduce((acc, curr) => {
        return acc + curr.views
    }, 0);

    channelStats.push({views : totalViews});

    // total subscribers
    const userSubscriptions = await Subscription.find({ channel: userId });
    const totalSubscribers = userSubscriptions.length;
    channelStats.push({subscribers : totalSubscribers});

    //total comments by user
    const userComments = await Comment.find({ owner: userId });
    const totalComments = userComments.length;
    channelStats.push({totalComments : totalComments});

    // total Channel Subscribed by channel owner
    const ChannelSubscriptions = await Subscription.find({ subscriber: userId });
    const totalSubscribedChannel = ChannelSubscriptions.length;
    channelStats.push({ subscribedTo: totalSubscribedChannel });


    const totalUploadedVideos = videos.map(video => video._id);
    console.log("totalUploadedVideos ::", totalUploadedVideos);

    // total likes
    const likes = [];
    for (let videoId of totalUploadedVideos) {
        const likeDocument = await Like.find({ video: videoId });
        likes.push(likeDocument[0]);
    }

    channelStats.push({ totalLikes: likes.length });

    // total tweets
    const tweets = await Tweet.find({ owner: userId });
    channelStats.push({ totalTweets: tweets.length });

    //total liked videos,comments,tweets by user
    const likedvideos = await Like.find({ likedBy: userId });
    channelStats.push({ LikedByUser: likedvideos.length });

    return res.status(200)
        .json(
            new apiResponse(
                200,
                channelStats,
                "Channel stats fetched successfully"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!isValidObjectId(userId)) {
    throw new apiError(401, "Invalid userId ");
  }

  const videos = await Video.find({ owner: userId });

  if (!videos) {
    throw new apiError(401, "No Videos Found!");
  }

  return res
    .status(200)
    .json(new apiResponse(200, videos, "Channel videos fetched successfully "));
});

module.exports = {
  getChannelStats,
  getChannelVideos
};

// const getChannelStats = asyncHandler(async (req, res) => {
//   const { channelId } = req.params;
//   const userId = req.user?._id;

//   if (!isValidObjectId(channelId)) {
//     throw new apiError(401, "Invalid Channel ID");
//   }

//   const channelStats = [];

//   const totalSubscribers = await Subscription.aggregate([
//     {
//       $match: { channel: new mongoose.Types.ObjectId(channelId) },
//     },
//     {
//       $count: "totalSubscribers",
//     },
//   ]);

//   const totalVideos = await Video.aggregate([
//     {
//       $match: { owner: new mongoose.Types.ObjectId(userId) },
//     },
//     {
//       $count: "totalVideos",
//     },
//   ]);

//   const totalViewsOnVideo = await Video.aggregate([
//     {
//       $match: { owner: new mongoose.Types.ObjectId(userId) },
//     },
//     {
//       $group: {
//         _id: null,
//         totalVideoViews: { $sum: "$views" },
//       },
//     },
//   ]);

//   //   channelStats.push({totalVideos : videos.length});
//   //   const totalViews = videos.reduce((acc, curr) => {
//   //       return acc + curr.views
//   //   }, 0);

//   //   channelStats.push({views : totalViews});
//   const videos = await Video.find({ owner: userId });

//   const totalUploadedVideos = videos.map(video => video._id);
//   console.log("totalUploadedVideos ::", totalUploadedVideos);

//   const likes = [];
//   for (let videoId of totalUploadedVideos) {
//     const likeDocument = await Like.find({ video: videoId });
//     likes.push(likeDocument[0]);
//   }

//   channelStats.push({ totalLikes: likes.length });


// });
