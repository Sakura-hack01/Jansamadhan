const { validationResult, body } = require('express-validator');

const emailNormalizeOptions = {
  all_lowercase: true,
  gmail_lowercase: true,
  gmail_remove_dots: false,
  gmail_remove_subaddress: false,
  outlookdotcom_remove_subaddress: false,
  yahoo_remove_subaddress: false,
  icloud_remove_subaddress: false,
};

const passwordPolicy = (field = 'password') =>
  body(field)
    .isString().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .matches(/(?=.*[A-Z])/).withMessage('Password must contain at least one uppercase letter')
    .matches(/(?=.*\d)/).withMessage('Password must contain at least one number')
    .matches(/(?=.*[!@#$%^&*])/).withMessage('Password must contain at least one special character (!@#$%^&*)');

exports.isStrongPassword = (pwd) =>
  typeof pwd === 'string' &&
  pwd.length >= 6 &&
  /[A-Z]/.test(pwd) &&
  /\d/.test(pwd) &&
  /[!@#$%^&*]/.test(pwd);

exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

exports.registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(emailNormalizeOptions),
  passwordPolicy('password'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\+?\d{1,4}\s?\d{6,14}$/)
    .withMessage('Please enter a valid mobile number with country code'),
];

exports.loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(emailNormalizeOptions),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.passwordResetValidation = [
  passwordPolicy('password'),
];

exports.expiredPasswordValidation = [
  body('token').notEmpty().withMessage('Password renewal token is required'),
  passwordPolicy('newPassword'),
];

exports.changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  passwordPolicy('newPassword'),
];
