require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const connectDB = require("./config/db.js");
const redisClient = require("./config/redis.js");
const logger = require("./utils/logger.js");
const routes = require("./routes/identityRoutes.js");
const errorHandler = require("./middleware/errorHandler.js");
const { generalRateLimiter } = require("./middleware/rateLimiter.js");

const app = express();
const PORT = process.env.PORT || 3001;

// Global Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(generalRateLimiter);

// Routes
app.use("/api/auth", routes);

// Global Error Handler
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    await redisClient.ping();
    app.listen(PORT, () => {
      logger.info(`Identity service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start identity service", { error });
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection", { promise, reason });
});

startServer();
