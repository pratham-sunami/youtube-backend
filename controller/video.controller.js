const { default: mongoose, Types, isValidObjectId } = require("mongoose");
const Video = require("../model/video.model");
const User = require("../model/user.model");
const Comment = require("../model/comment.model");
const Playlist = require("../model/playlist.model");
const Like = require("../model/like.model");
const { apiError } = require("../utils/apiError");
const { apiResponse } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const {
  uploadOnCloudinary,
  deleteOnCloudinary,
} = require("../utils/cloudinary");

// const getAllVideos = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
//   // Construct the filter object based on the provided query parameters
//   const filter = {};

//   // Add any additional filters based on your requirements
//   if (userId) {
//     filter.owner = userId;
//   }

//   if (query) {
//     filter.$or = [
//       { title: { $regex: query, $options: "i" } },
//       { description: { $regex: query, $options: "i" } },
//     ];
//   }

//   // Perform the database query to fetch videos
//   const videos = await Video.find(filter)
//     .sort({ [sortBy || "createdAt"]: sortType === "desc" ? -1 : 1 })
//     .skip((page - 1) * limit)
//     .limit(limit);

//   if (!videos) {
//     throw new apiError(400, "error while fetching all videos");
//   }

//   return res
//     .status(200)
//     .json(new apiResponse(200, videos, "videos fetched successfully"));
// });

const getAllVideos = asyncHandler(async (req, res) => {
  // TODO: get all videos based on query, sort, pagination
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = 1,
    userId,
  } = req.query;

  // dont use await because it will be not able to populate properly with aggregate pipeline in the next step
  const matchCondition = {
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
  };

  if (userId) {
    matchCondition.owner = new mongoose.Types.ObjectId(userId);
  }

  var videoAggregate;
  try {
    videoAggregate = Video.aggregate([
      {
        $match: matchCondition,
      },

      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                _id: 1,
                fullname: 1,
                avatar: 1,
                username: 1,
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
        $sort: {
          [sortBy || "createdAt"]: parseInt(sortType) || 1,
        },
      },
    ]);
  } catch (error) {
    console.error("Error in aggregation:", error);
    throw new apiError(
      500,
      error.message || "Internal server error in video aggregation"
    );
  }

  const options = {
    page,
    limit,
    customLabels: {
      totalDocs: "totalVideos",
      docs: "videos",
    },
    skip: (page - 1) * limit,
    limit: parseInt(limit),
  };

  Video.aggregatePaginate(videoAggregate, options)
    .then((result) => {
      if (result?.videos?.length === 0 && userId) {
        return res
          .status(200)
          .json(new apiResponse(200, [], "No videos found"));
      }

      return res
        .status(200)
        .json(new apiResponse(200, result, "video fetched successfully"));
    })
    .catch((error) => {
      console.log("error ::", error);
      throw new apiError(
        500,
        error?.message || "Internal server error in video aggregate Paginate"
      );
    });
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;
  const userID = req.user?._id;
  var videoFile;
  var thumbnailImage;
  try {
    if (![title, description].every(Boolean)) {
      throw new apiError(400, "All fields are required!");
    }

    const videoFilePath = req.files?.videoFile?.[0]?.path;

    if (!videoFilePath) {
      throw new apiError(400, "Video is required");
    }

    const videoFile = await uploadOnCloudinary(videoFilePath);

    if (!videoFile) {
      throw new apiError(500, "Failed to upload video!, try again");
    }

    let thumbnailLocalPath;

    if (
      req.files &&
      Array.isArray(req.files.thumbnail) &&
      req.files.thumbnail.length > 0
    ) {
      thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    }

    // Upload thumbnail image to Cloudinary
    const thumbnailImage = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnailImage) {
      throw new apiError(500, "Failed to upload thumbnail!, try again");
    }

    //   const isPublished = true;

    const video = await Video.create({
      title,
      description,
      duration: videoFile?.duration,
      owner: userID,
      videoFile: videoFile.url,
      thumbnail: thumbnailImage.url,
      isPublished,
    });

    if (!video) {
      throw new apiError(401, "Something went wrong while publishing video");
    }

    return res
      .status(201)
      .json(new apiResponse(200, { video }, "Video published successfully"));
  } catch (error) {
    try {
      if (videoFile?.url) await deleteOnCloudinary(videoFile?.url);
      if (thumbnailImage?.url) await deleteOnCloudinary(thumbnailImage?.url);
    } catch (error) {
      console.error("Error while deleting video :: ", error);
      throw new apiError(
        500,
        error?.message || "Server Error while deleting video from cloudinary"
      );
    }
    console.error("Error while publishing video :: ", error);
    throw new apiError(
      500,
      error?.message || "Server Error while uploading video"
    );
  }
});

