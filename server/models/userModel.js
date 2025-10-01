const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    walletAddress: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      validate: {
        validator: function (v) {
          return !v || /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: "Invalid Ethereum wallet address",
      },
    },
    role: {
      type: String,
      enum: {
        values: ["voter", "candidate", "admin"],
        message: "{VALUE} is not a valid role",
      },
      default: "voter",
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    votedInElections: [
      {
        electionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Election",
        },
        candidateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Candidate",
        },
        votedAt: {
          type: Date,
          default: Date.now,
        },
        transactionHash: String,
        blockNumber: Number,
      },
    ],
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (v) {
          const age = (Date.now() - v) / (365.25 * 24 * 60 * 60 * 1000);
          return age >= 18;
        },
        message: "User must be at least 18 years old",
      },
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    verificationToken: String,
    verificationTokenExpiry: Date,
    passwordResetToken: String,
    passwordResetExpiry: Date,
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ role: 1, isVerified: 1, isActive: 1 });

// Virtual for checking if user has voted in specific election
userSchema.virtual("hasVotedInElection").get(function () {
  return (electionId) => {
    return this.votedInElections.some(
      (vote) => vote.electionId.toString() === electionId.toString()
    );
  };
});

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

module.exports = mongoose.model("User", userSchema);
