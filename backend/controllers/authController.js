const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { query } = require('../config/database');

/**
 * Authentication Controller
 * Handles all authentication-related operations
 */

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (userId, email, role) => {
  return jwt.sign(
    {
      user_id: userId,
      email,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRY || '7d',
    }
  );
};

/**
 * 1. User Registration (Signup)
 * POST /api/auth/signup
 */
const signup = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      company_name,
      city,
      state,
      country,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email.toLowerCase());
    if (existingUser) {
      return next(new AppError('Email already registered', 409));
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verification_token = crypto.randomBytes(32).toString('hex');
    const verification_token_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password_hash,
      phone,
      role,
      company_name,
      city,
      state,
      country,
    });

    // Set verification token
    await User.setVerificationToken(
      newUser.id,
      verification_token,
      verification_token_expiry
    );

    // Generate JWT token
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    // Remove sensitive data from response
    const { password_hash: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. User Login
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email.toLowerCase());
    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);

    // Remove sensitive data from response
    const {
      password_hash: _,
      verification_token: __,
      verification_token_expiry: ___,
      ...userWithoutSensitiveData
    } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutSensitiveData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Token Verification
 * GET /api/auth/verify
 */
const verifyToken = async (req, res, next) => {
  try {
    // User is already attached to req by authMiddleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        average_rating: user.average_rating,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Logout
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const token = req.token;
    const userId = req.user.id;

    // Decode token to get expiry
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    // Add token to blacklist
    await query(
      'INSERT INTO token_blacklist (token, user_id, expires_at) VALUES ($1, $2, $3)',
      [token, userId, expiresAt]
    );

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Refresh Token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    // User is already authenticated by authMiddleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Generate new token
    const newToken = generateToken(user.id, user.email, user.role);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Get Current User Profile
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Update Profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Update user profile
    const updatedUser = await User.updateProfile(userId, updates);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Change Password
 * POST /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password hash
    const user = await User.findByEmail(req.user.email);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!isPasswordValid) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.updatePassword(userId, newPasswordHash);

    // Blacklist current token
    const token = req.token;
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    await query(
      'INSERT INTO token_blacklist (token, user_id, expires_at) VALUES ($1, $2, $3)',
      [token, userId, expiresAt]
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. Request Email Verification
 * POST /api/auth/send-verification-email
 */
const sendVerificationEmail = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.verified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified',
      });
    }

    // Generate verification token
    const verification_token = crypto.randomBytes(32).toString('hex');
    const verification_token_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Set verification token
    await User.setVerificationToken(
      userId,
      verification_token,
      verification_token_expiry
    );

    // In production, send email with verification link
    // const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verification_token}`;
    // await sendEmail(user.email, 'Email Verification', verificationLink);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      // Include token in response for testing (remove in production)
      verification_token: process.env.NODE_ENV === 'development' ? verification_token : undefined,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. Verify Email
 * POST /api/auth/verify-email
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    // Verify email with token
    const user = await User.verifyEmail(token);

    if (!user) {
      return next(
        new AppError('Invalid or expired verification token', 400)
      );
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        verified: user.verified,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  verifyToken,
  logout,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  sendVerificationEmail,
  verifyEmail,
};
