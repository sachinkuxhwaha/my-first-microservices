const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("../config/redis.js");
const logger = require("../utils/logger.js");

// IP-based rate limiter for sensitive media upload endpoint
const uploadMediaIpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  limit: 10, // 10 uploads per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip), // safely normalizes IPv4 & IPv6
  handler: (req, res) => {
    logger.warn(`Media upload IP rate limit exceeded for IP: ${req.ip}`);
    return res.status(429).json({
      success: false,
      message: "Too many upload requests from this IP, please try again later",
    });
  },
  store: new RedisStore({
    prefix: "rl:media:upload:ip:", // separate Redis namespace for media uploads
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

module.exports = { uploadMediaIpLimiter };
