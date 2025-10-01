// server/models/candidateModel.js
const candidateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    registrationNumber: {
      type: String,
      unique: true,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    contactNo: {
      type: String,
      required: true,
    },
    party: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    biography: {
      type: String,
      required: true,
      minlength: 50,
      maxlength: 2000,
    },
    manifesto: {
      type: String,
      required: true,
      minlength: 100,
      maxlength: 5000,
    },
    profileImage: {
      type: String,
      default: null,
    },
    experience: [
      {
        title: String,
        organization: String,
        startDate: Date,
        endDate: Date,
        description: String,
        isCurrent: { type: Boolean, default: false },
      },
    ],
    education: [
      {
        degree: String,
        institution: String,
        graduationYear: Number,
        fieldOfStudy: String,
      },
    ],
    achievements: [
      {
        title: String,
        description: String,
        year: Number,
      },
    ],
    socialMedia: {
      twitter: String,
      facebook: String,
      instagram: String,
      linkedin: String,
      website: String,
    },
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verificationNotes: {
      type: String,
      default: "",
    },
    votes: {
      type: Number,
      default: 0,
      min: 0,
    },
    blockchainCandidateId: Number,
  },
  {
    timestamps: true,
  }
);

// Auto-generate registration number
candidateSchema.pre("save", async function (next) {
  if (this.isNew && !this.registrationNumber) {
    const count = await this.constructor.countDocuments();
    this.registrationNumber = `CAND-${Date.now()}-${count + 1}`;
  }
  next();
});

candidateSchema.index({ userId: 1 });
candidateSchema.index({ electionId: 1 });
candidateSchema.index({ isVerified: 1, isActive: 1 });

module.exports = mongoose.model("Candidate", candidateSchema);
