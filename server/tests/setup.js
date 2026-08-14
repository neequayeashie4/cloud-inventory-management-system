// Loaded before every test file (see the "jest" block in package.json).
// Populates the env vars config/env.js requires at boot so app.js can be
// required without a real .env file or a live database.
process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.JWT_SECRET = "test-secret-key-not-for-production";
process.env.JWT_EXPIRES_IN = "8h";
process.env.DB_HOST = "127.0.0.1";
process.env.DB_PORT = "3306";
process.env.DB_USER = "test";
process.env.DB_PASSWORD = "test";
process.env.DB_NAME = "inventory_test";
process.env.AWS_REGION = "eu-west-1";
process.env.S3_BUCKET = "test-bucket";
