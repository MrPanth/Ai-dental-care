import apiClient from './apiClient';

export const doctorService = {
  getStats: async () => {
    const response = await apiClient.get('/api/doctor/stats');
    return response.data;
  },

  getReports: async () => {
    const response = await apiClient.get('/api/doctor/reports');
    return response.data;
  },

  getReportDetails: async (id) => {
    const response = await apiClient.get(`/api/doctor/reports/${id}`);
    return response.data;
  },

  submitReview: async (id, { notes, recommendation }) => {
    const response = await apiClient.put(`/api/doctor/reports/${id}/feedback`, { notes, recommendation });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/api/doctor/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await apiClient.put('/api/doctor/profile', profileData);
    return response.data;
  }
};
