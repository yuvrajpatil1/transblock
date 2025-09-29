const router = require("express").Router();
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//mail template
const getVerificationEmailTemplate = (userName, userEmail) => {
  return {
    subject: "Account Verified - Welcome to Transacto!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Transacto</h1>
        </div>

        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;"> Account Verified Successfully!</h2>

          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Dear ${userName},
          </p>

          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Great news! Your Transacto account has been successfully verified by our security team.
            You can now access all features of your digital wallet.
          </p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin: 0 0 10px 0;">What's Next?</h3>
            <ul style="color: #666; margin: 0; padding-left: 20px;">
              <li>Log in to your account</li>
              <li>Set up your wallet preferences</li>
              <li>Start making secure transactions</li>
              <li>Explore our premium features</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${"https://transacto.onrender.com"}/login"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 12px 30px;
                      text-decoration: none;
                      border-radius: 6px;
                      font-weight: bold;
                      display: inline-block;">
              Login to Your Account
            </a>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #1976d2; margin: 0; font-size: 14px;">
              <strong>Security Tip:</strong> Never share your login credentials with anyone.
              Transacto will never ask for your password via email.
            </p>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>

          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            The Transacto Team
          </p>
        </div>

        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© 2025 Transacto. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    `,
  };
};

//register User
router.post("/register", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      return res.send({
        success: false,
        message: "User already exists!",
      });
    }

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      req.body.password = hashedPassword;
    }

    const newUser = new User(req.body);
    await newUser.save();

    res.send({
      message: "User Created Successfully!",
      data: null,
      success: true,
    });
  } catch (error) {
    res.send({
      message: error.message,
      success: false,
    });
  }
});

//login User
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found!",
      });
    }

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).send({
        success: false,
        message: "Invalid password!",
      });
    }

    if (!user.isVerified) {
      return res.status(403).send({
        success: false,
        message: "User is not verified yet or has been suspended",
        code: "USER_NOT_VERIFIED",
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.send({
      message: "User logged in successfully!",
      data: token,
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      success: false,
    });
  }
});

//get User Info
router.post("/get-user-info", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    console.log(req.userId + "Yuv");
    user.password = "";
    user.transactionPin = "";

    res.send({
      message: "User info fetched successfully",
      data: user,
      success: true,
    });
  } catch (error) {
    res.send({
      message: error.message,
      success: false,
    });
  }
});

//get all users
router.get("/get-all-users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    const sanitizedUsers = users.map((user) => {
      const userObj = user.toObject();
      userObj.password = "";
      userObj.transactionPin = "";
      return userObj;
    });

    res.send({
      message: "Users fetched successfully",
      data: sanitizedUsers,
      success: true,
    });
  } catch (error) {
    res.send({
      message: error.message,
      success: false,
    });
  }
});

router.post("/send-verification-email", authMiddleware, async (req, res) => {
  try {
    const { userId, userName, userEmail } = req.body;

    if (!userId || !userEmail) {
      return res.status(400).send({
        success: false,
        message: "Missing required fields: userId and userEmail",
      });
    }

    const emailTemplate = getVerificationEmailTemplate(
      userName || "User",
      userEmail
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    };

    await transporter.sendMail(mailOptions);

    res.send({
      success: true,
      message: "Verification email sent successfully",
      data: null,
    });
  } catch (error) {
    console.error("Send verification email error:", error);
    res.status(500).send({
      success: false,
      message: "Failed to send verification email",
      error: error.message,
    });
  }
});

//update user verified status
router.post(
  "/update-user-verified-status",
  authMiddleware,
  async (req, res) => {
    try {
      const { selectedUser, isVerified } = req.body;

      const updatedUser = await User.findByIdAndUpdate(
        selectedUser,
        { isVerified: isVerified },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).send({
          success: false,
          message: "User not found",
        });
      }

      if (isVerified) {
        try {
          const emailTemplate = getVerificationEmailTemplate(
            updatedUser.firstName || updatedUser.name || "User",
            updatedUser.email
          );

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: updatedUser.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
          };

          await transporter.sendMail(mailOptions);
          console.log(`Verification email sent to ${updatedUser.email}`);
        } catch (emailError) {
          console.error("Error sending verification email:", emailError);
        }
      }

      res.send({
        data: updatedUser,
        message: isVerified
          ? "User verified successfully and notification email sent"
          : "User verification status updated successfully",
        success: true,
      });
    } catch (error) {
      console.error("Update request status error:", error);
      res.status(500).send({
        message: error.message,
        success: false,
      });
    }
  }
);

const otpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOTPEmailTemplate = (userName, otp) => {
  return {
    subject: "Reset Transaction PIN - OTP Verification",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Transacto</h1>
        </div>

        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Reset Transaction PIN</h2>

          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Dear ${userName},
          </p>

          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You have requested to reset your transaction PIN. Please use the following OTP to verify your identity:
          </p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px dashed #667eea;">
            <h1 style="color: #667eea; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 8px;">${otp}</h1>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Important:</strong> This OTP is valid for 10 minutes only. Do not share this code with anyone.
            </p>
          </div>

          <p style="color: #666; font-size: 14px;">
            If you didn't request this PIN reset, please ignore this email or contact our support team immediately.
          </p>

          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            The Transacto Team
          </p>
        </div>

        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© 2025 Transacto. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    `,
  };
};

