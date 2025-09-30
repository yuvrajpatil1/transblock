// server/routes/blockchainRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const blockchainService = require("../services/blockchainService");

// Get blockchain health
router.get("/health", async (req, res) => {
  try {
    const health = await blockchainService.healthCheck();
    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking blockchain health",
      error: error.message,
    });
  }
});

// Get blockchain network info
router.get("/network-info", authMiddleware, async (req, res) => {
  try {
    const networkInfo = await blockchainService.getNetworkInfo();
    res.json({
      success: true,
      data: networkInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching network info",
      error: error.message,
    });
  }
});

// Sync results from blockchain (Admin only)
router.post(
  "/sync-results/:electionId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { electionId } = req.params;
      const results = await blockchainService.syncResultsFromBlockchain(
        electionId
      );
      res.json({
        success: true,
        message: "Results synced from blockchain",
        data: results,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error syncing results",
        error: error.message,
      });
    }
  }
);

// Get blockchain events
router.get("/events", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { fromBlock = 0, toBlock = "latest" } = req.query;
    const events = await blockchainService.getVotingEvents(fromBlock, toBlock);
    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching blockchain events",
      error: error.message,
    });
  }
});

// Validate wallet address
router.post("/validate-address", authMiddleware, (req, res) => {
  try {
    const { address } = req.body;
    const isValid = blockchainService.isValidWalletAddress(address);
    res.json({
      success: true,
      data: { isValid, address },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error validating address",
      error: error.message,
    });
  }
});

module.exports = router;
