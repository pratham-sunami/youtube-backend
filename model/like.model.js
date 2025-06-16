const mongoose = require('mongoose');
const Schema= mongoose.Schema;

const likeSchema = new Schema({
    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweet"
    },
    likedBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{
    timestamps:true,
})

module.exports =mongoose.model("Like",likeSchema);