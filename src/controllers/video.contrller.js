import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { uploadToCloudinary } from "../utils/clodinary.js";
import { apiResponse } from "../utils/apiResponse.js";
// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";

const uploadVideo = asyncHandler(async (req, res) => {
    //get owner id from token
    const ownerId = req.user.id;
    if (!ownerId) {
        throw new apiError(401 , "Unauthorized");
    }
    //get video file from req
    const { title , description , duration } = req.body;
    if ( !title || !description || !duration) {
        throw new apiError(400 , "All fields are required");
    }
    //upload video on cloudinary
    const videoFile = req.files?.videoFile[0].path;
    if (!videoFile) {
        throw new apiError(400 , "Video file is required");
    }

    const videoFileUrl = await uploadToCloudinary(videoFile);
    if (!videoFileUrl) {
        throw new apiError(500 , "Avatar upload failed");
    }
    //upload thumbnail on cloudinary
    const thumbnail = req.files?.thumbnail[0].path;
    if (!thumbnail) {
        throw new apiError(400 , "Thumbnail is required");
    }

    const thumbnailUrl = await uploadToCloudinary(thumbnail);
    if (!thumbnailUrl) {
        throw new apiError(500 , "Thumbnail upload failed");
    }

    //save video into db

    const video = await Video.create({
        videoFile: videoFileUrl.url,
        thumbnail: thumbnailUrl.url,
        title,
        description,
        duration,
        // owner: mongoose.Types.ObjectId(ownerId)
        owner: ownerId
    });

    if (!video) {
        throw new apiError(500 , "Video upload failed");
    }
    //return response
    return res.status(201).json(
        new apiResponse(201 , video , "Video uploaded successfully")
    );

})

// const updateVideo

export { uploadVideo };