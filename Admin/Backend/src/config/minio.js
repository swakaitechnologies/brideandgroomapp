const Minio = require("minio");

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const bucketName = process.env.MINIO_BUCKET || "brideandgroom";
const kycBucketName = process.env.MINIO_KYC_BUCKET || "kyc-documents";
const bannerBucketName = process.env.MINIO_BANNER_BUCKET || "banners";
const feedbackBucketName = process.env.MINIO_FEEDBACK_BUCKET || "user-feedback";

module.exports = { minioClient, bucketName, kycBucketName, bannerBucketName, feedbackBucketName };

