/**
 * Content Filter Utility
 * Detects phone numbers, social media links, and handles in text.
 */

const numberWords = {
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
};

const forbiddenMessage =
  "No Private phone number, social media links, username/handles allow";

/**
 * Validates message content for prohibited contact information.
 * @param {string} text - The message content to validate.
 * @returns {Object} - { isValid: boolean, reason: string | null }
 */
const validateMessageContent = (text) => {
  if (!text) return { isValid: true, reason: null };

  if (text.startsWith("[IMAGE]:") || text.startsWith("[DOCUMENT]:") || text.startsWith("[AUDIO]:")) {
    console.log(`[DEBUG] Attachment message allowed automatically: "${text}"`);
    return { isValid: true, reason: null };
  }

  const lowercaseText = text.toLowerCase();
  console.log(`[DEBUG] Filtering message: "${text}"`);

  // 1. Check for Social Media Links (expanded)
  const socialDomains = [
    "instagram.com", "facebook.com", "fb.com", "linked.in", "linkedin.com",
    "twitter.com", "x.com", "snapchat.com", "wa.me", "t.me", "whatsapp.com",
    "telegram.me", "snap.chat", "github.com", "gmail.com", "yahoo.com"
  ];

  for (const domain of socialDomains) {
    if (lowercaseText.includes(domain)) {
      console.log(`[DEBUG] Blocked: matched domain "${domain}"`);
      return { isValid: false, reason: forbiddenMessage };
    }
  }

  // 2. Check for Social Media Keywords/Handles (expanded)
  const socialKeywords = [
    "insta", "ig:", "ig ", "fb:", "fb ", "snap:", "snap ", "snapchat",
    "whatsapp", "telegram", "tele:", "gmail", "yahoo", "outlook", "mail me",
    "contact me", "ping me", "my id", "@gmail", "linked in", "message me on"
  ];

  // Also check for @handles
  const handlePattern = /@[\w._]{3,}/;
  if (handlePattern.test(text)) {
    console.log(`[DEBUG] Blocked: matched handle pattern`);
    return { isValid: false, reason: forbiddenMessage };
  }

  for (const keyword of socialKeywords) {
    if (lowercaseText.includes(keyword)) {
      console.log(`[DEBUG] Blocked: matched keyword "${keyword}"`);
      return { isValid: false, reason: forbiddenMessage };
    }
  }

  // 3. Robust Phone Number Detection
  // Matches 10 digits with any delimiters (spaces, dots, dashes, parentheses)
  // Also catches numbers like +91 987 654 3210
  const normalizedText = lowercaseText.replace(/[^\d]/g, "");
  
  // Generic numeric pattern for 10+ digits anywhere in text
  const numericPattern = /(?:\d[\s.-]*){10,}/;
  if (numericPattern.test(text)) {
    console.log(`[DEBUG] Blocked: matched numeric pattern`);
    return { isValid: false, reason: forbiddenMessage };
  }

  // 4. Check for Text-based Phone Numbers
  let textAsDigits = lowercaseText;
  Object.keys(numberWords).forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    textAsDigits = textAsDigits.replace(regex, numberWords[word]);
  });

  const strippedText = textAsDigits.replace(/[^\d]/g, "");
  if (strippedText.length >= 10) {
    console.log(`[DEBUG] Blocked: matched text-based number (stripped: ${strippedText})`);
    return { isValid: false, reason: forbiddenMessage };
  }

  // 5. Catch mixed numbers like "nine 876 five 43210"
  // If the total digit count (including words converted) is >= 10
  if (strippedText.length >= 10) {
    console.log(`[DEBUG] Blocked: reached digit threshold`);
    return { isValid: false, reason: forbiddenMessage };
  }

  console.log(`[DEBUG] Message allowed`);
  return { isValid: true, reason: null };
};

module.exports = { validateMessageContent };
