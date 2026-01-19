# TruckingHub Backend API

## Overview
Backend API for TruckingHub MVP - Authentication and Load Marketplace Platform.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: Joi

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

3. Create PostgreSQL database:
```bash
createdb truckinghub
```

4. Run database schema:
```bash
psql -U postgres -d truckinghub -f config/schema.sql
```

5. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### 1. User Registration
**POST** `/api/auth/signup`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+1-555-0101",
  "role": "trucker",
  "company_name": "Smith Trucking",
  "city": "Los Angeles",
  "state": "CA",
  "country": "USA"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "John Smith",
    "email": "john@example.com",
    "role": "trucker",
    "verified": false
  }
}
```

#### 2. User Login
**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "John Smith",
    "email": "john@example.com",
    "role": "trucker",
    "verified": true,
    "average_rating": 4.5
  }
}
```

#### 3. Verify Token
**GET** `/api/auth/verify`

Verify JWT token validity and get user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "id": "uuid",
    "name": "John Smith",
    "email": "john@example.com",
    "role": "trucker",
    "verified": true
  }
}
```

#### 4. Logout
**POST** `/api/auth/logout`

Logout user and blacklist token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### 5. Refresh Token
**POST** `/api/auth/refresh`

Generate a new JWT token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 6. Get Current User Profile
**GET** `/api/auth/me`

Get authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1-555-0101",
    "role": "trucker",
    "company_name": "Smith Trucking",
    "city": "Los Angeles",
    "state": "CA",
    "country": "USA",
    "verified": true,
    "average_rating": 4.5,
    "total_ratings": 10
  }
}
```

#### 7. Update Profile
**PUT** `/api/auth/profile`

Update user profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John A. Smith",
  "phone": "+1-555-9999",
  "bio": "Experienced trucker with 10+ years",
  "city": "San Francisco",
  "state": "CA"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "name": "John A. Smith",
    "email": "john@example.com",
    "phone": "+1-555-9999",
    "bio": "Experienced trucker with 10+ years"
  }
}
```

#### 8. Change Password
**POST** `/api/auth/change-password`

Change user password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully. Please log in again."
}
```

#### 9. Send Verification Email
**POST** `/api/auth/send-verification-email`

Request email verification link.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

#### 10. Verify Email
**POST** `/api/auth/verify-email`

Verify user email with token.

**Request Body:**
```json
{
  "token": "verification_token_here"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "user": {
    "id": "uuid",
    "name": "John Smith",
    "email": "john@example.com",
    "verified": true
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Something went wrong!"
}
```

## Security Features

- ✅ **Password Hashing**: Bcrypt with 10 salt rounds
- ✅ **JWT Authentication**: HS256 algorithm, 7-day expiry
- ✅ **Input Validation**: Joi schemas for all endpoints
- ✅ **SQL Injection Prevention**: Parameterized queries
- ✅ **Token Blacklisting**: Logout invalidates tokens
- ✅ **CORS Protection**: Configurable allowed origins
- ✅ **Error Handling**: No sensitive data in error messages

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment (development/production) | development |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | truckinghub |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRY` | Token expiration time | 7d |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |

## Database Schema

### Users Table
```sql
- id (UUID, Primary Key)
- name (VARCHAR 255)
- email (VARCHAR 255, UNIQUE)
- password_hash (VARCHAR 255)
- phone (VARCHAR 50)
- role (ENUM: trucker, dispatcher, shipper, service_provider)
- company_name (VARCHAR 255)
- city (VARCHAR 100)
- state (VARCHAR 100)
- country (VARCHAR 100)
- bio (TEXT)
- profile_picture_url (TEXT)
- verified (BOOLEAN)
- verification_token (VARCHAR 255)
- verification_token_expiry (TIMESTAMP)
- average_rating (DECIMAL 3,2)
- total_ratings (INTEGER)
- last_login (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Token Blacklist Table
```sql
- id (UUID, Primary Key)
- token (TEXT)
- user_id (UUID, Foreign Key)
- blacklisted_at (TIMESTAMP)
- expires_at (TIMESTAMP)
```

## Project Structure

```
backend/
├── config/
│   ├── database.js          # PostgreSQL connection
│   └── schema.sql            # Database schema
├── controllers/
│   └── authController.js     # Authentication logic
├── middleware/
│   ├── authMiddleware.js     # JWT verification
│   ├── errorHandler.js       # Error handling
│   └── validationMiddleware.js # Joi validation
├── models/
│   └── User.js               # User model
├── routes/
│   └── auth.js               # Auth routes
├── validators/
│   └── authValidators.js     # Joi schemas
├── .env                      # Environment variables
├── .env.example              # Environment template
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies
├── server.js                # Express app
└── README.md                # Documentation
```

## Testing

### Manual Testing with cURL

**Register a user:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "phone": "+1-555-0101",
    "role": "trucker",
    "company_name": "Smith Trucking",
    "city": "Los Angeles",
    "state": "CA",
    "country": "USA"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Get profile (replace TOKEN):**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Development

### Run in development mode:
```bash
npm run dev
```

### Check for vulnerabilities:
```bash
npm audit
```

### Fix vulnerabilities:
```bash
npm audit fix
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Configure proper database credentials
4. Enable HTTPS
5. Set up proper logging
6. Configure rate limiting
7. Set up Redis for token blacklisting (recommended)

## Support

For issues and questions, please open an issue on GitHub.

## License

MIT
