# TruckingHub Setup Guide

This guide will walk you through setting up the TruckingHub logistics marketplace from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** - Choose one:
  - Local installation - [Download](https://www.mongodb.com/try/download/community)
  - MongoDB Atlas (Cloud) - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/)

## Quick Start (5 minutes)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/link78/truckingHub.git
cd truckingHub

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and update with your settings:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/truckinghub
JWT_SECRET=your_secure_random_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

**Important**: Change `JWT_SECRET` to a secure random string in production!

### Step 3: Start MongoDB

**Option A: Local MongoDB**
```bash
# Start MongoDB service
# On Mac:
brew services start mongodb-community

# On Windows (if installed as service):
# It should start automatically

# On Linux:
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string
3. Update `MONGODB_URI` in `.env` with your Atlas connection string

### Step 4: Seed the Database (Optional but Recommended)

```bash
npm run seed
```

This creates test users and sample data:
- **Trucker**: trucker@test.com / password123
- **Dispatcher**: dispatcher@test.com / password123
- **Shipper**: shipper@test.com / password123
- **Service Provider**: service@test.com / password123
- **Admin**: admin@test.com / password123

### Step 5: Start the Application

Open **two terminal windows**:

**Terminal 1 - Backend Server:**
```bash
npm run dev
```
Backend will start on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Frontend will start on http://localhost:3000

### Step 6: Access the Application

1. Open your browser to http://localhost:3000
2. You'll be redirected to the login page
3. Use any of the seeded credentials above to log in
4. Explore the marketplace!

## Detailed Setup

### Testing Different User Roles

1. **As a Trucker** (trucker@test.com):
   - Browse available jobs
   - Claim jobs
   - Place bids on jobs
   - Update job status
   - View earnings

2. **As a Dispatcher** (dispatcher@test.com):
   - Post new jobs
   - Monitor all jobs
   - Review bids from truckers
   - Assign jobs to truckers

3. **As a Shipper** (shipper@test.com):
   - Submit shipment requests
   - Track deliveries
   - Manage payments
   - Rate truckers

4. **As a Service Provider** (service@test.com):
   - Offer maintenance services
   - Set availability
   - Manage bookings

5. **As an Admin** (admin@test.com):
   - System oversight
   - Access all features
   - User management

### Verifying Installation

#### Check Backend
```bash
# Test if backend is running
curl http://localhost:5000/api/health
# Should return: {"success":true,"message":"Server is running"}
```

#### Check Database Connection
Look for this in the backend terminal:
```
MongoDB Connected: localhost
Server running in development mode on port 5000
```

#### Check Frontend
Visit http://localhost:3000 - you should see the login page.

## Troubleshooting

### MongoDB Connection Issues

**Error: "connect ECONNREFUSED"**
- Make sure MongoDB is running
- Check if the port (27017) is correct
- Verify MongoDB is listening on localhost

**Solution:**
```bash
# Check if MongoDB is running
# On Mac/Linux:
ps aux | grep mongod

# On Windows:
# Check Task Manager for mongod.exe
```

### Port Already in Use

**Error: "EADDRINUSE: address already in use"**

**Solution:**
```bash
# Find and kill the process using the port
# On Mac/Linux:
lsof -ti:5000 | xargs kill
lsof -ti:3000 | xargs kill

# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### npm Install Errors

**Error during npm install**

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Frontend Not Connecting to Backend

**Check CORS settings:**
- Ensure `FRONTEND_URL` in `.env` matches your frontend URL
- Default should be `http://localhost:3000`

**Check proxy in vite.config.js:**
- Should proxy `/api` to `http://localhost:5000`

## Production Deployment

### Environment Variables for Production

Update `.env` for production:
```
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=very_long_random_secure_string
FRONTEND_URL=https://your-domain.com
```

### Build Frontend

```bash
cd client
npm run build
```

This creates a `dist` folder with production-ready files.

### Serve with Node.js

Add this to `server.js` after your routes:
```javascript
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/dist'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
  });
}
```

### Start Production Server

```bash
npm start
```

## Additional Resources

### API Documentation
All API endpoints are documented in the main [README.md](README.md) file.

### Database Schema
Models are located in `server/models/`:
- User.js - User accounts and profiles
- Job.js - Job/Load listings
- Transaction.js - Payment transactions
- Rating.js - User ratings and reviews
- Service.js - Service provider offerings
- Notification.js - System notifications

### Real-time Features
Socket.IO events are documented in `server.js`

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review the code comments in the source files
- Open an issue on GitHub
- Contact support at support@truckinghub.com

## Next Steps

After successful setup:

1. **Customize the application** to your needs
2. **Add more features** (see Future Enhancements in README)
3. **Configure payment gateway** (Stripe, PayPal)
4. **Set up monitoring** and logging
5. **Deploy to production** (AWS, Heroku, DigitalOcean, etc.)
6. **Configure SSL/HTTPS** for secure connections
7. **Set up automated backups** for your database

Happy coding! 🚛
