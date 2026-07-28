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
  completeAppointment 
} = require('../controllers/appointmentController');

// All appointment routes require authentication
router.use(protect);

// Patients can book appointments
router.post('/book', authorize('patient'), bookAppointment);

// Patient cancels appointment
router.post('/:id/cancel', authorize('patient'), cancelAppointment);

// Doctors confirm, reject, complete appointments
router.put('/:id/confirm', authorize('doctor'), confirmAppointment);
router.put('/:id/reject', authorize('doctor'), rejectAppointment);
router.put('/:id/complete', authorize('doctor'), completeAppointment);

// Anyone (Doctor, Patient, Admin) can get their respective appointments
router.get('/my-appointments', getMyAppointments);

module.exports = router;
