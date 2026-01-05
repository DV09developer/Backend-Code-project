import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

// how to upload file to cloudinary
const uploadToCloudinary = async (filePath) => {
    try {
        if (!filePath) return null;;
        const result = await cloudinary.uploader.upload(filePath, {
            resourece_type: "auto"
        });
        console.log("file is uploaded on clodinary");
        // Delete the local file after upload
        // fs.unlinkSync(filePath);
        console.log(`file url ${result.secure_url}`)
        // return result.secure_url;
        return result;
    } catch (error) {
        fs.unlinkSync(filePath); //remove file from local in case of error
        throw new Error("Cloudinary Upload Failed");
    }
}

export {uploadToCloudinary};
// cloudinary.v2.uploader.upload("apifrom" , {})