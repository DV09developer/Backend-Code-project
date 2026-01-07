import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { uploadVideo } from "../controllers/video.contrller.js";
const router = Router();

router.route("/create-video").post(
    verifyAccessToken,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    uploadVideo
);

export default router;