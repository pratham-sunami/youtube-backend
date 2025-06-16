const express = require("express");
const { verifyJWT } = require("../middleware/auth.middleware");
const {
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
  getPlaylistById,
  getUserPlaylist,
} = require("../controller/playlist.controller");

const playlistRouter = express.Router();

playlistRouter.route("/create-playlist").post(verifyJWT, createPlaylist);

playlistRouter.route("/addvideo/:videoId/:playlistId").post(verifyJWT, addVideoToPlaylist);

playlistRouter.route("/removevideo/:videoId/:playlistId").post(verifyJWT, removeVideoFromPlaylist);

playlistRouter.route("/deleteplaylist/:playlistId").delete(verifyJWT, deletePlaylist);

playlistRouter.route("/updateplaylist/:playlistId").patch(verifyJWT, updatePlaylist);

playlistRouter.route("/getplaylist/:playlistId").get(verifyJWT, getPlaylistById);

playlistRouter.route("/userplaylist").get(verifyJWT, getUserPlaylist);

module.exports = playlistRouter;
