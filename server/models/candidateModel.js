// const mongoose = require("mongoose");

// const candidateSchema = new mongoose.Schema(
//   {
//     candidateId: {
//       type: Number,
//       required: true,
//       unique: true,
//     },
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 100,
//     },
//     party: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 50,
//     },
//     position: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 100,
//     },
//     description: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 1000,
//     },
//     manifesto: {
//       type: String,
//       trim: true,
//       maxlength: 5000,
//     },
//     imageUrl: {
//       type: String,
//       trim: true,
//       default: null,
//     },
//     voteCount: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     electionId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Election",
//       required: true,
//     },
//     socialMedia: {
//       twitter: {
//         type: String,
//         trim: true,
//         default: null,
//       },
//       facebook: {
//         type: String,
//         trim: true,
//         default: null,
//       },
//       instagram: {
//         type: String,
//         trim: true,
//         default: null,
//       },
//       website: {
//         type: String,
//         trim: true,
//         default: null,
//       },
//     },
//     qualifications: [
//       {
//         degree: {
//           type: String,
//           required: true,
//           trim: true,
//         },
//         institution: {
//           type: String,
//           required: true,
//           trim: true,
//         },
//         year: {
//           type: Number,
//           required: true,
//           min: 1900,
//           max: new Date().getFullYear(),
//         },
//       },
//     ],
//     experience: [
//       {
//         position: {
//           type: String,
//           required: true,
//           trim: true,
//         },
//         organization: {
//           type: String,
//           required: true,
//           trim: true,
//         },
//         startYear: {
//           type: Number,
//           required: true,
//           min: 1900,
//         },
//         endYear: {
//           type: Number,
//           min: 1900,
//           validate: {
//             validator: function (value) {
//               return !value || value >= this.startYear;
//             },
//             message: "End year must be greater than or equal to start year",
//           },
//         },
//         current: {
//           type: Boolean,
//           default: false,
//         },
//       },
//     ],
//     addedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Indexes for better query performance
// candidateSchema.index({ candidateId: 1 });
// candidateSchema.index({ electionId: 1 });
// candidateSchema.index({ isActive: 1 });
// candidateSchema.index({ voteCount: -1 }); // For sorting by votes

// // Virtual for vote percentage (calculated when populated)
// candidateSchema.virtual("votePercentage").get(function () {
//   return this.totalVotes
//     ? ((this.voteCount / this.totalVotes) * 100).toFixed(2)
//     : 0;
// });

// // Method to increment vote count
// candidateSchema.methods.incrementVote = async function () {
//   this.voteCount += 1;
//   return await this.save();
// };

// // Method to get candidate summary
// candidateSchema.methods.getSummary = function () {
//   return {
//     candidateId: this.candidateId,
//     name: this.name,
//     party: this.party,
//     position: this.position,
//     voteCount: this.voteCount,
//     imageUrl: this.imageUrl,
//   };
// };

// // Static method to find active candidates for an election
// candidateSchema.statics.findActiveByElection = function (electionId) {
//   return this.find({
//     electionId,
//     isActive: true,
//   }).sort({ candidateId: 1 });
// };

// // Static method to get candidates with vote counts sorted
// candidateSchema.statics.findWithResults = function (electionId) {
//   return this.find({
//     electionId,
//     isActive: true,
//   }).sort({ voteCount: -1, name: 1 });
// };

// // Pre-save middleware to ensure candidateId is unique within election
// candidateSchema.pre("save", async function (next) {
//   if (this.isNew || this.isModified("candidateId")) {
//     const existingCandidate = await this.constructor.findOne({
//       candidateId: this.candidateId,
//       electionId: this.electionId,
//       _id: { $ne: this._id },
//     });

//     if (existingCandidate) {
//       const error = new Error(
//         "Candidate ID must be unique within the election"
//       );
//       error.code = 11000;
//       return next(error);
//     }
//   }
//   next();
// });

// // Ensure JSON output includes virtuals
// candidateSchema.set("toJSON", { virtuals: true });
// candidateSchema.set("toObject", { virtuals: true });

// module.exports = mongoose.model("Candidate", candidateSchema);

// server/models/candidateModel.js
const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
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
    },
    manifesto: {
      type: String,
      required: true,
      minlength: 100,
    },
    experience: [
      {
        title: String,
        organization: String,
        startDate: Date,
        endDate: Date,
        description: String,
      },
    ],
    education: [
      {
        degree: String,
        institution: String,
        year: Number,
        description: String,
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
    profileImage: {
      type: String,
      default: "",
    },
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "elections",
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
      ref: "users",
    },
    verifiedAt: Date,
    verificationNotes: String,
    votes: {
      type: Number,
      default: 0,
    },
    registrationNumber: {
      type: String,
      unique: true,
    },
    constituency: String,
  },
  {
    timestamps: true,
  }
);

// Generate registration number before saving
candidateSchema.pre("save", async function (next) {
  if (!this.registrationNumber) {
    const count = await this.constructor.countDocuments();
    this.registrationNumber = `CAN-${Date.now()}-${count + 1}`;
  }
  next();
});

candidateSchema.index({ email: 1 });
candidateSchema.index({ electionId: 1, isVerified: 1, isActive: 1 });
candidateSchema.index({ party: 1 });

module.exports = mongoose.model("candidates", candidateSchema);
