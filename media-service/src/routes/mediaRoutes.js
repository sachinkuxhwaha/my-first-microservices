const express = require("express");

const { uploadMiddleware } = require("../middleware/uploadMiddleware.js");
const { uploadMedia } = require("../controllers/mediaController.js");
const { authenticateReq } = require("../middleware/authMiddleware.js");
const { uploadMediaIpLimiter } = require("../middleware/rateLimiter.js");

const router = express.Router();

router.post(
  "/upload",
  authenticateReq,
  uploadMediaIpLimiter,
  uploadMiddleware,
  uploadMedia,
);

module.exports = router;
