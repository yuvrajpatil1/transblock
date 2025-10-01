// server/routes/voteRoutes.js
const router = require("express").Router();
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const votingController = require("../controllers/votingController");

router.post(
  "/cast",
  authMiddleware,
  requireRole("voter"),
  votingController.castVote
);
router.post("/verify", authMiddleware, votingController.verifyVote);
router.get("/history", authMiddleware, votingController.getVotingHistory);

module.exports = router;
