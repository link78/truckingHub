import axios from 'axios';

const API_URL = '/api/jobs';

export const getJobs = async (filters = {}) => {
  const response = await axios.get(API_URL, { params: filters });
  return response.data;
};

export const getJob = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const createJob = async (jobData) => {
  const response = await axios.post(API_URL, jobData);
  return response.data;
};

export const updateJob = async (id, jobData) => {
  const response = await axios.put(`${API_URL}/${id}`, jobData);
  return response.data;
};

export const deleteJob = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

export const claimJob = async (id) => {
  const response = await axios.post(`${API_URL}/${id}/claim`);
  return response.data;
};

export const updateJobStatus = async (id, status, notes) => {
  const response = await axios.put(`${API_URL}/${id}/status`, { status, notes });
  return response.data;
};

export const placeBid = async (id, amount, message) => {
  const response = await axios.post(`${API_URL}/${id}/bid`, { amount, message });
  return response.data;
};
