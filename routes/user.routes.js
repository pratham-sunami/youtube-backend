const express = require("express");
const {
  userLogin,
  userLogout,
  userRegister,
  refreshAccessToken,
  changePassword,
  changeAvatar,
  changeCover,
  getUserDetails,
  updateAccountDetails,
  getUserChannelProfile,
  getWatchHistory,
  deleteUser,
  forgetPassword,
  resetPassword
} = require("../controller/user.controller");
const { upload } = require("../middleware/multer.middleware");
const { verifyJWT } = require("../middleware/auth.middleware");

const userRouter = express.Router();

userRouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  userRegister
);

userRouter.route("/login").post(userLogin);

userRouter.route("/logout").post(verifyJWT, userLogout);

userRouter.route("/refresh-token").post(refreshAccessToken);

userRouter.route("/change-password").post(verifyJWT, changePassword);

userRouter
  .route("/change-avatar")
  .post(verifyJWT, upload.single("avatar"), changeAvatar);

userRouter
  .route("/change-cover")
  .post(verifyJWT, upload.single("coverImage"), changeCover);

userRouter.route("/logged-in-user-details").get(verifyJWT, getUserDetails);

userRouter.route("/update-account").patch(verifyJWT, updateAccountDetails);

userRouter
  .route("/channel-info/:username")
  .get(verifyJWT, getUserChannelProfile);

userRouter.route("/watch-history").get(verifyJWT, getWatchHistory);

userRouter.route("/delete-user").delete(verifyJWT, deleteUser);

userRouter.route("/forget-password").post(verifyJWT, forgetPassword);

userRouter.route("/reset-password").post(verifyJWT, resetPassword);



module.exports = userRouter;
