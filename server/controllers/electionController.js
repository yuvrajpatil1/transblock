// server/controllers/electionController.js
const Election = require("../models/electionModel");
const Candidate = require("../models/candidateModel");
const Vote = require("../models/voteModel");
const blockchainService = require("../services/blockchainService");
const mongoose = require("mongoose");

exports.createElection = async (req, res) => {
  try {
    const { title, description, startDate, endDate, electionType } = req.body;

    const election = new Election({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      electionType: electionType || "general",
      createdBy: req.userId,
      status: "upcoming",
    });

    await election.save();

    // Create on blockchain
    try {
      const blockchainResult = await blockchainService.createElection(
        title,
        description,
        Math.floor(new Date(startDate).getTime() / 1000),
        Math.floor(new Date(endDate).getTime() / 1000)
      );

      election.blockchainElectionId = blockchainResult.electionId;
      await election.save();
    } catch (blockchainError) {
      console.error("Blockchain election creation failed:", blockchainError);
    }

    res.status(201).json({
      success: true,
      message: "Election created successfully",
      data: election,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllElections = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (type) filter.electionType = type;

    const elections = await Election.find(filter)
      .populate("candidates", "firstName lastName party profileImage votes")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getElectionById = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)
      .populate("candidates")
      .populate("winner")
      .populate("createdBy", "firstName lastName email");

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    res.json({
      success: true,
      data: election,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getActiveElections = async (req, res) => {
  try {
    const now = new Date();

    const elections = await Election.find({
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate({
      path: "candidates",
      match: { isVerified: true, isActive: true },
    });

    res.json({
      success: true,
      data: elections,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.startElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.status !== "upcoming") {
      return res.status(400).json({
        success: false,
        message: "Only upcoming elections can be started",
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.stopElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addCandidate = async (req, res) => {
  try {
    const { candidateId } = req.body;
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    const candidate = await Candidate.findById(candidateId);
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
        message: "Candidate already added",
      });
    }

    election.candidates.push(candidateId);
    await election.save();

    candidate.electionId = election._id;
    await candidate.save();

    res.json({
      success: true,
      message: "Candidate added successfully",
      data: election,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.removeCandidate = async (req, res) => {
  try {
    const { id, candidateId } = req.params;

    const election = await Election.findByIdAndUpdate(
      id,
      { $pull: { candidates: candidateId } },
      { new: true }
    );

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    await Candidate.findByIdAndUpdate(candidateId, { electionId: null });

    res.json({
      success: true,
      message: "Candidate removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.declareResults = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed elections can have results declared",
      });
    }

    // Get winner
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getElectionResults = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id).populate(
      "candidates"
    );

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    const results = await Vote.aggregate([
      { $match: { electionId: election._id } },
      {
        $group: {
          _id: "$candidateId",
          voteCount: { $sum: 1 },
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
      { $sort: { voteCount: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        election,
        results,
        totalVotes: election.totalVotes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateElection = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.createdBy;
    delete updates.blockchainElectionId;

    const election = await Election.findByIdAndUpdate(req.params.id, updates, {
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);

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

    await Election.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Election deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
