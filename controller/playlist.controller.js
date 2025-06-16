const { default: mongoose, Types, isValidObjectId } = require("mongoose");
const { apiError } = require("../utils/apiError");
const { apiResponse } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const Playlist = require("../model/playlist.model");
const Video = require("../model/video.model");

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!(name && description)) {
    throw new apiError(401, "All details required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new apiError(500, "something went wrong while creating playlist");
  }

  //   playlist.owner = req.user?._id;
  //   await playlist.save();

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "playlist created"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;
  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
    throw new apiError(401, "Invalid ID provided");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new apiError(404, " playlist not found");
  }
  if (!playlist?.video?.includes(videoId)) {
    playlist.video.push(videoId);
    await playlist.save();
  }

  // add video to playlist alternate method
  // const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
  //     $push: { videos: videoId },
  // });

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "video added successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId))
    throw new apiError(401, "Invalid video or playlist Id");

  const video = await Video.findById(videoId, { _id: 1 });
  if (!video) throw new apiError(404, "video not found");

  const playlist = await Playlist.findById(playlistId, { _id: 1, videos: 1 });
  if (!playlist) throw new apiError(404, "Playlist Not found");

  const isVideoInPlaylist = await Playlist.findOne({
    _id: playlistId,
    video: videoId,
  });
  
  if (!isVideoInPlaylist)
    throw new apiError(404, "Video not found in playlist");

  const removedVideoPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!removedVideoPlaylist) throw new apiError(500, "playlist not updated");
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        removedVideoPlaylist,
        "Video removed from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new apiError(401, "Invalid playlist id");
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId);

  if (!playlist) {
    throw new apiError(401, "Error while deleting the playlist");
  }

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { playlistId } = req.params;

  if (!(name && description)) {
    throw new apiError(401, "All details are required");
  }
  if (!isValidObjectId(playlistId)) {
    throw new apiError(401, "Invalid playlist Id");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    { $new: true }
  );

  if (!playlist) {
    throw new apiError(401, "Could not update playlist");
  }

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist updated successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new apiError(401, "Invalid playlist ID");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(playlistId) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videos",
      },
    },
  ]);

  if (!playlist?.length) {
    throw new apiError(401, "Could not fetch playlist");
  }

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist fetched succcessfully"));
});

const getUserPlaylist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!isValidObjectId(userId)) {
    throw new apiError(401, "Invalid user Id");
  }

  const playlist = await Playlist.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videos",
      },
    },
  ]);

  if (!playlist?.length) {
    throw new apiError(401, "Could not fetch user playlist");
  }

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "User playlist fetched successfully"));
});

module.exports = {
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
  getPlaylistById,
  getUserPlaylist,
};
//create playlist
//add video to playlist
//remove video from playlist
//delete playlist
//update playlish
//get playlist by id
//get user playlist
