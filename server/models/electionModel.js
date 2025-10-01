// server/models/electionModel.js
const electionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Election title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Election description is required"],
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      validate: {
        validator: function (v) {
          return this.isNew ? v > Date.now() : true;
        },
        message: "Start date must be in the future",
      },
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (v) {
          return v > this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "cancelled"],
      default: "upcoming",
    },
    electionType: {
      type: String,
      enum: ["general", "local", "special", "primary"],
      default: "general",
    },
    candidates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Candidate",
      },
    ],
    eligibleVoters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    totalVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    blockchainElectionId: {
      type: Number,
      default: null,
    },
    isResultsDeclared: {
      type: Boolean,
      default: false,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    settings: {
      allowPublicResults: { type: Boolean, default: false },
      allowLiveResults: { type: Boolean, default: false },
      requireVerification: { type: Boolean, default: true },
      maxVotesPerVoter: { type: Number, default: 1 },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-update status based on dates
electionSchema.pre("save", function (next) {
  const now = new Date();

  if (this.status === "cancelled") {
    return next();
  }

  if (now < this.startDate) {
    this.status = "upcoming";
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = "active";
  } else if (now > this.endDate) {
    this.status = "completed";
  }

  next();
});

electionSchema.index({ status: 1 });
electionSchema.index({ startDate: 1, endDate: 1 });
electionSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Election", electionSchema);
