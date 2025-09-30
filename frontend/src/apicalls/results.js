// apicalls/results.js
import { axiosInstance } from "./index";

// Get all elections
export const GetAllElections = async () => {
  try {
    const response = await axiosInstance.post(
      "/api/elections/get-all-elections"
    );
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch elections",
    };
  }
};

// Get specific election by ID
export const GetElectionById = async (electionId) => {
  try {
    const response = await axiosInstance.post(
      "/api/elections/get-election-by-id",
      {
        electionId,
      }
    );
    return response.data;
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch election details",
    };
  }
};

// Get election results
export const GetElectionResults = async (electionId) => {
  try {
    const response = await axiosInstance.post(
      "/api/elections/get-election-results",
      {
        electionId,
      }
    );
    return response.data;
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch election results",
    };
  }
};

// Get live election results (real-time)
export const GetLiveElectionResults = async (electionId) => {
  try {
    const response = await axiosInstance.post(
      "/api/elections/get-live-results",
      {
        electionId,
      }
    );
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch live results",
    };
  }
};

// Get election statistics
export const GetElectionStatistics = async (electionId) => {
  try {
    const response = await axiosInstance.post(
      "/api/elections/get-election-statistics",
      {
        electionId,
      }
    );
    return response.data;
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch election statistics",
    };
  }
};

// Verify blockchain transaction
export const VerifyBlockchainTransaction = async (
  transactionHash,
  candidateId
) => {
  try {
    const response = await axiosInstance.post(
      "/api/blockchain/verify-transaction",
      {
        transactionHash,
        candidateId,
      }
    );
    return response.data;
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to verify blockchain transaction",
    };
  }
};

// Get candidate details
export const GetCandidateDetails = async (candidateId) => {
  try {
    const response = await axiosInstance.post(
      "/api/candidates/get-candidate-details",
      {
        candidateId,
      }
    );
    return response.data;
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch candidate details",
    };
  }
};

// Get all candidates for an election
export const GetElectionCandidates = async (electionId) => {
  try {
    const response = await axiosInstance.post(
      "/api/candidates/get-election-candidates",
      {
        electionId,
      }
    );
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch candidates",
    };
  }
};

// Get voter turnout data
export const GetVoterTurnout = async (electionId) => {
  try {
    const response = await axiosInstance.post(
      "/api/elections/get-voter-turnout",
      {
        electionId,
      }
    );
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch voter turnout",
    };
  }
};

// Get constituency-wise results
export const GetConstituencyResults = async (electionId, constituencyId) => {
  try {
    const response = await axiosInstance.post(
      "/api/elections/get-constituency-results",
      {
        electionId,
        constituencyId,
      }
    );
    return response.data;
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch constituency results",
    };
  }
};

// Export election results (for admin)
export const ExportElectionResults = async (electionId, format = "pdf") => {
  try {
    const response = await axiosInstance.post(
      "/api/elections/export-results",
      {
        electionId,
        format,
      },
      {
        responseType: "blob", // Important for file downloads
      }
    );
    return {
      success: true,
      data: response.data,
      message: "Results exported successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to export results",
    };
  }
};

// Get blockchain network status
export const GetBlockchainNetworkStatus = async () => {
  try {
    const response = await axiosInstance.get("/api/blockchain/network-status");
    return response.data;
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch network status",
    };
  }
};