// //send OTP for PIN reset
// router.post("/send-pin-reset-otp", async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).send({
//         success: false,
//         message: "Email is required",
//       });
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).send({
//         success: false,
//         message: "Please enter a valid email address",
//       });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).send({
//         success: false,
//         message: "No account found with this email address",
//       });
//     }

//     if (!user.isVerified) {
//       return res.status(403).send({
//         success: false,
//         message: "Account not verified. Please contact support.",
//       });
//     }

//     const otp = generateOTP();
//     const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
//     console.log(otp);

//     otpStore.set(email, {
//       otp,
//       expiry: otpExpiry,
//       userId: user._id,
//       attempts: 0,
//     });

//     const emailTemplate = getOTPEmailTemplate(
//       user.firstName || user.name || "User",
//       otp
//     );

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: emailTemplate.subject,
//       html: emailTemplate.html,
//     };

//     await transporter.sendMail(mailOptions);

//     res.send({
//       success: true,
//       message: "OTP sent successfully to your email",
//       data: {
//         email: email,
//         expiresIn: "10 minutes",
//       },
//     });
//   } catch (error) {
//     console.error("Send PIN reset OTP error:", error);
//     console.log(res);
//     res.status(500).send({
//       success: false,
//       message: "Failed to send OTP. Please try again.",
//     });
//   }
// });

//send OTP for password reset
router.post("/send-password-reset-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({
        success: false,
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "No account found with this email address",
      });
    }

    if (!user.isVerified) {
      return res.status(403).send({
        success: false,
        message: "Account not verified. Please contact support.",
      });
    }

    if (user.authProvider === "google") {
      return res.status(400).send({
        success: false,
        message: "Please use Google to sign in to your account",
        code: "OAUTH_USER",
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    passwordResetOtpStore.set(email, {
      otp,
      expiry: otpExpiry,
      userId: user._id,
      attempts: 0,
    });

    const emailTemplate = getPasswordResetOTPEmailTemplate(
      user.firstName || user.name || "User",
      otp
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    };

    await transporter.sendMail(mailOptions);

    res.send({
      success: true,
      message: "Password reset OTP sent successfully to your email",
      data: {
        email: email,
        expiresIn: "15 minutes",
      },
    });
  } catch (error) {
    console.error("Send password reset OTP error:", error);
    res.status(500).send({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
});

//verify OTP for password reset
router.post("/verify-password-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).send({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const otpData = passwordResetOtpStore.get(email);

    if (!otpData) {
      return res.status(400).send({
        success: false,
        message: "OTP not found or expired. Please request a new OTP.",
      });
    }

    if (new Date() > otpData.expiry) {
      passwordResetOtpStore.delete(email);
      return res.status(400).send({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    if (otpData.attempts >= 5) {
      passwordResetOtpStore.delete(email);
      return res.status(429).send({
        success: false,
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    if (otpData.otp !== otp) {
      otpData.attempts += 1;
      passwordResetOtpStore.set(email, otpData);

      return res.status(400).send({
        success: false,
        message: `Invalid OTP. ${5 - otpData.attempts} attempts remaining.`,
      });
    }

    otpData.verified = true;
    passwordResetOtpStore.set(email, otpData);

    res.send({
      success: true,
      message: "OTP verified successfully",
      data: {
        email: email,
        verified: true,
      },
    });
  } catch (error) {
    console.error("Verify password reset OTP error:", error);
    res.status(500).send({
      success: false,
      message: "OTP verification failed. Please try again.",
    });
  }
});

//rset password (after OTP verification)
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).send({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).send({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const otpData = passwordResetOtpStore.get(email);

    if (!otpData || !otpData.verified) {
      return res.status(400).send({
        success: false,
        message: "OTP not verified. Please verify OTP first.",
      });
    }

    if (otpData.otp !== otp || new Date() > otpData.expiry) {
      passwordResetOtpStore.delete(email);
      return res.status(400).send({
        success: false,
        message: "Invalid or expired session. Please start over.",
      });
    }

    const user = await User.findById(otpData.userId);
    if (!user) {
      passwordResetOtpStore.delete(email);
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(otpData.userId, {
      password: hashedNewPassword,
    });

    passwordResetOtpStore.delete(email);

    try {
      const confirmationEmailTemplate = {
        subject: "Password Reset Successfully",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Transacto</h1>
            </div>

            <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Password Reset Successful</h2>

              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Dear ${user.firstName || user.name || "User"},
              </p>

              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Your account password has been successfully reset. You can now log in with your new password.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${"https://transacto.onrender.com"}/login"
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white;
                          padding: 12px 30px;
                          text-decoration: none;
                          border-radius: 6px;
                          font-weight: bold;
                          display: inline-block;">
                  Login to Your Account
                </a>
              </div>

              <div style="background: #f8d7da; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <p style="color: #721c24; margin: 0; font-size: 14px;">
                  <strong>Security Alert:</strong> If you didn't make this change, please contact our support team immediately.
                </p>
              </div>

              <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                The Transacto Team
              </p>
            </div>

            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>© 2025 Transacto. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: confirmationEmailTemplate.subject,
        html: confirmationEmailTemplate.html,
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
    }

    res.send({
      success: true,
      message: "Password reset successfully",
      data: {
        email: email,
        updated: true,
      },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).send({
      success: false,
      message: "Failed to reset password. Please try again.",
    });
  }
});

//resend OTP for password reset
router.post("/resend-password-reset-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "No account found with this email address",
      });
    }

    if (user.authProvider === "google") {
      return res.status(400).send({
        success: false,
        message: "Please use Google to sign in to your account",
        code: "OAUTH_USER",
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    passwordResetOtpStore.set(email, {
      otp,
      expiry: otpExpiry,
      userId: user._id,
      attempts: 0,
    });

    const emailTemplate = getPasswordResetOTPEmailTemplate(
      user.firstName || user.name || "User",
      otp
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    };

    await transporter.sendMail(mailOptions);

    res.send({
      success: true,
      message: "New password reset OTP sent successfully to your email",
      data: {
        email: email,
        expiresIn: "15 minutes",
      },
    });
  } catch (error) {
    console.error("Resend password reset OTP error:", error);
    res.status(500).send({
      success: false,
      message: "Failed to resend OTP. Please try again.",
    });
  }
});

// Get user profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate("votedFor", "name party candidateId")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching profile",
    });
  }
});

// Update user profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const allowedUpdates = ["firstName", "lastName", "walletAddress"];
    const updates = {};

    // Only allow specific fields to be updated
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Check if wallet address is already used by another user
    if (updates.walletAddress) {
      const existingWallet = await User.findOne({
        walletAddress: updates.walletAddress,
        _id: { $ne: req.userId },
      });

      if (existingWallet) {
        return res.status(400).json({
          success: false,
          message: "Wallet address already registered",
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating profile",
    });
  }
});

// Cast vote
router.post("/vote", authMiddleware, async (req, res) => {
  try {
    const { error, value } = voteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { candidateId, transactionHash } = value;

    // Check if user has already voted
    if (req.user.hasVoted) {
      return res.status(400).json({
        success: false,
        message: "You have already voted",
      });
    }

    // Find candidate
    const candidate = await Candidate.findOne({
      candidateId,
      isActive: true,
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found or inactive",
      });
    }

    // Update user vote status
    await User.findByIdAndUpdate(req.userId, {
      hasVoted: true,
      votedFor: candidate._id,
      transactionHash,
    });

    // Increment candidate vote count
    await candidate.incrementVote();

    res.json({
      success: true,
      message: "Vote cast successfully",
      data: {
        candidateId: candidate.candidateId,
        candidateName: candidate.name,
        transactionHash,
      },
    });
  } catch (error) {
    console.error("Vote casting error:", error);
    res.status(500).json({
      success: false,
      message: "Server error casting vote",
    });
  }
});

