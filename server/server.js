const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const compression = require("compression");
require("dotenv").config();

// Import routes
const userRoutes = require("./routes/userRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
// const adminRoutes = require("./routes/adminRoute");
const resultsRoutes = require("./routes/resultsRoutes");

const app = express();

// Trust proxy if behind reverse proxy (for accurate IP addresses in rate limiting)
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Rate limiting with different limits for different routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Stricter limit for auth routes
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const votingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1, // Only one vote per hour per IP
  message: {
    success: false,
    message:
      "You have already voted recently. Please wait before voting again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// Body parsing middleware with size limits
app.use(
  express.json({
    limit: "10mb",
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// MongoDB connection with better error handling
const connectDB = async () => {
  try {
    const mongoURI =
      "mongodb+srv://yuvrajpatil12092004:D6EZUYZQMv5ALF7R@cluster0.o9dzamn.mongodb.net/";

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("MongoDB connected successfully");

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

// Initialize database connection
connectDB();

// Routes with specific rate limiting
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/users/vote", votingLimiter);

app.use("/api/users", userRoutes);
app.use("/api/candidates", candidateRoutes);
// app.use("/api/admin", adminRoutes);
app.use("/api/results", resultsRoutes);

// Health check route with more detailed info
app.get("/health", async (req, res) => {
  const healthCheck = {
    status: "OK",
    message: "Blockchain Voting System Backend is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    database: {
      status:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      name: mongoose.connection.name,
    },
    memory: process.memoryUsage(),
    version: process.version,
  };

  try {
    // Quick database ping
    await mongoose.connection.db.admin().ping();
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.status = "ERROR";
    healthCheck.database.status = "error";
    healthCheck.database.error = error.message;
    res.status(503).json(healthCheck);
  }
});

// API documentation route (basic)
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Blockchain Voting System API",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      candidates: "/api/candidates",
      results: "/api/results",
      health: "/health",
    },
    documentation: "For detailed API documentation, visit /api/docs",
  });
});

// Request logging for debugging (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Validation error handling
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: errors,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  next(err);
});

// General error handling middleware
app.use((err, req, res, next) => {
  console.error("Error Stack:", err.stack);
  console.error("Error Time:", new Date().toISOString());
  console.error("Request URL:", req.url);
  console.error("Request Method:", req.method);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Something went wrong!" : err.message,
    error:
      process.env.NODE_ENV === "development"
        ? {
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
          }
        : "Internal Server Error",
    timestamp: new Date().toISOString(),
  });
});

// Handle 404 routes
app.use("/{*any}", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      "/api/users",
      "/api/candidates",
      "/api/results",
      "/health",
    ],
  });
});

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down gracefully...");

  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  console.log("SIGINT received. Shutting down gracefully...");

  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API Info: http://localhost:${PORT}/api`);
});

// Handle server errors
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error("Server error:", err);
  }
});

module.exports = app;
