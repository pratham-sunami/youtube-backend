const express = require("express");
const { verifyJWT } = require("../middleware/auth.middleware");
const {getChannelStats,
    getChannelVideos}= require("../controller/dashboard.controller");


const dashboardRouter=express.Router();

dashboardRouter.route("/channelstats").get(verifyJWT, getChannelStats);  

dashboardRouter.route("/channelvideos").get(verifyJWT, getChannelVideos);

module.exports=dashboardRouter