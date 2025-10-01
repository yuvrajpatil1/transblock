// server/routes/electionRoutes.js
const router = require("express").Router();
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const electionController = require("../controllers/electionController");

// Public routes
router.get("/", electionController.getAllElections);
router.get("/active", electionController.getActiveElections);
router.get("/:id", electionController.getElectionById);
router.get("/:id/results", electionController.getElectionResults);

// Protected routes
router.use(authMiddleware);

// Admin only routes
router.post("/", requireRole("admin"), electionController.createElection);
router.put("/:id", requireRole("admin"), electionController.updateElection);
router.post(
  "/:id/start",
  requireRole("admin"),
  electionController.startElection
);
router.post("/:id/stop", requireRole("admin"), electionController.stopElection);
router.post(
  "/:id/declare-results",
  requireRole("admin"),
  electionController.declareResults
);
router.delete("/:id", requireRole("admin"), electionController.deleteElection);
router.post(
  "/:id/add-candidate",
  requireRole("admin"),
  electionController.addCandidate
);
router.delete(
  "/:id/candidate/:candidateId",
  requireRole("admin"),
  electionController.removeCandidate
);

module.exports = router;
