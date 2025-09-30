// const mongoose = require("mongoose");

// const voteSchema = new mongoose.Schema(
//   {
//     voter: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     candidate: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Candidate",
//       required: true,
//     },
//     election: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Election",
//       required: false, // Optional if you don't have election model yet
//     },
//     transactionHash: {
//       type: String,
//       unique: true,
//       sparse: true, // Allows multiple null values
//     },
//     blockchainConfirmed: {
//       type: Boolean,
//       default: false,
//     },
//     ipAddress: {
//       type: String,
//       required: false,
//     },
//     userAgent: {
//       type: String,
//       required: false,
//     },
//     isValid: {
//       type: Boolean,
//       default: true,
//     },
//     timestamp: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Indexes for better performance
// voteSchema.index({ voter: 1 });
// voteSchema.index({ candidate: 1 });
// voteSchema.index({ election: 1 });
// voteSchema.index({ transactionHash: 1 });
// voteSchema.index({ timestamp: -1 });

// // Compound index to ensure one vote per user per election
// voteSchema.index({ voter: 1, election: 1 }, { unique: true });

// // Methods
// voteSchema.methods.confirm = function () {
//   this.blockchainConfirmed = true;
//   return this.save();
// };

// voteSchema.methods.invalidate = function () {
//   this.isValid = false;
//   return this.save();
// };

// // Static methods
// voteSchema.statics.getVotesByCandidate = function (candidateId) {
//   return this.find({ candidate: candidateId, isValid: true }).populate(
//     "voter",
//     "firstName lastName email"
//   );
// };

// voteSchema.statics.getVotesByElection = function (electionId) {
//   return this.find({ election: electionId, isValid: true })
//     .populate("voter", "firstName lastName email")
//     .populate("candidate", "name party");
// };

// voteSchema.statics.getTotalVotes = function () {
//   return this.countDocuments({ isValid: true });
// };

// server/models/VoteModel.js
const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    voterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "candidates",
      required: true,
    },
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "elections",
      required: true,
    },
    blockchainHash: {
      type: String,
      required: true,
      unique: true,
    },
    blockNumber: Number,
    gasUsed: String,
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "verified",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one vote per user per election
voteSchema.index({ voterId: 1, electionId: 1 }, { unique: true });
voteSchema.index({ electionId: 1 });
voteSchema.index({ candidateId: 1 });
voteSchema.index({ blockchainHash: 1 });

module.exports = mongoose.models.votes || mongoose.model("votes", voteSchema);
