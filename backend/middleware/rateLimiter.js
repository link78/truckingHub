const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware
 * Protects authentication endpoints from brute force attacks
 */

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for login attempts
 * 5 requests per 15 minutes
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Strict rate limiter for signup attempts
 * 3 requests per hour
 */
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per window
  message: {
    success: false,
    message: 'Too many accounts created from this IP, please try again after an hour.',
  },
});

/**
 * Rate limiter for password change attempts
 * 3 requests per 15 minutes
 */
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: {
    success: false,
    message: 'Too many password change attempts, please try again after 15 minutes.',
  },
});

/**
 * Rate limiter for email verification requests
 * 5 requests per hour
 */
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many verification email requests, please try again after an hour.',
  },
});

module.exports = {
  apiLimiter,
  loginLimiter,
  signupLimiter,
  passwordChangeLimiter,
  emailVerificationLimiter,
};
