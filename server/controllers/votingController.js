// server/controllers/votingController.js
const Vote = require("../models/voteModel");
const User = require("../models/userModel");
const Candidate = require("../models/candidateModel");
const Election = require("../models/electionModel");
const blockchainService = require("../services/blockchainService");

exports.castVote = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { candidateId, electionId } = req.body;
    const userId = req.userId;

    // Validate input
    if (!candidateId || !electionId) {
      throw new Error("Candidate ID and Election ID are required");
    }

    // Get user
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isVerified) {
      throw new Error("User must be verified to vote");
    }

    // Check if already voted
    const hasVoted = user.votedInElections.some(
      (vote) => vote.electionId.toString() === electionId
    );

    if (hasVoted) {
      throw new Error("You have already voted in this election");
    }

    // Validate election
    const election = await Election.findById(electionId).session(session);
    if (!election) {
      throw new Error("Election not found");
    }

    if (election.status !== "active") {
      throw new Error("Election is not active");
    }

    const now = new Date();
    if (now < election.startDate || now > election.endDate) {
      throw new Error("Election is not currently open for voting");
    }

    // Validate candidate
    const candidate = await Candidate.findById(candidateId).session(session);
    if (!candidate) {
      throw new Error("Candidate not found");
    }

    if (!candidate.isVerified || !candidate.isActive) {
      throw new Error("Candidate is not eligible");
    }

    if (!election.candidates.includes(candidateId)) {
      throw new Error("Candidate is not registered for this election");
    }

    // Cast vote on blockchain
    let blockchainResult;
    try {
      blockchainResult = await blockchainService.castVote(
        election.blockchainElectionId,
        candidate.blockchainCandidateId || candidate.registrationNumber,
        user.walletAddress
      );
    } catch (blockchainError) {
      console.error("Blockchain vote error:", blockchainError);
      throw new Error("Failed to record vote on blockchain");
    }

    // Create vote record
    const vote = new Vote({
      voterId: userId,
      candidateId,
      electionId,
      blockchainHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
      gasUsed: blockchainResult.gasUsed?.toString() || "0",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    await vote.save({ session });

    // Update user
    user.votedInElections.push({
      electionId,
      candidateId,
      votedAt: new Date(),
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
    });
    await user.save({ session });

    // Update candidate
    candidate.votes += 1;
    await candidate.save({ session });

    // Update election
    election.totalVotes += 1;
    await election.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Vote cast successfully",
      data: {
        transactionHash: blockchainResult.transactionHash,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        timestamp: vote.voteTimestamp,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Cast vote error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error casting vote",
    });
  } finally {
    session.endSession();
  }
};
