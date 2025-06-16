// const dotenv=require('dotenv')
// const {app} = require('app')
// const connectDb = require('connect-db')

// dotenv.config({
//     path: "./.env",
//   })
  
//   connectDb()
//   .then(()=>{
//    app.listen(process.env.PORT || 8000, ()=>{ console.log(`server is running at port ${process.env.PORT}`)})
//    app.on("error ",()=>{
//     console.log("Error is running",error);
//    })
//   })
//   .catch((err)=>{
//     console.log("Mongo db is failed to connect as ",err);
//   });
  
//////////////////// the above one is actually for mongoose connection 
  /* index method to connect db
  
  
  import mongoose from "mongoose";
  import { db_name } from "./Constants";
  const express = require("express");
  const app = express();
  
  (async () => {
    try {
      await mongoose.connect(`${process.env.MONGODB_URL}/${db_name}`);
      app.on("error", () => {
        console.log("ERROR: ", error);
      });
  
      app.listen(process.env.PORT, () => {
        console.log(`Example app listening on port ${port}`);
      });
    } catch (error) {
      console.error("ERROR: ", error);
      throw error;
    }
  })();
  
  
  
  
  */
  // require('dotenv').config()
  // const express = require('express')
  // const app = express()
  // const port = 8000
  
  // app.get('/', (req, res) => {
  //   res.send('Hello !')
  // })
  
  // app.get('/why', (req, res) => {
  //     res.send('Prathamsunami')
  //   })
  
  // app.listen(process.env.PORT, () => {
  //   console.log(`Example app listening on port ${port}`)
  // })
  