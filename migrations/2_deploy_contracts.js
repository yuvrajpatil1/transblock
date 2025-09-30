const Voting = artifacts.require("Voting");

module.exports = async function (deployer, network, accounts) {
  console.log("Deploying to network:", network);
  console.log("Deployer account:", accounts[0]);

  try {
    // Deploy the Voting contract
    await deployer.deploy(Voting);
    const votingInstance = await Voting.deployed();

    console.log("Voting contract deployed successfully!");
    console.log("Contract address:", votingInstance.address);
    console.log("Transaction hash:", votingInstance.transactionHash);

    // Get contract info
    const contractInfo = await votingInstance.getContractInfo();
    console.log("Contract version:", contractInfo.version);
    console.log("Contract description:", contractInfo.description);

    // Verify owner
    const owner = await votingInstance.owner();
    console.log("Contract owner:", owner);

    if (network === "development") {
      // For development, we can create a sample election and add some test data
      console.log("\n--- Setting up development data ---");

      try {
        // Create a test election
        const startTime = Math.floor(Date.now() / 1000) + 300; // Start in 5 minutes
        const endTime = startTime + 24 * 60 * 60; // End in 24 hours

        const electionTx = await votingInstance.createElection(
          "Test Election 2024",
          "A test election for development purposes",
          startTime,
          endTime,
          { from: accounts[0] }
        );

        console.log("Test election created with transaction:", electionTx.tx);

        // Add test candidates
        await votingInstance.addCandidate(
          1,
          1,
          "Alice Johnson",
          "Democratic Party",
          { from: accounts[0] }
        );
        await votingInstance.addCandidate(
          1,
          2,
          "Bob Smith",
          "Republican Party",
          { from: accounts[0] }
        );
        await votingInstance.addCandidate(
          1,
          3,
          "Carol Williams",
          "Independent",
          { from: accounts[0] }
        );

        console.log("Test candidates added successfully");

        // Register some test voters
        for (let i = 1; i < Math.min(6, accounts.length); i++) {
          await votingInstance.registerVoter(1, accounts[i], {
            from: accounts[0],
          });
        }

        console.log("Test voters registered successfully");
        console.log("Development setup completed!");
      } catch (setupError) {
        console.error("Error setting up development data:", setupError.message);
        // Don't throw here, deployment should still succeed
      }
    }

    // Save deployment info to a file for the backend to use
    const fs = require("fs");
    const path = require("path");

    const deploymentInfo = {
      network: network,
      contractAddress: votingInstance.address,
      transactionHash: votingInstance.transactionHash,
      deployedAt: new Date().toISOString(),
      deployer: accounts[0],
      contractABI: Voting.abi,
    };

    // Create build directory if it doesn't exist
    const buildDir = path.join(__dirname, "..", "build");
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    // Write deployment info
    fs.writeFileSync(
      path.join(buildDir, "deployment-info.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("Deployment info saved to build/deployment-info.json");
  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
};
