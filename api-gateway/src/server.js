require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const redisClient = require("./config/redis.js");
const logger = require("./utils/logger.js");
const { gatewayRateLimiter } = require("./middleware/rateLimiter.js");
const { validateToken } = require("./middleware/authMiddleware.js");
const {
  identityProxy,
  postProxy,
  mediaProxy,
} = require("./proxies/serviceProxies.js");
const errorHandler = require("./middleware/errorHandler.js");

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Global Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(gatewayRateLimiter);

// Request Logger (avoid logging req.body so passwords aren't exposed in logs)
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.originalUrl}`);
  next();
});

// 2. Service Proxies
app.use("/v1/auth", identityProxy);
app.use("/v1/posts", validateToken, postProxy);
app.use("/v1/media", validateToken, mediaProxy);

// 3. Global Error Handler
app.use(errorHandler);

// 4. Start Server after verifying Redis
const startServer = async () => {
  try {
    await redisClient.ping();
    app.listen(PORT, () => {
      logger.info(`API Gateway is running on port ${PORT}`);
      logger.info(`Identity service URL: ${process.env.IDENTITY_SERVICE_URL}`);
      logger.info(`Post service URL: ${process.env.POST_SERVICE_URL}`);
      logger.info(`Media service URL: ${process.env.MEDIA_SERVICE_URL}`);
    });
  } catch (error) {
    logger.error("Failed to start API Gateway", { error });
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection", { promise, reason });
});

startServer();
