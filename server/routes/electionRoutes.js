// server/routes/electionRoutes.js
const express = require("express");
const router = express.Router();
const electionController = require("../controllers/electionController");
const votingController = require("../controllers/votingController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Public routes
router.get("/active", electionController.getActiveElections);
router.get("/all", electionController.getAllElections);
router.get("/:electionId", electionController.getElectionById);

// Protected routes (all users)
router.use(authMiddleware);
router.post("/vote", votingController.castVote);
router.post("/verify-vote", votingController.verifyVote);
router.get("/my/voting-history", votingController.getVotingHistory);

// Admin only routes
router.post("/create", adminMiddleware, electionController.createElection);
router.put("/:electionId", adminMiddleware, electionController.updateElection);
router.post(
  "/:electionId/start",
  adminMiddleware,
  electionController.startElection
);
router.post(
  "/:electionId/stop",
  adminMiddleware,
  electionController.stopElection
);
router.post(
  "/:electionId/declare-results",
  adminMiddleware,
  electionController.declareResults
);
router.post(
  "/:electionId/add-candidate",
  adminMiddleware,
  electionController.addCandidateToElection
);
router.delete(
  "/:electionId/candidate/:candidateId",
  adminMiddleware,
  electionController.removeCandidateFromElection
);
router.delete(
  "/:electionId",
  adminMiddleware,
  electionController.deleteElection
);

module.exports = router;
