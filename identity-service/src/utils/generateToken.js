const RefreshToken = require("../models/RefreshToken");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * Generates a pair of tokens for user authentication:
 * 1. Short-lived Access Token (JWT) -> Sent with every API request to prove identity.
 * 2. Long-lived Refresh Token (Random String) -> Stored in DB to issue new access tokens when they expire.
 */
const generateToken = async (user) => {
  // 1. ACCESS TOKEN (Stateless JWT): Carries user payload, expires in 10 mins, verified via secret without DB lookup
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET, // Secret key used to sign the token
    { expiresIn: "10m" },
  );

  // 2. REFRESH TOKEN (Stateful Random String): Contains no user data; acts as a DB lookup key to mint new access tokens
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
