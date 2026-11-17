const RefreshToken = require("../models/RefreshToken");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Generate access and refresh tokens for a user
const generateToken = async (user) => {
  // Create JWT access token with user details (valid for 10 minutes)
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET, // Secret key used to sign the token
    { expiresIn: "10m" },
  );

  // Generate a secure random refresh token
  const refreshToken = crypto.randomBytes(40).toString("hex");

  // Set refresh token expiration to 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Save refresh token in MongoDB
  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

module.exports = generateToken;
