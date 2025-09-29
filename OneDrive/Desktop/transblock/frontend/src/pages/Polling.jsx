import React, { useState, useEffect } from "react";
import {
  Home,
  ArrowRightLeft,
  BarChart3,
  User,
  LogOut,
  Menu,
  Users,
  Search,
  Filter,
  UserCheck,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  Award,
  Calendar,
  MapPin,
  Briefcase,
} from "lucide-react";

// Mock data for demonstration
const mockUser = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  walletAddress: "0x742d35Cc6636C0532925a3b8D0cD1fE95B1b62BA",
  hasVoted: false,
  _id: "63677b4ea960c3c5f6720434",
  isAdmin: false,
};

const mockCandidates = [
  {
    _id: "1",
    name: "Sarah Johnson",
    party: "Progressive Alliance",
    position: "District Representative",
    experience: "8 years",
    age: 42,
    education: "Harvard Law School",
    platform: ["Healthcare Reform", "Climate Action", "Economic Growth"],
    image:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    voteCount: 1247,
    description:
      "Experienced leader focused on progressive policies and community development.",
  },
  {
    _id: "2",
    name: "Michael Chen",
    party: "Independent",
    position: "District Representative",
    experience: "5 years",
    age: 38,
    education: "MIT Computer Science",
    platform: ["Technology Innovation", "Education Reform", "Small Business"],
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    voteCount: 892,
    description:
      "Tech entrepreneur advocating for innovation and educational excellence.",
  },
  {
    _id: "3",
    name: "Dr. Emily Rodriguez",
    party: "Health First Party",
    position: "District Representative",
    experience: "12 years",
    age: 45,
    education: "Johns Hopkins Medical School",
    platform: ["Universal Healthcare", "Mental Health", "Senior Care"],
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
    voteCount: 1089,
    description:
      "Medical professional dedicated to improving healthcare access for all.",
  },
  {
    _id: "4",
    name: "Robert Williams",
    party: "Conservative Union",
    position: "District Representative",
    experience: "15 years",
    age: 52,
    education: "Yale Political Science",
    platform: ["Fiscal Responsibility", "Traditional Values", "Law & Order"],
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    voteCount: 1356,
    description:
      "Veteran politician committed to conservative principles and fiscal discipline.",
  },
];

const mockElection = {
  title: "2025 District Representative Election",
  startDate: "2025-08-01T00:00:00Z",
  endDate: "2025-08-15T23:59:59Z",
  status: "active", // active, upcoming, ended
  totalVotes: 4584,
  eligibleVoters: 12500,
};

