# Winston Logger – Node.js

## 1. What is Winston?

Winston is a logging library for Node.js used to record application events, errors, warnings and debugging information.

### Why use Winston?

- Supports multiple logging levels.
- Saves logs in files.
- Displays logs in the terminal.
- Supports JSON formatting.
- Supports timestamps and metadata.
- Helps debug and monitor applications.

## 2. Installation

```bash
npm install winston
```

## 3. Logging Levels

| Level   | Priority | Purpose                 |
| ------- | -------: | ----------------------- |
| error   |        0 | Serious errors          |
| warn    |        1 | Potential problems      |
| info    |        2 | Important events        |
| http    |        3 | HTTP requests           |
| verbose |        4 | Detailed information    |
| debug   |        5 | Debugging               |
| silly   |        6 | Extremely detailed logs |

Lower priority numbers mean higher severity.

## 4. Winston Configuration

```javascript
const winston = require("winston");

const logger = winston.createLogger({
  // Different log levels for development and production
  level: process.env.NODE_ENV === "production" ? "info" : "debug",

  // Configure log formatting
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),

  // Add service name to every log
  defaultMeta: { service: "identity-service" },

  // Define where logs should be sent
  transports: [
    // Display logs in terminal
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),

    // Store only error logs
    new winston.transports.File({
      filename: "error.log",
      level: "error",
    }),

    // Store all logs allowed by the configured level
    new winston.transports.File({
      filename: "combined.log",
    }),
  ],
});

// Export logger
module.exports = logger;
```

## 5. Important Configuration Options

- **createLogger():** Creates a Winston logger instance.
- **level:** Controls which logging levels are enabled.
- **timestamp():** Adds date and time to logs.
- **errors({ stack: true }):** Captures error stack traces.
- **splat():** Supports string interpolation.
- **json():** Formats logs as JSON.
- **defaultMeta:** Adds common metadata to every log.
- **transports:** Defines where logs are stored or displayed.
- **Console():** Displays logs in the terminal.
- **File():** Stores logs in files.

## 6. Using the Logger

```javascript
const logger = require("./utils/logger");

logger.info("Identity service started");
logger.warn("Too many login attempts");
logger.error("Database connection failed");
logger.debug("Checking user credentials");
```

## 7. Log Files

| File         | Purpose                                         |
| ------------ | ----------------------------------------------- |
| error.log    | Stores error-level logs                         |
| combined.log | Stores all logs allowed by the configured level |

## 8. Why Winston in Microservices?

In microservices, multiple independent services generate logs.

Using service-specific metadata helps identify which service generated each log.

Example:

- identity-service
- user-service
- product-service
- order-service
- payment-service

For larger systems, centralized logging helps collect and search logs across services.

## 9. Best Practices

1. Use separate loggers for different services.
2. Use appropriate logging levels.
3. Never log passwords or secret tokens.
4. Use timestamps and service metadata.
5. Implement log rotation in production.
6. Consider centralized logging for distributed applications.

### Final takeaway

Winston = Logging + Formatting + Log Levels + Transports.

It helps developers understand what is happening inside their Node.js applications and troubleshoot problems.
