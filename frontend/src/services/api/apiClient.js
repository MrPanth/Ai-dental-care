import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
// Strip trailing /api to prevent double prefixes in paths like '/api/auth/login'
const baseURL = rawApiUrl.replace(/\/api$/, '');

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
