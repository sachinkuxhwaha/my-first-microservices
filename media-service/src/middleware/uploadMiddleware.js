const multer = require("multer");
const logger = require("../utils/logger.js");

// Store uploaded file in memory as a Buffer for Cloudinary streaming
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
}).single("file");

const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      logger.error("Multer error while uploading", { error: err });
      return res.status(400).json({
        success: false,
        message: "Multer error while uploading",
        error: err.message,
      });
    }

    if (err) {
      logger.error("Unknown error occurred while uploading", { error: err });
      return res.status(500).json({
        success: false,
        message: "Unknown error occurred while uploading",
        error: err.message,
      });
    }

    if (!req.file) {
      logger.warn("No file found in upload request");
      return res.status(400).json({
        success: false,
        message: "No file found!",
      });
    }

    next();
  });
};

module.exports = { uploadMiddleware };
