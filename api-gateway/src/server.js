require("dotenv").config();
const express = require("express");
const Redis = require("ioredis");
const helmet = require("helmet");
const cors = require("cors");
const logger = require("./utils/logger.js");
const { rateLimit } = require("express-rate-limit");
const proxy = require("express-http-proxy");
const { RedisStore } = require("rate-limit-redis");
const errorHandler = require("./middleware/errorHandler.js");

const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting (copied from idenity-service)
const gatewayRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use(gatewayRateLimiter);

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);

    return res.status(502).json({
      success: false,
      message: "Identity service is unavailable",
    });
  },
};

// Setting up proxy for the Identity Service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions, //JavaScript spread operator. It copies the properties from your existing proxyOptions object into the new options object.
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`);
  logger.info(
    `Identity service is running on port ${process.env.IDENTITY_SERVICE_URL}`,
  );
  logger.info(`Redis URL ${process.env.REDIS_URL}`);
});
