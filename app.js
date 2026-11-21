const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const openapi = require("./docs/openapi");
const { apiLimiter, authLimiter, sensitiveLimiter } = require("./middleware/rateLimit.middleware");
const { csrfToken, requireCsrf } = require("./middleware/csrf.middleware");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const applicationRoutes = require("./routes/application.routes");
const applicationAuthRoutes = require("./routes/application-auth.routes");
const adminRoutes = require("./routes/admin.routes");
const notFound = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");

const { CLIENT_URL } = require("./config/env");

const app = express();

// Security headers
app.use(helmet());

// Cross-origin request configuration
app.use(
  cors({
    origin: (origin, callback) => !origin || origin === CLIENT_URL ? callback(null, true) : callback(new Error("Origin not allowed by CORS")),
    credentials: true,
  })
);

// Parse incoming JSON requests
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());
app.use("/api", apiLimiter);
app.get("/api/auth/csrf", csrfToken);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// API routes
app.use("/api/health", healthRoutes);

// Authentication routes
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", sensitiveLimiter);
app.use("/api/auth/verify-email/request", sensitiveLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/app-auth", applicationAuthRoutes);
app.use("/api/admin", adminRoutes);

// Handle unknown routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
