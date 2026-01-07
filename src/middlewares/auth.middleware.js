import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { apiError } from "../utils/apiError.js";

export const verifyAccessToken = asyncHandler(async (req, _, next) => {

    try {
        const token = req.cookies?.accessToken || req.headers(authorization)?.replace("Bearer " , "")
    
        if (!token) {
            throw new apiError(401 , "Access token is missing");
        }

        // const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET , (err , payload) => {
        //     if (err) {
        //         throw new apiError(401 , "Invalid access token");
        //     }
        // })
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // req.user = decodedtoken;
        // next();
    
        const user = await User.findById(decodedtoken._id).select(
            "-password -__v -createdAt -updatedAt -refreshToken"
        )
    
        if (!user) {
            throw new apiError(404 , "User not found");
        }
    
        req.user = user;
        next();
            // await User.findById(decodedtoken._id).then((user) => {
            // if (!user) {
            //     throw new apiError(404 , "User not found");
            // }})
            // ? next()
            // : res.status(401).json({ message: "Access token is missing or invalid" });
    } catch (error) {
        throw new apiError(401 , error.message || "Invalid access token");
    }
})