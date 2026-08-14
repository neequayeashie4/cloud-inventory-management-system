const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const path = require("path");
const env = require("./env");

// No credentials block — the SDK picks up temporary credentials from the
// EC2 instance metadata service via the attached IAM role in production,
// and from the local AWS profile / env vars during development.
const s3 = new S3Client({ region: env.aws.region });

const PRODUCT_PREFIX = "products/";
const SIGNED_URL_EXPIRY_SECONDS = 300;

async function uploadObject(file) {
  const key = `${PRODUCT_PREFIX}${crypto.randomUUID()}${path.extname(file.originalname)}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.aws.s3Bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ServerSideEncryption: "AES256",
    })
  );

  return key;
}

async function deleteObject(key) {
  if (!key) return;
  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.aws.s3Bucket,
      Key: key,
    })
  );
}

async function getObjectSignedUrl(key) {
  if (!key) return null;
  const command = new GetObjectCommand({
    Bucket: env.aws.s3Bucket,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: SIGNED_URL_EXPIRY_SECONDS });
}

module.exports = { uploadObject, deleteObject, getObjectSignedUrl };
