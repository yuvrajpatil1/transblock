// server/models/voteModel.js
const voteSchema = new mongoose.Schema(
  {
    voterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },
    blockchainHash: {
      type: String,
      required: true,
      unique: true,
    },
    blockNumber: {
      type: Number,
      required: true,
    },
    gasUsed: String,
    ipAddress: String,
    userAgent: String,
    isValid: {
      type: Boolean,
      default: true,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "verified",
    },
    voteTimestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one vote per user per election
voteSchema.index({ voterId: 1, electionId: 1 }, { unique: true });
voteSchema.index({ electionId: 1, candidateId: 1 });
voteSchema.index({ blockchainHash: 1 });
voteSchema.index({ voteTimestamp: -1 });

module.exports = mongoose.model("Vote", voteSchema);
