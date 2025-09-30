// server/controllers/votingController.js
const Vote = require("../models/voteModel");
const User = require("../models/userModel");
const Candidate = require("../models/candidateModel");
const Election = require("../models/electionModel");
const blockchainService = require("../services/blockchainService");

// Cast vote
exports.castVote = async (req, res) => {
  try {
    const { candidateId, electionId } = req.body;
    const userId = req.userId;

    // Validate input
    if (!candidateId || !electionId) {
      return res.status(400).json({
        success: false,
        message: "Candidate ID and Election ID are required",
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "User must be verified to vote",
      });
    }

    // Check if user already voted in this election
    const existingVote = await Vote.findOne({ voterId: userId, electionId });
    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: "You have already voted in this election",
      });
    }

    // Validate election
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Election is not active",
      });
    }

    const now = new Date();
    if (now < election.startDate || now > election.endDate) {
      return res.status(400).json({
        success: false,
        message: "Election is not currently open for voting",
      });
    }

    // Validate candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    if (!candidate.isVerified || !candidate.isActive) {
      return res.status(400).json({
        success: false,
        message: "Candidate is not eligible",
      });
    }

    if (!election.candidates.includes(candidateId)) {
      return res.status(400).json({
        success: false,
        message: "Candidate is not registered for this election",
      });
    }

    // Create blockchain transaction
    let blockchainHash = `0x${Date.now()}${Math.random()
      .toString(36)
      .substring(7)}`;
    let blockNumber = 0;
    let gasUsed = "0";

    try {
      if (user.walletAddress && blockchainService.initialized) {
        const blockchainResult = await blockchainService.syncUserVote(
          userId,
          candidate.registrationNumber || candidateId,
          election.blockchainElectionId || 1
        );
        blockchainHash = blockchainResult.transactionHash;
        blockNumber = blockchainResult.blockNumber;
        gasUsed = blockchainResult.gasUsed?.toString() || "0";
      }
    } catch (blockchainError) {
      console.error("Blockchain vote error:", blockchainError);
      // Continue with database vote even if blockchain fails
    }

    // Create vote record
    const vote = new Vote({
      voterId: userId,
      candidateId,
      electionId,
      blockchainHash,
      blockNumber,
      gasUsed,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    await vote.save();

    // Update user
    user.hasVoted = true;
    user.votedFor = candidateId;
    user.votedInElections.push({
      electionId,
      votedAt: new Date(),
      transactionHash: blockchainHash,
    });
    await user.save();

    // Update candidate vote count
    candidate.votes += 1;
    await candidate.save();

    // Update election total votes
    election.totalVotes += 1;
    await election.save();

    res.status(201).json({
      success: true,
      message: "Vote cast successfully",
      data: {
        transactionHash: blockchainHash,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        timestamp: vote.timestamp,
      },
    });
  } catch (error) {
    console.error("Cast vote error:", error);
    res.status(500).json({
      success: false,
      message: "Error casting vote",
      error: error.message,
    });
  }
};

// Verify vote
exports.verifyVote = async (req, res) => {
  try {
    const { transactionHash } = req.body;

    const vote = await Vote.findOne({ blockchainHash: transactionHash })
      .populate("candidateId", "firstName lastName party")
      .populate("electionId", "title")
      .lean();

    if (!vote) {
      return res.status(404).json({
        success: false,
        message: "Vote not found",
      });
    }

    // Verify on blockchain if possible
    let blockchainVerification = null;
    try {
      if (blockchainService.initialized) {
        blockchainVerification = await blockchainService.verifyVote(
          transactionHash
        );
      }
    } catch (error) {
      console.error("Blockchain verification error:", error);
    }

    res.json({
      success: true,
      data: {
        vote,
        blockchainVerification,
      },
    });
  } catch (error) {
    console.error("Verify vote error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying vote",
      error: error.message,
    });
  }
};

// Get user voting history
exports.getVotingHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const votes = await Vote.find({ voterId: userId })
      .populate("candidateId", "firstName lastName party profileImage")
      .populate("electionId", "title startDate endDate")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: votes,
    });
  } catch (error) {
    console.error("Get voting history error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching voting history",
      error: error.message,
    });
  }
};
