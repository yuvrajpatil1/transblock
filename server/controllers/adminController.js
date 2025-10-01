// server/controllers/adminController.js
const User = require("../models/userModel");
const Candidate = require("../models/candidateModel");
const Election = require("../models/electionModel");
const Vote = require("../models/voteModel");
const blockchainService = require("../services/blockchainService");

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;

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
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete admin users",
      });
    }

    await User.findByIdAndDelete(req.params.userId);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const totalVoters = await User.countDocuments({ role: "voter" });
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
      .populate("candidates", "firstName lastName party votes");

    // Voting statistics
    const votingStats = await Vote.aggregate([
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$voteTimestamp" },
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": -1 } },
      { $limit: 30 },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          verifiedUsers,
          totalVoters,
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { electionId, startDate, endDate } = req.query;

    let matchStage = {};
    if (electionId) matchStage.electionId = mongoose.Types.ObjectId(electionId);
    if (startDate || endDate) {
      matchStage.voteTimestamp = {};
      if (startDate) matchStage.voteTimestamp.$gte = new Date(startDate);
      if (endDate) matchStage.voteTimestamp.$lte = new Date(endDate);
    }

    // Daily vote trends
    const dailyVotes = await Vote.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$voteTimestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Votes by candidate
    const votesByCandidate = await Vote.aggregate([
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

    // Voter participation rate
    const totalUsers = await User.countDocuments({
      role: "voter",
      isVerified: true,
    });
    const uniqueVoters = await Vote.distinct("voterId", matchStage);
    const participationRate =
      totalUsers > 0
        ? ((uniqueVoters.length / totalUsers) * 100).toFixed(2)
        : 0;

    res.json({
      success: true,
      data: {
        dailyVotes,
        votesByCandidate,
        participationRate,
        totalVoters: uniqueVoters.length,
        eligibleVoters: totalUsers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, electionId } = req.query;

    let filter = {};
    if (electionId) filter.electionId = electionId;

    const logs = await Vote.find(filter)
      .populate("voterId", "firstName lastName email walletAddress")
      .populate("candidateId", "firstName lastName party")
      .populate("electionId", "title")
      .sort({ voteTimestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Vote.countDocuments(filter);

    res.json({
      success: true,
      data: {
        logs,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getSystemHealth = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const dbStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    let blockchainHealth = { status: "unavailable" };
    try {
      blockchainHealth = await blockchainService.healthCheck();
    } catch (error) {
      blockchainHealth = { status: "error", message: error.message };
    }

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
