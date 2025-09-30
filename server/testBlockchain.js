const web3Utils = require("./utils/web3Utils");

async function testBlockchain() {
  try {
    console.log("Initializing Web3...");
    await web3Utils.initialize();

    // --- Step 1: Create Election ---
    console.log("\nCreating election...");
    const electionResult = await web3Utils.createElection(
      "General Election",
      "Election for testing",
      Math.floor(Date.now() / 1000), // startTime in seconds
      Math.floor(Date.now() / 1000) + 3600 // endTime 1 hour later
    );

    // Get election ID from event
    const electionCreatedEvent = electionResult.events.ElectionCreated;
    const electionId = electionCreatedEvent.returnValues.electionId;
    console.log("Election created successfully with ID:", electionId);

    // --- Step 2: Add Candidates ---
    console.log("\nAdding candidates...");
    await web3Utils.addCandidate(electionId, 0, "Alice", "Party A");
    await web3Utils.addCandidate(electionId, 1, "Bob", "Party B");
    console.log("Candidates added successfully");

    // --- Step 3: Register Voters ---
    console.log("\nRegistering voters...");
    const voters = web3Utils.accounts.slice(1, 4); // pick some accounts
    for (const voter of voters) {
      await web3Utils.registerVoter(electionId, voter);
      console.log("Registered voter:", voter);
    }

    // --- Step 4: Cast Votes ---
    console.log("\nCasting votes...");
    await web3Utils.castVote(electionId, 0, voters[0]); // Alice
    await web3Utils.castVote(electionId, 1, voters[1]); // Bob
    await web3Utils.castVote(electionId, 0, voters[2]); // Alice
    console.log("Votes cast successfully");

    // --- Step 5: Get Election Results ---
    console.log("\nFetching election results...");
    const results = await web3Utils.getElectionResults(electionId);
    console.log("Election Results:", results);

    // --- Step 6: Get Winner ---
    console.log("\nFetching winner...");
    const winner = await web3Utils.getWinner(electionId);
    console.log("Winner:", winner);

    console.log("\n✅ Blockchain test completed successfully");
  } catch (error) {
    console.error("❌ Error during blockchain test:", error);
  }
}

// Run the test
testBlockchain();
