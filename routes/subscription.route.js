const express = require("express");
const {
  toggleSubscription,
  getUserChannelSubscriber,
  getSubscribedChannels,
} = require("../controller/subscription.controller");
const { verifyJWT } = require("../middleware/auth.middleware");

const subscriptionRouter = express.Router();

subscriptionRouter
  .route("/subscription/:channelId")
  .post(verifyJWT, toggleSubscription);

subscriptionRouter
  .route("/subscribers/:channelId")
  .get(verifyJWT, getUserChannelSubscriber);

subscriptionRouter
  .route("/subscribedChannels/:subscriberId")
  .get(verifyJWT, getSubscribedChannels);

module.exports = subscriptionRouter;
