// routes/candidateRoutes.js
const express = require("express");
const router = express.Router();
const Candidate = require("../models/candidateModel");
const authMiddleware = require("../middleware/authMiddleware");
// const adminMiddleware = require("../middleware/adminMiddleware");

// Register a new candidate
router.post("/candidates/register", authMiddleware, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      contactNo,
      party,
      position,
      biography,
      manifesto,
      experience,
      education,
      achievements,
      socialMedia,
      electionId,
    } = req.body;

    // Validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !contactNo ||
      !party ||
      !position ||
      !biography ||
      !manifesto
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Validate contact number (assuming 10 digits)
    const contactRegex = /^\d{10}$/;
    if (!contactRegex.test(contactNo.replace(/\D/g, ""))) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit contact number",
      });
    }

    // Validate biography and manifesto length
    if (biography.length < 50) {
      return res.status(400).json({
        success: false,
        message: "Biography must be at least 50 characters long",
      });
    }

    if (manifesto.length < 100) {
      return res.status(400).json({
        success: false,
        message: "Manifesto must be at least 100 characters long",
      });
    }

    // Check if candidate with email already exists
    const existingCandidate = await Candidate.findOne({ email });
    if (existingCandidate) {
      return res.status(400).json({
        success: false,
        message: "Candidate with this email already exists",
      });
    }

    // Clean up arrays - remove empty entries
    const cleanedExperience = Array.isArray(experience)
      ? experience.filter(
          (exp) => exp && (exp.title?.trim() || exp.organization?.trim())
        )
      : [];

    const cleanedEducation = Array.isArray(education)
      ? education.filter(
          (edu) => edu && (edu.degree?.trim() || edu.institution?.trim())
        )
      : [];

    const cleanedAchievements = Array.isArray(achievements)
      ? achievements.filter(
          (ach) => ach && (ach.title?.trim() || ach.description?.trim())
        )
      : [];

    // Clean up social media object
    const cleanedSocialMedia = socialMedia
      ? {
          twitter: socialMedia.twitter?.trim() || "",
          facebook: socialMedia.facebook?.trim() || "",
          instagram: socialMedia.instagram?.trim() || "",
          linkedin: socialMedia.linkedin?.trim() || "",
          website: socialMedia.website?.trim() || "",
        }
      : {};

    // Create new candidate
    const candidate = new Candidate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      contactNo: contactNo.replace(/\D/g, ""), // Store only digits
      party: party.trim(),
      position: position.trim(),
      biography: biography.trim(),
      manifesto: manifesto.trim(),
      experience: cleanedExperience,
      education: cleanedEducation,
      achievements: cleanedAchievements,
      socialMedia: cleanedSocialMedia,
      electionId,
      isVerified: false,
      isActive: true,
      votes: 0,
    });

    await candidate.save();

    // Remove sensitive data before sending response
    const candidateResponse = candidate.toObject();
    delete candidateResponse.__v;

    res.status(201).json({
      success: true,
      message: "Candidate registered successfully. Awaiting admin approval.",
      data: candidateResponse,
    });
  } catch (error) {
    console.error("Error registering candidate:", error);

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A candidate with this ${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
});

// Get all candidates (Admin only)
router.post("/get-all-candidates", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "" } = req.body;

    // Build filter object
    let filter = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { party: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "verified") {
      filter.isVerified = true;
    } else if (status === "pending") {
      filter.isVerified = false;
    }

    const candidates = await Candidate.find(filter)
      .populate("electionId", "title startDate endDate")
      .populate("verifiedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Candidate.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Candidates fetched successfully",
      data: {
        candidates,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
});

