require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const connectDB = require('./server/config/database');
const errorHandler = require('./server/middleware/error');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join room based on user ID
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Join job room
  socket.on('joinJob', (jobId) => {
    socket.join(`job_${jobId}`);
    console.log(`Socket ${socket.id} joined job room: ${jobId}`);
  });

  // Leave job room
  socket.on('leaveJob', (jobId) => {
    socket.leave(`job_${jobId}`);
    console.log(`Socket ${socket.id} left job room: ${jobId}`);
  });

  // Handle real-time messages
  socket.on('sendMessage', (data) => {
    io.to(`job_${data.jobId}`).emit('newMessage', data);
  });

  // Handle job status updates
  socket.on('jobStatusUpdate', (data) => {
    io.to(`job_${data.jobId}`).emit('statusUpdated', data);
  });

  // Handle new notifications
  socket.on('sendNotification', (data) => {
    io.to(data.userId).emit('newNotification', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Mount routes
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/jobs', require('./server/routes/jobs'));
app.use('/api/ratings', require('./server/routes/ratings'));
app.use('/api/transactions', require('./server/routes/transactions'));
app.use('/api/services', require('./server/routes/services'));
app.use('/api/notifications', require('./server/routes/notifications'));

// Phase 2: Automation & Compliance routes
app.use('/api/compliance', require('./server/routes/compliance'));
app.use('/api/vehicles', require('./server/routes/vehicles'));
app.use('/api/documents', require('./server/routes/documents'));
app.use('/api/hos', require('./server/routes/hos'));
app.use('/api/automation', require('./server/routes/automation'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = { app, io };
