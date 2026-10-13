const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { 
  bookAppointment, 
  getMyAppointments, 
  cancelAppointment, 
  confirmAppointment, 
  rejectAppointment, 
  completeAppointment,
  rescheduleAppointment,
  getBookedSlots
} = require('../controllers/appointmentController');

// All appointment routes require authentication
router.use(protect);

// Patients can book/reschedule appointments
router.post('/book', authorize('patient'), bookAppointment);
router.put('/:id/reschedule', authorize('patient'), rescheduleAppointment);

// Patient cancels appointment
router.post('/:id/cancel', authorize('patient'), cancelAppointment);

// Doctors confirm, reject, complete appointments
router.put('/:id/confirm', authorize('doctor'), confirmAppointment);
router.put('/:id/reject', authorize('doctor'), rejectAppointment);
router.put('/:id/complete', authorize('doctor'), completeAppointment);


// Patient gets booked slots for a doctor on a date
router.get('/booked-slots', authorize('patient'), getBookedSlots);

// Anyone (Doctor, Patient, Admin) can get their respective appointments
router.get('/my-appointments', getMyAppointments);

module.exports = router;
