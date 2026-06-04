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

if (useS3) {
  console.log("Initializing AWS S3 Client...");
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
  console.log("Initializing local MinIO Client...");
  minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  });
}

// Ensure buckets exist
const initMinio = async (retries = 5) => {
  const buckets = [bucketName, kycBucketName, bannerBucketName, feedbackBucketName];

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Checking ${useS3 ? "S3" : "MinIO"} connection (Attempt ${i + 1}/${retries})...`);

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

        // Set policy if using MinIO (AWS R2/S3 is typically configured via block public access/policies manually)
        if (!useS3) {
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
      }
      return; // Success
    } catch (err) {
      console.error(`Attempt ${i + 1} failed:`, err.message);
      if (err.message.includes("License has fully expired")) {
        return;
      }
      if (i === retries - 1) {
        console.error(`Failed to initialize ${useS3 ? "S3" : "MinIO"} after all attempts.`);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }
};

module.exports = { minioClient, bucketName, kycBucketName, bannerBucketName, feedbackBucketName, initMinio, useS3 };
