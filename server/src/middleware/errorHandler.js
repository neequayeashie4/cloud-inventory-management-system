const multer = require("multer");
const logger = require("../config/logger");

// Centralised error handler — must be registered last, after all routes.
module.exports = function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || "INTERNAL_ERROR";
  let message = err.message || "Something went wrong";

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = err.code === "LIMIT_FILE_SIZE" ? "File exceeds the 5MB size limit" : err.message;
  }

  if (statusCode >= 500) {
    logger.error(err.stack || err.message);
  } else {
    logger.warn(`${statusCode} ${code}: ${message}`);
  }

  // Stack traces never leave the server, in any environment.
  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
};
