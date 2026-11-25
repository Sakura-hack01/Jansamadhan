const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Adds exactly 2 calendar months to a date, clamping to the last day of the target month
 * (e.g., Dec 31 + 2 months -> Feb 28/29 instead of overflowing into March).
 */
function addTwoMonths(fromDate = new Date()) {
  const date = new Date(fromDate);
  const originalDay = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + 2);
  const lastDayOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  return date;
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  hasPassword: {
    type: Boolean,
    default: false
  },
  passwordChangedAt: {
    type: Date
  },
  passwordExpiresAt: {
    type: Date
  },
  phone: {
    type: String,
    trim: true,
    set: (v) => (v === '' || v === null ? undefined : v),
    match: [/^\+?\d{1,4}\s?\d{6,14}$/, 'Please enter a valid phone number with country code']
  },
  role: {
    type: String,
    enum: ['user', 'officer', 'admin'],
    default: 'user'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  avatar: {
    type: String,
    default: ''
  },
  googleId: {
    type: String
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  linkedProviders: {
    type: [String],
    enum: ['local', 'google'],
    default: []
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  aadhaarNumber: {
    type: String,
    select: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  loginOtp: String,
  loginOtpExpire: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  fcmToken: String, // For push notifications
}, {
  timestamps: true
});

// Hash password before saving and set 2-month password expiry
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
    const now = new Date();
    this.hasPassword = true;
    this.passwordChangedAt = now;
    this.passwordExpiresAt = addTwoMonths(now);
    if (!this.linkedProviders.includes('local')) {
      this.linkedProviders.push('local');
    }
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get password expiration date (2 months from creation/last change)
userSchema.methods.getPasswordExpiryDate = function() {
  if (!this.hasPassword && this.authProvider !== 'local' && !this.passwordChangedAt && !this.passwordExpiresAt) {
    return null;
  }
  if (this.passwordExpiresAt) return new Date(this.passwordExpiresAt);
  const baseDate = this.passwordChangedAt || this.createdAt || new Date();
  return addTwoMonths(baseDate);
};

// Check whether a registered user's password has expired (2-month span)
userSchema.methods.isPasswordExpired = function() {
  const expiryDate = this.getPasswordExpiryDate();
  if (!expiryDate) return false;
  return Date.now() >= expiryDate.getTime();
};

// Days remaining before password expires
userSchema.methods.getDaysUntilPasswordExpiry = function() {
  const expiryDate = this.getPasswordExpiryDate();
  if (!expiryDate) return null;
  const diffMs = expiryDate.getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

// Generate short-lived token solely to renew an expired password
userSchema.methods.generatePasswordExpiredToken = function() {
  return jwt.sign(
    { id: this._id, purpose: 'password_expired' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Generate JWT
userSchema.methods.generateJWT = function() {
  return jwt.sign(
    { id: this._id, role: this.role, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

// Generate email verification token
userSchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  return token;
};

// Generate Login OTP
userSchema.methods.generateLoginOtp = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Hash the OTP before saving for security
  const crypto = require('crypto');
  this.loginOtp = crypto.createHash('sha256').update(otp).digest('hex');
  this.loginOtpExpire = Date.now() + 5 * 60 * 1000; // 5 minutes validity
  return otp;
};

module.exports = mongoose.model('User', userSchema);
