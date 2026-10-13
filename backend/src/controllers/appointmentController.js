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
    
    // Check if appointment is in the past
    const apptDate = new Date(date);
    if (isNaN(apptDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date provided' });
    }

    // Parse slot time (e.g., "10:30 AM" or "02:00 PM")
    const parseSlotDateTime = (d, timeStr) => {
      const match = (timeStr || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      const slotDate = new Date(d);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const meridiem = match[3].toUpperCase();
        if (meridiem === 'PM' && hours < 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
        slotDate.setHours(hours, minutes, 0, 0);
      }
      return slotDate;
    };

    const slotDateTime = parseSlotDateTime(date, time);
    if (slotDateTime < new Date()) {
      return res.status(400).json({ message: 'Cannot book an appointment for a past date or time slot' });
    }

    // Check for duplicates/concurrency (ignoring canceled appointments)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await Appointment.findOne({ 
      doctorId: doctorProfile._id, 
      date: { $gte: startOfDay, $lte: endOfDay }, 
      time,
      status: { $nin: ['canceled'] }
    });
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
    const patientIds = [...new Set(appointments.map(a => a.patientId?.toString()).filter(Boolean))];

    const [doctorDocs, patientDocs] = await Promise.all([
      Doctor.find({ _id: { $in: doctorIds } }).select('_id profilePhoto clinicName clinicAddress specialization'),
      Patient.find({ _id: { $in: patientIds } }).select('_id name email phone age gender city medicalHistory')
    ]);

    const photoMap = Object.fromEntries(doctorDocs.map(d => [d._id.toString(), d.profilePhoto || null]));
    const patientMap = Object.fromEntries(patientDocs.map(p => [p._id.toString(), p]));

    const appointmentsWithPhotos = appointments.map(appt => ({
      ...appt.toObject(),
      doctorProfilePhoto: photoMap[appt.doctorId?.toString()] ?? null,
      patientDetails: patientMap[appt.patientId?.toString()] ?? null
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

    const apptDate = new Date(date);
    if (isNaN(apptDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date provided' });
    }

    const parseSlotDateTime = (d, timeStr) => {
      const match = (timeStr || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      const slotDate = new Date(d);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const meridiem = match[3].toUpperCase();
        if (meridiem === 'PM' && hours < 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
        slotDate.setHours(hours, minutes, 0, 0);
      }
      return slotDate;
    };

    const slotDateTime = parseSlotDateTime(date, time);
    if (slotDateTime < new Date()) {
      return res.status(400).json({ message: 'Cannot reschedule to a past date or time slot' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await Appointment.findOne({
      doctorId: appointment.doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      time,
      status: { $nin: ['canceled'] },
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

exports.getBookedSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ message: 'Doctor ID and date are required' });
    }
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['canceled'] }
    });

    const bookedSlots = appointments.map(appt => appt.time);
    res.json({ bookedSlots });
  } catch (error) {
    console.error('Get booked slots error:', error);
    res.status(500).json({ message: 'Server error fetching booked slots' });
  }
};

