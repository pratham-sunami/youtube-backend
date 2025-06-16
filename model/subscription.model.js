const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,  //one who is subscribing
      ref: "user",
    },
    channel: {
      type: Schema.Types.ObjectId,  //one to whom subscriber is subscribing
      ref: "user",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription",subscriptionSchema)