const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("../config/redis.js");
const logger = require("../utils/logger.js");

const gatewayRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Gateway rate limit exceeded for IP: ${req.ip}`);
    return res.status(429).json({
      success: false,
      message: "Too many requests",
    });
  },
  store: new RedisStore({
    prefix: "rl:gateway:",
    sendCommand: (...args) => redisClient.call(...args), //JavaScript spread operator. It copies the properties from your existing proxyOptions object into the new options object.
  }),
});

module.exports = { gatewayRateLimiter };
