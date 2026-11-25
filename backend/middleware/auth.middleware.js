const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Token is invalid. User not found.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Your account has been deactivated. Contact admin.' });
    }

    const allowedWhenExpired = ['/change-password', '/logout', '/me'];
    const isExempt = allowedWhenExpired.some((p) => req.originalUrl.includes(`/api/auth${p}`));
    if (!isExempt && user.isPasswordExpired()) {
      return res.status(403).json({
        message: 'Your password has expired after 2 months. Please update your password to continue.',
        code: 'PASSWORD_EXPIRED',
        passwordExpiredAt: user.getPasswordExpiryDate(),
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

const adminOnly = authorize('admin');
const officerOrAdmin = authorize('officer', 'admin');

module.exports = { protect, authorize, adminOnly, officerOrAdmin };
