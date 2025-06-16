const { default: mongoose } = require("mongoose");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require("../model/user.model");
const Comment = require("../model/comment.model");
const Tweet = require("../model/tweet.model");
const Like = require("../model/like.model");
const Subscription = require("../model/subscription.model");
const Video = require("../model/video.model");
const Playlist = require("../model/playlist.model");
const { apiError } = require("../utils/apiError");
const { apiResponse } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const {
  uploadOnCloudinary,
  deleteOnCloudinary,
} = require("../utils/cloudinary");
const jwt = require("jsonwebtoken");

const generateRefreshandAccessToken = async (userId) => {
  try {
    const user = await User.findOne(userId);
    const refreshToken = await user.generateRefreshToken();
    const accessToken = await user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      "Something went wrong to generate access and refresh token"
    );
  }
};

const userRegister = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  if (
    [fullname, email, password, username].some((field) => field.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ username: username });

  if (existedUser) {
    throw new apiError(400, "Username or Email has already been used");
  }

  let userDoc = new User({
    username,
    email,
    fullname,
    password,
  });

  // const token = await userDoc.generateAccessToken();
  const token = await userDoc.generateRefreshToken();
  // Save the token to the user document
  userDoc.token = token;

  const avatarPath = req.files?.avatar[0]?.path;

  if (!avatarPath) {
    throw new apiError(400, "Avatar image is required");
  }
  const avatar = await uploadOnCloudinary(avatarPath);

  let coverImageLocalPath;
  const coverPath = req.files?.cover[0]?.path;
  if (
    req.files &&
    Array.isArray(req.files.cover) &&
    req.files.cover.length > 0
  ) {
    coverImageLocalPath = req.files.cover[0].path;
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  const user = await User.create({
    fullname,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    refreshToken: token,
  });

  const createdUser = await User.findById(user._id).select(
    "-password  -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "Something went wrong. Please try again later");
  }

  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User registered successfully"));
});

const userLogin = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new apiError(400, "Please provide email or username");
  }

  const user = await User.findOne({ $or: [{ email }, { username }] });

  if (!user) {
    throw new apiError(400, "User not found");
  }
  // Validate user credentials
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new apiError(400, "Password is incorrect");
  }
  // Generate access token
  const accessToken = await user.generateAccessToken(user._id);
  const refreshToken = await user.generateRefreshToken(user._id);

  if (!user.refreshToken) {
    user.refreshToken = refreshToken;
    await user.save();
  }
  // Set options for the cookie
  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };
  // Set the access token in a cookie
  res
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions);

  // Send the response
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { user: { username: user.username, email: user.email } },
        "User logged in successfully"
      )
    );
});

