const jwt = require('jsonwebtoken');

// Convert JWT_EXPIRE to milliseconds for cookie
// Expects format like '7d' from environment variable
const getExpiryMilliseconds = (jwtExpire) => {
  const match = jwtExpire.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000; // days
    case 'h': return value * 60 * 60 * 1000;      // hours
    case 'm': return value * 60 * 1000;            // minutes
    case 's': return value * 1000;                 // seconds
    default: return 7 * 24 * 60 * 60 * 1000;       // default 7 days
  }
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Send token in response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const expiryMs = getExpiryMilliseconds(process.env.JWT_EXPIRE || '7d');

  const options = {
    expires: new Date(Date.now() + expiryMs),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rating: user.rating,
      company: user.company,
    },
  });
};

module.exports = { generateToken, sendTokenResponse };
