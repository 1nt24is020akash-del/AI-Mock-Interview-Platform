const express = require("express");
const { protect } = require("../middleware/auth.js");
const multer = require("multer");
const path = require("path");
const { analyzeResume } = require("../controllers/resumecontroller.js");

const router = express.Router();

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream", // Allow octet-stream if extension matches
];

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Up to 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mimeValid = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const extValid = ALLOWED_EXTENSIONS.includes(ext);

    if (extValid && mimeValid) {
      cb(null, true);
    } else if (extValid) {
      // Trust extension if mime is generic
      cb(null, true);
    } else {
      cb(
        new Error(
          "Unable to analyze this document. Please upload a valid resume containing sufficient information about your skills, education, projects, experience, or qualifications."
        ),
        false
      );
    }
  },
});

// Middleware to handle multer file upload errors gracefully
const handleUpload = (req, res, next) => {
  const uploadSingle = upload.single("resume");
  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "File size exceeds 10MB limit. Please upload a smaller resume.",
          message: "File size exceeds 10MB limit. Please upload a smaller resume.",
        });
      }
      return res.status(400).json({
        error:
          err.message ||
          "Unable to analyze this document. Please upload a valid resume containing sufficient information about your skills, education, projects, experience, or qualifications.",
        message:
          err.message ||
          "Unable to analyze this document. Please upload a valid resume containing sufficient information about your skills, education, projects, experience, or qualifications.",
      });
    }
    next();
  });
};

router.post("/analyze", protect, handleUpload, analyzeResume);

module.exports = router;