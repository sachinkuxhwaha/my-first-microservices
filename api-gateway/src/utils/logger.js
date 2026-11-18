const winston = require("winston");

// Create a Winston logger instance
const logger = winston.createLogger({
  // Use debug logs in development and info logs in production
  level: process.env.NODE_ENV === "production" ? "info" : "debug",

  // Combine multiple formatting options
  format: winston.format.combine(
    winston.format.timestamp(), // Add date and time to each log
    winston.format.errors({ stack: true }), // Include error stack traces
    winston.format.splat(), // Support string placeholders like %s
    winston.format.json(), // Convert logs into JSON format
  ),

  // Add service name to identify which microservice generated the log
  defaultMeta: { service: "api-gateway" },

  // Define where logs should be displayed or stored
  transports: [
    // Display logs in the terminal with colors
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Add colors based on log level
        winston.format.simple(), // Display logs in readable text format
      ),
    }),

    // Store only error-level logs in error.log
    new winston.transports.File({
      filename: "error.log",
      level: "error",
    }),

    // Store all logs allowed by the configured log level
    new winston.transports.File({
      filename: "combined.log",
    }),
  ],
});

module.exports = logger;
