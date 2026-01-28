import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Only connect if user is authenticated
    if (user) {
      console.log('Initializing socket connection for user:', user.id);
      
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        
        // Join user's personal room for notifications
        if (user?.id) {
          newSocket.emit('join', user.id);
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      // Cleanup on unmount or user change
      return () => {
        console.log('Cleaning up socket connection');
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user?.id]);

  // Helper function to join a job room
  const joinJobRoom = (jobId) => {
    if (socket && isConnected) {
      socket.emit('joinJob', jobId);
      console.log('Joined job room:', jobId);
    }
  };

  // Helper function to leave a job room
  const leaveJobRoom = (jobId) => {
    if (socket && isConnected) {
      socket.emit('leaveJob', jobId);
      console.log('Left job room:', jobId);
    }
  };

  // Helper function to send a message
  const sendMessage = (jobId, message) => {
    if (socket && isConnected) {
      socket.emit('sendMessage', { jobId, message, userId: user?.id });
    }
  };

  // Helper function to send notification
  const sendNotification = (targetUserId, notification) => {
    if (socket && isConnected) {
      socket.emit('sendNotification', { userId: targetUserId, ...notification });
    }
  };

  const value = {
    socket,
    isConnected,
    joinJobRoom,
    leaveJobRoom,
    sendMessage,
    sendNotification,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
