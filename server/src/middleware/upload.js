const multer = require("multer");
const AppError = require("../utils/AppError");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// memoryStorage: the file buffer is streamed straight to S3, never written
// to the EC2 instance's local disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    const ok = ALLOWED_MIME_TYPES.includes(file.mimetype);
    cb(ok ? null : new AppError("Only JPEG, PNG or WebP images are allowed", 400, "VALIDATION_ERROR"), ok);
  },
});

module.exports = upload;
