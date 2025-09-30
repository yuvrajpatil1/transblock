// const jwt = require("jsonwebtoken");

// module.exports = function (req, res, next) {
//   try {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) {
//       return res
//         .status(401)
//         .send({ success: false, message: "No token provided" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     req.userId = decoded.userId;
//     console.log("🔐 Received Auth Header:", req.headers.authorization);
//     console.log("👤 User ID from token:", req.userId);

//     next();
//   } catch (error) {
//     console.log("JWT Error:", error.message);
//     return res
//       .status(401)
//       .send({ success: false, message: "Invalid or expired token" });
//   }
// };

// // const jwt = require("jsonwebtoken");
// // const User = require("../models/userModel");

// // const authMiddleware = async (req, res, next) => {
// //   try {
// //     const token = req.header("Authorization")?.replace("Bearer ", "");

// //     if (!token) {
// //       return res.status(401).json({
// //         success: false,
// //         message: "Access denied. No token provided.",
// //       });
// //     }

// //     // Verify token
// //     const decoded = jwt.verify(
// //       token,
// //       process.env.JWT_SECRET || "your-secret-key"
// //     );

// //     // Find user by ID
// //     const user = await User.findById(decoded.userId).select("-password");

// //     if (!user) {
// //       return res.status(401).json({
// //         success: false,
// //         message: "Invalid token. User not found.",
// //       });
// //     }

// //     if (!user.isActive) {
// //       return res.status(401).json({
// //         success: false,
// //         message: "Account is deactivated.",
// //       });
// //     }

// //     // Add user info to request object
// //     req.user = user;
// //     req.userId = user._id;
// //     req.userRole = user.role;

// //     next();
// //   } catch (error) {
// //     console.error("Auth middleware error:", error);

// //     if (error.name === "JsonWebTokenError") {
// //       return res.status(401).json({
// //         success: false,
// //         message: "Invalid token.",
// //       });
// //     }

// //     if (error.name === "TokenExpiredError") {
// //       return res.status(401).json({
// //         success: false,
// //         message: "Token expired.",
// //       });
// //     }

// //     return res.status(500).json({
// //       success: false,
// //       message: "Server error during authentication.",
// //     });
// //   }
// // };

// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    // Get user and attach to request
    const User = require("../models/userModel");
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
