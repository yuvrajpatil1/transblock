// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Voting
 * @dev Implements voting process with security features
 */
contract Voting {
    struct Candidate {
        uint256 id;
        string name;
        string party;
        uint256 voteCount;
        bool isActive;
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedFor;
        uint256 registrationTime;
    }

    struct Election {
        uint256 id;
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 totalVotes;
    }

    address public owner;
    uint256 public currentElectionId;
    
    mapping(uint256 => Election) public elections;
    mapping(uint256 => mapping(uint256 => Candidate)) public candidates; // electionId => candidateId => Candidate
    mapping(uint256 => mapping(address => Voter)) public voters; // electionId => voterAddress => Voter
    mapping(uint256 => uint256[]) public electionCandidates; // electionId => candidateIds array
    mapping(uint256 => address[]) public electionVoters; // electionId => voter addresses
    
    uint256 public totalElections;
    
    event ElectionCreated(uint256 indexed electionId, string name, uint256 startTime, uint256 endTime);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name, string party);
    event VoterRegistered(uint256 indexed electionId, address indexed voter);
    event VoteCast(uint256 indexed electionId, address indexed voter, uint256 indexed candidateId);
    event ElectionStarted(uint256 indexed electionId);
    event ElectionEnded(uint256 indexed electionId);
    event CandidateStatusChanged(uint256 indexed electionId, uint256 indexed candidateId, bool isActive);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier electionExists(uint256 _electionId) {
        require(_electionId > 0 && _electionId <= totalElections, "Election does not exist");
        _;
    }

    modifier electionActive(uint256 _electionId) {
        require(elections[_electionId].isActive, "Election is not active");
        require(block.timestamp >= elections[_electionId].startTime, "Election has not started yet");
        require(block.timestamp <= elections[_electionId].endTime, "Election has ended");
        _;
    }

    modifier hasNotVoted(uint256 _electionId) {
        require(!voters[_electionId][msg.sender].hasVoted, "You have already voted");
        _;
    }

    modifier isRegisteredVoter(uint256 _electionId) {
        require(voters[_electionId][msg.sender].isRegistered, "You are not registered to vote");
        _;
    }

    modifier validCandidate(uint256 _electionId, uint256 _candidateId) {
        require(candidates[_electionId][_candidateId].id != 0, "Candidate does not exist");
        require(candidates[_electionId][_candidateId].isActive, "Candidate is not active");
        _;
    }

    constructor() {
        owner = msg.sender;
        totalElections = 0;
        currentElectionId = 0;
    }

    /**
     * @dev Create a new election
     */
    function createElection(
        string memory _name,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) public onlyOwner returns (uint256) {
        require(_startTime > block.timestamp, "Start time must be in the future");
        require(_endTime > _startTime, "End time must be after start time");
        require(bytes(_name).length > 0, "Election name cannot be empty");

        totalElections++;
        uint256 electionId = totalElections;

        elections[electionId] = Election({
            id: electionId,
            name: _name,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            isActive: true,
            totalVotes: 0
        });

        currentElectionId = electionId;

        emit ElectionCreated(electionId, _name, _startTime, _endTime);
        return electionId;
    }

    /**
     * @dev Add a candidate to an election
     */
    function addCandidate(
        uint256 _electionId,
        uint256 _candidateId,
        string memory _name,
        string memory _party
    ) public onlyOwner electionExists(_electionId) {
        require(candidates[_electionId][_candidateId].id == 0, "Candidate ID already exists");
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        require(bytes(_party).length > 0, "Party name cannot be empty");

        candidates[_electionId][_candidateId] = Candidate({
            id: _candidateId,
            name: _name,
            party: _party,
            voteCount: 0,
            isActive: true
        });

        electionCandidates[_electionId].push(_candidateId);

        emit CandidateAdded(_electionId, _candidateId, _name, _party);
    }

    /**
     * @dev Register a voter for an election
     */
    function registerVoter(uint256 _electionId, address _voter) public onlyOwner electionExists(_electionId) {
        require(!voters[_electionId][_voter].isRegistered, "Voter is already registered");
        require(_voter != address(0), "Invalid voter address");

        voters[_electionId][_voter] = Voter({
            isRegistered: true,
            hasVoted: false,
            votedFor: 0,
            registrationTime: block.timestamp
        });

        electionVoters[_electionId].push(_voter);

        emit VoterRegistered(_electionId, _voter);
    }

    /**
     * @dev Cast a vote
     */
    function vote(uint256 _electionId, uint256 _candidateId) 
        public 
        electionExists(_electionId)
        electionActive(_electionId)
        isRegisteredVoter(_electionId)
        hasNotVoted(_electionId)
        validCandidate(_electionId, _candidateId)
    {
        voters[_electionId][msg.sender].hasVoted = true;
        voters[_electionId][msg.sender].votedFor = _candidateId;

        candidates[_electionId][_candidateId].voteCount++;
        elections[_electionId].totalVotes++;

        emit VoteCast(_electionId, msg.sender, _candidateId);
    }

    /**
     * @dev Get candidate information
     */
    function getCandidate(uint256 _electionId, uint256 _candidateId) 
        public 
        view 
        electionExists(_electionId)
        returns (uint256 id, string memory name, string memory party, uint256 voteCount, bool isActive) 
    {
        Candidate memory candidate = candidates[_electionId][_candidateId];
        return (candidate.id, candidate.name, candidate.party, candidate.voteCount, candidate.isActive);
    }

    /**
     * @dev Get voter information
     */
    function getVoter(uint256 _electionId, address _voter) 
        public 
        view 
        electionExists(_electionId)
        returns (bool isRegistered, bool hasVoted, uint256 votedFor, uint256 registrationTime) 
    {
        Voter memory voter = voters[_electionId][_voter];
        return (voter.isRegistered, voter.hasVoted, voter.votedFor, voter.registrationTime);
    }

    /**
     * @dev Get election information
     */
    function getElection(uint256 _electionId) 
        public 
        view 
        electionExists(_electionId)
        returns (uint256 id, string memory name, string memory description, uint256 startTime, uint256 endTime, bool isActive, uint256 totalVotes) 
    {
        Election memory election = elections[_electionId];
        return (election.id, election.name, election.description, election.startTime, election.endTime, election.isActive, election.totalVotes);
    }

    /**
     * @dev Get all candidates for an election
     */
    function getElectionCandidates(uint256 _electionId) 
        public 
        view 
        electionExists(_electionId)
        returns (uint256[] memory) 
    {
        return electionCandidates[_electionId];
    }

    /**
     * @dev Get election results
     */
    function getResults(uint256 _electionId) 
        public 
        view 
        electionExists(_electionId)
        returns (uint256[] memory candidateIds, uint256[] memory voteCounts) 
    {
        uint256[] memory candidateList = electionCandidates[_electionId];
        uint256[] memory votes = new uint256[](candidateList.length);

        for (uint256 i = 0; i < candidateList.length; i++) {
            votes[i] = candidates[_electionId][candidateList[i]].voteCount;
        }

        return (candidateList, votes);
    }

    /**
     * @dev Get winning candidate
     */
    function getWinner(uint256 _electionId) 
        public 
        view 
        electionExists(_electionId)
        returns (uint256 winnerId, string memory winnerName, string memory winnerParty, uint256 winnerVotes) 
    {
        uint256[] memory candidateList = electionCandidates[_electionId];
        uint256 maxVotes = 0;
        uint256 winningCandidateId = 0;

        for (uint256 i = 0; i < candidateList.length; i++) {
            uint256 candidateId = candidateList[i];
            if (candidates[_electionId][candidateId].voteCount > maxVotes && candidates[_electionId][candidateId].isActive) {
                maxVotes = candidates[_electionId][candidateId].voteCount;
                winningCandidateId = candidateId;
            }
        }

        if (winningCandidateId != 0) {
            Candidate memory winner = candidates[_electionId][winningCandidateId];
            return (winner.id, winner.name, winner.party, winner.voteCount);
        }

        return (0, "", "", 0);
    }

    /**
     * @dev Check if voting period is active
     */
    function isVotingActive(uint256 _electionId) public view electionExists(_electionId) returns (bool) {
        Election memory election = elections[_electionId];
        return election.isActive && 
               block.timestamp >= election.startTime && 
               block.timestamp <= election.endTime;
    }

    /**
     * @dev End an election (only owner)
     */
    function endElection(uint256 _electionId) public onlyOwner electionExists(_electionId) {
        elections[_electionId].isActive = false;
        emit ElectionEnded(_electionId);
    }

    /**
     * @dev Activate/Deactivate a candidate (only owner)
     */
    function setCandidateStatus(uint256 _electionId, uint256 _candidateId, bool _isActive) 
        public 
        onlyOwner 
        electionExists(_electionId) 
    {
        require(candidates[_electionId][_candidateId].id != 0, "Candidate does not exist");
        candidates[_electionId][_candidateId].isActive = _isActive;
        emit CandidateStatusChanged(_electionId, _candidateId, _isActive);
    }

    /**
     * @dev Get total number of registered voters for an election
     */
    function getTotalVoters(uint256 _electionId) public view electionExists(_electionId) returns (uint256) {
        return electionVoters[_electionId].length;
    }

    /**
     * @dev Get total number of votes cast in an election
     */
    function getTotalVotes(uint256 _electionId) public view electionExists(_electionId) returns (uint256) {
        return elections[_electionId].totalVotes;
    }

    /**
     * @dev Transfer ownership (only current owner)
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }

    /**
     * @dev Emergency function to pause all elections
     */
    function emergencyPause() public onlyOwner {
        // Implementation would depend on specific requirements
        // This is a placeholder for emergency functionality
    }

    /**
     * @dev Get contract version and info
     */
    function getContractInfo() public pure returns (string memory version, string memory description) {
        return ("1.0.0", "Blockchain Voting System Smart Contract");
    }
}