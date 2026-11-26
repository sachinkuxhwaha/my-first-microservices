const cloudinary = require("../config/cloudinary.js");
const logger = require("./logger.js");

const uploadMediaToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStram = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          logger.error("Error while uplaoding media", error);
          reject(error);
        } else {
          resolve(result);
        }
      },
    );
    uploadStream.end(file.buffer);
  });
};

const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`Media deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    logger.error("Error deleting media from Cloudinary", { error });
    throw error;
  }
};

module.exports = { uploadMediaToCloudinary, deleteMediaFromCloudinary };
