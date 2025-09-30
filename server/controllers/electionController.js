// server/controllers/electionController.js
const Election = require("../models/electionModel");
const Candidate = require("../models/candidateModel");
const User = require("../models/userModel");
const Vote = require("../models/voteModel");
const blockchainService = require("../services/blockchainService");

// Create new election
exports.createElection = async (req, res) => {
  try {
    const { title, description, startDate, endDate, electionType } = req.body;

    // Validation
    if (!title || !description || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    if (start < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be in the past",
      });
    }

    const election = new Election({
      title,
      description,
      startDate: start,
      endDate: end,
      electionType: electionType || "general",
      createdBy: req.userId,
      status: "upcoming",
    });

    await election.save();

    // Optionally create on blockchain
    try {
      const blockchainResult = await blockchainService.createBlockchainElection(
        title,
        description,
        Math.floor(start.getTime() / 1000),
        Math.floor(end.getTime() / 1000)
      );
      election.blockchainElectionId = blockchainResult.electionId;
      await election.save();
    } catch (blockchainError) {
      console.error("Blockchain creation failed:", blockchainError);
    }

    res.status(201).json({
      success: true,
      message: "Election created successfully",
      data: election,
    });
  } catch (error) {
    console.error("Create election error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating election",
      error: error.message,
    });
  }
};

// Get all elections
exports.getAllElections = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let filter = {};
    if (status) filter.status = status;

    const elections = await Election.find(filter)
      .populate("candidates", "firstName lastName party profileImage")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Election.countDocuments(filter);

    res.json({
      success: true,
      data: {
        elections,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
      },
    });
  } catch (error) {
    console.error("Get all elections error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching elections",
      error: error.message,
    });
  }
};

// Get election by ID
exports.getElectionById = async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findById(electionId)
      .populate("candidates")
      .populate("createdBy", "firstName lastName email")
      .lean();

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    // Get vote count
    const voteCount = await Vote.countDocuments({ electionId });
    election.currentVoteCount = voteCount;

    res.json({
      success: true,
      data: election,
    });
  } catch (error) {
    console.error("Get election by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching election",
      error: error.message,
    });
  }
};

// Update election
exports.updateElection = async (req, res) => {
  try {
    const { electionId } = req.params;
    const updates = req.body;

    // Don't allow updating certain fields
    delete updates.blockchainElectionId;
    delete updates.createdBy;
    delete updates.totalVotes;

    const election = await Election.findByIdAndUpdate(electionId, updates, {
      new: true,
      runValidators: true,
    });

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    res.json({
      success: true,
      message: "Election updated successfully",
      data: election,
    });
  } catch (error) {
    console.error("Update election error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating election",
      error: error.message,
    });
  }
};

// Start election
exports.startElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.status !== "upcoming") {
      return res.status(400).json({
        success: false,
        message: "Election cannot be started",
      });
    }

    election.status = "active";
    election.startDate = new Date();
    await election.save();

    res.json({
      success: true,
      message: "Election started successfully",
      data: election,
    });
  } catch (error) {
    console.error("Start election error:", error);
    res.status(500).json({
      success: false,
      message: "Error starting election",
      error: error.message,
    });
  }
};

// Stop election
exports.stopElection = async (req, res) => {
  try {
    const { electionId } = req.params;

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
        message: "Only active elections can be stopped",
      });
    }

    election.status = "completed";
    election.endDate = new Date();
    await election.save();

    res.json({
      success: true,
      message: "Election stopped successfully",
      data: election,
    });
  } catch (error) {
    console.error("Stop election error:", error);
    res.status(500).json({
      success: false,
      message: "Error stopping election",
      error: error.message,
    });
  }
};

// Add candidate to election
exports.addCandidateToElection = async (req, res) => {
  try {
    const { electionId } = req.params;
    const { candidateId } = req.body;

    const election = await Election.findById(electionId);
    const candidate = await Candidate.findById(candidateId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    if (!candidate.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Candidate must be verified first",
      });
    }

    if (election.candidates.includes(candidateId)) {
      return res.status(400).json({
        success: false,
        message: "Candidate already added to this election",
      });
    }

    election.candidates.push(candidateId);
    await election.save();

    candidate.electionId = electionId;
    await candidate.save();

    res.json({
      success: true,
      message: "Candidate added to election successfully",
      data: election,
    });
  } catch (error) {
    console.error("Add candidate to election error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding candidate to election",
      error: error.message,
    });
  }
};

// Remove candidate from election
exports.removeCandidateFromElection = async (req, res) => {
  try {
    const { electionId, candidateId } = req.params;

    const election = await Election.findByIdAndUpdate(
      electionId,
      { $pull: { candidates: candidateId } },
      { new: true }
    );

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    res.json({
      success: true,
      message: "Candidate removed from election successfully",
      data: election,
    });
  } catch (error) {
    console.error("Remove candidate from election error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing candidate from election",
      error: error.message,
    });
  }
};

// Declare election results
exports.declareResults = async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Results can only be declared for completed elections",
      });
    }

    // Calculate winner
    const results = await Vote.aggregate([
      { $match: { electionId: election._id } },
      {
        $group: {
          _id: "$candidateId",
          voteCount: { $sum: 1 },
        },
      },
      { $sort: { voteCount: -1 } },
      { $limit: 1 },
    ]);

    if (results.length > 0) {
      election.winner = results[0]._id;
      election.isResultsDeclared = true;
      await election.save();

      const winner = await Candidate.findById(results[0]._id);

      res.json({
        success: true,
        message: "Results declared successfully",
        data: {
          election,
          winner,
          totalVotes: results[0].voteCount,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "No votes cast in this election",
      });
    }
  } catch (error) {
    console.error("Declare results error:", error);
    res.status(500).json({
      success: false,
      message: "Error declaring results",
      error: error.message,
    });
  }
};

// Delete election
exports.deleteElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.status === "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete active election",
      });
    }

    await Election.findByIdAndDelete(electionId);

    res.json({
      success: true,
      message: "Election deleted successfully",
    });
  } catch (error) {
    console.error("Delete election error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting election",
      error: error.message,
    });
  }
};

// Get active elections for voting
exports.getActiveElections = async (req, res) => {
  try {
    const now = new Date();

    const activeElections = await Election.find({
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate({
        path: "candidates",
        match: { isVerified: true, isActive: true },
        select:
          "firstName lastName party position biography profileImage votes",
      })
      .lean();

    res.json({
      success: true,
      data: activeElections,
    });
  } catch (error) {
    console.error("Get active elections error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching active elections",
      error: error.message,
    });
  }
};
