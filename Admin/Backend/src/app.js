const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

// Import Routes
const adminRoutes = require("./routes/adminRoutes");

// Import Middleware
const sanitizeMiddleware = require("./middleware/sanitizeMiddleware");
const csrfProtection = require("./middleware/csrfMiddleware");

const { metricsMiddleware, metricsHandler } = require("./middleware/metricsMiddleware");

const app = express();

// Trust Proxy
app.set("trust proxy", 1);

// Metrics endpoint (BEFORE other middleware/limiters)
app.use(metricsMiddleware);
app.get("/api/admin/metrics", metricsHandler);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.ADMIN_RATE_LIMIT_MAX) || 100,
  message: { success: false, message: "Too many requests" },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.ADMIN_LOGIN_LIMIT_MAX) || 10,
  message: { success: false, message: "Too many login attempts" },
});

// Middleware
const allowedOrigins = (process.env.ADMIN_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS)
  ? (process.env.ADMIN_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS).split(",")
  : ["http://localhost:5174", "http://localhost:5175"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      // Dynamically allow any Vercel or Render subdomains for easier deployment
      const isVercelOrRender = /https:\/\/[a-zA-Z0-9-]+\.(vercel\.app|onrender\.com)$/.test(origin);
      if (isVercelOrRender) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-Country-Code"],
    exposedHeaders: ["X-CSRF-Token"],
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());
app.use(sanitizeMiddleware);
app.use(csrfProtection);

// Health Check (Bypasses rate limiting but sets CSRF token)
app.get("/api/admin/health", (req, res) => {
  res
    .status(200)
    .json({ success: true, status: "healthy", timestamp: new Date() });
});

app.use(limiter);

// Routes
app.use("/api/admin/login", loginLimiter);
app.use("/api/admin", adminRoutes);
app.get("/", (req, res) => {
  res.send("Admin Backend is running...");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

module.exports = app;
