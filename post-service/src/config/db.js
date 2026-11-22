require("dotenv").config();
const mongoose = require("mongoose");
const logger = require("../utils/logger.js");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection failed", { error });
    process.exit(1);
  }
};

module.exports = connectDB;
