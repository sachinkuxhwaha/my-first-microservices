require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const redisClient = require("./config/redis.js");
const connectDB = require("./config/db.js");
const postRoutes = require("./routes/postRoute.js");
const errorHandler = require("./middleware/errorHandler.js");
const logger = require("./utils/logger.js");

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes,
);

// Global Error Handler
app.use(errorHandler);

const startServer = async () => {
  try {
    await redisClient.ping();
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Post service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start post service", { error });
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection", { promise, reason });
});

startServer();
