const express = require("express");
const { registerRateLimiter } = require("../middleware/rateLimiter.js");
const {
  registerUser,
  loginUser,
  refreshTokenUser,
  logoutUser,
} = require("../controllers/identityController.js");

const router = express.Router();

router.post("/register", registerRateLimiter, registerUser);
router.post("/login", loginUser);
router.post("/refreshToken", refreshTokenUser);
router.post("/logout", logoutUser);

module.exports = router;
