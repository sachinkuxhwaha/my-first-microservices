require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const Redis = require("ioredis");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

const connectDB = require("./config/database.js");
const logger = require("./utils/logger.js");
const routes = require("./routes/identityRoutes.js");
const errorHandler = require("./middleware/errorHandler.js");

const app = express();
const PORT = process.env.PORT || 3001;

// 1. REDIS CONNECTION

// Connect to Redis using the URL stored in the .env file.
// Redis is used to store request counts for rate limiting.
// It helps track how many requests each IP address makes.
const redisClient = new Redis(process.env.REDIS_URL);

// Listen for Redis connection errors and record them in logs.
redisClient.on("error", (error) => {
  logger.error("Redis connection error", { error });
});

// 2. GENERAL RATE LIMITER CONFIGURATION

// Configure a Redis-based rate limiter for all incoming requests.
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient, // Redis connection used to store request counts
  keyPrefix: "middleware", // Prefix used for rate-limiter keys in Redis
  points: 10, // Allow 10 requests
  duration: 1, // Within 1 second per IP address
});

// 3. GLOBAL MIDDLEWARE
app.use(helmet());
app.use(cors());
app.use(express.json());

// 4. APPLY GENERAL RATE LIMITING

// Apply rate limiting to every incoming request.
// req.ip identifies the client's IP address.
// Redis stores and tracks the request count for each IP.
app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)

    // If the IP is within its request limit, continue.
    .then(() => next())

    // Handle requests that exceed the limit or Redis failures.
    .catch((error) => {
      // A Redis or unexpected Error object indicates an
      // infrastructure/programming problem, not a normal limit rejection.
      if (error instanceof Error) {
        logger.error("Redis rate limiter failed", { error });

        return res.status(503).json({
          success: false,
          message: "Service temporarily unavailable",
        });
      }
      // The client has exceeded the allowed request limit.
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);

      return res.status(429).json({
        success: false,
        message: "Too many requests",
      });
    });
});

// 5. REGISTRATION-SPECIFIC RATE LIMITER

// Apply an additional rate limit specifically to registration.
// This provides extra protection to a sensitive endpoint.
const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute time window
  max: 50, // Allow a maximum of 50 requests
  standardHeaders: true, // Send standard rate-limit headers
  legacyHeaders: false, // Disable older rate-limit headers

  // Custom response when the registration limit is exceeded.
  handler: (req, res) => {
    logger.warn(`Registration rate limit exceeded for IP: ${req.ip}`);

    return res.status(429).json({
      success: false,
      message: "Too many requests",
    });
  },

  // Use Redis as the storage system for registration rate-limit data.
  // This allows request counts to be shared through Redis.
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// 6. REGISTER ROUTES
// Apply the additional rate limiter to registration requests.
app.use("/api/auth/register", registerRateLimiter);

// Register all authentication-related API routes.
app.use("/api/auth", routes);

// 7. CENTRALIZED ERROR HANDLER
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    // Check whether Redis is available.
    await redisClient.ping();

    app.listen(PORT, () => {
      logger.info(`Identity service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start identity service", { error });
    process.exit(1);
  }
};

// 9. HANDLE UNHANDLED PROMISE REJECTIONS

// Listen for Promise rejections that were not handled
// using .catch() or an appropriate try/catch block.
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection", {
    promise,
    reason,
  });
});

startServer();
