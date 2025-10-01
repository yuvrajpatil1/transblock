const web3Utils = require("./utils/web3Utils");

async function testBlockchain() {
  try {
    console.log("=".repeat(60));
    console.log("🚀 Starting Comprehensive Blockchain Test");
    console.log("=".repeat(60));

    // Initialize Web3
    console.log("\n📡 Initializing Web3...");
    await web3Utils.initialize();
    console.log(`✅ Connected with ${web3Utils.accounts.length} accounts`);

    // =================================================================
    // TEST SCENARIO 1: Presidential Election
    // =================================================================
    console.log("\n" + "=".repeat(60));
    console.log("📋 TEST 1: Presidential Election");
    console.log("=".repeat(60));

    const presElectionResult = await web3Utils.createElection(
      "Presidential Election 2024",
      "National presidential election",
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000) + 7200 // 2 hours
    );

    const presElectionId =
      presElectionResult.events.ElectionCreated.returnValues.electionId;
    console.log(`✅ Election created with ID: ${presElectionId}`);

    // Add 4 presidential candidates
    console.log("\n👥 Adding presidential candidates...");
    const presCandidates = [
      { id: 1, name: "Sarah Johnson", party: "Democratic Party" },
      { id: 2, name: "Michael Chen", party: "Republican Party" },
      { id: 3, name: "Emily Rodriguez", party: "Independent" },
      { id: 4, name: "James Wilson", party: "Green Party" },
    ];

    for (const candidate of presCandidates) {
      await web3Utils.addCandidate(
        presElectionId,
        candidate.id,
        candidate.name,
        candidate.party
      );
      console.log(`  ✓ Added: ${candidate.name} (${candidate.party})`);
    }

    // Register 8 voters for presidential election (accounts 1-8)
    console.log("\n📝 Registering voters for presidential election...");
    const presVoters = web3Utils.accounts.slice(1, 9);
    for (const voter of presVoters) {
      await web3Utils.registerVoter(presElectionId, voter);
    }
    console.log(`✅ Registered ${presVoters.length} voters`);

    // Cast votes for presidential election
    console.log("\n🗳️  Casting votes for presidential election...");
    const presVotes = [
      { voter: presVoters[0], candidateId: 1 }, // Sarah Johnson
      { voter: presVoters[1], candidateId: 1 }, // Sarah Johnson
      { voter: presVoters[2], candidateId: 2 }, // Michael Chen
      { voter: presVoters[3], candidateId: 1 }, // Sarah Johnson
      { voter: presVoters[4], candidateId: 3 }, // Emily Rodriguez
      { voter: presVoters[5], candidateId: 2 }, // Michael Chen
      { voter: presVoters[6], candidateId: 1 }, // Sarah Johnson
      { voter: presVoters[7], candidateId: 4 }, // James Wilson
    ];

    for (const vote of presVotes) {
      await web3Utils.castVote(presElectionId, vote.candidateId, vote.voter);
      const candidate = presCandidates.find((c) => c.id === vote.candidateId);
      console.log(`  ✓ Vote cast for: ${candidate.name}`);
    }

    // Get presidential election results
    console.log("\n Presidential Election Results:");
    const presResults = await web3Utils.getElectionResults(presElectionId);
    console.log(`Total Votes: ${presResults.totalVotes}`);

    for (let i = 0; i < presResults.candidateIds.length; i++) {
      const candidateId = presResults.candidateIds[i];
      const candidate = presCandidates.find(
        (c) => c.id === parseInt(candidateId)
      );
      console.log(
        `  ${candidate.name} (${candidate.party}): ${presResults.voteCounts[i]} votes`
      );
    }

    const presWinner = await web3Utils.getWinner(presElectionId);
    console.log(
      `\n🏆 WINNER: ${presWinner.winnerName} (${presWinner.winnerParty}) with ${presWinner.winnerVotes} votes`
    );

    // =================================================================
    // TEST SCENARIO 2: Local Council Election
    // =================================================================
    console.log("\n" + "=".repeat(60));
    console.log("📋 TEST 2: Local Council Election");
    console.log("=".repeat(60));

    const councilElectionResult = await web3Utils.createElection(
      "City Council Election",
      "Local council member election for District 5",
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000) + 3600 // 1 hour
    );

    const councilElectionId =
      councilElectionResult.events.ElectionCreated.returnValues.electionId;
    console.log(`✅ Election created with ID: ${councilElectionId}`);

    // Add 3 council candidates
    console.log("\n👥 Adding council candidates...");
    const councilCandidates = [
      { id: 1, name: "David Martinez", party: "Community First" },
      { id: 2, name: "Lisa Thompson", party: "Progress Alliance" },
      { id: 3, name: "Robert Kim", party: "Local Voice" },
    ];

    for (const candidate of councilCandidates) {
      await web3Utils.addCandidate(
        councilElectionId,
        candidate.id,
        candidate.name,
        candidate.party
      );
      console.log(`  ✓ Added: ${candidate.name} (${candidate.party})`);
    }

    // FIXED: Register 5 voters for council election (reuse accounts 1-5)
    console.log("\n Registering voters for council election...");
    const councilVoters = web3Utils.accounts.slice(1, 6); // Changed from slice(9, 14)
    for (const voter of councilVoters) {
      await web3Utils.registerVoter(councilElectionId, voter);
    }
    console.log(` Registered ${councilVoters.length} voters`);

    // Cast votes for council election
    console.log("\n  Casting votes for council election...");
    const councilVotes = [
      { voter: councilVoters[0], candidateId: 2 }, // Lisa Thompson
      { voter: councilVoters[1], candidateId: 2 }, // Lisa Thompson
      { voter: councilVoters[2], candidateId: 1 }, // David Martinez
      { voter: councilVoters[3], candidateId: 2 }, // Lisa Thompson
      { voter: councilVoters[4], candidateId: 3 }, // Robert Kim
    ];

    for (const vote of councilVotes) {
      await web3Utils.castVote(councilElectionId, vote.candidateId, vote.voter);
      const candidate = councilCandidates.find(
        (c) => c.id === vote.candidateId
      );
      console.log(`  ✓ Vote cast for: ${candidate.name}`);
    }

    // Get council election results
    console.log("\n📊 Council Election Results:");
    const councilResults = await web3Utils.getElectionResults(
      councilElectionId
    );
    console.log(`Total Votes: ${councilResults.totalVotes}`);

    for (let i = 0; i < councilResults.candidateIds.length; i++) {
      const candidateId = councilResults.candidateIds[i];
      const candidate = councilCandidates.find(
        (c) => c.id === parseInt(candidateId)
      );
      console.log(
        `  ${candidate.name} (${candidate.party}): ${councilResults.voteCounts[i]} votes`
      );
    }

    const councilWinner = await web3Utils.getWinner(councilElectionId);
    console.log(
      `\n🏆 WINNER: ${councilWinner.winnerName} (${councilWinner.winnerParty}) with ${councilWinner.winnerVotes} votes`
    );

    // =================================================================
    // TEST SCENARIO 3: Student Body President Election
    // =================================================================
    console.log("\n" + "=".repeat(60));
    console.log("📋 TEST 3: Student Body President Election");
    console.log("=".repeat(60));

    const studentElectionResult = await web3Utils.createElection(
      "Student Body President 2024",
      "University student government election",
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000) + 1800 // 30 minutes
    );

    const studentElectionId =
      studentElectionResult.events.ElectionCreated.returnValues.electionId;
    console.log(` Election created with ID: ${studentElectionId}`);

    // Add 5 student candidates
    console.log("\n👥 Adding student candidates...");
    const studentCandidates = [
      { id: 1, name: "Alex Turner", party: "Student Unity" },
      { id: 2, name: "Maya Patel", party: "Campus Change" },
      { id: 3, name: "Chris Anderson", party: "Voice of Students" },
      { id: 4, name: "Nicole Brown", party: "Future Forward" },
      { id: 5, name: "Kevin Lee", party: "Student First" },
    ];

    for (const candidate of studentCandidates) {
      await web3Utils.addCandidate(
        studentElectionId,
        candidate.id,
        candidate.name,
        candidate.party
      );
      console.log(`  ✓ Added: ${candidate.name} (${candidate.party})`);
    }

    // FIXED: Register 10 voters for student election (reuse all accounts 1-9, only 9 available)
    console.log("\n Registering voters for student election...");
    const studentVoters = web3Utils.accounts.slice(1, 10); // Changed from slice(14, 24)
    for (const voter of studentVoters) {
      await web3Utils.registerVoter(studentElectionId, voter);
    }
    console.log(` Registered ${studentVoters.length} voters`);

    // FIXED: Cast votes for student election (adjusted to 9 votes instead of 10)
    console.log("\n  Casting votes for student election...");
    const studentVotes = [
      { voter: studentVoters[0], candidateId: 2 }, // Maya Patel
      { voter: studentVoters[1], candidateId: 2 }, // Maya Patel
      { voter: studentVoters[2], candidateId: 1 }, // Alex Turner
      { voter: studentVoters[3], candidateId: 2 }, // Maya Patel
      { voter: studentVoters[4], candidateId: 5 }, // Kevin Lee
      { voter: studentVoters[5], candidateId: 2 }, // Maya Patel
      { voter: studentVoters[6], candidateId: 3 }, // Chris Anderson
      { voter: studentVoters[7], candidateId: 2 }, // Maya Patel
      { voter: studentVoters[8], candidateId: 4 }, // Nicole Brown
    ];

    for (const vote of studentVotes) {
      await web3Utils.castVote(studentElectionId, vote.candidateId, vote.voter);
      const candidate = studentCandidates.find(
        (c) => c.id === vote.candidateId
      );
      console.log(`  ✓ Vote cast for: ${candidate.name}`);
    }

    // Get student election results
    console.log("\n Student Election Results:");
    const studentResults = await web3Utils.getElectionResults(
      studentElectionId
    );
    console.log(`Total Votes: ${studentResults.totalVotes}`);

    for (let i = 0; i < studentResults.candidateIds.length; i++) {
      const candidateId = studentResults.candidateIds[i];
      const candidate = studentCandidates.find(
        (c) => c.id === parseInt(candidateId)
      );
      console.log(
        `  ${candidate.name} (${candidate.party}): ${studentResults.voteCounts[i]} votes`
      );
    }

    const studentWinner = await web3Utils.getWinner(studentElectionId);
    console.log(
      `\n🏆 WINNER: ${studentWinner.winnerName} (${studentWinner.winnerParty}) with ${studentWinner.winnerVotes} votes`
    );

    // =================================================================
    // VERIFICATION TESTS
    // =================================================================
    console.log("\n" + "=".repeat(60));
    console.log(" VERIFICATION TESTS");
    console.log("=".repeat(60));

    // Check voting status
    console.log("\n✓ Checking voting status for all elections...");
    const presActive = await web3Utils.isVotingActive(presElectionId);
    const councilActive = await web3Utils.isVotingActive(councilElectionId);
    const studentActive = await web3Utils.isVotingActive(studentElectionId);
    console.log(
      `  Presidential Election: ${presActive ? "Active" : "Inactive"}`
    );
    console.log(`  Council Election: ${councilActive ? "Active" : "Inactive"}`);
    console.log(`  Student Election: ${studentActive ? "Active" : "Inactive"}`);

    // Verify individual voter status
    console.log("\n✓ Verifying voter status...");
    const voterInfo = await web3Utils.getVoter(presElectionId, presVoters[0]);
    console.log(`  Voter ${presVoters[0].substring(0, 8)}...:`);
    console.log(`    Registered: ${voterInfo.isRegistered}`);
    console.log(`    Has Voted: ${voterInfo.hasVoted}`);
    console.log(`    Voted For: Candidate ${voterInfo.votedFor}`);

    // Verify individual candidate
    console.log("\n✓ Verifying candidate details...");
    const candidateInfo = await web3Utils.getCandidate(presElectionId, 1);
    console.log(`  Candidate ${candidateInfo.name}:`);
    console.log(`    Party: ${candidateInfo.party}`);
    console.log(`    Vote Count: ${candidateInfo.voteCount}`);
    console.log(`    Active: ${candidateInfo.isActive}`);

    // Get current block
    const currentBlock = await web3Utils.getCurrentBlock();
    console.log(`\n✓ Current block number: ${currentBlock}`);

    // =================================================================
    // SUMMARY
    // =================================================================
    console.log("\n" + "=".repeat(60));
    console.log(" TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Elections Created: 3`);
    console.log(
      `  1. Presidential Election: ${presResults.totalVotes} votes, Winner: ${presWinner.winnerName}`
    );
    console.log(
      `  2. Council Election: ${councilResults.totalVotes} votes, Winner: ${councilWinner.winnerName}`
    );
    console.log(
      `  3. Student Election: ${studentResults.totalVotes} votes, Winner: ${studentWinner.winnerName}`
    );
    console.log(
      `\nTotal Candidates: ${
        presCandidates.length +
        councilCandidates.length +
        studentCandidates.length
      }`
    );
    console.log(
      `Total Voters Registered: ${
        presVoters.length + councilVoters.length + studentVoters.length
      }`
    );
    console.log(
      `Total Votes Cast: ${
        parseInt(presResults.totalVotes) +
        parseInt(councilResults.totalVotes) +
        parseInt(studentResults.totalVotes)
      }`
    );

    console.log("\n" + "=".repeat(60));
    console.log(" ALL TESTS COMPLETED SUCCESSFULLY");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n ERROR DURING BLOCKCHAIN TEST:", error);
    console.error("\nStack trace:", error.stack);
  }
}

// Run the test
testBlockchain();
