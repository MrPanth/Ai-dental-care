import apiClient from './apiClient';

export const appointmentService = {
  getMyAppointments: async () => {
    const response = await apiClient.get('/api/appointments/my-appointments');
    return response.data;
  },

  bookAppointment: async ({ doctorId, date, time, reportId }) => {
    const response = await apiClient.post('/api/appointments/book', { doctorId, date, time, reportId });
    return response.data;
  },

  cancelAppointment: async (id) => {
    const response = await apiClient.post(`/api/appointments/${id}/cancel`);
    return response.data;
  },

  rescheduleAppointment: async (id, { date, time }) => {
    const response = await apiClient.put(`/api/appointments/${id}/reschedule`, { date, time });
    return response.data;
  },

  getBookedSlots: async (doctorId, date) => {
    const response = await apiClient.get(`/api/appointments/booked-slots?doctorId=${doctorId}&date=${date}`);
    return response.data;
  }
};
