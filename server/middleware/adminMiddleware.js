// const User = require("../models/userModel");

// const adminMiddleware = async (req, res, next) => {
//   try {
//     const userId = req.body.userId;
//     const user = await User.findById(userId);

//     if (!user || !user.isAdmin) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied. Admin privileges required.",
//       });
//     }

//     next();
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Error verifying admin status",
//       error: error.message,
//     });
//   }
// };

// module.exports = adminMiddleware;

// server/middleware/adminMiddleware.js
module.exports = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required",
    });
  }
  next();
};
