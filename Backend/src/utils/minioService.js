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
exports.uploadToMinio = async (folder, file, options = { thumb: true, width: 1200 }, bucket = null) => {
  const targetBucket = bucket || bucketName;
  const fileId = uuidv4();
  const isImage = file.mimetype.startsWith("image/");

  let buffer = file.buffer;
  let thumbBuffer = null;
  let thumbName = null;
  let fileExtension = path.extname(file.originalname);
  let finalMimeType = file.mimetype;

  if (isImage) {
    try {
      // 1. Process Main Image
      buffer = await sharp(file.buffer)
        .resize(options.width || 1200, null, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      fileExtension = ".webp";
      finalMimeType = "image/webp";

      // 2. Process Thumbnail if requested
      if (options.thumb) {
        thumbName = `${folder}/${fileId}_thumb.webp`;
        thumbBuffer = await sharp(file.buffer)
          .resize(300, 300, { fit: "cover" })
          .webp({ quality: 70 })
          .toBuffer();
      }
    } catch (sharpError) {
      console.warn(`[Sharp] Image processing failed for ${file.originalname}, uploading raw file instead:`, sharpError.message);
      buffer = file.buffer;
      fileExtension = path.extname(file.originalname) || ".jpg";
      finalMimeType = file.mimetype;
      thumbBuffer = null;
      thumbName = null;
    }
  }

  const fileName = `${folder}/${fileId}${fileExtension}`;

  // Upload Main
  await minioClient.putObject(targetBucket, fileName, buffer, buffer.length, {
    "Content-Type": finalMimeType,
  });

  // Upload Thumb if exists
  if (thumbBuffer) {
    await minioClient.putObject(targetBucket, thumbName, thumbBuffer, thumbBuffer.length, {
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
    return `${protocol}://${host}:${port}/${targetBucket}/${name}`;
  };

  return {
    url: getUrl(fileName),
    thumbnailUrl: thumbName ? getUrl(thumbName) : null,
    fileName: fileName, // Useful for references
  };
};
