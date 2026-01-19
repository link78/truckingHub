import axios from 'axios';

const API_URL = '/api/notifications';

export const getNotifications = async (filters = {}) => {
  const response = await axios.get(API_URL, { params: filters });
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await axios.put(`${API_URL}/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await axios.put(`${API_URL}/read-all`);
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
