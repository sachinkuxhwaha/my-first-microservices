const logger = require("../utils/logger.js");

/*
 * Runs BEFORE every post route.
 * 1. Checks that the request comes from a logged-in user.
 * 2. Puts the user id on req so controllers can use it.
 */
// (async is not needed here because nothing is awaited. Harmless.)
const authenticateReq = async (req, res, next) => {
  // The API gateway adds this header after it verifies the JWT.
  // Express lowercases header names, so we read "x-user-id".
  const userId = req.headers["x-user-id"];
  if (!userId) {
    logger.warn(`Access attempted without userId`);
    return res.status(401).json({
      success: false,
      message: "Authentication required! Please login to continue",
    });
  }
  // Attach the user to the request object.
  // { userId } is shorthand for { userId: userId }.
  // Controllers can now read req.user.userId.
  req.user = { userId };
  next(); // hand over to the next handler (the controller)
};

module.exports = { authenticateReq };
