const User = require("../models/User.js");
const generateToken = require("../utils/generateToken.js");
const logger = require("../utils/logger.js");
const {
  validateRegistration,
  validateLogin,
} = require("../validators/authValidator.js");

// Handle user registration
const registerUser = async (req, res) => {
  logger.info("Identity: Registering user");

  try {
    // Validate registration data using Joi
    const { error } = validateRegistration(req.body);
    // Return error if validation fails
    if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password, username } = req.body;
    // Check if email or username already exists
    let user = await User.findOne({
      $or: [{ email }, { username }], //$or means at least one of the conditions must match
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
    // Passing saved user to generateToken function and then destructuring the response
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

// Handle user login
const loginUser = async (req, res) => {
  logger.info("Identity: Login endpoint hit");

  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("Invalid credentials - user not found");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn("Invalid credentials - password does not match");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const { accessToken, refreshToken } = await generateToken(user);

    res.json({
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("Login error occurred", { error });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { registerUser, loginUser };
