import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Home,
  ArrowRightLeft,
  User,
  LogOut,
  X,
  BanknoteArrowDown,
  Menu,
  Users,
  Check,
  Clock,
  TrendingUp,
  BarChart3,
  ChevronDown,
  Trophy,
  Vote,
  Shield,
  Eye,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

const MobileCandidateCard = ({
  candidate,
  totalVotes,
  isWinner,
  formatDate,
  getPercentage,
  rank,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`bg-gray-800/60 backdrop-blur-xl border ${
        isWinner ? "border-amber-500/60" : "border-gray-700/60"
      } rounded-xl p-4 mb-4 ${isWinner ? "ring-2 ring-amber-500/30" : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 ${
              isWinner ? "bg-amber-600/30" : "bg-blue-600/20"
            } rounded-full flex items-center justify-center`}
          >
            {isWinner ? (
              <Trophy className="w-5 h-5 text-amber-400" />
            ) : (
              <User className="w-5 h-5 text-blue-400" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-semibold text-white text-sm">
                {candidate.name}
              </p>
              {isWinner && (
                <span className="px-2 py-1 bg-amber-600 text-white text-xs font-bold rounded-full">
                  WINNER
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Rank #{rank} • {candidate.party}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`font-bold text-lg ${
              isWinner ? "text-amber-400" : "text-blue-400"
            }`}
          >
            {candidate.votes.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">
            {getPercentage(candidate.votes, totalVotes)}%
          </p>
        </div>
      </div>

      <div className="mb-3">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              isWinner ? "bg-amber-500" : "bg-blue-500"
            }`}
            style={{ width: `${getPercentage(candidate.votes, totalVotes)}%` }}
          ></div>
        </div>
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-gray-400 hover:text-white transition-colors"
      >
        <span className="text-xs">
          ID: {candidate.candidateId?.slice(0, 8)}...
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-700/60">
          <p className="text-xs text-gray-400 mb-2">
            <strong>Constituency:</strong> {candidate.constituency}
          </p>
          <p className="text-xs text-gray-400 mb-2">
            <strong>Blockchain Hash:</strong>
          </p>
          <p className="text-xs text-gray-400 mb-3 font-mono break-all">
            {candidate.blockchainHash}
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Last Updated:</span>
            <span className="text-gray-300">
              {formatDate(candidate.lastUpdated)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ResultsPage() {
  const dispatch = useDispatch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("results");
  const [activeTabContent, setActiveTabContent] = useState("live");
  const [electionData, setElectionData] = useState({
    election: {
      name: "General Elections 2024",
      status: "completed",
      totalVotes: 1247893,
      totalCandidates: 12,
      startDate: "2024-03-15T09:00:00Z",
      endDate: "2024-03-15T18:00:00Z",
      blockchainNetwork: "Ethereum",
    },
    candidates: [
      {
        candidateId: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
        name: "Sarah Mitchell",
        party: "Democratic Alliance",
        constituency: "North District",
        votes: 456789,
        blockchainHash:
          "0x9f8e7d6c5b4a39281706f5e4d3c2b1a0987654321fedcba0987654321abcdef12",
        lastUpdated: "2024-03-15T18:00:00Z",
      },
      {
        candidateId: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234",
        name: "Michael Rodriguez",
        party: "Progressive Party",
        constituency: "South District",
        votes: 398765,
        blockchainHash:
          "0x8e7d6c5b4a39281706f5e4d3c2b1a09876543210edcba0987654321abcdef123",
        lastUpdated: "2024-03-15T18:00:00Z",
      },
      {
        candidateId: "0x3c4d5e6f7890abcdef1234567890abcdef123456",
        name: "Jennifer Chen",
        party: "Independent",
        constituency: "East District",
        votes: 267834,
        blockchainHash:
          "0x7d6c5b4a39281706f5e4d3c2b1a09876543210dcba0987654321abcdef12345",
        lastUpdated: "2024-03-15T18:00:00Z",
      },
      {
        candidateId: "0x4d5e6f7890abcdef1234567890abcdef12345678",
        name: "Robert Thompson",
        party: "Conservative Union",
        constituency: "West District",
        votes: 124505,
        blockchainHash:
          "0x6c5b4a39281706f5e4d3c2b1a09876543210cba0987654321abcdef123456",
        lastUpdated: "2024-03-15T18:00:00Z",
      },
    ],
  });
  const [isLoading, setIsLoading] = useState(false);
  // Mock user data since useSelector might not be available
  const user = { isAdmin: false };

  const userMenu = [
    {
      id: "dashboard",
      icon: Home,
      label: "Dashboard",
      onClick: () => navigate("/dashboard"),
      path: "/dashboard",
    },
    {
      id: "transactions",
      icon: ArrowRightLeft,
      label: "Polls",
      onClick: () => navigate("/polling"),
      path: "/polling",
    },
    {
      id: "requests",
      icon: BanknoteArrowDown,
      label: "Results",
      onClick: () => navigate("/results"),
      path: "/results",
    },
    {
      id: "logout",
      icon: LogOut,
      label: "Logout",
      onClick: () => {
        localStorage.removeItem("token");
        navigate("/logout");
      },
      path: "/logout",
    },
  ];

  const adminMenu = [
    {
      id: "dashboard",
      icon: Home,
      label: "Dashboard",
      onClick: () => navigate("/dashboard"),
      path: "/dashboard",
    },
    {
      id: "users",
      icon: Users,
      label: "Admin",
      onClick: () => navigate("/admin"),
      path: "/admin",
    },
    {
      id: "transactions",
      icon: ArrowRightLeft,
      label: "Polling",
      onClick: () => navigate("/polling"),
      path: "/polling",
    },
    {
      id: "requests",
      icon: BanknoteArrowDown,
      label: "Results",
      onClick: () => navigate("/results"),
      path: "/results",
    },
    {
      id: "logout",
      icon: LogOut,
      label: "Logout",
      onClick: () => {
        localStorage.removeItem("token");
        navigate("/logout");
      },
      path: "/logout",
    },
  ];

  const menuToRender = user?.isAdmin ? adminMenu : userMenu;

  const getStatusColor = (status) => {
    switch (status) {
      case "live":
        return "bg-green-900/30 text-green-400 border-green-400/30";
      case "completed":
        return "bg-blue-900/30 text-blue-400 border-blue-400/30";
      case "upcoming":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-400/30";
      default:
        return "bg-gray-900/30 text-gray-400 border-gray-400/30";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "live":
        return <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4" />;
      case "completed":
        return <Check className="w-3 h-3 lg:w-4 lg:h-4" />;
      case "upcoming":
        return <Clock className="w-3 h-3 lg:w-4 lg:h-4" />;
      default:
        return <Clock className="w-3 h-3 lg:w-4 lg:h-4" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getPercentage = (votes, totalVotes) => {
    return totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(2) : 0;
  };

  // Sort candidates by votes in descending order
  const sortedCandidates = [...electionData.candidates].sort(
    (a, b) => b.votes - a.votes
  );
  const winner = sortedCandidates[0];

  const currentCandidates =
    activeTabContent === "live" || activeTabContent === "final"
      ? sortedCandidates
      : electionData.candidates;

  return (
    <div className="min-h-dvh bg-gradient-to-tr from-black via-[#1e0b06] to-black text-white flex">
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

      <div className="flex-1 flex flex-col min-h-dvh">
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-gray-900/50 backdrop-blur-md border-b border-gray-700/60 z-30">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-100">VoteChain</h1>
            </div>
            <div className="w-10" />
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-5xl mx-auto mt-18 lg:mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-100">
                  ELECTION RESULTS
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  {electionData.election.name} •
                  <span className="ml-1 capitalize">
                    {electionData.election.status}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-3xl border border-gray-700/60 rounded-xl lg:rounded-2xl overflow-hidden mb-6">
              <div className="flex border-b border-gray-700/60">
                <button
                  onClick={() => setActiveTabContent("final")}
                  className={`flex-1 px-4 lg:px-6 py-3 lg:py-4 text-sm font-medium transition-colors flex items-center justify-center ${
                    activeTabContent === "final"
                      ? "bg-amber-600 text-white"
                      : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <span className="xs:inline">Final Results</span>
                </button>
              </div>

              <div className="block lg:hidden">
                {currentCandidates.length > 0 ? (
                  <div className="p-4">
                    {currentCandidates.map((candidate, index) => (
                      <MobileCandidateCard
                        key={candidate.candidateId}
                        candidate={candidate}
                        totalVotes={electionData.election.totalVotes}
                        isWinner={candidate.candidateId === winner.candidateId}
                        formatDate={formatDate}
                        getPercentage={getPercentage}
                        rank={index + 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">
                      No results available
                    </p>
                    <p className="text-gray-500 text-sm px-4">
                      Election results will appear here once voting begins
                    </p>
                  </div>
                )}
              </div>

              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/60">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                        Party
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                        Votes
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/60">
                    {currentCandidates.map((candidate, index) => {
                      const isWinner =
                        candidate.candidateId === winner.candidateId;
                      return (
                        <tr
                          key={candidate.candidateId}
                          className={`hover:bg-gray-700/30 transition-colors ${
                            isWinner ? "bg-amber-900/10" : ""
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center">
                              <span
                                className={`font-bold text-lg ${
                                  isWinner ? "text-amber-400" : "text-gray-300"
                                }`}
                              >
                                #{index + 1}
                              </span>
                              {isWinner && (
                                <Trophy className="w-5 h-5 text-amber-400 ml-2" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`w-8 h-8 ${
                                  isWinner
                                    ? "bg-amber-600/30"
                                    : "bg-blue-600/20"
                                } rounded-full flex items-center justify-center mr-3`}
                              >
                                <User
                                  className={`w-4 h-4 ${
                                    isWinner
                                      ? "text-amber-400"
                                      : "text-blue-400"
                                  }`}
                                />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-sm font-medium text-white">
                                    {candidate.name}
                                  </div>
                                  {isWinner && (
                                    <span className="px-2 py-1 bg-amber-600 text-white text-xs font-bold rounded-full">
                                      WINNER
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {candidate.constituency}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {candidate.party}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-white">
                              {candidate.votes.toLocaleString()}
                            </div>
                            <div className="w-20 bg-gray-700 rounded-full h-1 mt-1">
                              <div
                                className={`h-1 rounded-full ${
                                  isWinner ? "bg-amber-500" : "bg-blue-500"
                                }`}
                                style={{
                                  width: `${getPercentage(
                                    candidate.votes,
                                    electionData.election.totalVotes
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                            <span
                              className={
                                isWinner ? "text-amber-400" : "text-gray-300"
                              }
                            >
                              {getPercentage(
                                candidate.votes,
                                electionData.election.totalVotes
                              )}
                              %
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {currentCandidates.length === 0 && (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">
                      No results available
                    </p>
                    <p className="text-gray-500 text-sm">
                      Election results will appear here once voting begins
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="bg-gray-800/40 backdrop-blur-3xl border border-gray-700/60 rounded-xl lg:rounded-2xl p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm text-gray-400">
                      Total Votes
                    </p>
                    <p className="text-xl lg:text-2xl font-bold text-amber-400">
                      {electionData.election.totalVotes.toLocaleString()}
                    </p>
                  </div>
                  <Vote className="w-6 h-6 lg:w-8 lg:h-8 text-amber-400 opacity-60" />
                </div>
              </div>

              <div className="bg-gray-800/40 backdrop-blur-3xl border border-gray-700/60 rounded-xl lg:rounded-2xl p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm text-gray-400">
                      Candidates
                    </p>
                    <p className="text-xl lg:text-2xl font-bold text-blue-400">
                      {electionData.election.totalCandidates}
                    </p>
                  </div>
                  <Users className="w-6 h-6 lg:w-8 lg:h-8 text-blue-400 opacity-60" />
                </div>
              </div>

              <div className="bg-gray-800/40 backdrop-blur-3xl border border-gray-700/60 rounded-xl lg:rounded-2xl p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm text-gray-400">Turnout</p>
                    <p className="text-xl lg:text-2xl font-bold text-green-400">
                      87.3%
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-green-400 opacity-60" />
                </div>
              </div>

              <div className="bg-gray-800/40 backdrop-blur-3xl border border-gray-700/60 rounded-xl lg:rounded-2xl p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm text-gray-400">Network</p>
                    <p className="text-lg lg:text-xl font-bold text-purple-400">
                      {electionData.election.blockchainNetwork}
                    </p>
                  </div>
                  <Shield className="w-6 h-6 lg:w-8 lg:h-8 text-purple-400 opacity-60" />
                </div>
              </div>
            </div>

            {winner && (
              <div className="mt-6 bg-gradient-to-r from-amber-900/20 to-amber-800/20 backdrop-blur-3xl border border-amber-500/30 rounded-xl lg:rounded-2xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-amber-600/30 rounded-full flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-400 mb-1">
                      Election Winner
                    </h3>
                    <p className="text-xl font-bold text-white">
                      {winner.name}
                    </p>
                    <p className="text-sm text-gray-300">
                      {winner.party} • {winner.constituency}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-2xl font-bold text-amber-400">
                        {winner.votes.toLocaleString()} votes
                      </span>
                      <span className="text-lg text-amber-300">
                        (
                        {getPercentage(
                          winner.votes,
                          electionData.election.totalVotes
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <div className="border-t border-gray-800 p-4 lg:p-6 mt-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-400 mb-4 md:mb-0">
              <span className="hidden md:block">
                © 2025 VoteChain Technologies Pvt. Ltd. All rights reserved.
              </span>
              <span className="md:hidden text-center">
                © 2025 VoteChain Technologies Pvt. Ltd. <br /> All rights
                reserved.
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <span>Secured by Blockchain • Developed with ❤️ by</span>
                <a
                  className="underline text-white"
                  href="https://linkedin.com/in/yuvrajkpatil"
                >
                  Your Team.
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
