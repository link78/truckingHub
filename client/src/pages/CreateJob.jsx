import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { createJob } from '../services/jobService';

const CreateJob = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pickupLocation: '',
    pickupAddress: '',
    pickupDate: '',
    deliveryLocation: '',
    deliveryAddress: '',
    deliveryDate: '',
    cargoType: '',
    cargoWeight: '',
    paymentAmount: '',
    distance: '',
    truckType: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const jobData = {
        title: formData.title,
        description: formData.description,
        pickup: {
          location: formData.pickupLocation,
          address: formData.pickupAddress,
          date: formData.pickupDate,
        },
        delivery: {
          location: formData.deliveryLocation,
          address: formData.deliveryAddress,
          date: formData.deliveryDate,
        },
        cargo: {
          type: formData.cargoType,
          weight: formData.cargoWeight ? parseFloat(formData.cargoWeight) : undefined,
        },
        payment: {
          amount: parseFloat(formData.paymentAmount),
        },
        distance: formData.distance ? parseFloat(formData.distance) : undefined,
        requirements: {
          truckType: formData.truckType,
        },
      };

      await createJob(jobData);
      setMessage('Job posted successfully!');
      setTimeout(() => {
        navigate('/jobs');
      }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create job');
    }
  };

  if (user.role !== 'dispatcher' && user.role !== 'shipper') {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="alert alert-error">
            You don't have permission to post jobs.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Post a New Job</h1>

        {message && (
          <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit}>
            <h3>Job Details</h3>
            <div className="form-group">
              <label>Job Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Provide detailed description of the job..."
              />
            </div>

            <h3>Pickup Information</h3>
            <div className="form-group">
              <label>Pickup Location *</label>
              <input
                type="text"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                placeholder="City, State"
                required
              />
            </div>

            <div className="form-group">
              <label>Pickup Address</label>
              <input
                type="text"
                name="pickupAddress"
                value={formData.pickupAddress}
                onChange={handleChange}
                placeholder="Street address (optional)"
              />
            </div>

            <div className="form-group">
              <label>Pickup Date *</label>
              <input
                type="datetime-local"
                name="pickupDate"
                value={formData.pickupDate}
                onChange={handleChange}
                required
              />
            </div>

            <h3>Delivery Information</h3>
            <div className="form-group">
              <label>Delivery Location *</label>
              <input
                type="text"
                name="deliveryLocation"
                value={formData.deliveryLocation}
                onChange={handleChange}
                placeholder="City, State"
                required
              />
            </div>

            <div className="form-group">
              <label>Delivery Address</label>
              <input
                type="text"
                name="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={handleChange}
                placeholder="Street address (optional)"
              />
            </div>

            <div className="form-group">
              <label>Delivery Date *</label>
              <input
                type="datetime-local"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleChange}
                required
              />
            </div>

            <h3>Cargo Details</h3>
            <div className="form-group">
              <label>Cargo Type *</label>
              <input
                type="text"
                name="cargoType"
                value={formData.cargoType}
                onChange={handleChange}
                placeholder="e.g., Electronics, Furniture, Food"
                required
              />
            </div>

            <div className="form-group">
              <label>Cargo Weight (lbs)</label>
              <input
                type="number"
                name="cargoWeight"
                value={formData.cargoWeight}
                onChange={handleChange}
                placeholder="Weight in pounds"
              />
            </div>

            <h3>Additional Information</h3>
            <div className="form-group">
              <label>Payment Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                name="paymentAmount"
                value={formData.paymentAmount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Distance (miles)</label>
              <input
                type="number"
                name="distance"
                value={formData.distance}
                onChange={handleChange}
                placeholder="Estimated distance"
              />
            </div>

            <div className="form-group">
              <label>Required Truck Type</label>
              <select
                name="truckType"
                value={formData.truckType}
                onChange={handleChange}
              >
                <option value="">Any</option>
                <option value="box_truck">Box Truck</option>
                <option value="flatbed">Flatbed</option>
                <option value="refrigerated">Refrigerated</option>
                <option value="tanker">Tanker</option>
                <option value="semi_trailer">Semi Trailer</option>
              </select>
            </div>

            <div className="mt-2">
              <button type="submit" className="btn btn-primary">
                Post Job
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/jobs')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateJob;
