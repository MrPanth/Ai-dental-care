const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientName: { type: String, required: true },
  doctorName: { type: String, required: true },
  doctorClinicName: { type: String },
  doctorClinicAddress: { type: String },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // e.g., "10:30 AM"
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'canceled'],
    default: 'pending'
  },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', default: null }, // Related AI scan report
  createdAt: { type: Date, default: Date.now }
});

AppointmentSchema.index({ patientId: 1, date: 1 });
AppointmentSchema.index({ doctorId: 1, date: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
