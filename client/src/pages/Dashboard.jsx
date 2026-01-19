import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { getJobs } from '../services/jobService';
import { getNotifications } from '../services/notificationService';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    earnings: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [jobsData, notificationsData] = await Promise.all([
        getJobs(),
        getNotifications({ isRead: false }),
      ]);

      const jobs = jobsData.data || [];
      setRecentJobs(jobs.slice(0, 5));

      // Calculate stats
      const activeJobs = jobs.filter((j) =>
        ['claimed', 'in_progress'].includes(j.status)
      ).length;
      const completedJobs = jobs.filter((j) => j.status === 'completed').length;

      setStats({
        totalJobs: jobs.length,
        activeJobs,
        completedJobs,
        earnings: user.totalEarnings || 0,
      });

      setNotifications(notificationsData.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Welcome, {user.name}!</h1>
        <p className="color-muted" style={{ marginBottom: '2rem' }}>
          Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </p>

        <div className="dashboard-grid">
          <div className="stat-card">
            <h3>Total Jobs</h3>
            <div className="stat-value">{stats.totalJobs}</div>
          </div>
          <div className="stat-card">
            <h3>Active Jobs</h3>
            <div className="stat-value">{stats.activeJobs}</div>
          </div>
          <div className="stat-card">
            <h3>Completed Jobs</h3>
            <div className="stat-value">{stats.completedJobs}</div>
          </div>
          {user.role === 'trucker' && (
            <div className="stat-card">
              <h3>Total Earnings</h3>
              <div className="stat-value">${stats.earnings.toFixed(2)}</div>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Recent Jobs</h2>
          {recentJobs.length === 0 ? (
            <p>No jobs found.</p>
          ) : (
            recentJobs.map((job) => (
              <div key={job._id} className="job-card">
                <div className="job-header">
                  <div>
                    <h3 className="job-title">{job.title}</h3>
                    <p>
                      {job.pickup.location} → {job.delivery.location}
                    </p>
                  </div>
                  <span className={`job-status status-${job.status}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
                <p>
                  <strong>Payment:</strong> ${job.payment.amount}
                </p>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="card">
            <h2>Recent Notifications ({notifications.length} unread)</h2>
            {notifications.slice(0, 5).map((notif) => (
              <div key={notif._id} className="notification unread">
                <div>
                  <strong>{notif.title}</strong>
                  <p>{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
