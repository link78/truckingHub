import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { getJobs, claimJob } from '../services/jobService';

const Jobs = () => {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [filter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await getJobs(params);
      setJobs(response.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setMessage('Error loading jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimJob = async (jobId) => {
    try {
      await claimJob(jobId);
      setMessage('Job claimed successfully!');
      fetchJobs();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to claim job');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="flex-between">
          <h1>Available Jobs</h1>
          {(user.role === 'dispatcher' || user.role === 'shipper') && (
            <Link to="/jobs/create" className="btn btn-primary">
              Post New Job
            </Link>
          )}
        </div>

        {message && (
          <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        <div className="card">
          <div className="mb-1">
            <label className="mr-1">Filter by status:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-half"
            >
              <option value="all">All Jobs</option>
              <option value="available">Available</option>
              <option value="claimed">Claimed</option>
              <option value="in_progress">In Progress</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="card">
            <p>No jobs found.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job._id} className="job-card">
              <div className="job-header">
                <div>
                  <h3 className="job-title">{job.title}</h3>
                  <p>{job.description}</p>
                </div>
                <span className={`job-status status-${job.status}`}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-1">
                <p>
                  <strong>Route:</strong> {job.pickup.location} → {job.delivery.location}
                </p>
                <p>
                  <strong>Pickup Date:</strong>{' '}
                  {new Date(job.pickup.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Delivery Date:</strong>{' '}
                  {new Date(job.delivery.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Cargo:</strong> {job.cargo.type}
                  {job.cargo.weight && ` (${job.cargo.weight} lbs)`}
                </p>
                <p>
                  <strong>Payment:</strong> ${job.payment.amount}
                </p>
                {job.distance && (
                  <p>
                    <strong>Distance:</strong> {job.distance} miles
                  </p>
                )}
              </div>

              <div className="flex-gap mt-1">
                <Link to={`/jobs/${job._id}`} className="btn btn-primary">
                  View Details
                </Link>
                {user.role === 'trucker' && job.status === 'available' && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleClaimJob(job._id)}
                  >
                    Claim Job
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default Jobs;
