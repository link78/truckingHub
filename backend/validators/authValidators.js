const Joi = require('joi');

/**
 * Joi Validation Schemas for Authentication Endpoints
 */

// Signup validation schema
const signupSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 255 characters',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 128 characters',
  }),
  phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/).allow('', null).messages({
    'string.pattern.base': 'Please provide a valid phone number',
  }),
  role: Joi.string()
    .valid('trucker', 'dispatcher', 'shipper', 'service_provider')
    .required()
    .messages({
      'any.only': 'Role must be one of: trucker, dispatcher, shipper, service_provider',
      'string.empty': 'Role is required',
    }),
  company_name: Joi.string().max(255).allow('', null),
  city: Joi.string().max(100).allow('', null),
  state: Joi.string().max(100).allow('', null),
  country: Joi.string().max(100).allow('', null),
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

// Update profile validation schema
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(255).messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 255 characters',
  }),
  phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/).allow('', null).messages({
    'string.pattern.base': 'Please provide a valid phone number',
  }),
  company_name: Joi.string().max(255).allow('', null),
  city: Joi.string().max(100).allow('', null),
  state: Joi.string().max(100).allow('', null),
  country: Joi.string().max(100).allow('', null),
  bio: Joi.string().max(1000).allow('', null).messages({
    'string.max': 'Bio cannot exceed 1000 characters',
  }),
  profile_picture_url: Joi.string().uri().allow('', null).messages({
    'string.uri': 'Please provide a valid URL for profile picture',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

// Change password validation schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
  }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 8 characters long',
    'string.max': 'New password cannot exceed 128 characters',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'string.empty': 'Password confirmation is required',
  }),
});

// Verify email validation schema
const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Verification token is required',
  }),
});

module.exports = {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  verifyEmailSchema,
};
