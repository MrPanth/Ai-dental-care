import apiClient from './apiClient';

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/api/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  },
  
  forgotPassword: async (email) => {
    const response = await apiClient.post('/api/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (token, password) => {
    const response = await apiClient.post(`/api/auth/reset-password/${token}`, { password });
    return response.data;
  }
};
