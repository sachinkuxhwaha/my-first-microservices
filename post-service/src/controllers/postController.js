const Post = require("../models/Post.js");
const logger = require("../utils/logger.js");
const { invalidatePostCache } = require("../utils/invalidateCache.js");
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
    await invalidatePostCache(req, createNewPost._id.toString()); // this line invalidates cache for newly created post
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
    // 1. Pagination
    const page = parseInt(req.query.page, 10) || 1;
    // const limit = parseInt(req.query.limit || 10);
    const requestedLimit = parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(Math.max(requestedLimit, 1), 100);
    const startIndex = (page - 1) * limit; // Because pages start from 1, but MongoDB's skip() starts counting from 0

    // 2. In Redis, we store data in key:value pairs.
    const cacheKey = `posts:${page}:${limit}`;
    const cachePosts = await req.redisClient.get(cacheKey); // Redis GET command retrieves value of the given key.
    if (cachePosts) {
      return res.json(JSON.parse(cachePosts));
    }

    // 3. Fetch posts from MongoDB
    const posts = await Post.find({})
      .sort({ createdAt: -1, _id: -1 }) // 1 = Ascending order (oldest first) | -1 = Descending order (newest first)
      .skip(startIndex)
      .limit(limit);

    const totalNoOfPosts = await Post.countDocuments();

    const result = {
      posts,
      currentpage: page,
      totalPages: Math.max(1, parseInt(req.query.page, 10) || 1), // If 103 posts and limit 10 => 10.3 => Math.ceil => 11 pages
      totalPosts: totalNoOfPosts,
    };

    // save the post in redis cache for 5 mins
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result)); // SETEX: Set a key with an expiration time. setex(key, seconds, value)

    res.json(result);
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
    const postId = req.params.id;
    const cacheKey = `post:${postId}`;
    const cachePost = await req.redisClient.get(cacheKey);
    if (cachePost) {
      return res.json(JSON.parse(cachePost));
    }

    const postById = await Post.findById(postId);
    if (!postById) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    await req.redisClient.setex(cacheKey, 300, JSON.stringify(postById));
    res.json(postById);
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
    // Only the owner can delete their post
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Delete from DB first, then clear the cache
    await invalidatePostCache(req, req.params.id);

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    logger.error(`error while deleting post`, error);
    res.status(500).json({
      success: false,
      message: "error while deleting post",
    });
  }
};

module.exports = { createPost, getAllPosts, getPost, deletePost };
