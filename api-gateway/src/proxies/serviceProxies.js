const proxy = require("express-http-proxy");
const logger = require("../utils/logger.js");

const createProxyOptions = (serviceName) => ({
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`${serviceName} proxy error: ${err.message}`);
    return res.status(502).json({
      success: false,
      message: `${serviceName} is unavailable`,
    });
  },
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers["Content-Type"] = "application/json";
    delete proxyReqOpts.headers["x-user-id"];
    if (srcReq.user && srcReq.user.userId) {
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
    }
    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData) => {
    logger.info(
      `Response received from ${serviceName}: ${proxyRes.statusCode}`,
    );
    return proxyResData;
  },
});

const identityProxy = proxy(
  process.env.IDENTITY_SERVICE_URL,
  createProxyOptions("Identity service"),
);

const postProxy = proxy(
  process.env.POST_SERVICE_URL,
  createProxyOptions("Post service"),
);

module.exports = { identityProxy, postProxy };
