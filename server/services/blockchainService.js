const web3Utils = require("../utils/web3Utils");
const User = require("../models/userModel");
const Candidate = require("../models/candidateModel");

class BlockchainService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize blockchain service
   */
  async initialize() {
    if (this.initialized) return true;

    try {
      await web3Utils.initialize();
      this.initialized = true;
      console.log("Blockchain service initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize blockchain service:", error);
      throw error;
    }
  }

  /**
   * Sync user vote with blockchain
   */
  async syncUserVote(userId, candidateId, electionId = 1) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (!user.walletAddress) {
        throw new Error("User does not have a wallet address");
      }

      // Check if user is registered on blockchain
      const blockchainVoter = await web3Utils.getVoter(
        electionId,
        user.walletAddress
      );

      if (!blockchainVoter.isRegistered) {
        // Register user on blockchain
        await web3Utils.registerVoter(electionId, user.walletAddress);
        console.log(`User ${user.email} registered on blockchain`);
      }

      // Cast vote on blockchain
      const voteResult = await web3Utils.castVote(
        electionId,
        candidateId,
        user.walletAddress
      );

      return {
        success: true,
        transactionHash: voteResult.transactionHash,
        blockNumber: voteResult.blockNumber,
        gasUsed: voteResult.gasUsed,
      };
    } catch (error) {
      console.error("Error syncing user vote with blockchain:", error);
      throw error;
    }
  }

  /**
   * Sync candidate with blockchain
   */
  async syncCandidateToBlockchain(candidateId, electionId = 1) {
    try {
      const candidate = await Candidate.findOne({ candidateId });
      if (!candidate) {
        throw new Error("Candidate not found");
      }

      // Add candidate to blockchain
      const result = await web3Utils.addCandidate(
        electionId,
        candidate.candidateId,
        candidate.name,
        candidate.party
      );

      console.log(`Candidate ${candidate.name} synced to blockchain`);
      return result;
    } catch (error) {
      console.error("Error syncing candidate to blockchain:", error);
      throw error;
    }
  }

  /**
   * Verify vote on blockchain
   */
  async verifyVote(transactionHash) {
    try {
      const verification = await web3Utils.verifyTransaction(transactionHash);
      return {
        isValid: verification.success,
        blockNumber: verification.blockNumber,
        gasUsed: verification.gasUsed,
        details: verification.receipt,
      };
    } catch (error) {
      console.error("Error verifying vote on blockchain:", error);
      throw error;
    }
  }

  /**
   * Get blockchain results and sync with database
   */
  async syncResultsFromBlockchain(electionId = 1) {
    try {
      const blockchainResults = await web3Utils.getElectionResults(electionId);

      // Update database with blockchain results
      for (let i = 0; i < blockchainResults.candidateIds.length; i++) {
        const candidateId = blockchainResults.candidateIds[i];
        const voteCount = parseInt(blockchainResults.voteCounts[i]);

        await Candidate.findOneAndUpdate(
          { candidateId },
          { voteCount },
          { new: true }
        );
      }

      console.log("Results synced from blockchain to database");
      return blockchainResults;
    } catch (error) {
      console.error("Error syncing results from blockchain:", error);
      throw error;
    }
  }

  /**
   * Register multiple users on blockchain
   */
  async bulkRegisterVoters(userIds, electionId = 1) {
    try {
      const results = [];

      for (const userId of userIds) {
        const user = await User.findById(userId);
        if (user && user.walletAddress) {
          try {
            const result = await web3Utils.registerVoter(
              electionId,
              user.walletAddress
            );
            results.push({
              userId,
              email: user.email,
              success: true,
              transactionHash: result.transactionHash,
            });
          } catch (error) {
            results.push({
              userId,
              email: user.email,
              success: false,
              error: error.message,
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error("Error in bulk voter registration:", error);
      throw error;
    }
  }

  /**
   * Get voter status from blockchain
   */
  async getVoterBlockchainStatus(walletAddress, electionId = 1) {
    try {
      const voterStatus = await web3Utils.getVoter(electionId, walletAddress);
      return voterStatus;
    } catch (error) {
      console.error("Error getting voter status from blockchain:", error);
      throw error;
    }
  }

  /**
   * Get candidate blockchain status
   */
  async getCandidateBlockchainStatus(candidateId, electionId = 1) {
    try {
      const candidateStatus = await web3Utils.getCandidate(
        electionId,
        candidateId
      );
      return candidateStatus;
    } catch (error) {
      console.error("Error getting candidate status from blockchain:", error);
      throw error;
    }
  }

  /**
   * Create election on blockchain
   */
  async createBlockchainElection(name, description, startTime, endTime) {
    try {
      const result = await web3Utils.createElection(
        name,
        description,
        startTime,
        endTime
      );
      console.log(`Election "${name}" created on blockchain`);
      return result;
    } catch (error) {
      console.error("Error creating election on blockchain:", error);
      throw error;
    }
  }

  /**
   * Check if voting is active on blockchain
   */
  async isVotingActive(electionId = 1) {
    try {
      return await web3Utils.isVotingActive(electionId);
    } catch (error) {
      console.error("Error checking voting status on blockchain:", error);
      throw error;
    }
  }

  /**
   * Get election winner from blockchain
   */
  async getElectionWinner(electionId = 1) {
    try {
      const winner = await web3Utils.getWinner(electionId);

      // Find corresponding candidate in database
      if (winner.winnerId && winner.winnerId !== "0") {
        const candidate = await Candidate.findOne({
          candidateId: parseInt(winner.winnerId),
        });
        return {
          ...winner,
          candidateDetails: candidate,
        };
      }

      return winner;
    } catch (error) {
      console.error("Error getting election winner from blockchain:", error);
      throw error;
    }
  }

  /**
   * Validate wallet address format
   */
  isValidWalletAddress(address) {
    return web3Utils.isValidAddress(address);
  }

  /**
   * Get blockchain network info
   */
  async getNetworkInfo() {
    try {
      const blockNumber = await web3Utils.getCurrentBlock();
      return {
        currentBlock: blockNumber,
        network: "development",
        contractAddress: web3Utils.contractAddress,
        provider: "http://localhost:7545",
      };
    } catch (error) {
      console.error("Error getting network info:", error);
      throw error;
    }
  }

  /**
   * Monitor blockchain events
   */
  async getVotingEvents(fromBlock = 0, toBlock = "latest") {
    try {
      const voteCastEvents = await web3Utils.getContractEvents(
        "VoteCast",
        fromBlock,
        toBlock
      );
      const candidateAddedEvents = await web3Utils.getContractEvents(
        "CandidateAdded",
        fromBlock,
        toBlock
      );
      const voterRegisteredEvents = await web3Utils.getContractEvents(
        "VoterRegistered",
        fromBlock,
        toBlock
      );

      return {
        votes: voteCastEvents,
        candidatesAdded: candidateAddedEvents,
        votersRegistered: voterRegisteredEvents,
      };
    } catch (error) {
      console.error("Error getting blockchain events:", error);
      throw error;
    }
  }

  /**
   * Emergency functions for blockchain operations
   */
  async emergencyPause() {
    try {
      // This would call the emergency pause function on the smart contract
      // Implementation depends on contract design
      console.log("Emergency pause initiated");
      return { success: true, message: "Emergency pause initiated" };
    } catch (error) {
      console.error("Error in emergency pause:", error);
      throw error;
    }
  }

  /**
   * Health check for blockchain connectivity
   */
  async healthCheck() {
    try {
      const networkInfo = await this.getNetworkInfo();
      const isContractAccessible = web3Utils.contract !== null;

      return {
        status: "healthy",
        initialized: this.initialized,
        contractAccessible: isContractAccessible,
        networkInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        initialized: this.initialized,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;
