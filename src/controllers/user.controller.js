import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadToCloudinary } from "../utils/clodinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new apiError(404, "User not found while generating tokens");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new apiError(500 , "Token generation failed");
    }
};

const registerUser = asyncHandler(async (req , res) => {

    const { fullname, username, email, password } = req.body;
    console.log(email);

    if (
        [fullname, username, email, password].some((field) => field.trim() === "")
    ) {
        throw new apiError(400 , "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (existedUser) {
        throw new apiError(400 , "User with given email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if (!avatarLocalPath) {
        throw new apiError(400 , "Avatar is required");
    }
    
    const uploadedAvatarUrl = await uploadToCloudinary(avatarLocalPath);
    const uploadedCoverImageUrl = await uploadToCloudinary(coverImageLocalPath);
    
    if (!uploadedAvatarUrl) {
        throw new apiError(400 , "Avatar is required");
    }

    const user = await User.create({fullname, username, email, password, avatar: uploadedAvatarUrl.secure_url, coverImage: uploadedCoverImageUrl?.secure_url || ""});

    const createdUser = await User.findById(user._id).select(
        "-password -__v -createdAt -updatedAt -refreshToken"
    );

    if (!createdUser) {
        throw new apiError(500 , "User registration failed on registeration");
    }

    return res.status(201).json(
        new apiResponse(201 , createdUser , "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!(email?.trim() || username?.trim())) {
        throw new apiError(400 , "Email or Username is required");
    }
    if (password?.trim() === "") {
        throw new apiError(400 , "Password is required");
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!user) {
        throw new apiError(404 , "User not found");
    }

    const isPasswordMatch = await user.isPasswordCorrect(password);

    if (!isPasswordMatch) {
        throw new apiError(401 , "Invalid password");
    }

    // await generateAccessTokenAndRefreshToken(user._id).then(({ accessToken, refreshToken }) => {
    //     return res.status(200).json(
    //         new apiResponse(200 , {
    //             accessToken,
    //             refreshToken
    //         } , "User logged in successfully")
    //     )
    // })

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -__v -createdAt -updatedAt -refreshToken"
    );

    const options = {
        httponly : true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )
    

    //email and password validation there should be email or username
    // find user in database
    // if exist then compare password
    // if password match then generate token & refresh token
    // save refresh token in db
    // return response with token
})

const logoutUser = asyncHandler(async (req, res) => {
    req.user._id
    await User.findByIdAndUpdate(
        req.user._id , 
        {refreshToken: undefined} , {new: true}
    )
    // .then(() => {
    //     return res.status(200).json(
    //         new apiResponse(200 , null , "User logged out successfully")
    //     )
    // })
    
    const options = {
        httponly : true,
        secure: true
    }

    return res
    .status(200)
    // .cookie("accessToken", "", { ...options, maxAge: 0 })
    // .cookie("refreshToken", "", { ...options, maxAge: 0 })
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new apiResponse(200 , null , "User logged out successfully")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.headers["refreshtoken"];
    console.log("Refresh Token" , refreshToken);
    if (!refreshToken) {
        throw new apiError(401 , "Refresh token is missing");
    }
    let decodedtoken;
    try {
        decodedtoken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new apiError(401 , "Invalid refresh token");
    }
    const user = await User.findById(decodedtoken._id);
    if (!user || user.refreshToken !== refreshToken) {
        throw new apiError(401 , "Invalid refresh token");
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    const options = {
        httponly : true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", newAccessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new apiResponse(200 , { newAccessToken, newRefreshToken } , "Access token refreshed successfully")
    )
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (oldPassword?.trim() === "" || newPassword?.trim() === "") {
        throw new apiError(400 , "Old password and new password are required");
    }

    const user = await User.findById(req.user._id);
    const isOldPasswordMatch = await user.isPasswordCorrect(oldPassword);
    if (!isOldPasswordMatch) {
        throw new apiError(401 , "Old password is incorrect");
    }           
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(
        new apiResponse(200 , null , "Password changed successfully")
    )
});

const getCurrentUserProfile = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new apiResponse(200 , req.user , "User profile fetched successfully")
    )
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const { fullname, username, email } = req.body;
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullname,
                username,
                email
            }
        },
        { new: true }
    ).select("-password -__v -createdAt -updatedAt -refreshToken");
    return res.status(200).json(
        new apiResponse(200 , user , "User profile updated successfully")
    )
});

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new apiError(400 , "Avatar is required");
    }
    const uploadedAvatarUrl = await uploadToCloudinary(avatarLocalPath);
    if (!uploadedAvatarUrl) {
        throw new apiError(500 , "Avatar upload failed");
    }   
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: uploadedAvatarUrl.secure_url },
        { new: true }
    ).select("-password -__v -createdAt -updatedAt -refreshToken");
    return res.status(200).json(
        new apiResponse(200 , user , "User avatar updated successfully")
    )
});

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new apiError(400 , "Cover image is required");
    }
    const uploadedCoverImageUrl = await uploadToCloudinary(coverImageLocalPath);
    if (!uploadedCoverImageUrl) {
        throw new apiError(500 , "Cover image upload failed");
    }   
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { coverImage: uploadedCoverImageUrl.secure_url },
        { new: true }
    ).select("-password -__v -createdAt -updatedAt -refreshToken");
    return res.status(200).json(
        new apiResponse(200 , user , "User cover image updated successfully")
    )
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new apiError(400 , "Username is required");
    }
    const channel = await User.aggregate([
        { $match: { username: username?.toLowerCase() } },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelsSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user._id , "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        { $project: { password: 0, refreshToken: 0, __v: 0, createdAt: 0, updatedAt: 0 } }
    ])

    if (!channel || channel.length === 0) {
        throw new apiError(404 , "channel not found");
    }

    console.log("What is channel" , channel);

    return res.status(200).json(
        new apiResponse(200 , channel[0] , "Channel profile fetched successfully")
    )
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: { _id: new mongoose.Type.ObjectId(req.user._id) }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                { $project: { password: 0, refreshToken: 0, __v: 0, createdAt: 0, updatedAt: 0 } }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(
        new apiResponse(200 , user[0].watchHistory , "User watch history fetched successfully")
    )
});

export { registerUser , loginUser , logoutUser , refreshAccessToken , changeCurrentPassword , getCurrentUserProfile , updateUserProfile , updateAvatar , updateCoverImage , getUserChannelProfile , getWatchHistory};