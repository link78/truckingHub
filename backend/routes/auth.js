const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  loginLimiter,
  signupLimiter,
  passwordChangeLimiter,
  emailVerificationLimiter,
  apiLimiter,
} = require('../middleware/rateLimiter');
const {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  verifyEmailSchema,
} = require('../validators/authValidators');

/**
 * Authentication Routes
 * All routes related to user authentication and profile management
 */

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/signup',
  signupLimiter,
  validate(signupSchema),
  asyncHandler(authController.signup)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(authController.login)
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email with token
 * @access  Public
 */
router.post(
  '/verify-email',
  emailVerificationLimiter,
  validate(verifyEmailSchema),
  asyncHandler(authController.verifyEmail)
);

// Protected routes (authentication required)

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token and get user info
 * @access  Protected
 */
router.get(
  '/verify',
  apiLimiter,
  authMiddleware,
  asyncHandler(authController.verifyToken)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (blacklist token)
 * @access  Protected
 */
router.post(
  '/logout',
  apiLimiter,
  authMiddleware,
  asyncHandler(authController.logout)
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Protected
 */
router.post(
  '/refresh',
  apiLimiter,
  authMiddleware,
  asyncHandler(authController.refreshToken)
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Protected
 */
router.get(
  '/me',
  apiLimiter,
  authMiddleware,
  asyncHandler(authController.getCurrentUser)
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Protected
 */
router.put(
  '/profile',
  apiLimiter,
  authMiddleware,
  validate(updateProfileSchema),
  asyncHandler(authController.updateProfile)
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Protected
 */
router.post(
  '/change-password',
  passwordChangeLimiter,
  authMiddleware,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

/**
 * @route   POST /api/auth/send-verification-email
 * @desc    Send email verification link
 * @access  Protected
 */
router.post(
  '/send-verification-email',
  emailVerificationLimiter,
  authMiddleware,
  asyncHandler(authController.sendVerificationEmail)
);

module.exports = router;
