// apicalls/admin.js
import { axiosInstance } from "./index";

//get user info
export const GetUserInfo = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      // "https://transacto-backend.onrender.com/api/users/get-user-info",
      "http://localhost:5000/api/users/get-user-info",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    console.log(data);

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

//get all users
export const GetAllUsers = async () => {
  try {
    const { data } = await axiosInstance.get("/api/users/get-all-users");
    return data;
  } catch (error) {
    return error.response.data;
  }
};

// Update user status (activate/deactivate)
export const UpdateUserStatus = async (userId, isActive) => {
  try {
    const response = await axiosInstance.put(
      `/api/admin/users/${userId}/status`,
      {
        isActive,
      }
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Verify user
export const VerifyUser = async (userId) => {
  try {
    const response = await axiosInstance.put(
      `/api/admin/users/${userId}/verify`
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get admin dashboard statistics
export const GetAdminDashboard = async () => {
  try {
    const response = await axiosInstance.get("/api/admin/dashboard");
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Reset user vote
export const ResetUserVote = async (userId, reason) => {
  try {
    const response = await axiosInstance.put(
      `/api/admin/users/${userId}/reset-vote`,
      {
        reason,
      }
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Export user data
export const ExportUserData = async (format = "json") => {
  try {
    const response = await axiosInstance.get(`/api/admin/export/users`, {
      params: { format },
      responseType: format === "csv" ? "blob" : "json",
    });
    return { success: true, data: response.data };
  } catch (error) {
    return error.response.data;
  }
};

// Get system health
export const GetSystemHealth = async () => {
  try {
    const response = await axiosInstance.get("/api/admin/system/health");
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get voting analytics
export const GetVotingAnalytics = async () => {
  try {
    const response = await axiosInstance.get("/api/admin/analytics/voting");
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Create admin user
export const CreateAdminUser = async (adminData) => {
  try {
    const response = await axiosInstance.post(
      "/api/admin/users/create-admin",
      adminData
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get audit logs
export const GetAuditLogs = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/api/admin/audit-logs", {
      params,
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Emergency clear all votes
export const EmergencyClearVotes = async (confirmationCode) => {
  try {
    const response = await axiosInstance.post(
      "/api/admin/emergency/clear-votes",
      {
        confirmationCode,
      }
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Bulk operations
export const BulkVerifyUsers = async (userIds) => {
  try {
    const response = await axiosInstance.put("/api/admin/users/bulk-verify", {
      userIds,
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const BulkUpdateUserStatus = async (userIds, isActive) => {
  try {
    const response = await axiosInstance.put("/api/admin/users/bulk-status", {
      userIds,
      isActive,
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
