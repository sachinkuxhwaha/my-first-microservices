const User = require("../models/User.js");
const generateToken = require("../utils/generateToken.js");
const logger = require("../utils/logger.js");
const { validateRegistration } = require("../validators/validation.js");

// Handle user registration
const registerUser = async (req, res) => {
  logger.info("Identity: Registering user");

  try {
    // Validate registration data using Joi
    const { error } = validateRegistration(req.body);

    // Return error if validation fails
    if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`); //$or means at least one of the conditions must match

      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password, username } = req.body;

    // Check if email or username already exists
    let user = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (user) {
      logger.warn("User already exists");

      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create a new user document
    user = new User({ username, email, password });

    // Save user in MongoDB (password is hashed by the pre-save hook)
    await user.save();

    logger.info(`User saved successfully: ${user._id}`);

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateToken(user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully!",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error occurred", { error });

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { registerUser };
