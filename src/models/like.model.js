import mongoose , { Schema } from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema({
    video_id: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    comment_id: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    liked_by: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true})

// likeSchema.plugin(mongooseAggregatePaginate);

export const Like = mongoose.model("Like" , likeSchema);