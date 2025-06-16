const express = require('express');
const {verifyJWT} = require('../middleware/auth.middleware')
const {addComment,updateComment,deleteComment,getVideoComments} = require('../controller/comment.controller')

const commentRouter = express.Router();

commentRouter.route("/add-comment").post(verifyJWT, addComment);

commentRouter.route("/edit-comment/:commentID").patch(verifyJWT, updateComment);

commentRouter.route("/delete-comment/:commentID").delete(verifyJWT, deleteComment);

commentRouter.route("/comments/:videoID").get(verifyJWT, getVideoComments);

module.exports = commentRouter