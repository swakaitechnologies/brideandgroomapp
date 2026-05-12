const Minio = require("minio");

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const bucketName = process.env.MINIO_BUCKET;
const kycBucketName = process.env.MINIO_KYC_BUCKET || "kyc-documents";
const bannerBucketName = process.env.MINIO_BANNER_BUCKET || "banners";

// Delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Ensure bucket and policies exist
const initMinio = async (retries = 5) => {
  const buckets = [bucketName, kycBucketName, bannerBucketName];

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Checking MinIO connection (Attempt ${i + 1}/${retries})...`);

      for (const bucket of buckets) {
        const exists = await minioClient.bucketExists(bucket);
        if (!exists) {
          await minioClient.makeBucket(bucket);
          console.log(`Bucket "${bucket}" created successfully.`);
        }

        // 1. Set bucket policy to allow public READ access for frontend visibility
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
        console.log(`Bucket "${bucket}" policy set to PUBLIC READ.`);

        // 2. Set CORS Policy to allow frontend to load images
        const corsConfig = [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "HEAD"],
            AllowedOrigins: ["https://brideandgroom.co.in", "https://admin.brideandgroom.co.in", "http://localhost:3000"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3000
          }
        ];
        
        try {
          // Note: minioClient.setBucketCors is the standard way to set CORS
          await minioClient.setBucketCors(bucket, corsConfig);
          console.log(`Bucket "${bucket}" CORS policy set successfully.`);
        } catch (corsErr) {
          console.warn(`Warning: Could not set CORS for bucket "${bucket}":`, corsErr.message);
        }
      }
      return; // Success
    } catch (err) {
      console.error(`Attempt ${i + 1} failed:`, err.message);
      
      // If license is expired, don't keep retrying as it will always fail
      if (err.message.includes("License has fully expired")) {
        console.warn("⚠️ Minio License Expired. Skipping further initialization attempts for local development.");
        return;
      }

      if (i === retries - 1) {
        console.error("Failed to initialize MinIO after all attempts.");
      } else {
        await delay(3000); // Wait 3 seconds before next retry
      }
    }
  }
};

module.exports = { minioClient, bucketName, kycBucketName, bannerBucketName, initMinio };
