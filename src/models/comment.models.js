import mongoose , { Schema } from "mongoose";

const commentSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    video_id: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
})

const Comment = mongoose.model("Comment" , commentSchema);

export { Comment };