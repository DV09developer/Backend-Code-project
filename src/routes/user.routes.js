import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken , 
    getCurrentUserProfile , 
    changeCurrentPassword , 
    updateUserProfile , 
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyAccessToken , logoutUser); // logoutUser to be added

router.route("/refresh-token").post(refreshAccessToken); // to be implemented

router.route("/profile").get(verifyAccessToken , getCurrentUserProfile);

router.route("/change-password").post(verifyAccessToken , changeCurrentPassword);

router.route("/update-profile").put(verifyAccessToken , updateUserProfile);

router.route("/update-avatar").patch(
    verifyAccessToken ,
    upload.single("avatar"),
    updateAvatar
);

router.route("/update-cover-image").patch(
    verifyAccessToken ,
    upload.single("coverImage"),
    updateCoverImage
);

router.route("/channel/:username").get(verifyAccessToken , getUserChannelProfile);

router.route("/watch-history").get(verifyAccessToken , getWatchHistory);

export default router;