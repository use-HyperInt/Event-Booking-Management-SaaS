import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Helper function to upload image to Cloudinary
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = 'events',
  fileName?: string
): Promise<{ url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder,
      resource_type: 'image',
      format: 'jpg',
      quality: 'auto',
      fetch_format: 'auto',
    };

    if (fileName) {
      uploadOptions.public_id = fileName;
    }

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result!.secure_url,
            public_id: result!.public_id,
          });
        }
      }
    ).end(fileBuffer);
  });
};

// Helper function to delete image from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};
