// routes/electionsRoute.js
const router = require("express").Router();
const Election = require("../models/electionModel");
const Candidate = require("../models/candidateModel");
const Vote = require("../models/voteModel");
const authMiddleware = require("../middleware/authMiddleware");
const { ethers } = require("ethers");

// Get all elections
router.post("/get-all-elections", authMiddleware, async (req, res) => {
  try {
    const elections = await Election.find()
      .populate("candidates")
      .sort({ createdAt: -1 });

    res.send({
      success: true,
      data: elections,
      message: "Elections fetched successfully",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// Get election by ID
router.post("/get-election-by-id", authMiddleware, async (req, res) => {
  try {
    const { electionId } = req.body;

    const election = await Election.findById(electionId)
      .populate("candidates")
      .populate("voters");

    if (!election) {
      return res.send({
        success: false,
        message: "Election not found",
      });
    }

    res.send({
      success: true,
      data: election,
      message: "Election details fetched successfully",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// Get election results
router.post("/get-election-results", authMiddleware, async (req, res) => {
  try {
    const { electionId } = req.body;

    // Get election details
    const election = await Election.findById(electionId);
    if (!election) {
      return res.send({
        success: false,
        message: "Election not found",
      });
    }

    // Get all votes for this election
    const votes = await Vote.find({ electionId })
      .populate("candidateId")
      .populate("voterId");

    // Calculate results
    const candidateVotes = {};
    let totalVotes = 0;

    votes.forEach((vote) => {
      const candidateId = vote.candidateId._id.toString();
      if (!candidateVotes[candidateId]) {
        candidateVotes[candidateId] = {
          candidate: vote.candidateId,
          votes: 0,
          blockchainHashes: [],
        };
      }
      candidateVotes[candidateId].votes += 1;
      candidateVotes[candidateId].blockchainHashes.push(vote.blockchainHash);
      totalVotes += 1;
    });

    // Convert to array and sort by votes
    const results = Object.values(candidateVotes).sort(
      (a, b) => b.votes - a.votes
    );

    // Add rank and percentage
    results.forEach((result, index) => {
      result.rank = index + 1;
      result.percentage =
        totalVotes > 0 ? ((result.votes / totalVotes) * 100).toFixed(2) : 0;
    });

    const responseData = {
      election: {
        ...election.toObject(),
        totalVotes,
        totalCandidates: election.candidates.length,
      },
      results,
      winner: results.length > 0 ? results[0] : null,
    };

    res.send({
      success: true,
      data: responseData,
      message: "Election results fetched successfully",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// Get live election results (real-time)
router.post("/get-live-results", authMiddleware, async (req, res) => {
  try {
    const { electionId } = req.body;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.send({
        success: false,
        message: "Election not found",
      });
    }

    // Check if election is currently active
    const now = new Date();
    const isLive = now >= election.startDate && now <= election.endDate;

    if (!isLive) {
      return res.send({
        success: false,
        message: "Election is not currently live",
      });
    }

    // Get real-time vote count
    const votes = await Vote.find({ electionId })
      .populate("candidateId")
      .sort({ createdAt: -1 });

    const candidateVotes = {};
    let totalVotes = 0;

    votes.forEach((vote) => {
      const candidateId = vote.candidateId._id.toString();
      if (!candidateVotes[candidateId]) {
        candidateVotes[candidateId] = {
          candidate: vote.candidateId,
          votes: 0,
          latestBlockchainHash: null,
          lastUpdated: null,
        };
      }
      candidateVotes[candidateId].votes += 1;
      candidateVotes[candidateId].latestBlockchainHash = vote.blockchainHash;
      candidateVotes[candidateId].lastUpdated = vote.createdAt;
      totalVotes += 1;
    });

    const liveResults = Object.values(candidateVotes).sort(
      (a, b) => b.votes - a.votes
    );

    res.send({
      success: true,
      data: {
        election,
        results: liveResults,
        totalVotes,
        isLive: true,
        lastUpdated: new Date(),
      },
      message: "Live results fetched successfully",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// Get election statistics
router.post("/get-election-statistics", authMiddleware, async (req, res) => {
  try {
    const { electionId } = req.body;

    const election = await Election.findById(electionId).populate("voters");
    if (!election) {
      return res.send({
        success: false,
        message: "Election not found",
      });
    }

    const totalVotes = await Vote.countDocuments({ electionId });
    const totalRegisteredVoters = election.voters.length;
    const turnoutPercentage =
      totalRegisteredVoters > 0
        ? ((totalVotes / totalRegisteredVoters) * 100).toFixed(2)
        : 0;

    // Get votes by hour (for charts)
    const votesByHour = await Vote.aggregate([
      { $match: { electionId: election._id } },
      {
        $group: {
          _id: {
            hour: { $hour: "$createdAt" },
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1, "_id.hour": 1 } },
    ]);

    // Get votes by constituency
    const votesByConstituency = await Vote.aggregate([
      { $match: { electionId: election._id } },
      {
        $lookup: {
          from: "candidates",
          localField: "candidateId",
          foreignField: "_id",
          as: "candidate",
        },
      },
      { $unwind: "$candidate" },
      {
        $group: {
          _id: "$candidate.constituency",
          totalVotes: { $sum: 1 },
        },
      },
      { $sort: { totalVotes: -1 } },
    ]);

    const statistics = {
      totalVotes,
      totalRegisteredVoters,
      turnoutPercentage: parseFloat(turnoutPercentage),
      totalCandidates: election.candidates.length,
      electionStatus: election.status,
      votesByHour,
      votesByConstituency,
      blockchainNetwork: election.blockchainNetwork || "Ethereum",
      startDate: election.startDate,
      endDate: election.endDate,
    };

    res.send({
      success: true,
      data: statistics,
      message: "Election statistics fetched successfully",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// Get voter turnout
router.post("/get-voter-turnout", authMiddleware, async (req, res) => {
  try {
    const { electionId } = req.body;

    const election = await Election.findById(electionId).populate("voters");
    if (!election) {
      return res.send({
        success: false,
        message: "Election not found",
      });
    }

    const totalVotes = await Vote.countDocuments({ electionId });
    const totalRegisteredVoters = election.voters.length;

    // Get hourly turnout data
    const hourlyTurnout = await Vote.aggregate([
      { $match: { electionId: election._id } },
      {
        $group: {
          _id: {
            hour: { $hour: "$createdAt" },
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          votesThisHour: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1, "_id.hour": 1 } },
    ]);

    // Calculate cumulative turnout
    let cumulativeVotes = 0;
    const turnoutData = hourlyTurnout.map((item) => {
      cumulativeVotes += item.votesThisHour;
      return {
        hour: item._id.hour,
        date: item._id.date,
        votesThisHour: item.votesThisHour,
        cumulativeVotes,
        turnoutPercentage:
          totalRegisteredVoters > 0
            ? ((cumulativeVotes / totalRegisteredVoters) * 100).toFixed(2)
            : 0,
      };
    });

    res.send({
      success: true,
      data: {
        totalVotes,
        totalRegisteredVoters,
        currentTurnout:
          totalRegisteredVoters > 0
            ? ((totalVotes / totalRegisteredVoters) * 100).toFixed(2)
            : 0,
        turnoutData,
      },
      message: "Voter turnout data fetched successfully",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// Get constituency results
router.post("/get-constituency-results", authMiddleware, async (req, res) => {
  try {
    const { electionId, constituencyId } = req.body;

    const votes = await Vote.find({ electionId })
      .populate("candidateId")
      .populate("voterId");

    // Filter by constituency
    const constituencyVotes = votes.filter(
      (vote) => vote.candidateId.constituency === constituencyId
    );

    const candidateVotes = {};
    constituencyVotes.forEach((vote) => {
      const candidateId = vote.candidateId._id.toString();
      if (!candidateVotes[candidateId]) {
        candidateVotes[candidateId] = {
          candidate: vote.candidateId,
          votes: 0,
        };
      }
      candidateVotes[candidateId].votes += 1;
    });

    const results = Object.values(candidateVotes).sort(
      (a, b) => b.votes - a.votes
    );

    res.send({
      success: true,
      data: {
        constituency: constituencyId,
        results,
        totalVotes: constituencyVotes.length,
      },
      message: "Constituency results fetched successfully",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// Export election results (Admin only)
router.post("/export-results", authMiddleware, async (req, res) => {
  try {
    const { electionId, format = "json" } = req.body;

    // Check if user is admin
    if (!req.body.user.isAdmin) {
      return res.send({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const election = await Election.findById(electionId).populate("candidates");
    const votes = await Vote.find({ electionId })
      .populate("candidateId")
      .populate("voterId");

    const exportData = {
      election: {
        name: election.name,
        description: election.description,
        startDate: election.startDate,
        endDate: election.endDate,
        status: election.status,
        totalVotes: votes.length,
      },
      results: votes.map((vote) => ({
        candidateName: vote.candidateId.name,
        candidateParty: vote.candidateId.party,
        constituency: vote.candidateId.constituency,
        voterAddress: vote.voterId.walletAddress,
        blockchainHash: vote.blockchainHash,
        timestamp: vote.createdAt,
      })),
      exportedAt: new Date(),
      exportedBy: req.body.user.email,
    };

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=election-${electionId}-results.json`
      );
      res.send(JSON.stringify(exportData, null, 2));
    } else {
      // For PDF/CSV export, you would use libraries like PDFKit or csv-writer
      res.send({
        success: true,
        data: exportData,
        message: "Results exported successfully",
      });
    }
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
