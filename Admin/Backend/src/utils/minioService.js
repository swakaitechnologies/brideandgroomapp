const { minioClient, bannerBucketName } = require("../config/minio");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const path = require("path");

/**
 * Upload a banner to MinIO with Sharp processing
 * @param {object} file - The multer file object
 */
exports.uploadBannerToMinio = async (file) => {
  const fileId = uuidv4();
  const fileExtension = ".webp";
  const fileName = `banners/${fileId}${fileExtension}`;

  // 1. Optimize with Sharp (resize to max 1200 width and convert to WebP)
  const buffer = await sharp(file.buffer)
    .resize(1200, null, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  // 2. Upload to banners bucket
  await minioClient.putObject(bannerBucketName, fileName, buffer, buffer.length, {
    "Content-Type": "image/webp",
  });

  const getUrl = (name) => {
    if (process.env.CDN_URL) {
      return `${process.env.CDN_URL}/${name}`;
    }
    const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
    const host = process.env.MINIO_ENDPOINT || "localhost";
    const port = parseInt(process.env.MINIO_PORT) || 9000;

    return `${protocol}://${host}:${port}/${bannerBucketName}/${name}`;
  };

  return {
    url: getUrl(fileName),
    fileName: fileName,
  };
};
