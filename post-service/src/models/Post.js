const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    mediaIds: [
      {
        type: String,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }, //already adds createdAt and updatedAt
);

// Lets MongoDB search words in content. Only needed if post-service does the searching, not search-service.
postSchema.index({ content: "text" });

module.exports = mongoose.model("Post", postSchema);
