const { default: mongoose, Types, isValidObjectId } = require("mongoose");
const { asyncHandler } = require("../utils/asyncHandler");
const { apiResponse } = require("../utils/apiResponse");
const { apiError } = require("../utils/apiError");
const Like = require("../model/like.model");
const Video = require("../model/video.model");
const Comment = require("../model/comment.model");
const Tweet = require("../model/tweet.model");

const toggleLike = async (Model, resourceId, userId) => {
  if (!isValidObjectId(resourceId))
    throw new apiError(400, "Invalid Resource Id");
  if (!isValidObjectId(userId)) throw new apiError(400, "Invalid  UserId");

  const resource = await Model.findById(resourceId);
  if (!resource) throw new apiError(404, "No Resource Found");

  const resourceField = Model.modelName.toLowerCase();

  const isLiked = await Like.findOne({
    [resourceField]: resourceId,
    likedBy: userId,
  });

  var response;
  try {
    response = isLiked
      ? await Like.deleteOne({ [resourceField]: resourceId, likedBy: userId })
      : await Like.create({ [resourceField]: resourceId, likedBy: userId });
  } catch (error) {
    console.error("toggleLike error ::", error);
    throw new apiError(
      500,
      error?.message || "Internal server error in toggleLike"
    );
  }

  const totalLikes = await Like.countDocuments({ [resourceField]: resourceId });

  return { response, isLiked, totalLikes };
};

const toggleLikeOnVideo = asyncHandler(async (req, res) => {
  // const { videoId } = req.params;

  // if (!mongoose.Types.ObjectId.isValid(videoId)) {
  //   throw new apiError(401, "Video ID is not valid");
  // }

  // let isLiked = await Like.findOne({
  //   video: videoId,
  //   likedBy: req.user?._id,
  // });

  // if (isLiked) {
  //   const unlike = await Like.findByIdAndDelete(isLiked._id);

  //   if (!unlike) {
  //     throw new apiError(401, "error on unliking this video");
  //   }

  //   isLiked = null;
  // } else {
  //   const like = await Like.create({
  //     video: videoId,
  //     likedBy: req.user?._id,
  //   });

  //   if (!like) {
  //     throw new apiError(401, "error on liking this video");
  //   }

  //   isLiked = like;
  // }

  // const isUserLiked = !!isLiked;

  // return res
  //   .status(200)
  //   .json(new apiResponse(200, isUserLiked, "toggle the like on video"));

  const { videoId } = req.params;
  const { response, isLiked, totalLikes } = await toggleLike(
    Video,
    videoId,
    req.user?._id
  );

  // get total Likes on videos

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { response, totalLikes },
        isLiked === null ? "Liked successfully" : "remove liked successfully"
      )
    );
});

const toggleLikeOnComment = asyncHandler(async (req, res) => {
  // const { commentId } = req.params;

  // if (!mongoose.Types.ObjectId.isValid(commentId)) {
  //   throw new apiError(401, "Comment ID is not valid");
  // }

  // let isLiked = await Like.findOne({
  //   comment: commentId,
  //   likedBy: req.user?._id,
  // });

  // if (isLiked) {
  //   const unlike = await Like.findByIdAndDelete(isLiked._id);

  //   if (!unlike) {
  //     throw new apiError(401, "error on unliking this comment");
  //   }

  //   isLiked = null;
  // } else {
  //   const like = await Like.create({
  //     comment: commentId,
  //     likedBy: req.user?._id,
  //   });

  //   if (!like) {
  //     throw new apiError(401, "error on liking this comment");
  //   }

  //   isLiked = like;
  // }

  // const isUserLiked = !!isLiked;

  // return res
  //   .status(200)
  //   .json(new apiResponse(200, isUserLiked, "toggle the like on comment"));

  const { commentId } = req.params;
  const { response, isLiked, totalLikes } = await toggleLike(
    Comment,
    commentId,
    req.user?._id
  );
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { response, totalLikes },
        isLiked === null ? "Liked successfully" : "remove liked successfully"
      )
    );
});

const toggleLikeOnTweet = asyncHandler(async (req, res) => {
  // const { tweetId } = req.params;

  // if (!mongoose.Types.ObjectId.isValid(tweetId)) {
  //   throw new apiError(401, "tweet ID is not valid");
  // }

  // let isLiked = await Like.findOne({
  //   tweet: tweetId,
  //   likedBy: req.user?._id,
  // });

  // if (isLiked) {
  //   const unlike = await Like.findByIdAndDelete(isLiked._id);

  //   if (!unlike) {
  //     throw new apiError(401, "error on unliking this tweet");
  //   }

  //   isLiked = null;
  // } else {
  //   const like = await Like.create({
  //     tweet: tweetId,
  //     likedBy: req.user?._id,
  //   });

  //   if (!like) {
  //     throw new apiError(401, "error on liking this tweet");
  //   }

  //   isLiked = like;
  // }

  // const isUserLiked = !!isLiked;

  // return res
  //   .status(200)
  //   .json(new apiResponse(200, isUserLiked, "toggle the like on tweet"));

  const { tweetId } = req.params;

  const { response, isLiked, totalLikes } = await toggleLike(
    Tweet,
    tweetId,
    req.user?._id
  );

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { response, totalLikes },
        isLiked === null ? "Liked successfully" : "remove liked successfully"
      )
    );
});

const getAllLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  if (!req.user?._id) throw new apiError(401, "Unauthorized Request");
  const userId = req.user?._id;

  const videoPipeline = [
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
          {
            $addFields: {
              videoFile: "$videoFile",
            },
          },
          {
            $addFields: {
              thumbnail: "$thumbnail",
            },
          },
        ],
      },
    },
    {
      $unwind: "$video",
    },
    {
      $replaceRoot: {
        newRoot: "$video",
      },
    },
  ];

  try {
    const likedVideos = await Like.aggregate(videoPipeline);
    const likedVideosCount = likedVideos.length;
    // Prepare the response object
    const response = {
      likedVideos,
      likedVideosCount,
    };
    return res
      .status(200)
      .json(
        new apiResponse(200, response, "liked videos fetched successfully")
      );
  } catch (error) {
    console.error("getLikedVideos error ::", error);
    throw new apiError(
      500,
      error?.message || "Internal server error in getLikedVideos"
    );
  }
});

module.exports = {
  toggleLikeOnVideo,
  toggleLikeOnComment,
  toggleLikeOnTweet,
  getAllLikedVideos,
};

// const getAllLikedVideos = asyncHandler(async (req, res) => {
//   const likedVideos = await Like.aggregate([
//       {
//           $match: { likedBy: req.user?._id }
//       },
//       {
//           $lookup: {
//               from: "videos",
//               localField: "video",
//               foreignField: "_id",
//               as: "video"
//           }
//       }
//   ]);

//   if (likedVideos.length === 0) {
//       return res.status(201).json(new apiResponse(201, [], "There are no videos liked by the user"));
//   } else {
//       return res.status(200).json(new apiResponse(200, likedVideos, "All videos fetched successfully"));
//   }
// });
