const express = require("express");

const { uploadMiddleware } = require("../middleware/uploadMiddleware.js");
const { uploadMedia } = require("../controllers/mediaController.js");
const { authenticateReq } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/upload", authenticateReq, uploadMiddleware, uploadMedia);

module.exports = router;
