require("dotenv").config();
const { Photo } = require("./src/models/associations");
const { sequelize } = require("./src/config/database");

async function fixUrls() {
  try {
    const targetDomain = "localhost:9000";

    console.log(`🔍 Searching for photos with old IPs or domains...`);

    const photos = await Photo.findAll();
    let updatedCount = 0;

    const pattern = /(?:192\.168\.\d+\.\d+|127\.0\.0\.1|localhost|storage\.brideandgroom\.co\.in):9000|storage\.brideandgroom\.co\.in/gi;

    for (const photo of photos) {
      let needsUpdate = false;
      let newUrl = photo.url;
      let newThumb = photo.thumbnailUrl;

      if (photo.url && (pattern.test(photo.url) || !photo.url.includes(targetDomain))) {
        newUrl = photo.url.replace(pattern, targetDomain).replace("https://", "http://");
        // Ensure protocol is http since local MinIO uses http
        if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
          newUrl = "http://" + newUrl;
        }
        needsUpdate = true;
      }

      if (photo.thumbnailUrl && (pattern.test(photo.thumbnailUrl) || !photo.thumbnailUrl.includes(targetDomain))) {
        newThumb = photo.thumbnailUrl.replace(pattern, targetDomain).replace("https://", "http://");
        if (!newThumb.startsWith("http://") && !newThumb.startsWith("https://")) {
          newThumb = "http://" + newThumb;
        }
        needsUpdate = true;
      }

      if (needsUpdate) {
        await photo.update({ url: newUrl, thumbnailUrl: newThumb });
        updatedCount++;
      }
    }

    console.log(`✅ Successfully updated ${updatedCount} photo URLs to use ${targetDomain}.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing photo URLs:", error);
    process.exit(1);
  }
}

fixUrls();
