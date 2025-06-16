const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/user.routes");
const connectDB = require("./db");
const videoRoutes = require("./routes/video.routes");
const commentRoutes = require("./routes/comment.routes");
const subscribeRoutes = require("./routes/subscription.route");
const tweetRoutes = require("./routes/tweet.route");
const likeRoutes = require("./routes/like.routes");
const playlistRoutes = require("./routes/playlist.route");
const dashboardRoutes = require("./routes/dashboard.route");
const healthcheckRoutes = require("./routes/healthcheck.route");

// const { init } = require("./utils/socket-setup");
require("dotenv").config();

const PORT = process.env.PORT || 8000;

//middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/user',userRoutes)
app.use('/video',videoRoutes)
app.use('/comment',commentRoutes)
app.use('/subscription',subscribeRoutes)
app.use('/tweet',tweetRoutes)
app.use('/like',likeRoutes)
app.use('/playlist',playlistRoutes)
app.use('/dashboard',dashboardRoutes)
app.use('/healthcheck',healthcheckRoutes)

// app.use("/", routes);
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
//   next();
// });
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// app.use((error, req, res, next) => {
//   const status = error.status || 500;
//   const message = error.message || "Something went wrong.";
//   res.status(status).json({ message: message });
// });

//routes
app.get("/", async (req, res) => {
  res.send("Server is running");
});

//database connection
connectDB()
.then(()=>{
 app.listen(process.env.PORT || 8000, ()=>{ console.log(`server is running at port ${process.env.PORT}`)})
 app.on("error ",()=>{
  console.log("Error is running",error);
 })
})
.catch((err)=>{
  console.log("Mongo db is failed to connect as ",err);
});