// Update candidate verification status (Admin only)
router.post(
  "/update-candidate-verified-status",
  authMiddleware,
  async (req, res) => {
    try {
      const { candidateId, isVerified, verificationNotes } = req.body;

      if (!candidateId) {
        return res.status(400).json({
          success: false,
          message: "Candidate ID is required",
        });
      }

      if (typeof isVerified !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Verification status must be true or false",
        });
      }

      const updateData = {
        isVerified,
        verificationNotes: verificationNotes || "",
      };

      if (isVerified) {
        updateData.verifiedBy = req.body.userId || req.userId; // Get from auth middleware
        updateData.verifiedAt = new Date();
      } else {
        updateData.verifiedBy = null;
        updateData.verifiedAt = null;
      }

      const candidate = await Candidate.findByIdAndUpdate(
        candidateId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate("electionId", "title startDate endDate")
        .populate("verifiedBy", "firstName lastName email");

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: "Candidate not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `Candidate ${
          isVerified ? "approved" : "rejected"
        } successfully`,
        data: candidate,
      });
    } catch (error) {
      console.error("Error updating candidate status:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    }
  }
);

// Get candidate by ID
router.post("/get-candidate-by-id", authMiddleware, async (req, res) => {
  try {
    const { candidateId } = req.body;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: "Candidate ID is required",
      });
    }

    const candidate = await Candidate.findById(candidateId)
      .populate("electionId", "title startDate endDate")
      .populate("verifiedBy", "firstName lastName email");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Candidate fetched successfully",
      data: candidate,
    });
  } catch (error) {
    console.error("Error fetching candidate:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
});

// Update candidate profile
router.post("/update-profile", authMiddleware, async (req, res) => {
  try {
    const { candidateId, ...updateData } = req.body;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: "Candidate ID is required",
      });
    }

    // Remove fields that shouldn't be updated by the candidate
    delete updateData.isVerified;
    delete updateData.verifiedBy;
    delete updateData.verifiedAt;
    delete updateData.registrationNumber;
    delete updateData.votes;
    delete updateData._id;
    delete updateData.__v;

    // Clean up data
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();
    }
    if (updateData.contactNo) {
      updateData.contactNo = updateData.contactNo.replace(/\D/g, "");
    }

    const candidate = await Candidate.findByIdAndUpdate(
      candidateId,
      updateData,
      { new: true, runValidators: true }
    ).populate("electionId", "title startDate endDate");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: candidate,
    });
  } catch (error) {
    console.error("Error updating candidate profile:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
});

// Delete candidate (Admin only)
router.post("/delete", authMiddleware, async (req, res) => {
  try {
    const { candidateId } = req.body;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: "Candidate ID is required",
      });
    }

    const candidate = await Candidate.findByIdAndDelete(candidateId);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Candidate deleted successfully",
      data: { deletedId: candidateId },
    });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
});

// Get candidates by election
router.post("/get-by-election", authMiddleware, async (req, res) => {
  try {
    const { electionId } = req.body;

    if (!electionId) {
      return res.status(400).json({
        success: false,
        message: "Election ID is required",
      });
    }

    const candidates = await Candidate.find({
      electionId,
      isVerified: true,
      isActive: true,
    })
      .select(
        "firstName lastName party position biography profileImage votes registrationNumber"
      )
      .sort({ firstName: 1 });

    res.status(200).json({
      success: true,
      message: "Candidates fetched successfully",
      data: candidates,
    });
  } catch (error) {
    console.error("Error fetching candidates by election:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
});

// Get candidates by party
router.post("/get-by-party", authMiddleware, async (req, res) => {
  try {
    const { party } = req.body;

    if (!party) {
      return res.status(400).json({
        success: false,
        message: "Party name is required",
      });
    }

    const candidates = await Candidate.find({
      party: { $regex: new RegExp(`^${party}$`, "i") }, // Case-insensitive exact match
      isVerified: true,
      isActive: true,
    })
      .populate("electionId", "title startDate endDate")
      .sort({ firstName: 1 });

    res.status(200).json({
      success: true,
      message: "Candidates fetched successfully",
      data: candidates,
    });
  } catch (error) {
    console.error("Error fetching candidates by party:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
});

// Get verified candidates for public view
router.get("/public/verified", async (req, res) => {
  try {
    const { election, party, position, page = 1, limit = 20 } = req.query;

    let filter = {
      isVerified: true,
      isActive: true,
    };

    if (election) filter.electionId = election;
    if (party) filter.party = { $regex: new RegExp(`^${party}$`, "i") };
    if (position)
      filter.position = { $regex: new RegExp(`^${position}$`, "i") };

    const candidates = await Candidate.find(filter)
      .select(
        "firstName lastName party position biography profileImage votes registrationNumber"
      )
      .populate("electionId", "title startDate endDate")
      .sort({ votes: -1, firstName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Candidate.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Verified candidates fetched successfully",
      data: {
        candidates,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching verified candidates:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
});

// Get candidate statistics (Admin only)
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const stats = await Candidate.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          verified: { $sum: { $cond: ["$isVerified", 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$isVerified", false] }, 1, 0] } },
          active: { $sum: { $cond: ["$isActive", 1, 0] } },
        },
      },
    ]);

    const partyStats = await Candidate.aggregate([
      {
        $match: { isVerified: true, isActive: true },
      },
      {
        $group: {
          _id: "$party",
          count: { $sum: 1 },
          totalVotes: { $sum: "$votes" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const positionStats = await Candidate.aggregate([
      {
        $match: { isVerified: true, isActive: true },
      },
      {
        $group: {
          _id: "$position",
          count: { $sum: 1 },
          totalVotes: { $sum: "$votes" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Candidate statistics fetched successfully",
      data: {
        overview: stats[0] || {
          total: 0,
          verified: 0,
          pending: 0,
          active: 0,
        },
        byParty: partyStats,
        byPosition: positionStats,
      },
    });
  } catch (error) {
    console.error("Error fetching candidate statistics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
});

module.exports = router;
