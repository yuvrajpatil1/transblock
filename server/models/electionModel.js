// const mongoose = require("mongoose");

// const electionSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     description: {
//       type: String,
//       required: true,
//     },
//     startDate: {
//       type: Date,
//       required: true,
//     },
//     endDate: {
//       type: Date,
//       required: true,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     status: {
//       type: String,
//       enum: ["upcoming", "active", "completed", "cancelled"],
//       default: "upcoming",
//     },
//     candidates: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Candidate",
//       },
//     ],
//     totalVotes: {
//       type: Number,
//       default: 0,
//     },
//     settings: {
//       allowMultipleVotes: {
//         type: Boolean,
//         default: false,
//       },
//       requireVerification: {
//         type: Boolean,
//         default: true,
//       },
//       publicResults: {
//         type: Boolean,
//         default: true,
//       },
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Add methods
// electionSchema.methods.isOngoing = function () {
//   const now = new Date();
//   return this.startDate <= now && now <= this.endDate && this.isActive;
// };

// electionSchema.methods.hasEnded = function () {
//   return new Date() > this.endDate;
// };

// electionSchema.methods.hasStarted = function () {
//   return new Date() >= this.startDate;
// };

// module.exports = mongoose.model("Election", electionSchema);

// server/models/electionModel.js
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
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "cancelled"],
      default: "upcoming",
    },
    electionType: {
      type: String,
      enum: ["general", "local", "special"],
      default: "general",
    },
    candidates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "candidates",
      },
    ],
    voters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    totalVotes: {
      type: Number,
      default: 0,
    },
    blockchainElectionId: Number,
    blockchainNetwork: {
      type: String,
      default: "Ethereum",
    },
    isResultsDeclared: {
      type: Boolean,
      default: false,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "candidates",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validate dates
electionSchema.pre("save", function (next) {
  if (this.startDate >= this.endDate) {
    next(new Error("End date must be after start date"));
  }
  next();
});

electionSchema.index({ status: 1 });
electionSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("elections", electionSchema);
