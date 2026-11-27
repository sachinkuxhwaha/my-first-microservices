const Redis = require("ioredis");
const logger = require("../utils/logger.js");

const redisClient = new Redis(process.env.REDIS_URL);
redisClient.on("error", (error) =>
  logger.error("Redis connection error", { error }),
);

module.exports = redisClient;
