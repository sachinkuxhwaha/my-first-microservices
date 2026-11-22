const { RateLimiterRedis } = require("rate-limiter-flexible");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("../config/redis.js");
const logger = require("../utils/logger.js");

// 1. General Rate Limiter (10 requests/sec per IP)
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

const generalRateLimiter = (req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch((error) => {
      if (error instanceof Error) {
        logger.error("Redis rate limiter failed", { error });
        return res.status(503).json({
          success: false,
          message: "Service temporarily unavailable",
        });
      }
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      return res.status(429).json({
        success: false,
        message: "Too many requests",
      });
    });
};

// 2. Registration-Specific Rate Limiter (50 requests per 15 mins per IP)
const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Registration rate limit exceeded for IP: ${req.ip}`);
    return res.status(429).json({
      success: false,
      message: "Too many requests",
    });
  },
  store: new RedisStore({
    prefix: "rl:identity:register:",
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

module.exports = { generalRateLimiter, registerRateLimiter };
