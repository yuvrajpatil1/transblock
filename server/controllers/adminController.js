// server/controllers/adminController.js
const User = require("../models/userModel");
const Candidate = require("../models/candidateModel");
const Election = require("../models/electionModel");
const Vote = require("../models/voteModel");
const blockchainService = require("../services/blockchainService");

// Get all users with pagination and filtering
exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "",
      status = "",
    } = req.query;

    let filter = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) filter.role = role;
    if (status === "verified") filter.isVerified = true;
    if (status === "unverified") filter.isVerified = false;

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      message: "Users fetched successfully",
      data: {
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: user,
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user status",
      error: error.message,
    });
  }
};

// Verify user
exports.verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isVerified: true },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User verified successfully",
      data: user,
    });
  } catch (error) {
    console.error("Verify user error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying user",
      error: error.message,
    });
  }
};

// Get dashboard statistics
exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const totalCandidates = await Candidate.countDocuments();
    const verifiedCandidates = await Candidate.countDocuments({
      isVerified: true,
    });
    const totalElections = await Election.countDocuments();
    const activeElections = await Election.countDocuments({ status: "active" });
    const totalVotes = await Vote.countDocuments();

    // Recent elections
    const recentElections = await Election.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("candidates", "firstName lastName party")
      .lean();

    // Voting statistics
    const votingStats = await Election.aggregate([
      {
        $match: { status: "active" },
      },
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "electionId",
          as: "votes",
        },
      },
      {
        $project: {
          title: 1,
          totalVotes: { $size: "$votes" },
          startDate: 1,
          endDate: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          verifiedUsers,
          totalCandidates,
          verifiedCandidates,
          totalElections,
          activeElections,
          totalVotes,
        },
        recentElections,
        votingStats,
      },
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
      error: error.message,
    });
  }
};

// Reset user vote
exports.resetUserVote = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        hasVoted: false,
        votedFor: null,
        $pull: { votedInElections: {} },
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User vote reset successfully",
      data: user,
    });
  } catch (error) {
    console.error("Reset user vote error:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting user vote",
      error: error.message,
    });
  }
};

// Export user data
exports.exportUserData = async (req, res) => {
  try {
    const users = await User.find().select("-password").lean();

    res.json({
      success: true,
      data: users,
      message: "User data exported successfully",
    });
  } catch (error) {
    console.error("Export user data error:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting user data",
      error: error.message,
    });
  }
};

// Create admin user
exports.createAdminUser = async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = new User({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      role: "admin",
      isVerified: true,
      isActive: true,
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: "Admin user created successfully",
      data: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Create admin user error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating admin user",
      error: error.message,
    });
  }
};

// Bulk verify users
exports.bulkVerifyUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { isVerified: true }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} users verified successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Bulk verify users error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying users",
      error: error.message,
    });
  }
};

// Bulk update user status
exports.bulkUpdateUserStatus = async (req, res) => {
  try {
    const { userIds, isActive } = req.body;

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { isActive }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} users updated successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Bulk update user status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user status",
      error: error.message,
    });
  }
};

// Get system health
exports.getSystemHealth = async (req, res) => {
  try {
    const dbStatus =
      require("mongoose").connection.readyState === 1
        ? "connected"
        : "disconnected";
    const blockchainHealth = await blockchainService.healthCheck();

    res.json({
      success: true,
      data: {
        database: dbStatus,
        blockchain: blockchainHealth,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get system health error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching system health",
      error: error.message,
    });
  }
};

// Get voting analytics
exports.getVotingAnalytics = async (req, res) => {
  try {
    const { electionId } = req.query;

    let matchStage = {};
    if (electionId)
      matchStage = {
        electionId: require("mongoose").Types.ObjectId(electionId),
      };

    const analytics = await Vote.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const candidateStats = await Vote.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$candidateId",
          totalVotes: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "candidates",
          localField: "_id",
          foreignField: "_id",
          as: "candidate",
        },
      },
      { $unwind: "$candidate" },
      { $sort: { totalVotes: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        dailyVotes: analytics,
        candidateStats,
      },
    });
  } catch (error) {
    console.error("Get voting analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching voting analytics",
      error: error.message,
    });
  }
};

// Get audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const votes = await Vote.find()
      .populate("voterId", "firstName lastName email")
      .populate("candidateId", "firstName lastName party")
      .populate("electionId", "title")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Vote.countDocuments();

    res.json({
      success: true,
      data: {
        logs: votes,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching audit logs",
      error: error.message,
    });
  }
};

// Emergency clear votes
exports.emergencyClearVotes = async (req, res) => {
  try {
    const { electionId, confirmationCode } = req.body;

    // Security check
    if (confirmationCode !== process.env.EMERGENCY_CODE) {
      return res.status(403).json({
        success: false,
        message: "Invalid confirmation code",
      });
    }

    const result = await Vote.deleteMany({ electionId });

    await User.updateMany(
      { "votedInElections.electionId": electionId },
      {
        $pull: { votedInElections: { electionId } },
        hasVoted: false,
        votedFor: null,
      }
    );

    res.json({
      success: true,
      message: `${result.deletedCount} votes cleared successfully`,
    });
  } catch (error) {
    console.error("Emergency clear votes error:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing votes",
      error: error.message,
    });
  }
};

// Update candidate verification status
exports.updateCandidateVerificationStatus = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { isVerified, verificationNotes } = req.body;

    const updateData = {
      isVerified,
      verificationNotes: verificationNotes || "",
      verifiedBy: isVerified ? req.userId : null,
      verifiedAt: isVerified ? new Date() : null,
    };

    const candidate = await Candidate.findByIdAndUpdate(
      candidateId,
      updateData,
      { new: true }
    ).populate("electionId", "title");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.json({
      success: true,
      message: `Candidate ${isVerified ? "verified" : "rejected"} successfully`,
      data: candidate,
    });
  } catch (error) {
    console.error("Update candidate verification error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating candidate verification",
      error: error.message,
    });
  }
};
