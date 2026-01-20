# TruckHub MVP Phase 1 Load Marketplace

## Project Overview
TruckHub is a load marketplace that connects shippers and carriers in real time, facilitating efficient transportation of goods across various locations.

## Features
- User Authentication: Secure login and registration for shippers and carriers (bcrypt password hashing)
- Load Listings: Real-time posting and searching of available loads with advanced filtering
- Bidding System: Carriers can bid on loads with automatic job assignment and transaction support
- Ratings and Reviews: Users can rate each other with detailed category breakdowns
- Notifications: Real-time notification system for all user actions

## Database Features (PostgreSQL)
- **6 normalized tables** with referential integrity
- **Automated triggers** for updating user ratings
- **Transaction support** for atomic bid acceptance and job assignment
- **Advanced indexing** for fast queries on jobs, bids, and ratings
- **Data constraints** preventing self-ratings and duplicate bids
- **Idempotent migrations** for repeatable database setup

## Tech Stack
- **Front-end:** React.js
- **Back-end:** Node.js, Express.js
- **Database:** PostgreSQL
- **Real-time:** Socket.IO (Phase 2)

## Quick Start Instructions

### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/link78/truckingHub.git
   cd truckingHub/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up PostgreSQL database:
   ```bash
   createdb truckinghub
   ```

4. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials
   ```

5. Run migrations and seed data:
   ```bash
   npm run reset-db
   ```

6. Start the server:
   ```bash
   npm run dev
   ```

7. Access the API at `http://localhost:3001`
   - Health check: `http://localhost:3001/health`
   - API info: `http://localhost:3001/api`

## Project Structure
```
truckingHub/
├── backend/
│   ├── config/          # Database connection and constants
│   ├── migrations/      # PostgreSQL schema migrations
│   ├── models/          # Database models (User, Job, Bid, Notification, Rating)
│   ├── seeds/           # Sample data for testing
│   ├── server.js        # Express application entry point
│   └── package.json
├── frontend/            # React frontend (coming soon)
└── README.md
```

## Current API Endpoints (MVP Phase 1)
- `GET /health`: Server and database health check
- `GET /api`: API version and information

### Coming in Phase 2
- Authentication endpoints (login, register, password reset)
- Job management (CRUD operations for freight postings)
- Bid management (create, accept, reject bids)
- Notification endpoints
- Rating and review endpoints

## Real-time Features (Coming in Phase 2)
Socket.IO will be integrated for real-time updates on:
- New job postings matching trucker preferences
- Bid status updates (accepted/rejected)
- Job assignment notifications
- Live bidding competition updates