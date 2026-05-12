const { minioClient, bucketName } = require("../config/minio");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const path = require("path");

/**
 * Upload a file to MinIO with optional Sharp processing
 * @param {string} folder - The folder/prefix to use 
 * @param {object} file - The multer file object
 * @param {object} options - Optimization options { thumb: boolean, width: number }
 */
exports.uploadToMinio = async (folder, file, options = { thumb: true, width: 1200 }) => {
  const fileId = uuidv4();
  const isImage = file.mimetype.startsWith("image/");
  const fileExtension = isImage ? ".webp" : path.extname(file.originalname);
  const fileName = `${folder}/${fileId}${fileExtension}`;

  let buffer = file.buffer;
  let thumbBuffer = null;
  let thumbName = null;

  if (isImage) {
    // 1. Process Main Image
    buffer = await sharp(file.buffer)
      .resize(options.width || 1200, null, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // 2. Process Thumbnail if requested
    if (options.thumb) {
      thumbName = `${folder}/${fileId}_thumb.webp`;
      thumbBuffer = await sharp(file.buffer)
        .resize(300, 300, { fit: "cover" })
        .webp({ quality: 70 })
        .toBuffer();
    }
  }

  // Upload Main
  await minioClient.putObject(bucketName, fileName, buffer, buffer.length, {
    "Content-Type": isImage ? "image/webp" : file.mimetype,
  });

  // Upload Thumb if exists
  if (thumbBuffer) {
    await minioClient.putObject(bucketName, thumbName, thumbBuffer, thumbBuffer.length, {
      "Content-Type": "image/webp",
    });
  }

  const getUrl = (name) => {
    if (process.env.CDN_URL) return `${process.env.CDN_URL}/${name}`;
    const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
    const host = process.env.MINIO_ENDPOINT;
    const port = parseInt(process.env.MINIO_PORT);

    if (!host || isNaN(port)) {
      throw new Error("MINIO_ENDPOINT or MINIO_PORT not configured in environment variables");
    }
    return `${protocol}://${host}:${port}/${bucketName}/${name}`;
  };

  return {
    url: getUrl(fileName),
    thumbnailUrl: thumbName ? getUrl(thumbName) : null,
    fileName: fileName, // Useful for references
  };
};
