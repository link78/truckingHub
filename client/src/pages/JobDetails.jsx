import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getJob, updateJobStatus, placeBid } from '../services/jobService';

const JobDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { socket, isConnected, joinJobRoom, leaveJobRoom } = useSocket();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');

  useEffect(() => {
    fetchJob();
    
    // Join job room for real-time updates
    if (id && isConnected) {
      joinJobRoom(id);
    }

    // Cleanup: leave job room when component unmounts
    return () => {
      if (id && isConnected) {
        leaveJobRoom(id);
      }
    };
  }, [id, isConnected]);

  useEffect(() => {
    if (socket && isConnected) {
      // Listen for real-time job status updates
      socket.on('statusUpdated', (data) => {
        console.log('Job status updated:', data);
        if (data.jobId === id) {
          // Refresh job data
          fetchJob();
          // Show notification
          setMessage(`Job status updated to: ${data.status}`);
          setTimeout(() => setMessage(''), 3000);
        }
      });

      // Listen for new bids
      socket.on('newBid', (data) => {
        console.log('New bid received:', data);
        if (data.jobId === id) {
          fetchJob();
          setMessage('A new bid has been placed');
          setTimeout(() => setMessage(''), 3000);
        }
      });

      return () => {
        socket.off('statusUpdated');
        socket.off('newBid');
      };
    }
  }, [socket, isConnected, id]);

  const fetchJob = async () => {
    try {
      const response = await getJob(id);
      setJob(response.data);
      setNewStatus(response.data.status);
    } catch (error) {
      console.error('Error fetching job:', error);
      setMessage('Error loading job details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateJobStatus(id, newStatus, statusNotes);
      setMessage('Status updated successfully!');
      setStatusNotes('');
      fetchJob();
      
      // Emit socket event for real-time update
      if (socket && isConnected) {
        socket.emit('jobStatusUpdate', {
          jobId: id,
          status: newStatus,
          updatedBy: user?.id,
        });
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update status');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    try {
      await placeBid(id, parseFloat(bidAmount), bidMessage);
      setMessage('Bid placed successfully!');
      setBidAmount('');
      setBidMessage('');
      fetchJob();
      
      // Emit socket event for new bid notification
      if (socket && isConnected && job?.postedBy?._id) {
        socket.emit('sendNotification', {
          userId: job.postedBy._id,
          title: 'New Bid Received',
          message: `A new bid of $${bidAmount} was placed on your job`,
          jobId: id,
        });
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to place bid');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading job details...</p>
        </div>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="alert alert-error">Job not found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <button onClick={() => navigate('/jobs')} className="btn btn-secondary">
          ← Back to Jobs
        </button>

        {message && (
          <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        <div className="card mt-1">
          <div className="job-header">
            <h1>{job.title}</h1>
            <span className={`job-status status-${job.status}`}>
              {job.status.replace('_', ' ')}
            </span>
          </div>

          <h3>Description</h3>
          <p>{job.description}</p>

          <h3>Route Information</h3>
          <div className="grid-2col">
            <div>
              <h4>Pickup</h4>
              <p><strong>Location:</strong> {job.pickup.location}</p>
              {job.pickup.address && <p><strong>Address:</strong> {job.pickup.address}</p>}
              <p><strong>Date:</strong> {new Date(job.pickup.date).toLocaleString()}</p>
            </div>
            <div>
              <h4>Delivery</h4>
              <p><strong>Location:</strong> {job.delivery.location}</p>
              {job.delivery.address && <p><strong>Address:</strong> {job.delivery.address}</p>}
              <p><strong>Date:</strong> {new Date(job.delivery.date).toLocaleString()}</p>
            </div>
          </div>

          <h3>Cargo Information</h3>
          <p><strong>Type:</strong> {job.cargo.type}</p>
          {job.cargo.weight && <p><strong>Weight:</strong> {job.cargo.weight} lbs</p>}
          {job.cargo.volume && <p><strong>Volume:</strong> {job.cargo.volume} cubic ft</p>}

          <h3>Payment</h3>
          <p><strong>Amount:</strong> ${job.payment.amount}</p>
          <p><strong>Status:</strong> {job.payment.paymentStatus}</p>

          {job.distance && <p><strong>Distance:</strong> {job.distance} miles</p>}

          {job.postedBy && (
            <>
              <h3>Posted By</h3>
              <p><strong>Name:</strong> {job.postedBy.name}</p>
              <p><strong>Company:</strong> {job.postedBy.company || 'N/A'}</p>
              <p><strong>Email:</strong> {job.postedBy.email}</p>
            </>
          )}

          {job.assignedTo && (
            <>
              <h3>Assigned To</h3>
              <p><strong>Name:</strong> {job.assignedTo.name}</p>
              <p><strong>Rating:</strong> {job.assignedTo.rating} ⭐</p>
              <p><strong>Phone:</strong> {job.assignedTo.phone || 'N/A'}</p>
            </>
          )}
        </div>

        {/* Status Update Form */}
        {(job.assignedTo?._id === user.id || job.postedBy?._id === user.id || user.role === 'admin') && (
          <div className="card">
            <h2>Update Job Status</h2>
            <form onSubmit={handleStatusUpdate}>
              <div className="form-group">
                <label>Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="available">Available</option>
                  <option value="claimed">Claimed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add any notes about this status update..."
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Update Status
              </button>
            </form>
          </div>
        )}

        {/* Bid Form for Truckers */}
        {user.role === 'trucker' && job.status === 'available' && (
          <div className="card">
            <h2>Place a Bid</h2>
            <form onSubmit={handlePlaceBid}>
              <div className="form-group">
                <label>Bid Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Message (optional)</label>
                <textarea
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  placeholder="Add a message with your bid..."
                />
              </div>
              <button type="submit" className="btn btn-success">
                Submit Bid
              </button>
            </form>
          </div>
        )}

        {/* Bids List */}
        {job.bids && job.bids.length > 0 && (job.postedBy?._id === user.id || user.role === 'admin') && (
          <div className="card">
            <h2>Bids ({job.bids.length})</h2>
            {job.bids.map((bid, index) => (
              <div key={index} className="p-1 border-bottom">
                <p><strong>Trucker:</strong> {bid.trucker?.name || 'Unknown'}</p>
                <p><strong>Amount:</strong> ${bid.amount}</p>
                {bid.message && <p><strong>Message:</strong> {bid.message}</p>}
                <p><strong>Date:</strong> {new Date(bid.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* Status History */}
        {job.statusHistory && job.statusHistory.length > 0 && (
          <div className="card">
            <h2>Status History</h2>
            {job.statusHistory.map((history, index) => (
              <div key={index} className="p-half border-bottom">
                <p>
                  <strong>{history.status.replace('_', ' ')}</strong> -{' '}
                  {new Date(history.timestamp).toLocaleString()}
                </p>
                {history.notes && <p>{history.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default JobDetails;
