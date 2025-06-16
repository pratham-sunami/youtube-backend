const mongoose = require('mongoose')
const Schema = mongoose.Schema

const tweetSchema = new Schema({
    owner:{
        type: Schema.Types.ObjectId,
        ref:"User"
    },
    content:{
        type:String,
        required:true,
    }
},{
    timestamps:true,
})

module.exports =mongoose.model("Tweet",tweetSchema);