import apiClient from './apiClient';

export const adminService = {
  getStats: async () => {
    const response = await apiClient.get('/api/admin/stats');
    return response.data;
  },

  getPendingDoctors: async () => {
    const response = await apiClient.get('/api/admin/doctors/pending');
    return response.data;
  },

  getApprovedDoctors: async () => {
    const response = await apiClient.get('/api/admin/doctors/approved');
    return response.data;
  },

  getDoctorById: async (id) => {
    const response = await apiClient.get(`/api/admin/doctors/${id}`);
    return response.data;
  },

  approveDoctor: async (id) => {
    const response = await apiClient.put(`/api/admin/doctors/${id}/approve`);
    return response.data;
  },

  rejectDoctor: async (id) => {
    const response = await apiClient.put(`/api/admin/doctors/${id}/reject`);
    return response.data;
  },

  deleteDoctor: async (id) => {
    const response = await apiClient.delete(`/api/admin/doctors/${id}`);
    return response.data;
  },

  getAllReports: async (status = '') => {
    const response = await apiClient.get('/api/admin/reports', {
      params: { status }
    });
    return response.data;
  }
};
