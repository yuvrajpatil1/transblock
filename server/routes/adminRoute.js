// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updateUserStatus,
  verifyUser,
  getDashboard,
  resetUserVote,
  exportUserData,
  createAdminUser,
  bulkVerifyUsers,
  bulkUpdateUserStatus,
  getSystemHealth,
  getVotingAnalytics,
  getAuditLogs,
  emergencyClearVotes,
  updateCandidateVerificationStatus,
} = require("../controllers/adminController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Middleware to ensure all admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// User Management Routes
router.get("/users", getAllUsers);
router.put("/users/:userId/status", updateUserStatus);
router.put("/users/:userId/verify", verifyUser);
router.put("/users/:userId/reset-vote", resetUserVote);
router.post("/users/create-admin", createAdminUser);
router.put("/users/bulk-verify", bulkVerifyUsers);
router.put("/users/bulk-status", bulkUpdateUserStatus);

// Candidate Management Routes
router.put(
  "/candidates/:candidateId/verify",
  updateCandidateVerificationStatus
);

// Dashboard and Analytics Routes
router.get("/dashboard", getDashboard);
router.get("/analytics/voting", getVotingAnalytics);
router.get("/audit-logs", getAuditLogs);

// System Routes
router.get("/system/health", getSystemHealth);

// Export Routes
router.get("/export/users", exportUserData);

// Emergency Routes
router.post("/emergency/clear-votes", emergencyClearVotes);

module.exports = router;
