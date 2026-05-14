import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const notificationsAPI = {
  getAll: () => api.get('notifications/'),
  markAsRead: (id) => api.patch(`notifications/${id}/read/`),
  markAllAsRead: () => api.patch('notifications/read-all/'),
  clearAll: () => api.delete('notifications/clear-all/'),
};

export default api;
