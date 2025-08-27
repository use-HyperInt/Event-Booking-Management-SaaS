"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleImages = exports.uploadSingleImage = void 0;
const multer_1 = __importDefault(require("multer"));
// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer_1.default.memoryStorage();
// File filter to only allow images
const fileFilter = (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed!'));
    }
};
// Configure multer
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
// Middleware for single image upload
exports.uploadSingleImage = upload.single('image');
// Middleware for multiple image uploads (up to 5 images)
exports.uploadMultipleImages = upload.array('images', 5);
exports.default = upload;
//# sourceMappingURL=upload.js.map