// const getVideoByID = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;

//   if (!videoId) {
//     throw new apiError(401, "Video ID must be a valid");
//   }

//   const data = await Video.findById(videoId);

//   if (!data) {
//     throw new apiError(401, "error while fetching video");
//   }

//   return res
//     .status(200)
//     .json(new apiResponse(200, data, "video found successfully"));
// });

const getVideoByID = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new apiError(404, "Video not found");

  const findVideo = await Video.findById(videoId);
  if (!findVideo) throw new apiError(404, "Video not found");

  const user = await User.findById(req.user?._id, { watchHistory: 1 });
  if (!user) throw new apiError(404, "User not found");

  if(req.user?._id.toString() !== findVideo.owner.toString()){
     {
      await Video.findByIdAndUpdate(
        videoId,
        {
          $inc: { views: 1 },
        },
        {
          new: true,
        }
      );
    }
  }
  // adding video to watch history
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $addToSet: {
        watchHistory: videoId,
      },
    },
    {
      new: true,
    }
  );

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: "$avatar.url",
              fullName: 1,
              _id: 1,
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
        videoFile: "$videoFile.url",
      },
    },
    {
      $addFields: {
        thumbnail: "$thumbnail.url",
      },
    },
  ]);
  if (!video) throw new apiError(500, "Video detail not found");
  return res
    .status(200)
    .json(new apiResponse(200, video[0], "Fetched video successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { videoId } = req.params;
  const thumbnailPath = req.files?.thumbnail[0]?.path;

  if (!isValidObjectId(videoId)) {
    throw new apiError(401, "Video Id is not valid");
  }
  if (![title, description].every(Boolean)) {
    throw new apiError(401, "All fields are required");
  }

  const oldDataOfVideo = await Video.findById(videoId);  

  if (!oldDataOfVideo) {
    throw new apiError(401, "Could not fetch old data of video");
  }

  if (oldDataOfVideo?.owner?.toString() !== req.user?._id?.toString()){
    throw new apiError(401, "Unauthorized Request");
  }

  const oldThumbnailPath = oldDataOfVideo.thumbnail;

  if (!oldThumbnailPath) {
    throw new apiError(401, "No Thumbnail Found for this Video");
  }

  await deleteOnCloudinary(oldThumbnailPath);

  let thumbnail;
  if (thumbnailPath) {
    thumbnail = await uploadOnCloudinary(thumbnailPath);
  }

  if (!thumbnail && thumbnailPath) {
    throw new apiError(500, "Failed to upload thumbnail!, please try again");
  }

  const videoData = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: thumbnail.url,
      },
    },
    { $new: true }
  );

  if (!videoData) {
    throw new apiError(401, "Error while updating details of video");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, videoData, "Successfully updated details of video")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new apiError(404, "Invalid video ID");
  }
  const videoData = await Video.findById(videoId);

  if (!videoData) {
    throw new apiError(404, "could not fetch video details");
  }

  if(req.user?._id.toString() !== videoData.owner.toString()){
    throw new apiError(404, "Unauthorised request");
  }

  const thumbnailPath = videoData.thumbnail;
  await deleteOnCloudinary(thumbnailPath);

  const videoPath = videoData.videoFile;
  await deleteOnCloudinary(videoPath);

  const data = await Video.findByIdAndDelete(videoId);

  if (!data) {
    throw new apiError(404, "Error while deleting video");
  }

  const updatePromises = [
    User.updateMany(
      { watchHistory: videoId },
      { $pull: { watchHistory: videoId } }
    ),
    Comment.deleteMany({ video: videoId }),
    Playlist.updateMany({ video: videoId }, { $pull: { video: videoId } }),
    Like.deleteMany({ video: videoId }),
  ];

  await Promise.all(updatePromises);

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new apiError(404, "Invalid video ID");
  }

  const video = await Video.findById(videoId, {
    _id: 1,
    isPublished: 1,
    owner: 1,
  });

  if (!video) {
    throw new apiError(404, "Could no find video details with this ID");
  }

  if (video?.owner?.toString() !== req.user?._id?.toString()){
    throw new apiError(401, "Unauthorized Request");
  }
  video.isPublished = !video.isPublished;

  // Save the updated video
  await video.save();

  // Respond with the updated video
  res.status(200).json({
    success: true,
    message: "Toggle status updated successfully",
    video: video,
  });
});

module.exports = {
  getAllVideos,
  publishVideo,
  getVideoByID,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
