const express = require("express");
const { authenticateReq } = require("../middleware/authMiddleware.js");
const {
  createPostIpLimiter,
  createPostUserLimiter,
} = require("../middleware/rateLimiter.js");
const {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
} = require("../controllers/postController.js");

const router = express.Router();

// Check IP limit first, then authenticate, then check User ID limit
router.post(
  "/create-post",
  createPostIpLimiter,
  authenticateReq,
  createPostUserLimiter,
  createPost,
);
router.get("/all-posts", getAllPosts);
router.get("/:id", getPost);
router.delete("/:id", authenticateReq, deletePost);

module.exports = router;
