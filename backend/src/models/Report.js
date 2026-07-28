const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  patientCity: { type: String, required: true, lowercase: true, trim: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  doctorName: { type: String, default: '' },
  doctorCity: { type: String, default: '', lowercase: true, trim: true },
  imagePath: { type: String, required: true },
  aiFindings: {
    issueDetected: { type: Boolean, required: true },
    confidence: { type: Number, min: 0, max: 100 },
    conditions: [String],
    severity: { type: String, enum: ['none', 'mild', 'moderate', 'severe'] },
    description: { type: String }
  },
  doctorFeedback: {
    reviewed: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    recommendation: {
      type: String,
      enum: ['', 'Immediate treatment needed', 'Schedule appointment within a week',
        'Schedule appointment within a month', 'Monitor condition',
        'No action needed', 'Refer to specialist'],
      default: ''
    },
    reviewedAt: { type: Date, default: null }
  },
  status: {
    type: String,
    enum: ['no_issue', 'pending_no_doctor', 'assigned', 'reviewed', 'closed', 'processing', 'completed', 'failed'],
    default: 'processing'
  },
  errorMessage: { type: String, default: null },
  locationMatched: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

ReportSchema.index({ patientCity: 1 });
ReportSchema.index({ doctorId: 1 });
ReportSchema.index({ status: 1 });

module.exports = mongoose.model('Report', ReportSchema);
