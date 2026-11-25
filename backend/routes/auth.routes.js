const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const {
  registerValidation,
  loginValidation,
  passwordResetValidation,
  expiredPasswordValidation,
  changePasswordValidation,
  validateRequest,
} = require('../middleware/validation.middleware');
const {
  register,
  login,
  updateExpiredPassword,
  googleAuth,
  getMe,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken,
  sendLoginOtp,
  verifyLoginOtp,
} = require('../controllers/auth.controller');

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/update-expired-password', expiredPasswordValidation, validateRequest, updateExpiredPassword);
router.post('/send-otp', sendLoginOtp);
router.post('/verify-otp', verifyLoginOtp);
router.post('/google', googleAuth);
router.post('/refresh-token', refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', passwordResetValidation, validateRequest, resetPassword);

// Protected
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePasswordValidation, validateRequest, changePassword);

module.exports = router;
