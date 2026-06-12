const multer = require("multer");

// Use memory storage since we process with Sharp and upload to MinIO
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed!"));
    }
  },
});

const attachmentUpload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for chat attachments
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [
      ".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif", ".svg", ".bmp", ".tiff",
      ".pdf", ".doc", ".docx", ".txt", ".xls", ".xlsx", ".ppt", ".pptx", ".csv", ".rtf",
      ".zip", ".rar", ".7z", ".tar", ".gz",
      ".mp3", ".wav", ".m4a", ".aac", ".ogg",
      ".mp4", ".mov", ".avi", ".mkv", ".webm", ".3gp"
    ];
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/rtf",
      "application/zip",
      "application/x-zip-compressed",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      "application/x-tar",
      "application/gzip",
      "application/octet-stream"
    ];

    const path = require("path");
    const ext = path.extname(file.originalname).toLowerCase();
    
    const isAccepted = 
      file.mimetype.startsWith("image/") || 
      file.mimetype.startsWith("audio/") || 
      file.mimetype.startsWith("video/") || 
      allowedMimeTypes.includes(file.mimetype) || 
      allowedExtensions.includes(ext);

    if (isAccepted) {
      cb(null, true);
    } else {
      cb(new Error("Only images, audio, video, and standard documents (PDF, Word, Excel, PowerPoint, TXT, CSV, RTF, ZIP, RAR, 7Z) are allowed!"));
    }
  },
});

const reportUpload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only images and PDF documents are allowed as proof!"));
    }
  },
});

const videoIntroUpload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit per video
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed for intro video!"));
    }
  },
});

module.exports = upload;
module.exports.attachmentUpload = attachmentUpload;
module.exports.reportUpload = reportUpload;
module.exports.videoIntroUpload = videoIntroUpload;
