// apicalls/candidates.js
import { axiosInstance } from "./index";

// Get all candidates
export const GetAllCandidates = async () => {
  try {
    const response = await axiosInstance.post(
      "/api/candidates/get-all-candidates"
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Update candidate verification status
export const UpdateCandidateVerifiedStatus = async (payload) => {
  try {
    const response = await axiosInstance.post(
      "/api/candidates/update-candidate-verified-status",
      payload
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get candidate by ID
export const GetCandidateById = async (id) => {
  try {
    const response = await axiosInstance.post(
      "/api/candidates/get-candidate-by-id",
      {
        candidateId: id,
      }
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Register new candidate
export const RegisterCandidate = async (payload) => {
  try {
    const response = await axiosInstance.post(
      "/api/candidates/register",
      payload
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Update candidate profile
export const UpdateCandidateProfile = async (payload) => {
  try {
    const response = await axiosInstance.post(
      "/api/candidates/update-profile",
      payload
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Delete candidate
export const DeleteCandidate = async (candidateId) => {
  try {
    const response = await axiosInstance.post("/api/candidates/delete", {
      candidateId,
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get candidates by election
export const GetCandidatesByElection = async (electionId) => {
  try {
    const response = await axiosInstance.post(
      "/api/candidates/get-by-election",
      { electionId }
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get candidates by party
export const GetCandidatesByParty = async (party) => {
  try {
    const response = await axiosInstance.post("/api/candidates/get-by-party", {
      party,
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
