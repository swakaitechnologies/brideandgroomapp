const Minio = require("minio");
const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const awsAccessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const awsRegion = process.env.APP_AWS_REGION || process.env.AWS_REGION || "ap-south-1";

const useS3 = !!(awsAccessKeyId && awsSecretAccessKey);

let minioClient;

const bucketName = useS3
  ? (process.env.AWS_BUCKET || "brideandgroom-989346120215-ap-south-1-an")
  : (process.env.MINIO_BUCKET || "user-photos");

const kycBucketName = useS3
  ? (process.env.AWS_KYC_BUCKET || "kyc-documents-989346120215-ap-south-1-an")
  : (process.env.MINIO_KYC_BUCKET || "kyc-documents");

const bannerBucketName = useS3
  ? (process.env.AWS_BANNER_BUCKET || "banners-989346120215-ap-south-1-an")
  : (process.env.MINIO_BANNER_BUCKET || "banners");

const feedbackBucketName = useS3
  ? (process.env.AWS_FEEDBACK_BUCKET || "user-feedback-989346120215-ap-south-1-an")
  : (process.env.MINIO_FEEDBACK_BUCKET || "user-feedback");

const reportBucketName = useS3
  ? (process.env.AWS_REPORT_BUCKET || "reports-989346120215-ap-south-1-an")
  : (process.env.MINIO_REPORT_BUCKET || "report-bucket");

if (useS3) {
  console.log("Admin Backend: Initializing AWS S3 Client...");
  const s3 = new S3Client({
    region: awsRegion,
    credentials: {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
    }
  });

  // Compatibility Wrapper matching minioClient interface
  minioClient = {
    async putObject(bucket, key, body, size, metadata = {}) {
      const contentType = metadata["Content-Type"] || metadata["content-type"] || "application/octet-stream";
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      });
      return s3.send(command);
    },

    async removeObject(bucket, key) {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      return s3.send(command);
    },

    async presignedGetObject(bucket, key, expires = 3600) {
      const { GetObjectCommand } = require("@aws-sdk/client-s3");
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      return getSignedUrl(s3, command, { expiresIn: expires });
    },

    async bucketExists(bucket) {
      try {
        const command = new HeadBucketCommand({ Bucket: bucket });
        await s3.send(command);
        return true;
      } catch (err) {
        if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) return false;
        throw err;
      }
    },

    async makeBucket(bucket) {
      const command = new CreateBucketCommand({ Bucket: bucket });
      return s3.send(command);
    },

    async setBucketPolicy(bucket, policy) {
      try {
        const command = new PutBucketPolicyCommand({
          Bucket: bucket,
          Policy: typeof policy === "string" ? policy : JSON.stringify(policy),
        });
        return s3.send(command);
      } catch (err) {
        console.warn(`[AWS S3] Warning setting policy for ${bucket}:`, err.message);
      }
    }
  };
} else {
  console.log("Admin Backend: Initializing local MinIO Client...");
  minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  });
}

const resolvePresignedUrl = (presignedUrl) => {
  if (!presignedUrl) return presignedUrl;
  const publicUrl = process.env.MINIO_PUBLIC_URL;
  if (publicUrl) {
    try {
      const urlObj = new URL(presignedUrl);
      const publicUrlObj = new URL(publicUrl);
      urlObj.protocol = publicUrlObj.protocol;
      urlObj.host = publicUrlObj.host;
      return urlObj.toString();
    } catch (e) {
      console.error("Error resolving presigned URL host:", e);
    }
  }
  return presignedUrl;
};

module.exports = { minioClient, bucketName, kycBucketName, bannerBucketName, feedbackBucketName, reportBucketName, resolvePresignedUrl, useS3 };
