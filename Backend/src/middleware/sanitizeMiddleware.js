/**
 * Input Sanitization Middleware
 * 
 * Strips dangerous HTML/script content from request body, query, and params
 * to prevent stored XSS attacks. Applied globally before route handlers.
 */

/**
 * Basic HTML entity escape — strips script tags and dangerous attributes.
 * Does NOT use external libraries for zero-dependency security.
 */
const sanitizeValue = (value) => {
  if (typeof value !== "string") return value;

  return value
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove event handler attributes (onclick, onerror, onload, etc.)
    .replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // Remove javascript: protocol
    .replace(/javascript\s*:/gi, "")
    // Remove data: protocol in href/src (can execute code)
    .replace(/data\s*:\s*text\/html/gi, "")
    // Trim excessive whitespace
    .trim();
};

/**
 * Recursively sanitize all string values in an object.
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return sanitizeValue(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  if (typeof obj === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip password fields — they can contain special chars
      if (key.toLowerCase().includes("password")) {
        sanitized[key] = value;
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Express middleware — sanitizes req.body, req.query, req.params.
 */
const sanitizeMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

module.exports = sanitizeMiddleware;
