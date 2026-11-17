const mongoose = require("mongoose");

const RefreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // References the User model
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// Automatically delete tokens after their expiration date
RefreshTokenSchema.index(
  { expiresAt: 1 }, // Monitor the expiresAt field
  { expireAfterSeconds: 0 }, // Delete when the expiration date passes
);

const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);
module.exports = RefreshToken;
