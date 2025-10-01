// server/routes/candidateRoutes.js
const router = require("express").Router();
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const candidateController = require("../controllers/candidateController");

// Public routes
router.get("/", candidateController.getAllCandidates);
router.get("/verified", candidateController.getVerifiedCandidates);
router.get("/:id", candidateController.getCandidateById);

// Protected routes
router.use(authMiddleware);

// Candidate registration (voters can apply to become candidates)
router.post(
  "/register",
  requireRole("voter", "candidate"),
  candidateController.registerAsCandidate
);

// Candidate profile management
router.put(
  "/profile",
  requireRole("candidate"),
  candidateController.updateProfile
);
router.get(
  "/my/profile",
  requireRole("candidate"),
  candidateController.getMyProfile
);

// Admin routes
router.put(
  "/:id/verify",
  requireRole("admin"),
  candidateController.verifyCandidate
);
router.delete(
  "/:id",
  requireRole("admin"),
  candidateController.deleteCandidate
);

module.exports = router;
