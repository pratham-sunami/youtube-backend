const { default: mongoose, Types, isValidObjectId } = require("mongoose");
const {apiResponse} = require("../utils/apiResponse");
const {apiError} = require("../utils/apiError");
const {asyncHandler} = require("../utils/asyncHandler");
const User = require("../model/user.model");
const Comment = require("../model/comment.model");
const Video = require("../model/video.model");

//adding comment on the video
const addComment = asyncHandler(async (req, res) => {
  const { videoID } = req.query;
  const { commentBody } = req.body;
  const userID = req.user?._id;
  if (!commentBody) {
    throw new apiError(400, "Please enter your comment");
  }
  if (!isValidObjectId(videoID)) {
    throw new apiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoID);
  if (!video) {
    throw new apiError(404, "Video not found");
  }

  const user = await User.findById(userID).select("username avatar");
  if (!user) {
    throw new apiError(404, "User not found");
  }

  const comment = await Comment.create({
    content: commentBody,
    video: videoID,
    owner: userID,
  });

  return res
    .status(201)
    .json(new apiResponse(201, comment, "Comment added successfully"));
});

//updating the comment
const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { commentID } = req.params;
  const userID = req.user?._id;

  if (!content) {
    throw new apiError(400, "No new content provided for the comment");
  }
  if (!mongoose.isValidObjectId(commentID)) {
    throw new apiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentID);
  if (!comment) {
    throw new apiError(404, "Comment not found");
  }

  //this needs to be checked later  
  if (comment.owner.toString() !== userID.toString()) {
    throw new apiError(403, "You are not authorized to update this comment");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentID,
    { content },
    { new: true }
  );

  if (!updatedComment) {
    throw new apiError(500, "Something went wrong while updating the comment");
  }

  return res
    .status(200)
    .json(new apiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentID } = req.params;
  const userID = req.user?._id;

  if (!mongoose.isValidObjectId(commentID)) {
    throw new apiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentID);

  if (!comment) {
    throw new apiError(404, "Comment not found");
  } 

  if (comment.owner.toString() !== userID.toString()) {
    throw new apiError(403, "You are not authorized to delete this comment");
  }

  const deleteComment = await Comment.findByIdAndDelete(commentID);

  if (!deleteComment) {
    throw new apiError(404, "Something went wrong while deleting comment!");
  }

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Comment deleted successfully"));
});

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoID } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.isValidObjectId(videoID)) {
    throw new apiError(400, "Invalid video ID");
  }

  const aggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoID), // Corrected reference to mongoose.Types.ObjectId
      },
    },
  ]);

  try {
    const result = await Comment.aggregatePaginate(aggregate, { page, limit });
    return res
      .status(200)
      .json(
        new apiResponse(200, { result }, "Video Comment fetched successfully")
      );
  } catch (error) {
    throw error;
  }
});

module.exports = {
  addComment,
  updateComment,
  deleteComment,
  getVideoComments,
};
