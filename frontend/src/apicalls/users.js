//apicalls for user
import axios from "axios";
import { axiosInstance } from "./index";

//login User
export const LoginUser = async (payload) => {
  console.log(payload);
  try {
    const { data } = await axiosInstance.post("/api/users/login", payload);
    return data;
  } catch (error) {
    return error.response.data;
  }
};

//Register User
export const RegisterUser = async (payload) => {
  try {
    const { data } = await axiosInstance.post("/api/users/register", payload);

    return data;
  } catch (error) {
    return error.response.data;
  }
};

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

//update user verified status
export const UpdateUserVerifiedStatus = async (payload) => {
  try {
    const { data } = await axiosInstance.post(
      "/api/users/update-user-verified-status",
      payload
    );
    return data;
  } catch (error) {
    console.error("UpdateUserVerifiedStatus error:", error);
    throw error;
  }
};

//verify transaction PIN
export const VerifyTransactionPin = async (transactionPin) => {
  try {
    const { data } = await axiosInstance.post(
      "/api/users/verify-transaction-pin",
      { transactionPin }
    );
    return data;
  } catch (error) {
    console.error("VerifyTransactionPin error:", error);
    return error.response?.data || { success: false, message: error.message };
  }
};

//update transaction PIN
export const UpdateTransactionPin = async (payload) => {
  try {
    const { data } = await axiosInstance.post(
      "/api/users/update-transaction-pin",
      payload
    );
    return data;
  } catch (error) {
    console.error("UpdateTransactionPin error:", error);
    return error.response?.data || { success: false, message: error.message };
  }
};

//generate qr code
export const GenerateQRCode = async (customURL = null) => {
  try {
    const params = customURL ? { url: customURL } : {};
    const { data } = await axiosInstance.get("/api/users/generate-qr", {
      params,
    });
    return data;
  } catch (error) {
    console.error(
      "GenerateQRCode error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

//send verification email
export const SendVerificationEmail = async (payload) => {
  try {
    const { data } = await axiosInstance.post(
      "/api/users/send-verification-email",
      payload
    );
    return data;
  } catch (error) {
    console.error("SendVerificationEmail error:", error);
    return error.response.data;
  }
};

//send OTP - PIN reset
export const SendPinResetOTP = async (payload) => {
  try {
    const { data } = await axiosInstance.post(
      "/api/users/send-pin-reset-otp",
      payload
    );
    console.log(data + "yuvvvv");
    return data;
  } catch (error) {
    console.error("SendPinResetOTP error:", error);
    return error.response?.data || { success: false, message: error.message };
  }
};

//send OTP for password reset
export const SendPasswordResetOTP = async (payload) => {
  try {
    const { data } = await axiosInstance.post(
      "/api/users/send-password-reset-otp",
      payload
    );
    return data;
  } catch (error) {
    console.error("SendPasswordResetOTP error:", error);
    return error.response?.data || { success: false, message: error.message };
  }
};

//verify OTP for password reset
export const VerifyPasswordResetOTP = async (payload) => {
  try {
    const { data } = await axiosInstance.post(
      "/api/users/verify-password-reset-otp",
      payload
    );
    return data;
  } catch (error) {
    console.error("VerifyPasswordResetOTP error:", error);
    return error.response?.data || { success: false, message: error.message };
  }
};

//reset password
export const ResetPassword = async (payload) => {
  try {
    const { data } = await axiosInstance.post(
      "/api/users/reset-password",
      payload
    );
    return data;
  } catch (error) {
    console.error("ResetPassword error:", error);
    return error.response?.data || { success: false, message: error.message };
  }
};

//resend OTP for password reset
export const ResendPasswordResetOTP = async (payload) => {
  try {
    const { data } = await axiosInstance.post(
      "/api/users/resend-password-reset-otp",
      payload
    );
    return data;
  } catch (error) {
    console.error("ResendPasswordResetOTP error:", error);
    return error.response?.data || { success: false, message: error.message };
  }
};

//get user profile
export const GetUserProfile = async () => {
  try {
    const { data } = await axiosInstance.get("/api/users/profile");
    return data;
  } catch (error) {
    return error.response.data;
  }
};

//update user profile
export const UpdateUserProfile = async (payload) => {
  try {
    const { data } = await axiosInstance.put("/api/users/profile", payload);
    return data;
  } catch (error) {
    return error.response.data;
  }
};

//cast vote
export const CastVote = async (payload) => {
  try {
    const { data } = await axiosInstance.post("/api/users/vote", payload);
    return data;
  } catch (error) {
    console.error("CastVote error:", error);
    return error.response?.data || { success: false, message: error.message };
  }
};

//get voting status
export const GetVotingStatus = async () => {
  try {
    const { data } = await axiosInstance.get("/api/users/voting-status");
    return data;
  } catch (error) {
    console.error("GetVotingStatus error:", error);
    return error.response?.data || { success: false, message: error.message };
  }
};

//verify user account
export const VerifyUserAccount = async (payload) => {
  try {
    const { data } = await axiosInstance.post("/api/users/verify", payload);
    return data;
  } catch (error) {
    console.error("VerifyUserAccount error:", error);
    return error.response?.data || { success: false, message: error.message };
  }
};

//change password
export const ChangePassword = async (payload) => {
  try {
    const { data } = await axiosInstance.post(
      "/api/users/change-password",
      payload
    );
    return data;
  } catch (error) {
    console.error("ChangePassword error:", error);
    return error.response?.data || { success: false, message: error.message };
  }
};

//get user statistics
export const GetUserStats = async () => {
  try {
    const { data } = await axiosInstance.get("/api/users/stats");
    return data;
  } catch (error) {
    console.error("GetUserStats error:", error);
    return error.response?.data || { success: false, message: error.message };
  }
};
