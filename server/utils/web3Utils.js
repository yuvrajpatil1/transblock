const { Web3 } = require("web3");
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

  /** Initialize Web3 connection */
  async initialize() {
    try {
      const providerUrl = "http://localhost:7545";
      this.web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

      await this.web3.eth.net.isListening();
      console.log("Web3 connection established successfully");

      this.accounts = await this.web3.eth.getAccounts();
      this.defaultAccount = this.accounts[0];

      console.log(
        `Connected to blockchain with ${this.accounts.length} accounts`
      );
      console.log("Default account:", this.defaultAccount);

      await this.loadContract();

      return true;
    } catch (error) {
      console.error("Failed to initialize Web3:", error);
      throw error;
    }
  }

  /** Load smart contract instance */
  async loadContract() {
    try {
      const rootDir = path.resolve(__dirname, "../../");
      const contractDir = path.join(rootDir, "build", "contracts");
      const files = fs.readdirSync(contractDir);
      const votingFile = files.find((f) => f.toLowerCase() === "voting.json");

      if (!votingFile)
        throw new Error(
          `Voting.json not found in ${contractDir}. Run 'truffle migrate' first.`
        );

      const contractJsonPath = path.join(contractDir, votingFile);
      const contractJson = JSON.parse(
        fs.readFileSync(contractJsonPath, "utf8")
      );

      const networkId = await this.web3.eth.net.getId();
      if (!contractJson.networks[networkId])
        throw new Error(
          `Contract not deployed to current network (networkId: ${networkId}).`
        );

      this.contractAddress = contractJson.networks[networkId].address;
      this.contract = new this.web3.eth.Contract(
        contractJson.abi,
        this.contractAddress
      );

      console.log("Contract loaded at:", this.contractAddress);
      return this.contract;
    } catch (err) {
      console.error("Failed to load contract:", err);
      throw err;
    }
  }

  /** Create a new election */
  async createElection(
    name,
    description,
    startTime,
    endTime,
    fromAccount = null
  ) {
    try {
      if (!this.contract) throw new Error("Contract not loaded");
      const account = fromAccount || this.defaultAccount;

      const start = BigInt(startTime).toString();
      const end = BigInt(endTime).toString();

      const gasEstimate = await this.contract.methods
        .createElection(name, description, start, end)
        .estimateGas({ from: account });

      const result = await this.contract.methods
        .createElection(name, description, start, end)
        .send({
          from: account,
          gas: Math.floor(Number(gasEstimate) * 1.2),
          gasPrice: process.env.GAS_PRICE || "20000000000",
        });

      console.log("Election created on blockchain:", result.transactionHash);
      return result;
    } catch (error) {
      console.error("Failed to create election on blockchain:", error);
      throw error;
    }
  }

  /** Add candidate */
  async addCandidate(electionId, candidateId, name, party, fromAccount = null) {
    try {
      if (!this.contract) throw new Error("Contract not loaded");
      const account = fromAccount || this.defaultAccount;

      const eId = BigInt(electionId).toString();
      const cId = BigInt(candidateId).toString();

      const gasEstimate = await this.contract.methods
        .addCandidate(eId, cId, name, party)
        .estimateGas({ from: account });

      const result = await this.contract.methods
        .addCandidate(eId, cId, name, party)
        .send({
          from: account,
          gas: Math.floor(Number(gasEstimate) * 1.2),
          gasPrice: process.env.GAS_PRICE || "20000000000",
        });

      console.log("Candidate added:", result.transactionHash);
      return result;
    } catch (error) {
      console.error("Failed to add candidate:", error);
      throw error;
    }
  }

  /** Register voter */
  async registerVoter(electionId, voterAddress, fromAccount = null) {
    try {
      if (!this.contract) throw new Error("Contract not loaded");
      const account = fromAccount || this.defaultAccount;

      const eId = BigInt(electionId).toString();
      const gasEstimate = await this.contract.methods
        .registerVoter(eId, voterAddress)
        .estimateGas({ from: account });

      const result = await this.contract.methods
        .registerVoter(eId, voterAddress)
        .send({
          from: account,
          gas: Math.floor(Number(gasEstimate) * 1.2),
          gasPrice: process.env.GAS_PRICE || "20000000000",
        });

      console.log("Voter registered:", result.transactionHash);
      return result;
    } catch (error) {
      console.error("Failed to register voter:", error);
      throw error;
    }
  }

  /** Cast vote */
  async castVote(electionId, candidateId, voterAddress) {
    try {
      if (!this.contract) throw new Error("Contract not loaded");

      const eId = BigInt(electionId).toString();
      const cId = BigInt(candidateId).toString();

      const gasEstimate = await this.contract.methods
        .vote(eId, cId)
        .estimateGas({ from: voterAddress });

      const result = await this.contract.methods.vote(eId, cId).send({
        from: voterAddress,
        gas: Math.floor(Number(gasEstimate) * 1.2),
        gasPrice: process.env.GAS_PRICE || "20000000000",
      });

      console.log("Vote cast:", result.transactionHash);
      return result;
    } catch (error) {
      console.error("Failed to cast vote:", error);
      throw error;
    }
  }

  /** Get election results safely using contract's getResults method */
  async getElectionResults(electionId) {
    try {
      if (!this.contract) throw new Error("Contract not loaded");
      const eId = BigInt(electionId).toString();

      // Fetch election details
      const election = await this.contract.methods.elections(eId).call();

      // Use the contract's getResults function instead of events
      const results = await this.contract.methods.getResults(eId).call();

      const candidateIds = results[0].map((id) => BigInt(id).toString());
      const voteCounts = results[1].map((count) => BigInt(count).toString());

      return {
        electionId,
        candidateIds,
        voteCounts,
        totalVotes: BigInt(election.totalVotes).toString(),
        electionInfo: election,
      };
    } catch (error) {
      console.error("Failed to get election results:", error);
      throw error;
    }
  }

  /** Compute winner using contract's getWinner method */
  async getWinner(electionId) {
    try {
      if (!this.contract) throw new Error("Contract not loaded");
      const eId = BigInt(electionId).toString();

      // Use the contract's getWinner function directly
      const winner = await this.contract.methods.getWinner(eId).call();

      return {
        winnerId: BigInt(winner[0]).toString(),
        winnerName: winner[1],
        winnerParty: winner[2],
        winnerVotes: BigInt(winner[3]).toString(),
      };
    } catch (error) {
      console.error("Failed to get winner:", error);
      throw error;
    }
  }

  /** Get candidate info safely */
  async getCandidate(electionId, candidateId) {
    try {
      if (!this.contract) throw new Error("Contract not loaded");

      const eId = BigInt(electionId).toString();
      const cId = BigInt(candidateId).toString();

      // Fetch candidate from contract
      const candidate = await this.contract.methods
        .getCandidate(eId, cId)
        .call();

      // Return normalized BigInt values
      return {
        id: BigInt(candidate[0]).toString(),
        name: candidate[1],
        party: candidate[2],
        voteCount: BigInt(candidate[3]).toString(),
        isActive: candidate[4],
      };
    } catch (error) {
      console.error(`Failed to get candidate ${candidateId}:`, error);
      throw error;
    }
  }

  /** Get voter info safely */
  async getVoter(electionId, voterAddress) {
    try {
      if (!this.contract) throw new Error("Contract not loaded");

      const eId = BigInt(electionId).toString();

      // Fetch voter from contract
      const voter = await this.contract.methods
        .getVoter(eId, voterAddress)
        .call();

      return {
        isRegistered: voter[0],
        hasVoted: voter[1],
        votedFor: voter[2] ? BigInt(voter[2]).toString() : null,
        registrationTime: BigInt(voter[3]).toString(),
      };
    } catch (error) {
      console.error(`Failed to get voter ${voterAddress}:`, error);
      throw error;
    }
  }

  /** Check voting active */
  async isVotingActive(electionId) {
    try {
      if (!this.contract) throw new Error("Contract not loaded");
      const eId = BigInt(electionId).toString();
      return await this.contract.methods.isVotingActive(eId).call();
    } catch (error) {
      console.error("Failed to check voting status:", error);
      throw error;
    }
  }

  /** Verify transaction */
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

  /** Get current block */
  async getCurrentBlock() {
    try {
      return await this.web3.eth.getBlockNumber();
    } catch (error) {
      console.error("Failed to get current block:", error);
      throw error;
    }
  }

  /** Wei ⇄ Ether conversion */
  weiToEther(wei) {
    return this.web3.utils.fromWei(wei.toString(), "ether");
  }
  etherToWei(ether) {
    return this.web3.utils.toWei(ether.toString(), "ether");
  }

  /** Check valid address */
  isValidAddress(address) {
    return this.web3.utils.isAddress(address);
  }

  /** Get contract events */
  async getContractEvents(eventName, fromBlock = 0, toBlock = "latest") {
    try {
      if (!this.contract) throw new Error("Contract not loaded");
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

const web3Utils = new Web3Utils();
module.exports = web3Utils;
