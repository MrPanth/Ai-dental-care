const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  phone: { type: String },
  city: { type: String, required: true, lowercase: true, trim: true },
  medicalHistory: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

PatientSchema.index({ city: 1 });

module.exports = mongoose.model('Patient', PatientSchema);
