// // const mongoose = require("mongoose");

// // const UserSchema = new mongoose.Schema(
// //   {
// //     firstName: {
// //       type: String,
// //       required: true,
// //     },
// //     lastName: {
// //       type: String,
// //       required: true,
// //     },
// //     email: {
// //       type: String,
// //       required: true,
// //     },
// //     contactNo: {
// //       type: String,
// //       required: false,
// //     },
// //     identification: {
// //       type: String,
// //       required: false,
// //     },
// //     identificationNumber: {
// //       type: String,
// //       required: true,
// //     },
// //     address: {
// //       type: String,
// //       required: false,
// //     },
// //     walletAddress: {
// //       type: String,
// //       required: true,
// //     },
// //     password: {
// //       type: String,
// //       required: function () {
// //         return !this.googleId;
// //       },
// //     },
// //     balance: {
// //       type: Number,
// //       default: 0,
// //     },
// //     isVerified: {
// //       type: Boolean,
// //       default: false,
// //     },
// //     isAdmin: {
// //       type: Boolean,
// //       default: false,
// //     },
// //     googleId: {
// //       type: String,
// //       sparse: true,
// //     },
// //     profilePicture: {
// //       type: String,
// //       required: false,
// //     },
// //     authProvider: {
// //       type: String,
// //       enum: ["local", "google"],
// //       default: "local",
// //     },
// //   },
// //   {
// //     timestamps: true,
// //   }
// // );

// // UserSchema.pre("save", function (next) {
// //   if (this.googleId) {
// //     this.authProvider = "google";
// //     this.isVerified = true;
// //   }
// //   next();
// // });

// // module.exports = mongoose.model("User", UserSchema);

// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const userSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: String,
//       required: false,
//       unique: true,
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//       match: [
//         /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
//         "Please enter a valid email",
//       ],
//     },
//     password: {
//       type: String,
//       required: true,
//       minlength: 6,
//     },
//     firstName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     lastName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     walletAddress: {
//       type: String,
//       unique: true,
//       sparse: true,
//       trim: true,
//     },
//     hasVoted: {
//       type: Boolean,
//       default: false,
//     },
//     votedFor: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Candidate",
//       default: null,
//     },
//     transactionHash: {
//       type: String,
//       default: null,
//     },
//     isVerified: {
//       type: Boolean,
//       default: false,
//     },
//     verificationToken: {
//       type: String,
//       default: null,
//     },
//     role: {
//       type: String,
//       enum: ["voter", "admin"],
//       default: "voter",
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     lastLogin: {
//       type: Date,
//       default: null,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Index for better query performance
// userSchema.index({ userId: 1 });
// userSchema.index({ email: 1 });
// userSchema.index({ walletAddress: 1 });

// // Hash password before saving
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   try {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Compare password method
// userSchema.methods.comparePassword = async function (candidatePassword) {
//   try {
//     return await bcrypt.compare(candidatePassword, this.password);
//   } catch (error) {
//     throw error;
//   }
// };

// // Get full name method
// userSchema.methods.getFullName = function () {
//   return `${this.firstName} ${this.lastName}`;
// };

// // Remove sensitive data when converting to JSON
// userSchema.methods.toJSON = function () {
//   const user = this.toObject();
//   delete user.password;
//   delete user.verificationToken;
//   return user;
// };

// // Static method to find user by credentials
// userSchema.statics.findByCredentials = async function (email, password) {
//   const user = await this.findOne({ email, isActive: true });
//   if (!user) {
//     throw new Error("Invalid login credentials");
//   }

//   const isMatch = await user.comparePassword(password);
//   if (!isMatch) {
//     throw new Error("Invalid login credentials");
//   }

//   return user;
// };

// module.exports = mongoose.model("User", userSchema);

// server/models/userModel.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
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
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
    },
    walletAddress: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ["voter", "admin"],
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
    hasVoted: {
      type: Boolean,
      default: false,
    },
    votedFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "candidates",
      default: null,
    },
    votedInElections: [
      {
        electionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "elections",
        },
        votedAt: Date,
        transactionHash: String,
      },
    ],
    phoneNumber: {
      type: String,
      trim: true,
    },
    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    verificationToken: String,
    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ isVerified: 1, isActive: 1 });

module.exports = mongoose.model("users", userSchema);
