const logger = require("../utils/logger.js");
const Media = require("../models/Media.js");

const {
  uploadMediaToCloudinary,
  deleteMediaFromCloudinary,
} = require("../utils/cloudinaryHelper.js");

const uploadMedia = async (req, res) => {
  logger.info("Media uplaod started!");
  try {
    if (!req.file) {
      logger.error("No file found. Please add a file and try again!");
      return res.status(400).json({
        success: false,
        messgae: "No file found. Please add a file and try again!",
      });
    }

    const { originalName, mimeType } = req.file;
    const userId = req.user.userId;

    logger.info(`File name: name=${originalName}, type=${mimeType}`);
    logger.info("Uploading to cloudinary starting...");

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    logger.info(
      `Cloudinary uplaod successful. Public Id: %{cloudinaryUploadResult.publicId}`,
    );

    const newlyCreatedMedia = await Media({
      publicId: cloudinaryUploadResult.publicId,
      originalName,
      mimeType,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();

    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      messgae: "Media uplaod is successful",
    });
  } catch (error) {
    logger.error(`Media upload failed!`, error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while uploading media file!",
    });
  }
};

module.exports = { uploadMedia };
