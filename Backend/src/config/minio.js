const Minio = require("minio");

let minioClient;

const bucketName = process.env.MINIO_BUCKET || "user-photos";
const kycBucketName = process.env.MINIO_KYC_BUCKET || "kyc-documents";
const bannerBucketName = process.env.MINIO_BANNER_BUCKET || "banners";
const feedbackBucketName = process.env.MINIO_FEEDBACK_BUCKET || "user-feedback";

console.log("Initializing local MinIO Client...");
minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

const useS3 = false;

// Ensure buckets exist
const initMinio = async (retries = 5) => {
  const buckets = [bucketName, kycBucketName, bannerBucketName, feedbackBucketName];

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Checking MinIO connection (Attempt ${i + 1}/${retries})...`);

      for (const bucket of buckets) {
        if (!bucket) continue;
        const exists = await minioClient.bucketExists(bucket);
        if (!exists) {
          console.log(`Bucket "${bucket}" does not exist. Creating...`);
          try {
            await minioClient.makeBucket(bucket);
            console.log(`Bucket "${bucket}" created successfully.`);
          } catch (createErr) {
            console.warn(`Could not create bucket "${bucket}" (it may already exist or creation is not allowed):`, createErr.message);
          }
        }

        // Set policy
        const policy = {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: { AWS: ["*"] },
              Action: ["s3:GetBucketLocation", "s3:ListBucket"],
              Resource: [`arn:aws:s3:::${bucket}`],
            },
            {
              Effect: "Allow",
              Principal: { AWS: ["*"] },
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${bucket}/*`],
            },
          ],
        };
        await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
      }
      return; // Success
    } catch (err) {
      console.error(`Attempt ${i + 1} failed:`, err.message);
      if (err.message.includes("License has fully expired")) {
        return;
      }
      if (i === retries - 1) {
        console.error(`Failed to initialize MinIO after all attempts.`);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }
};

module.exports = { minioClient, bucketName, kycBucketName, bannerBucketName, feedbackBucketName, initMinio, useS3 };
