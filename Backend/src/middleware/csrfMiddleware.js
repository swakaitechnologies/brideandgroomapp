const crypto = require("crypto");

/**
 * CSRF Protection Middleware (Double Submit Cookie Pattern)
 * 
 * On GET requests: generates a CSRF token, sets it in a cookie + response header.
 * On POST/PUT/DELETE requests: validates the token from the request header against the cookie.
 */

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

const generateToken = () => crypto.randomBytes(32).toString("hex");

// Routes that skip CSRF (webhooks only — health checks should still provide tokens)
const SKIP_PATHS = [
    "/api/payments/webhook/razorpay",
    "/api/payments/webhook/stripe",
];
const csrfProtection = (req, res, next) => {
    // Skip CSRF for mobile app requests (CSRF is a browser-specific vulnerability)
    if (req.get("X-Mobile-App") === "true") {
        return next();
    }

    // Skip CSRF for webhook endpoints
    if (SKIP_PATHS.some((path) => req.path.startsWith(path))) {
        return next();
    }

    // For safe methods (GET, HEAD, OPTIONS), attach a CSRF token
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        let token = req.cookies[CSRF_COOKIE_NAME];
        if (!token) {
            token = generateToken();
            res.cookie(CSRF_COOKIE_NAME, token, {
                httpOnly: false, // Must be readable by JavaScript
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            });
        }
        // Always expose token in response header for cross-origin frontends
        res.set(CSRF_HEADER_NAME, token);
        return next();
    }

    // For unsafe methods, validate the token
    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.get(CSRF_HEADER_NAME);

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        console.warn(`[CSRF FAILURE] Path: ${req.path}, Cookie: ${!!cookieToken}, Header: ${!!headerToken}, Match: ${cookieToken === headerToken}`);
        return res.status(403).json({
            success: false,
            message: "CSRF token validation failed",
        });
    }

    next();
};

module.exports = csrfProtection;