const userLogout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // remove this field from document
      },
    },
    {
      new: true, //return the updated doc
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new apiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const validateToken = req.body.refreshToken;
  if (!validateToken) {
    throw new apiError(401, "Invalid refresh token");
  }

  const decoded = jwt.verify(validateToken, process.env.REFRESH_TOKEN);

  const user = await User.findById(decoded?.id);

  if (!user) {
    throw new apiError(401, "unauthorized request");
  }

  if (validateToken !== user?.refreshToken) {
    throw new apiError(401, "refresh token is expired or used");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  const { accessToken, newRefreshToken } = await generateRefreshandAccessToken(
    user._id
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new apiResponse(
        200,
        { accessToken, refreshToken: newRefreshToken },
        "Access token refreshed"
      )
    );
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new apiError(404, "User not found");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new apiError(401, "You entered the wrong password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new apiResponse(200, user, "password changed successfully"));
});

const changeAvatar = asyncHandler(async (req, res) => {
  const avatarPath = req.file?.path;

  if (!avatarPath) {
    throw new apiError(400, "Invalid avatar path");
  }

  // delete previous saved image from the cloudinary

  const oldUser = req.user?._id;
  const oldDetails = await User.findById(oldUser);
  const oldAvatarImageUrl = oldDetails.avatar;
  await deleteOnCloudinary(oldAvatarImageUrl);

  //uploaded the latest image
  const avatar = await uploadOnCloudinary(avatarPath);

  if (!avatar.url) {
    throw new apiError(400, "Avatar url is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "avatar image updated successfully"));
});

const changeCover = asyncHandler(async (req, res) => {
  const coverPath = req.file?.path;

  if (!coverPath) {
    throw new apiError(400, "Invalid cover path");
  }

  //todo delete previous saved image from the cloudinary
  const oldUser = req.user?._id;
  const oldDetails = await User.findById(oldUser);
  const oldCoverImageUrl = oldDetails.coverImage;
  await deleteOnCloudinary(oldCoverImageUrl);

  //upload latest cover image
  const cover = await uploadOnCloudinary(coverPath);

  if (!cover.url) {
    throw new apiError(400, "cover image url is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: cover.url } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "cover image updated successfully"));
});

const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "User details fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new apiError(401, "Invalid fullname or email");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  await user.save();

  return res
    .status(200)
    .json(new apiResponse(200, user, "User fields are updated"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new apiError(403, "Invalid username");
  }

  const channel = await User.aggregate([
    { $match: { username: username?.toLowerCase() } },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        username: 1,
        email: 1,
        fullname: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  console.log("aggregation result is", channel);
  if (!channel?.length) {
    throw new apiError(404, "Channel does not exist");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    const user = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.user._id) }, // Match by user ID directly
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
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
          ],
        },
      },
    ]);

    if (!user || user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          user[0].watchHistory,
          "watch history fetched successfully"
        )
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const user = await User.findByIdAndDelete(userId);

  if(!user){
    throw new apiError(401,"could not delete the user")
  }

  const deletePromises = [
    Comment.deleteMany({owner:userId}),
    Tweet.deleteMany({owner:userId}),
    Like.deleteMany({owner:userId}),
    Playlist.deleteMany({owner:userId}),
    Video.deleteMany({owner:userId}),
    Subscription.deleteMany({ $or: [{ subscriber: userId }, { channel: userId }] })
  ]

  try {
    await Promise.all(deletePromises);
    return res.status(200).json(new apiResponse(200, {}, "User deleted successfully"));
  } catch (error) {    
    console.error("Error deleting user-related data:", error);
    throw new apiError(500, "Could not delete user data");
  }
});

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    // Configure your email service provider here
    // Example for Gmail:
    service: "gmail",
    port: 485,
    auth: {
      user: "pratham.sunami@adglobal360.com", // generated ethereal user
      pass: "opuwhkovikbdpbkj", // generated ethereal password
    },
  });
  // Email data
  const mailOptions = {
    from: `Youtube Officials <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

const forgetPassword = asyncHandler(async (req, res) => {
 
  // const { email } = req.body;
  const userId = req.user?._id

  // Check if email exists
  const user = await User.findById(userId);

  if (!user) {
    throw new apiError(404, 'User does not exist');
  }

  // Generate verification code
  const verificationCode = crypto.randomBytes(3).toString('hex');

  // Save verification code in user document
  user.resetPasswordToken = crypto.createHash('sha256').update(verificationCode).digest('hex');
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes
  await user.save();

  // Compose email message
  const message = `Your verification code for resetting the password is: ${verificationCode}`;

  // Send verification code to user's email
  await sendEmail({
    email: user.email,
    subject: 'Password Reset Verification Code',
    message,
  });

  // Send response
  res.status(200).json({
    success: true,
    message: 'Verification code sent to your email for password reset',
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const {email, verificationCode, newPassword } = req.body;
  const userId = req.user?._id
  // Find user by email and verification code
  const user = await User.findOne({
    email,
    resetPasswordToken: crypto.createHash('sha256').update(verificationCode).digest('hex'),
    resetPasswordExpire: { $gt: Date.now() }, // Check if verification code is not expired
  });

  if (!user) {
    throw new apiError(400, 'Invalid or expired verification code');
  }

  // Update user's password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Send response
  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
  });
});


module.exports = {
  userRegister,
  userLogin,
  userLogout,
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
};
