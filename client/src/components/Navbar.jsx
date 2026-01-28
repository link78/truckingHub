import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Fetch initial unread notification count
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications?isRead=false', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.count || 0);
          setNotifications(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (socket && isConnected) {
      // Listen for new notifications
      socket.on('newNotification', (notification) => {
        console.log('Received new notification:', notification);
        setUnreadCount((prev) => prev + 1);
        setNotifications((prev) => [notification, ...prev]);
        
        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification(notification.title || 'New Notification', {
            body: notification.message,
            icon: '/favicon.ico',
          });
        }
      });

      return () => {
        socket.off('newNotification');
      };
    }
  }, [socket, isConnected]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <div className="navbar">
      <div className="navbar-content">
        <h1>TruckingHub</h1>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/jobs">Jobs</Link>
          {(user?.role === 'dispatcher' || user?.role === 'shipper') && (
            <Link to="/jobs/create">Post Job</Link>
          )}
        </nav>
        <div className="flex-gap">
          {/* Socket connection indicator */}
          <div className="socket-status" title={isConnected ? 'Connected' : 'Disconnected'}>
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          </div>

          {/* Notification bell */}
          <div className="notification-container">
            <button 
              className="notification-btn" 
              onClick={toggleNotifications}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
            
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="unread-count">{unreadCount} unread</span>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="notification-empty">No new notifications</div>
                  ) : (
                    notifications.slice(0, 5).map((notif, index) => (
                      <div key={notif._id || index} className="notification-item">
                        <strong>{notif.title}</strong>
                        <p>{notif.message}</p>
                        <small>{new Date(notif.createdAt).toLocaleString()}</small>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <span className="navbar-user">
            {user?.name} ({user?.role})
          </span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
