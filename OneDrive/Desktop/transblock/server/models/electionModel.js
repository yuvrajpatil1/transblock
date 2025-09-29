const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "cancelled"],
      default: "upcoming",
    },
    candidates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Candidate",
      },
    ],
    totalVotes: {
      type: Number,
      default: 0,
    },
    settings: {
      allowMultipleVotes: {
        type: Boolean,
        default: false,
      },
      requireVerification: {
        type: Boolean,
        default: true,
      },
      publicResults: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Add methods
electionSchema.methods.isOngoing = function () {
  const now = new Date();
  return this.startDate <= now && now <= this.endDate && this.isActive;
};

electionSchema.methods.hasEnded = function () {
  return new Date() > this.endDate;
};

electionSchema.methods.hasStarted = function () {
  return new Date() >= this.startDate;
};

module.exports = mongoose.model("Election", electionSchema);
