const jwt = require('jsonwebtoken');

// Time unit constants (in milliseconds)
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const DEFAULT_EXPIRY_DAYS = 7;

// Convert JWT_EXPIRE to milliseconds for cookie
// Expects format like '7d' from environment variable
const getExpiryMilliseconds = (jwtExpire) => {
  const match = jwtExpire.match(/^(\d+)([dhms])$/);
  if (!match) return DEFAULT_EXPIRY_DAYS * MS_PER_DAY;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'd': return value * MS_PER_DAY;
    case 'h': return value * MS_PER_HOUR;
    case 'm': return value * MS_PER_MINUTE;
    case 's': return value * MS_PER_SECOND;
    default: return DEFAULT_EXPIRY_DAYS * MS_PER_DAY;
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
