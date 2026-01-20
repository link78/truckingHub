# TruckingHub Backend API

Backend foundation for TruckingHub - an internal logistics marketplace platform connecting truckers, shippers, and dispatchers.

## 🚀 Features

- **PostgreSQL Database**: Normalized schema with proper relationships and constraints
- **User Management**: Multi-role support (trucker, dispatcher, shipper, service_provider, admin)
- **Job Postings**: Full freight job management with origin/destination tracking
- **Bidding System**: Trucker bids on jobs with automatic job assignment
- **Notifications**: Real-time notification system for all user actions
- **Ratings & Reviews**: Post-job ratings with detailed category breakdowns
- **Database Models**: Complete CRUD operations for all entities
- **Migration System**: Version-controlled database schema migrations
- **Seed Data**: Sample data for testing and development

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/link78/truckingHub.git
   cd truckingHub/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb truckinghub
   
   # Or using psql
   psql -U postgres
   CREATE DATABASE truckinghub;
   \q
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=truckinghub
   DB_USER=postgres
   DB_PASSWORD=your_password
   PORT=3001
   NODE_ENV=development
   ```

5. **Run database migrations**
   ```bash
   npm run migrate
   ```

6. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

## 🎯 Usage

### Development Mode
```bash
npm run dev
```
Server runs with auto-reload on file changes.

### Production Mode
```bash
npm start
```

### Database Commands
```bash
# Run migrations only
npm run migrate

# Seed database with sample data
npm run seed

