const express = require("express");
const { verifyJWT } = require("../middleware/auth.middleware");
const { upload } = require("../middleware/multer.middleware");
const {
  getAllVideos,
  publishVideo,
  getVideoByID,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} = require("../controller/video.controller");

const videoRouter = express.Router();

videoRouter.route("/publish-video").post(
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  verifyJWT,
  publishVideo
);

videoRouter.route("/video-details/:videoId").get(verifyJWT, getVideoByID);

videoRouter
  .route("/edit-video/:videoId")
  .post(
    upload.fields([{ name: "thumbnail", maxCount: 1 }]),
    verifyJWT,
    updateVideo
  );

videoRouter.route("/delete/:videoId").delete(verifyJWT, deleteVideo);

videoRouter.route("/allvideos").get(verifyJWT, getAllVideos);

videoRouter
  .route("/publish-status/:videoId")
  .patch(verifyJWT, togglePublishStatus);

module.exports = videoRouter;
