const crypto = require("crypto");

// ENCRYPTION_KEY must be set in .env for production.
// Fallback is ONLY allowed in development/testing.
if (!process.env.ENCRYPTION_KEY && process.env.NODE_ENV === "production") {
  console.error("❌ CRITICAL: ENCRYPTION_KEY is not set. Cannot start in production without it.");
  process.exit(1);
}

const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(String(process.env.ENCRYPTION_KEY || "dev-only-fallback-key-not-for-production"))
  .digest("base64")
  .substr(0, 32);

const IV_LENGTH = 16; // 16 bytes for AES

// Algorithm constants
const ALGORITHM_GCM = "aes-256-gcm";
const ALGORITHM_CBC = "aes-256-cbc"; // Legacy support

function encrypt(text) {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      ALGORITHM_GCM,
      Buffer.from(ENCRYPTION_KEY),
      iv,
    );

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    // Format: IV:AuthTag:EncryptedText
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Encryption Error:", error);
    return text;
  }
}

function decrypt(text) {
  if (!text) return text;
  try {
    const textParts = text.split(":");

    // CASE 1: New GCM Format (IV:AuthTag:Encrypted)
    if (textParts.length === 3) {
      const iv = Buffer.from(textParts[0], "hex");
      const authTag = Buffer.from(textParts[1], "hex");
      const encryptedText = textParts[2];

      const decipher = crypto.createDecipheriv(
        ALGORITHM_GCM,
        Buffer.from(ENCRYPTION_KEY),
        iv,
      );
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    }

    // CASE 2: Legacy CBC Format (IV:Encrypted)
    // We generated this in the previous step. We must support it to avoid showing ciphertext.
    if (textParts.length === 2) {
      const iv = Buffer.from(textParts[0], "hex");
      const encryptedText = Buffer.from(textParts[1], "hex");

      const decipher = crypto.createDecipheriv(
        ALGORITHM_CBC,
        Buffer.from(ENCRYPTION_KEY),
        iv,
      );
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    }

    // CASE 3: Plain text or unknown format
    return text;
  } catch (error) {
    // If decryption fails, we log it but return the original text
    // (though in a real app you might want to return "Message unavailable")
    console.error("Decryption Error:", error.message);
    return text;
  }
}

module.exports = { encrypt, decrypt };
