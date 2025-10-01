// server/controllers/candidateController.js
const Candidate = require("../models/candidateModel");
const User = require("../models/userModel");

exports.registerAsCandidate = async (req, res) => {
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
    } = req.body;

    // Check if user already has candidate profile
    const existingCandidate = await Candidate.findOne({ userId: req.userId });
    if (existingCandidate) {
      return res.status(400).json({
        success: false,
        message: "You already have a candidate profile",
      });
    }

    const candidate = new Candidate({
      userId: req.userId,
      firstName,
      lastName,
      email,
      contactNo,
      party,
      position,
      biography,
      manifesto,
      experience: experience || [],
      education: education || [],
      achievements: achievements || [],
      socialMedia: socialMedia || {},
    });

    await candidate.save();

    // Update user role
    await User.findByIdAndUpdate(req.userId, { role: "candidate" });

    res.status(201).json({
      success: true,
      message: "Candidate registration submitted. Awaiting admin approval.",
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllCandidates = async (req, res) => {
  try {
    const { page = 1, limit = 20, electionId, party, verified } = req.query;

    let filter = {};
    if (electionId) filter.electionId = electionId;
    if (party) filter.party = party;
    if (verified !== undefined) filter.isVerified = verified === "true";

    const candidates = await Candidate.find(filter)
      .populate("electionId", "title")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Candidate.countDocuments(filter);

    res.json({
      success: true,
      data: {
        candidates,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getVerifiedCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find({
      isVerified: true,
      isActive: true,
    })
      .populate("electionId", "title")
      .sort({ votes: -1 });

    res.json({
      success: true,
      data: candidates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate("electionId")
      .populate("verifiedBy", "firstName lastName");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ userId: req.userId }).populate(
      "electionId"
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate profile not found",
      });
    }

    res.json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.isVerified;
    delete updates.verifiedBy;
    delete updates.votes;
    delete updates.userId;

    const candidate = await Candidate.findOneAndUpdate(
      { userId: req.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate profile not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.verifyCandidate = async (req, res) => {
  try {
    const { isVerified, verificationNotes } = req.body;

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      {
        isVerified,
        verificationNotes,
        verifiedBy: isVerified ? req.userId : null,
        verifiedAt: isVerified ? new Date() : null,
      },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.json({
      success: true,
      message: `Candidate ${isVerified ? "verified" : "rejected"} successfully`,
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    // Update user role back to voter
    await User.findByIdAndUpdate(candidate.userId, { role: "voter" });

    res.json({
      success: true,
      message: "Candidate deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