// Get voting status
router.get("/voting-status", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate("votedFor", "name party candidateId")
      .select("hasVoted votedFor transactionHash");

    res.json({
      success: true,
      votingStatus: {
        hasVoted: user.hasVoted,
        votedFor: user.votedFor,
        transactionHash: user.transactionHash,
      },
    });
  } catch (error) {
    console.error("Voting status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching voting status",
    });
  }
});

// Verify user account (email verification)
router.post("/verify", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token required",
      });
    }

    const user = await User.findOne({
      verificationToken: token,
      isVerified: false,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({
      success: true,
      message: "Account verified successfully",
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during verification",
    });
  }
});

// Change password
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(req.userId);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({
      success: false,
      message: "Server error changing password",
    });
  }
});

// Get user statistics
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).populate(
      "votedFor",
      "name party candidateId voteCount"
    );

    const totalUsers = await User.countDocuments({ isActive: true });
    const totalVotes = await User.countDocuments({ hasVoted: true });
    const totalCandidates = await Candidate.countDocuments({ isActive: true });

    res.json({
      success: true,
      stats: {
        user: {
          hasVoted: user.hasVoted,
          votedFor: user.votedFor,
          registrationDate: user.createdAt,
          lastLogin: user.lastLogin,
        },
        system: {
          totalUsers,
          totalVotes,
          totalCandidates,
          voterTurnout:
            totalUsers > 0 ? ((totalVotes / totalUsers) * 100).toFixed(2) : 0,
        },
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching statistics",
    });
  }
});

module.exports = router;
