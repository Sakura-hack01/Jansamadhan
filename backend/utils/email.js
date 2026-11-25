const nodemailer = require('nodemailer');

let testAccount = null;

const createTransporter = async () => {
  const isPlaceholderPass = !process.env.EMAIL_PASS ||
    process.env.EMAIL_PASS.includes('your_') ||
    process.env.EMAIL_PASS.trim() === '';

  if (process.env.EMAIL_USER && !isPlaceholderPass) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Fallback for development using Ethereal
  if (!testAccount) {
    testAccount = await nodemailer.createTestAccount();
    console.log('📧 Ethereal Test Email Account created:', testAccount.user);
  }

  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: `"JanSamadhan" <${process.env.EMAIL_USER || testAccount?.user || 'noreply@jansamadhan.gov.in'}>`,
      to,
      subject,
      html,
      text,
    });
    
    if (!process.env.EMAIL_USER) {
      console.log('📧 Email sent! Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('❌ Email send error:', error);
    // Don't throw error to prevent app crash if email fails
    return null;
  }
};

// Email Templates
const emailTemplates = {
  complaintRegistered: (complaint, user) => ({
    subject: `Complaint Registered - ${complaint.complaintNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏛️ JanSamadhan</h1>
          <p style="color: #bfdbfe; margin: 5px 0 0;">Government Grievance Portal</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1e3a5f;">Complaint Registered Successfully</h2>
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>Your complaint has been registered with JanSamadhan portal.</p>
          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0;"><strong>Complaint Number:</strong> <span style="color: #2563eb; font-size: 18px;">${complaint.complaintNumber}</span></p>
            <p style="margin: 5px 0 0;"><strong>Title:</strong> ${complaint.title}</p>
            <p style="margin: 5px 0 0;"><strong>Department:</strong> ${complaint.department?.name || 'N/A'}</p>
            <p style="margin: 5px 0 0;"><strong>Status:</strong> <span style="background: #fef3c7; padding: 2px 8px; border-radius: 4px; color: #92400e;">Pending</span></p>
            <p style="margin: 5px 0 0;"><strong>Expected Resolution:</strong> Within 30 days</p>
          </div>
          <p>You can track your complaint status by logging in to the JanSamadhan portal.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/track/${complaint.complaintNumber}" 
               style="background: #2563eb; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Track Complaint
            </a>
          </div>
          <p style="color: #6b7280; font-size: 12px;">This is an automated email. Please do not reply to this email.</p>
        </div>
      </div>
    `
  }),

  complaintAssigned: (complaint, officer) => ({
    subject: `Complaint ${complaint.complaintNumber} - Action Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🏛️ JanSamadhan</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1e3a5f;">New Complaint Assigned to You</h2>
          <p>Dear <strong>${officer.name}</strong>,</p>
          <p>A new complaint has been assigned to you for resolution.</p>
          <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
            <p><strong>Complaint Number:</strong> ${complaint.complaintNumber}</p>
            <p><strong>Title:</strong> ${complaint.title}</p>
            <p><strong>Priority:</strong> ${complaint.priority.toUpperCase()}</p>
            <p><strong>Due Date:</strong> ${new Date(complaint.dueDate).toLocaleDateString('en-IN')}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.CLIENT_URL}/officer/complaint/${complaint._id}" 
               style="background: #16a34a; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none;">
              View Complaint
            </a>
          </div>
        </div>
      </div>
    `
  }),

  statusUpdate: (complaint, user, newStatus, note) => ({
    subject: `Complaint ${complaint.complaintNumber} - Status Updated`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🏛️ JanSamadhan</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2>Complaint Status Updated</h2>
          <p>Dear ${user.name},</p>
          <p>Your complaint <strong>${complaint.complaintNumber}</strong> status has been updated.</p>
          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>New Status:</strong> ${newStatus.toUpperCase().replace('_', ' ')}</p>
            ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
          </div>
          <a href="${process.env.CLIENT_URL}/track/${complaint.complaintNumber}" 
             style="background: #2563eb; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block;">
            View Details
          </a>
        </div>
      </div>
    `
  }),

  verifyEmail: (user, token) => ({
    subject: 'Verify Your Email - JanSamadhan',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white;">🏛️ JanSamadhan</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2>Verify Your Email Address</h2>
          <p>Hello ${user.name}, welcome to JanSamadhan!</p>
          <p>Please verify your email address to complete registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/verify-email/${token}" 
               style="background: #2563eb; color: white; padding: 15px 40px; border-radius: 6px; text-decoration: none; font-size: 16px;">
              Verify Email
            </a>
          </div>
          <p style="color: #6b7280;">This link expires in 24 hours.</p>
        </div>
      </div>
    `
  }),

  resetPassword: (user, token) => ({
    subject: 'Reset Your Password - JanSamadhan',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white;">🏛️ JanSamadhan</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2>Reset Your Password</h2>
          <p>Hello ${user.name},</p>
          <p>Click the button below to reset your password. This link expires in 30 minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/reset-password/${token}" 
               style="background: #dc2626; color: white; padding: 15px 40px; border-radius: 6px; text-decoration: none;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `
  }),

  otpRegistration: (user, otp) => ({
    subject: `Verify Your Registration - JanSamadhan`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <div style="background: #000080; border-top: 4px solid #FF9933; border-bottom: 4px solid #138808; padding: 25px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏛️ JanSamadhan</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Government of India</p>
        </div>
        <div style="background: white; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none;">
          <h2 style="color: #0f172a; text-align: center; margin-top: 0;">Account Verification</h2>
          <p style="color: #475569; font-size: 15px;">Dear <strong>${user.name}</strong>,</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">Thank you for registering on the JanSamadhan portal. Please use the following 6-digit verification code to complete your account creation process:</p>
          
          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
            <p style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #000080; margin: 0;">${otp}</p>
          </div>
          
          <p style="text-align: center; color: #ef4444; font-size: 13px;"><strong>Note:</strong> This verification code is valid for exactly <strong>5 minutes</strong>.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="color: #64748b; font-size: 12px; text-align: center; line-height: 1.5; margin: 0;">
            If you did not initiate this registration, please ignore this email.<br/>
            JanSamadhan - Public Grievance Redressal System 🇮🇳
          </p>
        </div>
      </div>
    `
  }),

  otpLogin: (user, otp) => ({
    subject: `Your JanSamadhan Login OTP`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <div style="background: #000080; border-top: 4px solid #FF9933; border-bottom: 4px solid #138808; padding: 25px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏛️ JanSamadhan</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Government of India</p>
        </div>
        <div style="background: white; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none;">
          <h2 style="color: #0f172a; text-align: center; margin-top: 0;">One-Time Login Verification</h2>
          <p style="color: #475569; font-size: 15px;">Dear <strong>${user.name}</strong>,</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">Use the following 6-digit One-Time Password (OTP) to sign in to your JanSamadhan account:</p>
          
          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
            <p style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #000080; margin: 0;">${otp}</p>
          </div>
          
          <p style="text-align: center; color: #ef4444; font-size: 13px;"><strong>Security Notice:</strong> This OTP expires in <strong>5 minutes</strong>. Never share it with anyone.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="color: #64748b; font-size: 12px; text-align: center; line-height: 1.5; margin: 0;">
            If you did not request this OTP, please secure your account immediately.<br/>
            JanSamadhan - Public Grievance Redressal System 🇮🇳
          </p>
        </div>
      </div>
    `
  })
};

module.exports = { sendEmail, emailTemplates };
