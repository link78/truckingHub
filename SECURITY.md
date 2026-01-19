# Security Best Practices for TruckingHub

This document outlines security measures implemented and recommended practices for TruckingHub.

## Implemented Security Features

### 1. Authentication & Authorization

#### JWT (JSON Web Tokens)
- ✅ Secure token-based authentication
- ✅ Tokens expire after 7 days (configurable)
- ✅ Tokens stored in localStorage (client) and verified on server
- ⚠️ **Production**: Consider using httpOnly cookies for enhanced security

#### Password Security
- ✅ Passwords hashed using bcryptjs with salt rounds
- ✅ Passwords never stored in plain text
- ✅ Password field excluded from query results by default
- ✅ Minimum password length: 6 characters
- ⚠️ **Recommendation**: Increase to 8+ characters in production

#### Role-Based Access Control (RBAC)
- ✅ Five distinct user roles: trucker, dispatcher, shipper, service_provider, admin
- ✅ Protected routes require authentication
- ✅ Authorization middleware checks user role
- ✅ Certain endpoints restricted to specific roles

### 2. API Security

#### Input Validation
- ✅ Mongoose schema validation for all models
- ✅ Required fields enforced
- ✅ Data type validation
- ✅ Email format validation
- ⚠️ **TODO**: Add input sanitization to prevent XSS attacks

#### CORS (Cross-Origin Resource Sharing)
- ✅ CORS enabled for frontend communication
- ✅ Origin restricted to frontend URL
- ⚠️ **Production**: Ensure FRONTEND_URL is set correctly

#### Error Handling
- ✅ Custom error handler middleware
- ✅ Sensitive information not exposed in error messages
- ✅ Mongoose errors formatted for client consumption

### 3. Database Security

#### MongoDB Security
- ✅ Connection string stored in environment variables
- ✅ Mongoose prevents NoSQL injection by default
- ⚠️ **Production**: Enable MongoDB authentication
- ⚠️ **Production**: Use connection string with credentials

## Recommended Security Enhancements

### 1. Environment Variables

**Current Implementation:**
```
JWT_SECRET=your_jwt_secret_key_here
```

**Production Best Practice:**
- Generate a strong random secret (minimum 32 characters)
- Never commit .env to version control
- Use different secrets for different environments
- Rotate secrets periodically

```bash
# Generate strong secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. HTTPS/SSL

**Required for Production:**
- Use HTTPS for all communications
- Obtain SSL certificate (Let's Encrypt, commercial CA)
- Redirect HTTP to HTTPS
- Enable HSTS (HTTP Strict Transport Security)

```javascript
// Add to server.js for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 3. Rate Limiting

**Prevent Brute Force Attacks:**

Install express-rate-limit:
```bash
npm install express-rate-limit
```

Implement:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/auth/login', authLimiter);
```

### 4. Input Sanitization

**Prevent XSS Attacks:**

Install sanitization packages:
```bash
npm install express-mongo-sanitize helmet xss-clean
```

Implement:
```javascript
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());
```

### 5. Password Strength

**Enforce Strong Passwords:**

Install validator:
```bash
npm install validator
```

Update User model:
```javascript
const validator = require('validator');

userSchema.path('password').validate(function(value) {
  return validator.isStrongPassword(value, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  });
}, 'Password must be at least 8 characters and contain uppercase, lowercase, number, and symbol');
```

### 6. Session Management

**HttpOnly Cookies:**

Update auth utils to use cookies instead of localStorage:
```javascript
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true, // Prevents XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict' // CSRF protection
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }
  });
};
```

### 7. File Upload Security

**If implementing file uploads:**

Install multer:
```bash
npm install multer
```

Implement with restrictions:
```javascript
const multer = require('multer');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

### 8. Logging and Monitoring

**Track Security Events:**

Install winston:
```bash
npm install winston
```

Implement logging:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log failed login attempts
app.post('/api/auth/login', async (req, res) => {
  // ... login logic
  if (!isMatch) {
    logger.warn(`Failed login attempt for ${email} from ${req.ip}`);
    // ... error response
  }
});
```

### 9. Dependency Security

**Keep Dependencies Updated:**

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update packages
npm update

# Check for outdated packages
npm outdated
```

**Use Snyk or Dependabot:**
- Enable GitHub Dependabot for automatic security updates
- Run regular security scans

### 10. Data Encryption

**Encrypt Sensitive Data:**

For sensitive fields like SSN, credit card info:
```bash
npm install crypto-js
```

```javascript
const CryptoJS = require('crypto-js');

const encryptData = (data) => {
  return CryptoJS.AES.encrypt(data, process.env.ENCRYPTION_KEY).toString();
};

const decryptData = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

## Security Checklist for Production

- [ ] Generate strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Use helmet for security headers
- [ ] Enable MongoDB authentication
- [ ] Use httpOnly cookies for tokens
- [ ] Implement password strength requirements
- [ ] Add logging and monitoring
- [ ] Run npm audit and fix vulnerabilities
- [ ] Enable CORS only for trusted origins
- [ ] Remove console.log statements
- [ ] Set NODE_ENV=production
- [ ] Use environment variables for all secrets
- [ ] Implement proper error handling (no stack traces to client)
- [ ] Regular security audits
- [ ] Database backups
- [ ] Implement 2FA (Two-Factor Authentication) for admin users
- [ ] Add CAPTCHA for registration/login
- [ ] Implement account lockout after failed attempts
- [ ] Regular penetration testing

## Common Vulnerabilities to Prevent

### SQL/NoSQL Injection
- ✅ Mongoose sanitizes queries by default
- ✅ Use parameterized queries
- ⚠️ Validate and sanitize all user input

### Cross-Site Scripting (XSS)
- ⚠️ Sanitize user input before storing
- ⚠️ Escape output when rendering
- ✅ Use React (automatically escapes by default)

### Cross-Site Request Forgery (CSRF)
- ⚠️ Use CSRF tokens for state-changing operations
- ✅ sameSite cookie attribute

### Authentication Bypass
- ✅ Verify tokens on every protected route
- ✅ Role-based access control
- ⚠️ Implement account lockout

### Information Disclosure
- ✅ Don't expose sensitive error details
- ✅ Passwords excluded from queries
- ⚠️ Remove stack traces in production

## Incident Response Plan

If a security breach occurs:

1. **Immediate Actions:**
   - Identify and isolate affected systems
   - Revoke compromised credentials
   - Rotate JWT secrets
   - Reset all user passwords

2. **Investigation:**
   - Review logs
   - Identify attack vector
   - Assess damage and data exposure

3. **Recovery:**
   - Patch vulnerabilities
   - Restore from backups if necessary
   - Update security measures

4. **Communication:**
   - Notify affected users
   - Report to authorities if required
   - Document incident and lessons learned

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

## Contact

For security concerns or to report vulnerabilities:
- Email: security@truckinghub.com
- Use responsible disclosure
- Do not publicly disclose vulnerabilities until patched
