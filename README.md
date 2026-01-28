# TruckingHub - Internal Logistics Marketplace

## Project Overview
TruckingHub is a comprehensive internal logistics marketplace for commercial trucking that connects truckers, dispatchers, shippers, and service providers in a seamless digital ecosystem. The platform functions as "Grubhub meets Uber Freight, but internal."

## Features

### Core Features
- **User Roles**: Trucker, Dispatcher, Shipper, Service Provider, and Admin
- **Job Marketplace**: Real-time job posting, browsing, claiming, and bidding system
- **Authentication & Authorization**: JWT-based secure authentication with role-based access control
- **Job Management**: Full lifecycle tracking from posting to completion
- **Payment System**: Transaction management and tracking
- **Rating & Review System**: Participant rating to maintain quality
- **Real-time Updates**: Socket.IO-powered notifications and status updates
- **Service Provider Marketplace**: Additional services like maintenance, fueling, roadside assistance

### User Capabilities by Role

#### Trucker
- Browse available jobs
- Claim jobs directly or place bids
- Update job status
- Track earnings and completed jobs
- View ratings and reviews

#### Dispatcher
- Post new jobs
- Assign loads to truckers
- Monitor fleet progress
- Review bids from truckers
- Track job completion

#### Shipper
- Submit shipment requests
- Track deliveries in real-time
- Manage payments
- Rate truckers

#### Service Provider
- Offer services (maintenance, fueling, etc.)
- Set availability and pricing
- Manage service bookings

#### Admin
- System oversight
- User management
- Access to analytics

## Tech Stack
- **Frontend**: React.js with Vite
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Project Structure
```
truckingHub/
├── server/
│   ├── models/          # Database models
│   ├── routes/          # API route definitions
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth & error handling
│   ├── config/          # Database configuration
│   └── utils/           # Helper functions
├── client/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React Context (Auth)
│   │   ├── services/    # API service functions
│   │   └── styles.css   # Global styles
│   └── index.html       # HTML entry point
└── server.js            # Main server file
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/link78/truckingHub.git
cd truckingHub
```

### 2. Install Server Dependencies
```bash
npm install
```

### 3. Install Client Dependencies
```bash
cd client
npm install
cd ..
```

### 4. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/truckinghub
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### 5. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# If using local MongoDB
mongod
```

Or use MongoDB Atlas (cloud) and update the `MONGODB_URI` in `.env`

### 6. Run the Application

#### Development Mode (both frontend and backend)

Terminal 1 - Start Backend:
```bash
npm run dev
```

Terminal 2 - Start Frontend:
```bash
cd client
npm run dev
```

The backend will run on `http://localhost:5000`  
The frontend will run on `http://localhost:3000`

#### Production Mode
```bash
# Build frontend
cd client
npm run build
cd ..

# Start server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/updatedetails` - Update user details (Protected)
- `PUT /api/auth/updatepassword` - Update password (Protected)

### Jobs
- `GET /api/jobs` - Get all jobs (Protected)
- `GET /api/jobs/:id` - Get single job (Protected)
- `POST /api/jobs` - Create job (Dispatcher/Shipper)
- `PUT /api/jobs/:id` - Update job (Protected)
- `DELETE /api/jobs/:id` - Delete job (Protected)
- `POST /api/jobs/:id/claim` - Claim job (Trucker)
- `PUT /api/jobs/:id/status` - Update job status (Protected)
- `POST /api/jobs/:id/bid` - Place bid on job (Trucker)

### Ratings
- `POST /api/ratings` - Create rating (Protected)
- `GET /api/ratings/user/:userId` - Get user ratings (Public)
- `GET /api/ratings/job/:jobId` - Get job ratings (Protected)

### Transactions
- `GET /api/transactions` - Get user transactions (Protected)
- `GET /api/transactions/:id` - Get single transaction (Protected)
- `POST /api/transactions` - Create transaction (Protected)
- `PUT /api/transactions/:id/status` - Update transaction status (Protected)

### Services
- `GET /api/services` - Get all services (Public)
- `GET /api/services/:id` - Get single service (Public)
- `POST /api/services` - Create service (Service Provider)
- `PUT /api/services/:id` - Update service (Protected)
- `DELETE /api/services/:id` - Delete service (Protected)

### Notifications
- `GET /api/notifications` - Get user notifications (Protected)
- `PUT /api/notifications/:id/read` - Mark as read (Protected)
- `PUT /api/notifications/read-all` - Mark all as read (Protected)
- `DELETE /api/notifications/:id` - Delete notification (Protected)

## Real-time Features (Socket.IO)

### Events
- `join` - Join user room
- `joinJob` - Join job-specific room
- `leaveJob` - Leave job room
- `sendMessage` - Send real-time message
- `jobStatusUpdate` - Broadcast status updates
- `sendNotification` - Send real-time notification

## Database Models

### User
- Authentication and profile information
- Role-based access (trucker, dispatcher, shipper, service_provider, admin)
- Rating and earnings tracking
- Truck information for truckers

### Job
- Job details and requirements
- Pickup and delivery information
- Cargo details
- Payment information
- Status tracking and history
- Bidding system

### Rating
- User ratings and reviews
- Category-based ratings (professionalism, communication, timeliness, quality)

### Transaction
- Payment tracking
- Transaction history
- Multiple payment methods

### Service
- Service provider offerings
- Pricing and availability
- Service categories

### Notification
- Real-time notifications
- Read/unread status
- Categorized notification types

## Default Test Users (Create these after setup)

You can register users with different roles:

1. **Trucker**
   - Email: trucker@test.com
   - Role: trucker

2. **Dispatcher**
   - Email: dispatcher@test.com
   - Role: dispatcher

3. **Shipper**
   - Email: shipper@test.com
   - Role: shipper

## Security Features
- JWT-based authentication
- Password hashing with bcryptjs
- Role-based authorization
- Protected API routes
- CORS enabled for frontend communication

## Future Enhancements
- Payment gateway integration (Stripe, PayPal)
- Advanced job matching algorithm based on location, truck type, etc.
- Mobile applications (iOS/Android)
- GPS tracking integration
- Document management (BOL, POD)
- Advanced analytics and reporting
- Multi-language support
- Push notifications

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
ISC

## Support
For support, email support@truckinghub.com or open an issue in the repository.