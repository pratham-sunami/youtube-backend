const { default: mongoose, Types, isValidObjectId } = require("mongoose");
const { apiResponse } = require("../utils/apiResponse");
const { apiError } = require("../utils/apiError");
const { asyncHandler } = require("../utils/asyncHandler");
const Subscription = require("../model/subscription.model");

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(channelId)) {
    throw new apiError(401, "Invalid channel ID");
  }

  let isSubscribed = false;

  const subscription = await Subscription.findOne({
    channel: channelId,
    subscriber: userId,
  });

  if (subscription) {
    // User is already subscribed, so unsubscribe
    await Subscription.findByIdAndDelete(subscription._id);
  } else {
    // User is not subscribed, so subscribe
    await Subscription.create({
      channel: channelId,
      subscriber: userId,
    });
    isSubscribed = true; // User is now subscribed
  }

  return res
    .status(200)
    .json(new apiResponse(200, { isSubscribed }, "Success"));
});

const getUserChannelSubscriber = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(channelId)) {
      throw new apiError(401, "Channel Id is invalid");
    }

    const subscribers = await Subscription.aggregate([
      {
        $match: { channel: new mongoose.Types.ObjectId(`${channelId}`) },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscribers",
          pipeline: [
            {
              $project: {
                username: 1,
                fullname: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
            subscribers: {
                $first: "$subscribers"
            }
        }
    }
    ]);

    if (subscribers.length === 0) {
      throw new apiError(401, "There are no subscribers for this channel");
    }

    return res
      .status(200)
      .json(new apiResponse(200, subscribers, "successfully fetched"));
  } catch (error) {
    console.error(error);
    throw new apiError(500, "Internal Server Error");
  }
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    const subscriberId = req.params.subscriberId;

    const channels = await Subscription.aggregate([
      {
        $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) }, 
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "subscribedChannels",
        },
      },
      {
        $addFields: {
          subscribedChannels: { $first: "$subscribedChannels" }
        }
      },
      {
        $project: {
          "subscribedChannels.username": 1,
          "subscribedChannels.fullName": 1,
          "subscribedChannels.avatar": 1,
          createdAt: 1 
        }
      }
    ]);

    if (channels.length === 0) {
      throw new apiError(401, "There are no channels subscribed");
    }

    return res.status(200).json(new apiResponse(200, channels, "success"));
  } catch (error) {
    console.error(error);
    throw new apiError(500, "Internal Server Error");
  }
});


module.exports = {
  toggleSubscription,
  getUserChannelSubscriber,
  getSubscribedChannels,
};

//toggle subscription of the changel
// getUserChannelSubscriber
// getSubscribedChannels
