const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const { query } = require('../config/database');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to access this resource.', 401)
      );
    }

    // Check if token is blacklisted
    const blacklistCheck = await query(
      'SELECT id FROM token_blacklist WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP',
      [token]
    );

    if (blacklistCheck.rows.length > 0) {
      return next(new AppError('Token has been invalidated. Please log in again.', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const userResult = await query(
      'SELECT id, name, email, role, verified FROM users WHERE id = $1',
      [decoded.user_id]
    );

    if (!userResult.rows[0]) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    // Attach user to request
    req.user = userResult.rows[0];
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    return next(error);
  }
};

/**
 * Authorization Middleware
 * Checks if user has required role(s)
 * @param {...string} roles - Allowed roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be logged in to access this resource.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }

    next();
  };
};

/**
 * Optional Authentication Middleware
 * Attaches user to request if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user
    const userResult = await query(
      'SELECT id, name, email, role, verified FROM users WHERE id = $1',
      [decoded.user_id]
    );

    if (userResult.rows[0]) {
      req.user = userResult.rows[0];
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

module.exports = {
  authMiddleware,
  requireRole,
  optionalAuth,
};
