import { apiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.models.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req , res , next) => {

    const { fullname, name, email, password } = req.body;
    console.log(email);

    if (
        [fullname, name, email, password].some((field) => field.trim() === "")
    ) {
        throw new apiError(400 , "All fields are required");
    }

    const existedUser = User.findOne({
        $or: [{ email }, { name }]
    })

    if (existedUser) {
        throw new apiError(400 , "User with given email or name already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new apiError(400 , "Avatar is required");
    }
    
    const uploadedAvatarUrl = await uploadToCloudinary(avatarLocalPath);
    const uploadedCoverImageUrl = await uploadToCloudinary(coverImageLocalPath);
    
    if (!uploadedAvatarUrl) {
        throw new apiError(400 , "Avatar is required");
    }

    const user = await User.create({fullname, name, email, password, avatar: uploadedAvatarUrl.secure_url, coverImage: uploadedCoverImageUrl?.secure_url || ""});

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

export { registerUser };