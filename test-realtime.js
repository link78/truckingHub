/**
 * Real-Time Infrastructure Test Demo
 * 
 * This script demonstrates the Socket.IO real-time features:
 * 1. Connection establishment
 * 2. Room joining
 * 3. Event emission and listening
 */

const io = require('socket.io-client');

// Configuration
const SOCKET_URL = 'http://localhost:5000';
const USER_ID = 'test-user-123';
const JOB_ID = 'test-job-456';

console.log('=== TruckingHub Real-Time Infrastructure Test ===\n');

// Create a socket client
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
});

// Connection events
socket.on('connect', () => {
  console.log('✓ Socket connected:', socket.id);
  
  // Test 1: Join user room
  console.log('\n--- Test 1: User Room ---');
  socket.emit('join', USER_ID);
  console.log('✓ Joined user room:', USER_ID);
  
  // Test 2: Join job room
  setTimeout(() => {
    console.log('\n--- Test 2: Job Room ---');
    socket.emit('joinJob', JOB_ID);
    console.log('✓ Joined job room:', JOB_ID);
    
    // Test 3: Send status update
    setTimeout(() => {
      console.log('\n--- Test 3: Job Status Update ---');
      const statusUpdate = {
        jobId: JOB_ID,
        status: 'in_progress',
        updatedBy: USER_ID,
      };
      socket.emit('jobStatusUpdate', statusUpdate);
      console.log('✓ Emitted job status update:', statusUpdate);
      
      // Test 4: Send notification
      setTimeout(() => {
        console.log('\n--- Test 4: Notification ---');
        const notification = {
          userId: USER_ID,
          title: 'Test Notification',
          message: 'This is a test notification from the real-time system',
          type: 'job_posted',
        };
        socket.emit('sendNotification', notification);
        console.log('✓ Emitted notification:', notification);
        
        // Wait for events and disconnect
        setTimeout(() => {
          console.log('\n--- Test 5: Leave Room ---');
          socket.emit('leaveJob', JOB_ID);
          console.log('✓ Left job room:', JOB_ID);
          
          setTimeout(() => {
            console.log('\n=== All Tests Completed ===');
            socket.disconnect();
            process.exit(0);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
});

// Listen for status updates
socket.on('statusUpdated', (data) => {
  console.log('  → Received statusUpdated event:', data);
});

// Listen for new notifications
socket.on('newNotification', (data) => {
  console.log('  → Received newNotification event:', data);
});

// Listen for new messages
socket.on('newMessage', (data) => {
  console.log('  → Received newMessage event:', data);
});

socket.on('disconnect', (reason) => {
  console.log('\n✓ Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('\n✗ Connection error:', error.message);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  socket.disconnect();
  process.exit(0);
});
