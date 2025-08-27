"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
exports.default = cloudinary_1.v2;
// Helper function to upload image to Cloudinary
const uploadToCloudinary = async (fileBuffer, folder = 'events', fileName) => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder,
            resource_type: 'image',
            format: 'jpg',
            quality: 'auto',
            fetch_format: 'auto',
        };
        if (fileName) {
            uploadOptions.public_id = fileName;
        }
        cloudinary_1.v2.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve({
                    url: result.secure_url,
                    public_id: result.public_id,
                });
            }
        }).end(fileBuffer);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
// Helper function to delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader.destroy(publicId, (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve();
            }
        });
    });
};
exports.deleteFromCloudinary = deleteFromCloudinary;
//# sourceMappingURL=cloudinary.config.js.map