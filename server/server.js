// server/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");

const dbconfig = require("./config/dbconfig");
const blockchainService = require("./services/blockchainService");

const app = express();

// Database Connection
dbconfig();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/candidates", require("./routes/candidateRoutes"));
app.use("/api/admin", require("./routes/adminRoute"));
app.use("/api/elections", require("./routes/electionRoutes"));
app.use("/api/results", require("./routes/resultsRoutes"));
app.use("/api/blockchain", require("./routes/blockchainRoutes"));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Initialize blockchain service
const initializeBlockchain = async () => {
  try {
    await blockchainService.initialize();
    console.log("Blockchain service initialized");
  } catch (error) {
    console.error("Failed to initialize blockchain service:", error);
    console.log("Server will continue without blockchain features");
  }
};

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await initializeBlockchain();
});

module.exports = app;
