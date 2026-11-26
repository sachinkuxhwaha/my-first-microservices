require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db.js");
const errorHandler = require("./middleware/errorHandler.js");
const mediaRoutes = require("./routes/mediaRoutes.js");
const logger = require("./utils/logger.js");

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/media", mediaRoutes);

// Global Error Handler
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Media service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start media service", { error });
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection", { promise, reason });
});

startServer();
