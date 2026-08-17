const REQUIRED_VARS = [
  "NODE_ENV",
  "PORT",
  "JWT_SECRET",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "AWS_REGION",
  "S3_BUCKET",
];

function loadEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key] || process.env[key].trim() === "");

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  return {
    nodeEnv: process.env.NODE_ENV,
    port: parseInt(process.env.PORT, 10),
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
    db: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    aws: {
      region: process.env.AWS_REGION,
      s3Bucket: process.env.S3_BUCKET,
      s3UrlExpirySeconds: Number(process.env.S3_URL_EXPIRY) || 900,
    },
  };
}

module.exports = loadEnv();
