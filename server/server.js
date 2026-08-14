require("dotenv").config();

const app = require("./src/app");
const env = require("./src/config/env");
const logger = require("./src/config/logger");

const server = app.listen(env.port, () => {
  logger.info(`Inventory API listening on port ${env.port} (${env.nodeEnv})`);
});

process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => process.exit(0));
});
