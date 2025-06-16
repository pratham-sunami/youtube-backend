const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { db_name } = require("../constants");


const connectDb = async () => {
    try {
      const connectionInstance = await mongoose.connect(
        `${process.env.MONGODB_URL}/${db_name}`
      );
      console.log("Mongo db is connected  ", connectionInstance.connection.host);
    } catch (error) {
      console.error("ERROR: ", error);
      process.exit(1);
    }
  };
  module.exports = connectDb;