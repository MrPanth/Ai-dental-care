const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { sendAppointmentConfirmation } = require('../services/emailService');
const { appointmentSchema } = require('../utils/validators');

exports.bookAppointment = async (req, res) => {
  try {
    const validation = appointmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: 'Validation failed', errors: validation.error.format() });
    }

    const { doctorId, date, time, reportId } = req.body;
    
    const patientProfile = await Patient.findOne({ userId: req.user._id });
    if (!patientProfile) return res.status(404).json({ message: 'Patient profile not found' });
    
    const doctorProfile = await Doctor.findById(doctorId);
    if (!doctorProfile) return res.status(404).json({ message: 'Doctor not found' });
    
    // Check for duplicates/concurrency (Simple check)
    const existing = await Appointment.findOne({ doctorId: doctorProfile._id, date: new Date(date), time });
    if (existing) return res.status(400).json({ message: 'This slot is already booked' });

    const appointment = await Appointment.create({
      patientId: patientProfile._id,
      doctorId: doctorProfile._id,
      patientName: patientProfile.name,
      doctorName: doctorProfile.name,
      doctorClinicName: doctorProfile.clinicName,
      doctorClinicAddress: doctorProfile.clinicAddress,
      date: new Date(date),
      time: time || "Not specified",
      reportId: reportId || null
    });
    
    // Non-blocking operations
    sendAppointmentConfirmation(appointment, patientProfile, doctorProfile)
      .catch(err => console.error('Delayed email error:', err));
    
    const io = req.app.get('socketio');
    if (io) {
      io.to(doctorProfile.userId.toString()).emit('notification', {
        type: 'new_appointment',
        message: `New appointment booked by ${patientProfile.name} on ${new Date(date).toLocaleDateString()}`,
        appointmentId: appointment._id
      });
      io.to(req.user._id.toString()).emit('notification', {
        type: 'appointment_success',
        message: `Your appointment with Dr. ${doctorProfile.name} is confirmed.`,
        appointmentId: appointment._id
      });
    }

    res.status(201).json({ message: 'Appointment successfully booked.', appointment });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Server error during booking' });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    let appointments;
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      appointments = await Appointment.find({ patientId: patient._id }).sort({ date: -1 });
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      appointments = await Appointment.find({ doctorId: doctor._id }).sort({ date: -1 });
    } else {
       appointments = await Appointment.find().sort({ date: -1 });
    }

    // Batch-fetch current profilePhoto for all distinct doctors in one query
    const doctorIds = [...new Set(appointments.map(a => a.doctorId?.toString()).filter(Boolean))];
    const doctorDocs = await Doctor.find({ _id: { $in: doctorIds } }).select('_id profilePhoto');
    const photoMap = Object.fromEntries(doctorDocs.map(d => [d._id.toString(), d.profilePhoto || null]));

    const appointmentsWithPhotos = appointments.map(appt => ({
      ...appt.toObject(),
      doctorProfilePhoto: photoMap[appt.doctorId?.toString()] ?? null
    }));

    res.json({ appointments: appointmentsWithPhotos });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving appointments' });
  }
};

const notifyAppointmentUpdate = async (req, appointment, messageText) => {
  const io = req.app.get('socketio');
  if (!io) return;
  try {
    const [patient, doctor] = await Promise.all([
      Patient.findById(appointment.patientId),
      Doctor.findById(appointment.doctorId)
    ]);
    if (patient) {
      io.to(patient.userId.toString()).emit('notification', {
        type: 'appointment_updated',
        message: messageText,
        appointmentId: appointment._id
      });
    }
    if (doctor) {
      io.to(doctor.userId.toString()).emit('notification', {
        type: 'appointment_updated',
        message: messageText,
        appointmentId: appointment._id
      });
    }
  } catch (err) {
    console.error('Socket notification error:', err);
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const patientProfile = await Patient.findOne({ userId: req.user._id });
    if (!patientProfile) return res.status(404).json({ message: 'Patient profile not found' });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.patientId.toString() !== patientProfile._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    appointment.status = 'canceled';
    await appointment.save();

    await notifyAppointmentUpdate(
      req,
      appointment,
      `Appointment with ${appointment.patientName} has been canceled.`
    );

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error during cancellation' });
  }
};

exports.confirmAppointment = async (req, res) => {
  try {
    const doctorProfile = await Doctor.findOne({ userId: req.user._id });
    if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.doctorId.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to confirm this appointment' });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending appointments can be confirmed' });
    }

    appointment.status = 'confirmed';
    await appointment.save();

    await notifyAppointmentUpdate(
      req,
      appointment,
      `Your appointment with Dr. ${appointment.doctorName} is confirmed.`
    );

    res.json({
      success: true,
      message: 'Appointment confirmed successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Confirm appointment error:', error);
    res.status(500).json({ message: 'Server error during confirmation' });
  }
};

exports.rejectAppointment = async (req, res) => {
  try {
    const doctorProfile = await Doctor.findOne({ userId: req.user._id });
    if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.doctorId.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this appointment' });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending appointments can be rejected' });
    }

    appointment.status = 'canceled';
    await appointment.save();

    await notifyAppointmentUpdate(
      req,
      appointment,
      `Your appointment request with Dr. ${appointment.doctorName} was declined.`
    );

    res.json({
      success: true,
      message: 'Appointment request rejected',
      data: appointment
    });
  } catch (error) {
    console.error('Reject appointment error:', error);
    res.status(500).json({ message: 'Server error during rejection' });
  }
};

exports.completeAppointment = async (req, res) => {
  try {
    const doctorProfile = await Doctor.findOne({ userId: req.user._id });
    if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.doctorId.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this appointment' });
    }

    if (appointment.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed appointments can be marked completed' });
    }

    appointment.status = 'completed';
    await appointment.save();

    await notifyAppointmentUpdate(
      req,
      appointment,
      `Your appointment with Dr. ${appointment.doctorName} is completed.`
    );

    res.json({
      success: true,
      message: 'Appointment marked completed',
      data: appointment
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({ message: 'Server error during completion' });
  }
};

exports.rescheduleAppointment = async (req, res) => {
  try {
    const { date, time } = req.body;
    if (!date || !time) {
      return res.status(400).json({ message: 'Date and time are required' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const patientProfile = await Patient.findOne({ userId: req.user._id });
    if (!patientProfile || appointment.patientId.toString() !== patientProfile._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reschedule this appointment' });
    }

    const existing = await Appointment.findOne({
      doctorId: appointment.doctorId,
      date: new Date(date),
      time,
      _id: { $ne: appointment._id }
    });
    if (existing) {
      return res.status(400).json({ message: 'This slot is already booked' });
    }

    appointment.date = new Date(date);
    appointment.time = time;
    appointment.status = 'pending';
    await appointment.save();

    await notifyAppointmentUpdate(
      req,
      appointment,
      `Appointment with ${appointment.patientName} has been rescheduled to ${new Date(date).toLocaleDateString()} at ${time}.`
    );

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({ message: 'Server error during rescheduling' });
  }
};

