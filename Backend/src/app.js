// Backend API Version: 1.2.0 - Full Security + Payment + Performance
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const csrfProtection = require("./middleware/csrfMiddleware");
const sanitizeMiddleware = require("./middleware/sanitizeMiddleware");
const { initSentry, Sentry } = require("./config/sentry");

const path = require("path");

const rateLimit = require("express-rate-limit");
const { metricsMiddleware, metricsHandler } = require("./middleware/metricsMiddleware");
const { cacheMiddleware } = require("./middleware/cacheMiddleware");

// Load Associations
// Version 1.0.5 - API Stabilization Update
require("./models/associations");


const storyRoutes = require("./routes/storyRoutes");

const app = express();

// Initialize Sentry
initSentry(app);

// Trust Proxy
app.set("trust proxy", 1);

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 200 : 10000,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 20 : 10000,
  message: {
    success: false,
    message:
      "Too many authentication attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limits for interactions (Spam prevention)
const interactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 10000,
  message: {
    success: false,
    message: "Action limit reached. Please wait before sending more requests.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 3 : 10000,
  message: {
    success: false,
    message: "You are reporting too frequently. Please wait.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

const minioPublicUrl = process.env.MINIO_PUBLIC_URL || "http://localhost:9000";

app.use(
  cors({
    origin: (origin, callback) => {
      // In production: strict origin checking
      if (process.env.NODE_ENV === "production") {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      } else {
        // Development: allow all
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-Country-Code"],
    exposedHeaders: ["X-CSRF-Token"], // Allow frontend JS to read this header
    maxAge: 86400, // Cache preflight for 24 hours
  }),
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Strict Transport Security — force HTTPS for 1 year
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    // Referrer Policy — don't leak full URL to external sites
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://checkout.razorpay.com", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://api.dicebear.com", minioPublicUrl, "https://*.mercdn.net"],
        connectSrc: ["'self'", ...allowedOrigins, minioPublicUrl, "https://api.razorpay.com", "https://lumberjack.razorpay.com", "https://api.stripe.com", "http://localhost:5000"],
        frameSrc: ["'self'", "https://api.razorpay.com", "https://js.stripe.com"],
        workerSrc: ["'self'", "blob:"],
      },
    },
    // Permissions-Policy — disable unused browser features
    permissionsPolicy: {
      features: {
        camera: ["'none'"],
        microphone: ["'none'"],
        geolocation: ["'self'"],
        payment: ["'self'", "https://api.razorpay.com", "https://js.stripe.com"],
      },
    },
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(sanitizeMiddleware);
app.use(csrfProtection);

// Serve static files (uploads) FIRST - to avoid rate limiting images
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Global Rate Limiting (Applied to API routes)
app.use(globalLimiter);

// Prometheus Metrics (before routes, after rate limiting)
app.use(metricsMiddleware);
app.get("/api/metrics", metricsHandler);

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Matrimony API" });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    ip: req.ip
  });
});

app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/matches", require("./routes/matchRoutes"));
app.use("/api/banners", require("./routes/bannerRoutes"));
app.use("/api/photos", require("./routes/photoRoutes"));
app.use(
  "/api/partner-preferences",
  require("./routes/partnerPreferenceRoutes"),
);
app.use("/api/privacy", require("./routes/privacyRoutes"));
app.use(
  "/api/interests",
  interactionLimiter,
  require("./routes/interestRoutes"),
);
app.use(
  "/api/contact-requests",
  interactionLimiter,
  require("./routes/contactRequestRoutes"),
);
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/messages", interactionLimiter, require("./routes/messageRoutes"));
app.use("/api/block", require("./routes/blockRoutes"));
app.use("/api/reports", reportLimiter, require("./routes/reportRoutes"));
app.use("/api/kyc", require("./routes/kycRoutes"));
app.use("/api/stories", storyRoutes);

app.use("/api/feedback", require("./routes/feedbackRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/shortlist", require("./routes/shortlistRoutes"));
app.use("/api/newsletter", require("./routes/newsletterRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

// Cached endpoints — frequently accessed, rarely changed
app.get("/api/cached/plans", cacheMiddleware(600), (req, res, next) => {
  req.url = "/plans";
  require("./routes/paymentRoutes").handle(req, res, next);
});
// Health Check
app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ success: true, status: "healthy", timestamp: new Date() });
});

// 404 Catch-all for API
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
  });
});

// Sentry Error Handler (Must be before custom error handlers)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Error Handling Middleware (500/505)
app.use((err, req, res, _next) => {
  /* eslint-disable no-unused-vars */
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

module.exports = app;