# Reset database (migrate + seed)
npm run reset-db
```

## 📁 Project Structure

```
backend/
├── config/
│   ├── database.js          # Database connection pool
│   └── constants.js         # Application constants (roles, statuses, etc.)
├── migrations/
│   ├── 001_create_roles.sql
│   ├── 002_create_users.sql
│   ├── 003_create_jobs.sql
│   ├── 004_create_bids.sql
│   ├── 005_create_notifications.sql
│   ├── 006_create_ratings.sql
│   ├── 007_create_indexes.sql
│   └── migrate.js           # Migration runner
├── models/
│   ├── User.js             # User model with authentication
│   ├── Job.js              # Job posting model
│   ├── Bid.js              # Bidding model
│   ├── Notification.js     # Notification model
│   └── Rating.js           # Rating and review model
├── seeds/
│   └── seed.js             # Sample data seeding
├── server.js               # Express application entry point
├── package.json
├── .env.example
└── README.md
```

## 💾 Database Schema

### Core Tables

#### Roles
- User role definitions (trucker, dispatcher, shipper, service_provider, admin)

#### Users
- Comprehensive user profiles with authentication
- Address and contact information
- Verification status and ratings
- Trucker-specific fields (license, insurance, truck details)

#### Jobs
- Freight job postings with full logistics details
- Origin and destination information with pickup/delivery dates
- Cargo type, weight, and special requirements
- Pricing and status tracking

#### Bids
- Trucker bids on jobs
- Bid amount and proposed dates
- Status tracking (pending, accepted, rejected, withdrawn)

#### Notifications
- Real-time notifications for user actions
- Support for different notification types
- Read/unread status tracking

#### Ratings
- Post-job ratings and reviews
- Overall and category-specific ratings
- Anonymous rating support
- Automatic user rating calculation

## 🔌 API Endpoints

### Health Check
```
GET /health
```
Returns server and database health status.

### API Information
```
GET /api
```
Returns API version and available endpoints.

> **Note**: Authentication, jobs, bids, notifications, and ratings API routes will be implemented in the next phase.

## 📊 Models & Operations

### User Model
- `create(userData)` - Create new user with password hashing
- `findById(id)` - Find user by ID
- `findByEmail(email)` - Find user by email
- `findAll(filters)` - Find users with optional filters
- `update(id, updateData)` - Update user profile
- `verifyPassword(email, password)` - Authenticate user
- `updatePassword(id, newPassword)` - Change password
- `activate(id)` / `deactivate(id)` - Activate/deactivate user
- `getRatingStats(id)` - Get user rating statistics

### Job Model
- `create(jobData)` - Create new job posting
- `findById(id)` - Find job by ID
- `findAll(filters)` - Find jobs with filtering (status, location, cargo type, price range, dates)
- `findOpen(filters)` - Find only open jobs
- `update(id, updateData)` - Update job details
- `assign(jobId, truckerId)` - Assign job to trucker
- `updateStatus(id, status)` - Update job status
- `start(id)` / `complete(id)` / `cancel(id)` - Job lifecycle methods
- `getStats(userId)` - Get job statistics

### Bid Model
- `create(bidData)` - Create new bid
- `findById(id)` - Find bid by ID
- `findAll(filters)` - Find bids with filters
- `findByJob(jobId)` - Find all bids for a job
- `findByTrucker(truckerId)` - Find all bids by a trucker
- `findPending(filters)` - Find pending bids
- `update(id, updateData)` - Update bid details
- `accept(id)` - Accept bid (with automatic job assignment and other bids rejection)
- `reject(id)` - Reject bid
- `withdraw(id, truckerId)` - Withdraw bid
- `getStats(userId, userType)` - Get bid statistics

### Notification Model
- `create(notificationData)` - Create new notification
- `findById(id)` - Find notification by ID
- `findByUser(userId, options)` - Get user notifications with pagination
- `findUnread(userId, options)` - Get unread notifications
- `markAsRead(id, userId)` - Mark single notification as read
- `markMultipleAsRead(ids, userId)` - Mark multiple notifications as read
- `markAllAsRead(userId)` - Mark all user notifications as read
- `getUnreadCount(userId)` - Get count of unread notifications
- `delete(id, userId)` - Delete notification

### Rating Model
- `create(ratingData)` - Create new rating
- `findById(id)` - Find rating by ID
- `findAll(filters)` - Find ratings with filters
- `findByUser(userId)` - Find ratings for a user
- `findByRatingUser(userId)` - Find ratings given by a user
- `findByJob(jobId)` - Find ratings for a job
- `update(id, updateData, ratingUserId)` - Update rating
- `addResponse(id, ratedUserId, responseText)` - Add response to rating
- `getAverageRating(userId)` - Calculate average rating
- `canRate(jobId, ratedUserId, ratingUserId)` - Check if user can rate

## 🔒 Security Features

- Password hashing with bcrypt (10 salt rounds)
- Email format validation
- Database constraints for data integrity
- No self-rating allowed
- Unique constraints to prevent duplicate bids
- Transaction support for critical operations (bid acceptance, job assignment)

## 🧪 Sample Data

After running `npm run seed`, you'll have:

### Users
- **Trucker**: trucker@example.com / password123
- **Shipper**: shipper@example.com / password123
- **Dispatcher**: dispatcher@example.com / password123
- **Admin**: admin@example.com / password123
- **Trucker 2**: trucker2@example.com / password123

### Data Created
- 5 users (all verified and active)
- 2 job postings
- 3 bids on jobs
- 4 sample notifications

## 🚧 Development Roadmap

### ✅ Phase 1: Core Backend (Current)
- Database schema and migrations
- Models with CRUD operations
- Express server setup
- Configuration management
- Seed data

### 📝 Phase 2: API Routes (Next)
- Authentication endpoints (login, register, password reset)
- Job management endpoints (CRUD operations)
- Bid management endpoints
- Notification endpoints
- Rating and review endpoints
- Input validation and error handling
- JWT authentication middleware

### 🔮 Future Phases
- Real-time updates with WebSockets
- File upload for documents (licenses, insurance)
- Search and filtering optimization
- Caching layer (Redis)
- Rate limiting and security enhancements
- Comprehensive test suite
- API documentation (Swagger/OpenAPI)

## 🐛 Troubleshooting

### Database Connection Issues

#### "client password must be a string" Error
This error occurs when the `DB_PASSWORD` environment variable is not properly set:

**Solution:**
1. Make sure your `.env` file exists and has `DB_PASSWORD` set:
   ```bash
   # For password authentication
   DB_PASSWORD=your_actual_password
   ```

2. If using peer/trust authentication (no password), you can either:
   - Leave `DB_PASSWORD` unset in `.env`
   - Or configure PostgreSQL to use peer authentication:
     ```bash
     # Edit pg_hba.conf to use 'trust' or 'peer' method
     sudo nano /etc/postgresql/*/main/pg_hba.conf
     # Restart PostgreSQL
     sudo service postgresql restart
     ```

3. For local development without password, you can also set an empty password for postgres user:
   ```bash
   sudo -u postgres psql
   ALTER USER postgres PASSWORD 'postgres';
   \q
   ```

#### General Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -U postgres -l | grep truckinghub

# Test connection
psql -U postgres -d truckinghub -c "SELECT 1"
```

### Migration Errors
```bash
# Drop and recreate database (⚠️ destroys all data)
dropdb truckinghub
createdb truckinghub
npm run migrate
```

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change PORT in .env file
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | truckinghub |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment (development/production) | development |
| `JWT_SECRET` | JWT signing secret (for future use) | - |

## 🤝 Contributing

This is the MVP Phase 1 implementation. Future contributions will focus on:
- API route implementation
- Authentication and authorization
- Testing infrastructure
- Documentation improvements
- Performance optimizations

## 📄 License

ISC

## 👥 Authors

TruckingHub Development Team

---

**Status**: ✅ MVP Phase 1 Complete - Ready for Phase 2 (API Routes)
