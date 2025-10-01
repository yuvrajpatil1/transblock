// server/utils/emailService.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, userName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Account Verified - Blockchain Voting System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Verified Successfully!</h2>
        <p>Dear ${userName},</p>
        <p>Your account has been verified by our admin team.</p>
        <p>You can now log in and participate in elections.</p>
        <a href="${process.env.CLIENT_URL}/login" 
           style="background: #4CAF50; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Login Now
        </a>
        <p>Best regards,<br>Blockchain Voting Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendVoteConfirmation = async (
  email,
  userName,
  candidateName,
  transactionHash
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Vote Confirmation - Blockchain Voting System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Vote Cast Successfully!</h2>
        <p>Dear ${userName},</p>
        <p>Your vote for <strong>${candidateName}</strong> has been recorded on the blockchain.</p>
        <p><strong>Transaction Hash:</strong> ${transactionHash}</p>
        <p>You can verify your vote anytime using this transaction hash.</p>
        <p>Thank you for participating in this election.</p>
        <p>Best regards,<br>Blockchain Voting Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendVoteConfirmation,
};