const Sidebar = ({ isOpen, onClose, menuItems, activeTab, setActiveTab }) => (
  <div
    className={`fixed top-0 left-0 h-full w-64 bg-gray-900/95 backdrop-blur-lg border-r border-gray-700/60 z-50 transform transition-transform duration-300 ease-in-out ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    } lg:translate-x-0 lg:static lg:z-auto`}
  >
    <div className="p-6 border-b border-gray-700/60">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-100">Electoral</h1>
        <p className="text-xs text-gray-400 mt-1">Blockchain Voting</p>
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-white lg:hidden"
      >
        ✕
      </button>
    </div>

    <nav className="p-4 space-y-2">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setActiveTab(item.id);
            item.onClick();
            onClose();
          }}
          className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
            activeTab === item.id
              ? "bg-amber-600/20 text-amber-400 border border-amber-600/30"
              : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
          }`}
        >
          <item.icon className="w-5 h-5 mr-3" />
          {item.label}
        </button>
      ))}
    </nav>
  </div>
);

export default function PollingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("polling");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterParty, setFilterParty] = useState("all");
  const [user, setUser] = useState(mockUser);
  const [candidates, setCandidates] = useState(mockCandidates);
  const [election, setElection] = useState(mockElection);
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const candidatesPerPage = 4;

  const userMenu = [
    {
      id: "dashboard",
      icon: Home,
      label: "Dashboard",
      onClick: () => console.log("Navigate to dashboard"),
      path: "/dashboard",
    },
    {
      id: "polling",
      icon: ArrowRightLeft,
      label: "Polling",
      onClick: () => console.log("Navigate to polling"),
      path: "/polling",
    },
    {
      id: "results",
      icon: BarChart3,
      label: "Results",
      onClick: () => console.log("Navigate to results"),
      path: "/results",
    },
    {
      id: "profile",
      icon: User,
      label: "Profile",
      onClick: () => console.log("Navigate to profile"),
      path: "/profile",
    },
    {
      id: "logout",
      icon: LogOut,
      label: "Logout",
      onClick: () => console.log("Logout"),
      path: "/logout",
    },
  ];

  const adminMenu = [
    ...userMenu.slice(0, -2),
    {
      id: "admin",
      icon: Users,
      label: "Admin Panel",
      onClick: () => console.log("Navigate to admin"),
      path: "/admin",
    },
    ...userMenu.slice(-2),
  ];

  const menuToRender = user?.isAdmin ? adminMenu : userMenu;

  // Filter candidates
  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.platform.some((p) =>
        p.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesParty =
      filterParty === "all" || candidate.party === filterParty;

    return matchesSearch && matchesParty;
  });

  // Pagination logic
  const indexOfLastCandidate = currentPage * candidatesPerPage;
  const indexOfFirstCandidate = indexOfLastCandidate - candidatesPerPage;
  const currentCandidates = filteredCandidates.slice(
    indexOfFirstCandidate,
    indexOfLastCandidate
  );
  const totalPages = Math.ceil(filteredCandidates.length / candidatesPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleVote = async (candidateId) => {
    if (user.hasVoted) {
      alert("You have already voted in this election!");
      return;
    }

    setVotingInProgress(true);
    setSelectedCandidate(candidateId);

    // Simulate blockchain transaction delay
    setTimeout(() => {
      // Update candidate vote count
      setCandidates((prev) =>
        prev.map((candidate) =>
          candidate._id === candidateId
            ? { ...candidate, voteCount: candidate.voteCount + 1 }
            : candidate
        )
      );

      // Update user voting status
      setUser((prev) => ({ ...prev, hasVoted: true }));

      // Update total votes
      setElection((prev) => ({ ...prev, totalVotes: prev.totalVotes + 1 }));

      setVotingInProgress(false);
      setSelectedCandidate(null);
      alert("Vote submitted successfully to blockchain!");
    }, 3000);
  };

  const getElectionStatus = () => {
    const now = new Date();
    const start = new Date(election.startDate);
    const end = new Date(election.endDate);

    if (now < start)
      return { status: "upcoming", text: "Upcoming", color: "text-blue-400" };
    if (now > end)
      return { status: "ended", text: "Ended", color: "text-red-400" };
    return { status: "active", text: "Active", color: "text-green-400" };
  };

  const electionStatus = getElectionStatus();

  const CandidateCard = ({ candidate }) => (
    <div className="bg-gray-700/30 border border-gray-600/50 rounded-xl p-6 space-y-4 hover:bg-gray-700/40 transition-all duration-300">
      <div className="flex items-start space-x-4">
        <img
          src={candidate.image}
          alt={candidate.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-gray-600"
        />
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{candidate.name}</h3>
          <p className="text-amber-400 font-medium">{candidate.party}</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-300">
            <span className="flex items-center">
              <Briefcase className="w-4 h-4 mr-1" />
              {candidate.experience}
            </span>
            <span className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              {candidate.age} years
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center text-green-400 font-bold">
            <Award className="w-5 h-5 mr-1" />
            {candidate.voteCount}
          </div>
          <p className="text-xs text-gray-400">votes</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-gray-300 text-sm">{candidate.description}</p>

        <div>
          <p className="text-gray-400 text-xs mb-2">EDUCATION</p>
          <p className="text-white text-sm">{candidate.education}</p>
        </div>

        <div>
          <p className="text-gray-400 text-xs mb-2">KEY PLATFORM POINTS</p>
          <div className="flex flex-wrap gap-2">
            {candidate.platform.map((point, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-amber-600/20 text-amber-300 rounded-full text-xs border border-amber-600/30"
              >
                {point}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-600/50">
        <button
          onClick={() => handleVote(candidate._id)}
          disabled={
            user.hasVoted ||
            electionStatus.status !== "active" ||
            votingInProgress
          }
          className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 ${
            user.hasVoted
              ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
              : electionStatus.status !== "active"
              ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
              : votingInProgress && selectedCandidate === candidate._id
              ? "bg-amber-600/50 text-amber-200 cursor-not-allowed animate-pulse"
              : "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
          }`}
        >
          {user.hasVoted
            ? "Already Voted"
            : electionStatus.status !== "active"
            ? "Voting Closed"
            : votingInProgress && selectedCandidate === candidate._id
            ? "Processing Vote..."
            : "Vote for Candidate"}
        </button>
      </div>
    </div>
  );

  const uniqueParties = [...new Set(candidates.map((c) => c.party))];

  return (
    <div className="min-h-screen w-full bg-gradient-to-tr from-black via-[#1e0b06] to-black text-white flex overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gray-900/50 backdrop-blur-md border-b border-gray-700/60 z-30">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-300 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-100">Electoral</h1>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        menuItems={menuToRender}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-4 pt-20 lg:pt-4">
          {/* Mobile Title */}
          <div className="lg:hidden text-left p-4 mb-2">
            <h1 className="text-2xl font-bold text-gray-100">POLLING</h1>
            <p className="text-xs text-gray-300">
              Wallet: {user?.walletAddress?.slice(0, 6)}...
              {user?.walletAddress?.slice(-4)}
            </p>
            <div className="flex items-center mt-2">
              <span className={`text-xs ${electionStatus.color}`}>
                {electionStatus.text}
              </span>
              {user.hasVoted && (
                <span className="ml-4 text-xs text-green-400 flex items-center">
                  <UserCheck className="w-4 h-4 mr-1" />
                  Voted
                </span>
              )}
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-2">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-100">
                  POLLING STATION
                </h1>
                <p className="text-lg text-gray-300 pt-2 font-medium">
                  {election.title}
                </p>
                <div className="flex items-center space-x-6 mt-3 text-sm">
                  <span className="text-gray-300">
                    Wallet:{" "}
                    <span className="font-mono">
                      {user?.walletAddress?.slice(0, 10)}...
                      {user?.walletAddress?.slice(-6)}
                    </span>
                  </span>
                  <span
                    className={`font-semibold ${electionStatus.color} flex items-center`}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    {electionStatus.text}
                  </span>
                  {user.hasVoted && (
                    <span className="text-green-400 flex items-center font-semibold">
                      <UserCheck className="w-4 h-4 mr-1" />
                      Vote Recorded
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="bg-gray-800/60 border border-gray-700/60 rounded-lg p-4">
                  <div className="text-2xl font-bold text-amber-400">
                    {election.totalVotes.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-300">Total Votes Cast</div>
                  <div className="text-xs text-gray-400 mt-1">
                    of {election.eligibleVoters.toLocaleString()} eligible
                    voters
                  </div>
                </div>
              </div>
            </div>

            {/* Election Info Card */}
            <div className="bg-gray-800/40 backdrop-blur-3xl border border-gray-700/60 rounded-2xl p-4 sm:p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <Calendar className="w-6 h-6 text-amber-400" />
                  <div>
                    <p className="text-white font-medium">Voting Period</p>
                    <p className="text-sm text-gray-300">
                      {new Date(election.startDate).toLocaleDateString()} -{" "}
                      {new Date(election.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="lg:hidden">
                  <div className="text-xl font-bold text-amber-400">
                    {election.totalVotes.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-300">votes cast</div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-gray-800/40 backdrop-blur-3xl border border-gray-700/60 rounded-2xl p-4 sm:p-6 mb-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      placeholder="Search candidates, parties, or platform issues..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-sm"
                    />
                  </div>

                  <div className="relative sm:min-w-[150px]">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <select
                      value={filterParty}
                      onChange={(e) => setFilterParty(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-8 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 focus:outline-none appearance-none text-sm"
                    >
                      <option value="all" className="bg-gray-800 text-gray-100">
                        All Parties
                      </option>
                      {uniqueParties.map((party) => (
                        <option
                          key={party}
                          value={party}
                          className="bg-gray-800 text-gray-100"
                        >
                          {party}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    {filteredCandidates.length} of {candidates.length}{" "}
                    candidates
                  </div>
                </div>
              </div>
            </div>

            {/* Candidates Grid */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              {currentCandidates.map((candidate) => (
                <CandidateCard key={candidate._id} candidate={candidate} />
              ))}
            </div>

            {filteredCandidates.length === 0 && (
              <div className="text-center py-12 px-4">
                <ArrowRightLeft className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No candidates found</p>
                <p className="text-gray-500 text-sm">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}

            {/* Pagination */}
            {currentCandidates.length > 0 && totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-400 order-2 sm:order-1">
                  Showing {indexOfFirstCandidate + 1}–
                  {Math.min(indexOfLastCandidate, filteredCandidates.length)} of{" "}
                  {filteredCandidates.length} candidates
                </p>

                <div className="flex space-x-2 order-1 sm:order-2">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <span className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm min-w-[40px] text-center">
                    {currentPage}
                  </span>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
