const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  specialization: {
    type: String,
    required: true,
    enum: ['General Dentistry', 'Orthodontics', 'Periodontics',
      'Endodontics', 'Oral Surgery', 'Pediatric Dentistry',
      'Prosthodontics', 'Cosmetic Dentistry']
  },
  licenseNumber: { type: String, required: true, unique: true },
  experience: { type: Number, required: true },
  phone: { type: String, required: true },
  clinicName: { type: String, required: true },
  clinicAddress: { type: String, required: true },
  city: { type: String, required: true, lowercase: true, trim: true },
  isApproved: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  documents: [String],
  createdAt: { type: Date, default: Date.now }
});

DoctorSchema.index({ city: 1, isApproved: 1 });

module.exports = mongoose.model('Doctor', DoctorSchema);
