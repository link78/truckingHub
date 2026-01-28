# Real-Time Infrastructure Documentation

## Overview

Phase 1 Item #5 implements a comprehensive real-time infrastructure using Socket.IO for the TruckingHub logistics marketplace. This enables instant notifications, live job updates, and real-time communication between users.

## Architecture

### Client-Side

#### SocketContext (`client/src/context/SocketContext.jsx`)

The SocketContext provides centralized Socket.IO connection management:

```javascript
import { useSocket } from './context/SocketContext';

const { socket, isConnected, joinJobRoom, leaveJobRoom } = useSocket();
```

**Features:**
- Automatic connection when user logs in
- Automatic disconnection when user logs out
- Joins user's personal room for notifications
- Helper functions for room management
- Connection state tracking

**Configuration:**
- Socket URL: `VITE_SOCKET_URL` environment variable (defaults to http://localhost:5000)
- Reconnection enabled with exponential backoff
- Supports WebSocket and polling transports

### Server-Side

#### Socket.IO Server (`server.js`)

The server sets up Socket.IO with CORS support and event handlers:

```javascript
const io = socketio(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});
```

**Events Handled:**
- `join` - User joins their personal room
- `joinJob` - User joins a job-specific room
- `leaveJob` - User leaves a job room
- `sendMessage` - Send message to job room
- `jobStatusUpdate` - Job status change
- `sendNotification` - Send notification to user

## Real-Time Features

### 1. Job Notifications

When a new job is posted, all active truckers receive instant notifications:

```javascript
// Server emits to all truckers
truckers.forEach((trucker) => {
  io.to(trucker._id.toString()).emit('newNotification', {
    type: 'job_posted',
    title: 'New Job Available',
    message: `A new job "${job.title}" has been posted`,
    relatedJob: job._id,
  });
});
```

### 2. Job Status Updates

Job status changes are broadcast in real-time to all interested parties:

```javascript
// Server emits to job room
io.to(`job_${job._id}`).emit('statusUpdated', {
  jobId: job._id.toString(),
  status: status,
  updatedBy: req.user.id,
});
```

```javascript
// Client listens for updates
socket.on('statusUpdated', (data) => {
  if (data.jobId === currentJobId) {
    // Refresh job data
    fetchJob();
  }
});
```

### 3. Notification System

Real-time notifications appear in the navbar with:
- Unread count badge
- Dropdown with recent notifications
- Browser notifications (when permitted)
- Auto-refresh on new notifications

### 4. Dashboard Updates

The dashboard automatically refreshes when:
- New jobs are posted
- Job statuses change
- New notifications arrive

### 5. Bid Notifications

When a trucker places a bid, the job poster receives instant notification:

```javascript
io.to(job.postedBy.toString()).emit('newNotification', {
  type: 'new_message',
  title: 'New Bid Received',
  message: `New bid of $${amount} received`,
});
```

## Room Architecture

### Personal Rooms

Each user has a personal room identified by their user ID:
```javascript
socket.join(userId);
```

Notifications are sent to users' personal rooms:
```javascript
io.to(userId).emit('newNotification', notification);
```

### Job Rooms

Job-specific updates use room naming convention `job_${jobId}`:
```javascript
socket.join(`job_${jobId}`);
```

All participants in a job room receive updates:
```javascript
io.to(`job_${jobId}`).emit('statusUpdated', data);
```

## UI Components

### Connection Status Indicator

Visual indicator in navbar shows connection state:
- **Green pulsing dot**: Connected
- **Red dot**: Disconnected

### Notification Bell

The notification bell shows:
- Unread count badge
- Dropdown with 5 most recent notifications
- Click to view all notifications

### Real-Time Job Details

The JobDetails page:
- Joins job room on mount
- Leaves job room on unmount
- Updates automatically on status changes
- Shows new bids instantly

## Event Flow Examples

### Job Creation Flow

1. Dispatcher creates job via API
2. Backend controller saves job to database
3. Backend emits `newJobPosted` event
4. Backend sends notifications to all truckers
5. Trucker clients receive `newNotification` event
6. Dashboard auto-refreshes with new job
7. Notification bell shows unread count

### Status Update Flow

1. Trucker updates job status via API
2. Backend controller updates database
3. Backend emits `statusUpdated` to job room
4. Backend sends notifications to dispatcher
5. All clients in job room receive update
6. JobDetails page auto-refreshes
7. Dashboard stats update automatically

## Testing

### Manual Testing

1. Start server: `npm run dev`
2. Start client: `cd client && npm run dev`
3. Open browser to http://localhost:3000
4. Login as different users in multiple tabs
5. Create a job as dispatcher
6. Watch notifications appear in trucker tabs
7. Claim job and update status
8. Observe real-time updates across all tabs

### Automated Testing

Run the test script:
```bash
# Start server first
npm run dev

# In another terminal
node test-realtime.js
```

This tests:
- Socket connection
- Room joining/leaving
- Event emission
- Event reception

## Configuration

### Environment Variables

**Server** (`.env`):
```
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Client** (`.env`):
```
VITE_SOCKET_URL=http://localhost:5000
```

### CORS Settings

Ensure CORS is properly configured for Socket.IO:
```javascript
cors: {
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST'],
}
```

## Best Practices

1. **Always clean up listeners**: Remove event listeners in useEffect cleanup
2. **Join/leave rooms properly**: Join on mount, leave on unmount
3. **Handle reconnection**: Socket.IO handles this automatically
4. **Validate events**: Check event data before processing
5. **Use room architecture**: Don't broadcast everything to everyone
6. **Debounce updates**: Avoid too many rapid updates

## Performance Considerations

- Room-based architecture scales well
- Events are only sent to relevant users
- Automatic reconnection prevents lost connections
- Polling fallback for WebSocket issues

## Future Enhancements

- [ ] Typing indicators for messages
- [ ] Read receipts for notifications
- [ ] Presence indicators (online/offline)
- [ ] Direct messaging between users
- [ ] File sharing in job rooms
- [ ] Voice/video chat integration

## Troubleshooting

### Connection Issues

If socket won't connect:
1. Check server is running on correct port
2. Verify CORS settings
3. Check browser console for errors
4. Ensure WebSocket is not blocked by firewall

### Events Not Received

If events aren't being received:
1. Verify socket is connected (`isConnected === true`)
2. Check you're in the correct room
3. Verify event names match exactly
4. Check server logs for emission

### Notifications Not Showing

If notifications don't appear:
1. Check browser notification permissions
2. Verify user is logged in
3. Check notification fetching logic
4. Verify Socket.IO event listeners

## Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
- [React Context API](https://react.dev/reference/react/useContext)
