const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("../config/redis.js");
const logger = require("../utils/logger.js");

// 1. IP-based limiter (protects against multi-account spam from one IP)
const createPostIpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  limit: 20, // 20 posts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip), // safely normalizes IPv4 & IPv6
  handler: (req, res) => {
    logger.warn(`Create-post IP rate limit exceeded for IP: ${req.ip}`);
    return res
      .status(429)
      .json({ success: false, message: "Too many requests from this IP" });
  },
  store: new RedisStore({
    prefix: "rl:createPost:ip:", // separate Redis namespace for IP
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// 2. User-based limiter (protects against single-account spam across IPs)
const createPostUserLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  limit: 10, // 10 posts per minute per user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user.userId, // authenticateReq must run first
  handler: (req, res) => {
    logger.warn(
      `Create-post user rate limit exceeded for user: ${req.user.userId}`,
    );
    return res
      .status(429)
      .json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    prefix: "rl:createPost:user:", // separate Redis namespace for userId
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

module.exports = { createPostIpLimiter, createPostUserLimiter };
