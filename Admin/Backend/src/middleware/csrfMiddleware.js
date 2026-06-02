const crypto = require("crypto");

/**
 * CSRF Protection Middleware for Admin Backend
 * 
 * Uses Double Submit Cookie pattern.
 */

const CSRF_COOKIE_NAME = "admin-csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

const generateToken = () => crypto.randomBytes(32).toString("hex");

const csrfProtection = (req, res, next) => {
    // For safe methods (GET, HEAD, OPTIONS), attach/verify a CSRF token
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        let token = req.cookies[CSRF_COOKIE_NAME];
        if (!token) {
            token = generateToken();
            res.cookie(CSRF_COOKIE_NAME, token, {
                httpOnly: false,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                maxAge: 24 * 60 * 60 * 1000,
            });
        }
        res.set(CSRF_HEADER_NAME, token);
        return next();
    }

    // For unsafe methods, validate the token
    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.get(CSRF_HEADER_NAME);

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        console.warn(`[ADMIN CSRF FAILURE] Path: ${req.path}, Cookie: ${!!cookieToken}, Header: ${!!headerToken}`);
        return res.status(403).json({
            success: false,
            message: "CSRF token validation failed",
        });
    }

    next();
};

module.exports = csrfProtection;
