const Web3 = require("web3");
const fs = require("fs");
const path = require("path");

class Web3Utils {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.contractAddress = null;
    this.accounts = [];
    this.defaultAccount = null;
  }

  /**
   * Initialize Web3 connection
   */
  async initialize() {
    try {
      const providerUrl = "http://localhost:7545";
      this.web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

      // Test connection
      await this.web3.eth.net.isListening();
      console.log("Web3 connection established successfully");

      // Get accounts
      this.accounts = await this.web3.eth.getAccounts();
      this.defaultAccount = this.accounts[0];

      console.log(
        `Connected to blockchain with ${this.accounts.length} accounts`
      );
      console.log("Default account:", this.defaultAccount);

      // Load contract
      await this.loadContract();

      return true;
    } catch (error) {
      console.error("Failed to initialize Web3:", error);
      throw error;
    }
  }

  /**
   * Load smart contract instance
   */
  async loadContract() {
    try {
      // Load deployment info
      const deploymentPath = path.join(
        __dirname,
        "../build/deployment-info.json"
      );

      if (!fs.existsSync(deploymentPath)) {
        throw new Error(
          "Deployment info not found. Please deploy the contract first."
        );
      }

      const deploymentInfo = JSON.parse(
        fs.readFileSync(deploymentPath, "utf8")
      );
      this.contractAddress = deploymentInfo.contractAddress;

      // Create contract instance
      this.contract = new this.web3.eth.Contract(
        deploymentInfo.contractABI,
        this.contractAddress
      );

      console.log("Contract loaded successfully at:", this.contractAddress);

      // Verify contract is accessible
      const owner = await this.contract.methods.owner().call();
      console.log("Contract owner:", owner);

      return this.contract;
    } catch (error) {
      console.error("Failed to load contract:", error);
      throw error;
    }
  }

  /**
   * Create a new election on blockchain
   */
  async createElection(
    name,
    description,
    startTime,
    endTime,
    fromAccount = null
  ) {
    try {
      if (!this.contract) {
        throw new Error("Contract not loaded");
      }

      const account = fromAccount || this.defaultAccount;
      const gasEstimate = await this.contract.methods
        .createElection(name, description, startTime, endTime)
        .estimateGas({ from: account });

      const result = await this.contract.methods
        .createElection(name, description, startTime, endTime)
        .send({
          from: account,
          gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
          gasPrice: process.env.GAS_PRICE || "20000000000",
        });

      console.log("Election created on blockchain:", result.transactionHash);
      return result;
    } catch (error) {
      console.error("Failed to create election on blockchain:", error);
      throw error;
    }
  }

  /**
   * Add candidate to blockchain
   */
  async addCandidate(electionId, candidateId, name, party, fromAccount = null) {
    try {
      if (!this.contract) {
        throw new Error("Contract not loaded");
      }

      const account = fromAccount || this.defaultAccount;
      const gasEstimate = await this.contract.methods
        .addCandidate(electionId, candidateId, name, party)
        .estimateGas({ from: account });

      const result = await this.contract.methods
        .addCandidate(electionId, candidateId, name, party)
        .send({
          from: account,
          gas: Math.floor(gasEstimate * 1.2),
          gasPrice: process.env.GAS_PRICE || "20000000000",
        });

      console.log("Candidate added to blockchain:", result.transactionHash);
      return result;
    } catch (error) {
      console.error("Failed to add candidate to blockchain:", error);
      throw error;
    }
  }

  /**
   * Register voter on blockchain
   */
  async registerVoter(electionId, voterAddress, fromAccount = null) {
    try {
      if (!this.contract) {
        throw new Error("Contract not loaded");
      }

      const account = fromAccount || this.defaultAccount;
      const gasEstimate = await this.contract.methods
        .registerVoter(electionId, voterAddress)
        .estimateGas({ from: account });

      const result = await this.contract.methods
        .registerVoter(electionId, voterAddress)
        .send({
          from: account,
          gas: Math.floor(gasEstimate * 1.2),
          gasPrice: process.env.GAS_PRICE || "20000000000",
        });

      console.log("Voter registered on blockchain:", result.transactionHash);
      return result;
    } catch (error) {
      console.error("Failed to register voter on blockchain:", error);
      throw error;
    }
  }

  /**
   * Cast vote on blockchain
   */
  async castVote(electionId, candidateId, voterAddress) {
    try {
      if (!this.contract) {
        throw new Error("Contract not loaded");
      }

      const gasEstimate = await this.contract.methods
        .vote(electionId, candidateId)
        .estimateGas({ from: voterAddress });

      const result = await this.contract.methods
        .vote(electionId, candidateId)
        .send({
          from: voterAddress,
          gas: Math.floor(gasEstimate * 1.2),
          gasPrice: process.env.GAS_PRICE || "20000000000",
        });

      console.log("Vote cast on blockchain:", result.transactionHash);
      return result;
    } catch (error) {
      console.error("Failed to cast vote on blockchain:", error);
      throw error;
    }
  }

  /**
   * Get election results from blockchain
   */
  async getElectionResults(electionId) {
    try {
      if (!this.contract) {
        throw new Error("Contract not loaded");
      }

      const results = await this.contract.methods.getResults(electionId).call();
      const election = await this.contract.methods
        .getElection(electionId)
        .call();

      return {
        electionId,
        candidateIds: results.candidateIds,
        voteCounts: results.voteCounts,
        totalVotes: election.totalVotes,
        electionInfo: election,
      };
    } catch (error) {
      console.error("Failed to get election results from blockchain:", error);
      throw error;
    }
  }

  /**
   * Get candidate information from blockchain
   */
  async getCandidate(electionId, candidateId) {
    try {
      if (!this.contract) {
        throw new Error("Contract not loaded");
      }

      const candidate = await this.contract.methods
        .getCandidate(electionId, candidateId)
        .call();
      return {
        id: candidate.id,
        name: candidate.name,
        party: candidate.party,
        voteCount: candidate.voteCount,
        isActive: candidate.isActive,
      };
    } catch (error) {
      console.error("Failed to get candidate from blockchain:", error);
      throw error;
    }
  }

  /**
   * Get voter information from blockchain
   */
  async getVoter(electionId, voterAddress) {
    try {
      if (!this.contract) {
        throw new Error("Contract not loaded");
      }

      const voter = await this.contract.methods
        .getVoter(electionId, voterAddress)
        .call();
      return {
        isRegistered: voter.isRegistered,
        hasVoted: voter.hasVoted,
        votedFor: voter.votedFor,
        registrationTime: voter.registrationTime,
      };
    } catch (error) {
      console.error("Failed to get voter from blockchain:", error);
      throw error;
    }
  }

  /**
   * Check if voting is active
   */
  async isVotingActive(electionId) {
    try {
      if (!this.contract) {
        throw new Error("Contract not loaded");
      }

      return await this.contract.methods.isVotingActive(electionId).call();
    } catch (error) {
      console.error("Failed to check voting status:", error);
      throw error;
    }
  }

  /**
   * Get winner of election
   */
  async getWinner(electionId) {
    try {
      if (!this.contract) {
        throw new Error("Contract not loaded");
      }

      const winner = await this.contract.methods.getWinner(electionId).call();
      return {
        winnerId: winner.winnerId,
        winnerName: winner.winnerName,
        winnerParty: winner.winnerParty,
        winnerVotes: winner.winnerVotes,
      };
    } catch (error) {
      console.error("Failed to get winner:", error);
      throw error;
    }
  }

  /**
   * Verify transaction on blockchain
   */
  async verifyTransaction(txHash) {
    try {
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      return {
        success: receipt.status === true || receipt.status === "0x1",
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        receipt,
      };
    } catch (error) {
      console.error("Failed to verify transaction:", error);
      throw error;
    }
  }

  /**
   * Get current block number
   */
  async getCurrentBlock() {
    try {
      return await this.web3.eth.getBlockNumber();
    } catch (error) {
      console.error("Failed to get current block:", error);
      throw error;
    }
  }

  /**
   * Convert Wei to Ether
   */
  weiToEther(wei) {
    return this.web3.utils.fromWei(wei.toString(), "ether");
  }

  /**
   * Convert Ether to Wei
   */
  etherToWei(ether) {
    return this.web3.utils.toWei(ether.toString(), "ether");
  }

  /**
   * Check if address is valid
   */
  isValidAddress(address) {
    return this.web3.utils.isAddress(address);
  }

  /**
   * Get contract events
   */
  async getContractEvents(eventName, fromBlock = 0, toBlock = "latest") {
    try {
      if (!this.contract) {
        throw new Error("Contract not loaded");
      }

      return await this.contract.getPastEvents(eventName, {
        fromBlock,
        toBlock,
      });
    } catch (error) {
      console.error("Failed to get contract events:", error);
      throw error;
    }
  }
}

// Create singleton instance
const web3Utils = new Web3Utils();

module.exports = web3Utils;
