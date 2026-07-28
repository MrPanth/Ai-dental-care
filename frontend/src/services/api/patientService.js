import apiClient from './apiClient';

export const patientService = {
  getReports: async () => {
    const response = await apiClient.get('/api/patient/reports');
    return response.data;
  },

  getReportDetails: async (id) => {
    const response = await apiClient.get(`/api/patient/reports/${id}`);
    return response.data;
  },

  getDoctors: async (city) => {
    const response = await apiClient.get(`/api/patient/doctors?city=${city}`);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/api/patient/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await apiClient.put('/api/patient/profile', profileData);
    return response.data;
  },

  uploadDentalScan: async (formData) => {
    const response = await apiClient.post('/api/patient/upload-scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
