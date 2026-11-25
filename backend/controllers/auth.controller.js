const crypto = require('crypto');
const https = require('https');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../utils/email');
const Notification = require('../models/Notification');
const { clearLoginAttempts } = require('../middleware/security.middleware');

const getGoogleClient = () => new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

// Helper: Fetch JSON over HTTPS using built-in Node https module
const fetchJson = (url, headers = {}) =>
  new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (res.statusCode >= 400) {
              return reject(new Error(parsed.error_description || parsed.error || `HTTP ${res.statusCode}`));
            }
            resolve(parsed);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });

// Serialize user cleanly with password expiration metadata
const serializeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.loginOtp;
  delete userObj.loginOtpExpire;
  delete userObj.emailVerificationToken;
  delete userObj.emailVerificationExpire;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpire;

  if (typeof user.getPasswordExpiryDate === 'function') {
    const expiryDate = user.getPasswordExpiryDate();
    userObj.passwordExpiresAt = expiryDate;
    userObj.daysUntilPasswordExpiry = user.getDaysUntilPasswordExpiry();
    userObj.isPasswordExpired = user.isPasswordExpired();
  }
  return userObj;
};

// Helper to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateJWT();
  const refreshToken = user.generateRefreshToken();

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user: serializeUser(user),
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, password, phone, address } = req.body;
    const email = normalizeEmail(req.body.email);
    const cleanPhone = phone && phone.trim() ? phone.trim() : undefined;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.isVerified) {
        existingUser.name = name || existingUser.name;
        if (password) existingUser.password = password;
        if (cleanPhone) existingUser.phone = cleanPhone;
        const otp = existingUser.generateLoginOtp();
        await existingUser.save();

        const { subject, html } = emailTemplates.otpRegistration(existingUser, otp);
        const emailSent = await sendEmail({ to: email, subject, html });
        if (!emailSent) {
          return res.status(500).json({ message: 'Failed to send verification OTP email. Please check email configuration.' });
        }

        return res.status(200).json({
          success: true,
          message: 'An unverified account was found. A fresh 6-digit OTP has been sent to your email.',
          email: existingUser.email,
        });
      }
      return res.status(400).json({ message: 'Email already registered. Please sign in.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: cleanPhone,
      address,
      authProvider: 'local',
      linkedProviders: ['local'],
      isVerified: false,
    });

    const otp = user.generateLoginOtp();
    await user.save({ validateBeforeSave: false });

    const { subject, html } = emailTemplates.otpRegistration(user, otp);
    const emailSent = await sendEmail({ to: email, subject, html });
    if (!emailSent) {
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ message: 'Verification email could not be sent. Please try again later.' });
    }

    await Notification.create({
      user: user._id,
      title: 'Welcome to JanSamadhan!',
      message: 'Your account has been created. Please complete OTP verification.',
      type: 'system',
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user with Email ID & Password
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.password) {
      return res.status(400).json({
        message: `This account was created with ${user.authProvider} sign-in. Please continue with ${user.authProvider} or use "Forgot Password" to set a password.`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated.' });
    }

    if (!user.isVerified && user.authProvider === 'local') {
      return res.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
        message: 'Please verify your email address with OTP before signing in.',
      });
    }

    // Enforce 2-month password expiration for registered password users
    if (user.isPasswordExpired()) {
      return res.status(403).json({
        code: 'PASSWORD_EXPIRED',
        message: 'Your password has expired after 2 months. Please create a new password to continue.',
        passwordUpdateToken: user.generatePasswordExpiredToken(),
        passwordExpiredAt: user.getPasswordExpiryDate(),
      });
    }

    clearLoginAttempts(req);
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Update expired password (after 2-month expiration)
// @route   POST /api/auth/update-expired-password
// @access  Public (requires short-lived passwordUpdateToken)
exports.updateExpiredPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Renewal token and new password are required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Password renewal session expired. Please sign in again.' });
    }

    if (decoded.purpose !== 'password_expired') {
      return res.status(401).json({ message: 'Invalid password renewal token.' });
    }

    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    if (user.password) {
      const isSame = await user.comparePassword(newPassword);
      if (isSame) {
        return res.status(400).json({ message: 'New password must be different from your expired password.' });
      }
    }

    user.password = newPassword;
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Send Login / Verification OTP
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendLoginOtp = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });
    if (!user.isActive) return res.status(403).json({ message: 'Your account has been deactivated.' });

    const otp = user.generateLoginOtp();
    await user.save({ validateBeforeSave: false });

    const template = user.isVerified
      ? emailTemplates.otpLogin(user, otp)
      : emailTemplates.otpRegistration(user, otp);

    const emailSent = await sendEmail({ to: user.email, subject: template.subject, html: template.html });
    if (!emailSent) {
      user.loginOtp = undefined;
      user.loginOtpExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Email could not be sent. Please check email settings.' });
    }

    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Login / Registration OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyLoginOtp = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = (req.body.otp || '').toString().trim();
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      email,
      loginOtp: hashedOtp,
      loginOtpExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP.' });
    if (!user.isActive) return res.status(403).json({ message: 'Your account has been deactivated.' });

    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;
    if (!user.isVerified) user.isVerified = true;

    // If user registered with password and that password has already expired after 2 months, enforce renewal
    if (user.isPasswordExpired()) {
      await user.save({ validateBeforeSave: false });
      return res.status(403).json({
        code: 'PASSWORD_EXPIRED',
        message: 'Your password has expired after 2 months. Please create a new password to continue.',
        passwordUpdateToken: user.generatePasswordExpiredToken(),
        passwordExpiredAt: user.getPasswordExpiryDate(),
      });
    }

    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth login (supports ID token credential or OAuth2 access_token)
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential, access_token: accessToken } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        message: 'Google Sign-In is not configured on the server. Add GOOGLE_CLIENT_ID to backend/.env.',
      });
    }

    if (!credential && !accessToken) {
      return res.status(400).json({ message: 'Google authentication token is required.' });
    }

    let googleId;
    let email;
    let name;
    let picture;

    if (credential) {
      const googleClient = getGoogleClient();
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = normalizeEmail(payload.email);
      name = payload.name;
      picture = payload.picture;
    } else {
      // Verify OAuth2 access token belongs to our GOOGLE_CLIENT_ID and fetch user profile
      const tokenInfo = await fetchJson(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
      );
      if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID && tokenInfo.azp !== process.env.GOOGLE_CLIENT_ID) {
        return res.status(401).json({ message: 'Google token audience mismatch.' });
      }
      const userInfo = await fetchJson('https://www.googleapis.com/oauth2/v3/userinfo', {
        Authorization: `Bearer ${accessToken}`,
      });
      googleId = userInfo.sub;
      email = normalizeEmail(userInfo.email);
      name = userInfo.name;
      picture = userInfo.picture;
    }

    if (!email) {
      return res.status(400).json({ message: 'Google account did not return an email address.' });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        avatar: picture || '',
        authProvider: 'google',
        linkedProviders: ['google'],
        isVerified: true,
        isActive: true,
      });
    } else {
      if (!user.googleId) user.googleId = googleId;
      if (!user.linkedProviders.includes('google')) user.linkedProviders.push('google');
      if (picture && !user.avatar) user.avatar = picture;
      if (!user.isVerified) user.isVerified = true;
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated.' });
    }

    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Google Auth Error:', error.message);
    return res.status(401).json({ message: 'Google authentication failed. Please try again.' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).populate('department', 'name code');
  res.json({ success: true, user: serializeUser(user) });
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email.' });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const { subject, html } = emailTemplates.resetPassword(user, resetToken);
    const emailSent = await sendEmail({ to: user.email, subject, html });
    if (!emailSent) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Password reset email could not be sent. Please try again later.' });
    }

    res.json({ success: true, message: 'Password reset email sent.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    if (!user.isVerified) user.isVerified = true;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. Please sign in.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user.password) {
      return res.status(400).json({ message: 'No local password is set for this account.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const isSame = await user.comparePassword(newPassword);
    if (isSame) {
      return res.status(400).json({ message: 'New password must be different from your current password.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully. Valid for the next 2 months.',
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required.' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
};
