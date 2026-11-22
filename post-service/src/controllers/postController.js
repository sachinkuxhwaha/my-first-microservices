const Post = require("../models/Post.js");
const logger = require("../utils/logger.js");
const { validateCreatePost } = require("../validators/validation.js");

// POST: create a new post for the logged-in user
const createPost = async (req, res) => {
  logger.info("Create post end point hit");
  try {
    // Validate post data using Joi
    const { error } = validateCreatePost(req.body);
    // Return error if validation fails
    if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { content, mediaIds } = req.body;

    const createNewPost = new Post({
      /*
       * Where does req.user.userId come from?
       * 1. identity-service signs a JWT with { userId } at login.
       * 2. The client sends it: Authorization: Bearer <accessToken>.
       * 3. api-gateway verifies the JWT, then forwards the request
       *    with the header  x-user-id: <userId>.
       * 4. post-service authMiddleware reads that header and sets
       *    req.user = { userId }.
       * 5. Here we read req.user.userId and save it as the owner.
       */
      // Owner of the post. Never take this from req.body.
      user: req.user.userId,
      content, // text of the post
      mediaIds: mediaIds || [], // optional, default: no media
    });

    await createNewPost.save();
    logger.info(`Post created: ${createNewPost._id}`);

    res.status(201).json({
      success: true,
      message: "post created successfully",
      postId: createNewPost._id,
    });
  } catch (error) {
    logger.error(`error while creating post`, error);
    res.status(500).json({
      success: false,
      message: "error while creating post",
    });
  }
};

// GET: list posts (to be implemented)
const getAllPosts = async (req, res) => {
  try {
  } catch (error) {
    logger.error(`error while fetching posts`, error);
    res.status(500).json({
      success: false,
      message: "error while fetching posts",
    });
  }
};

// GET: one post by id (to be implemented)
const getPost = async (req, res) => {
  try {
  } catch (error) {
    logger.error(`error while fetching post by id`, error);
    res.status(500).json({
      success: false,
      message: "error while fetching post by id",
    });
  }
};

// DELETE: remove a post (to be implemented)
const deletePost = async (req, res) => {
  try {
  } catch (error) {
    logger.error(`error while deleting post`, error);
    res.status(500).json({
      success: false,
      message: "error while deleting post",
    });
  }
};

module.exports = { createPost, getAllPosts, getPost, deletePost };
