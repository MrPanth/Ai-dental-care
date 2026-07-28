const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Report = require('../models/Report');
const User = require('../models/User');
const analyzeImage = require('../services/aiService');
const { patientProfileSchema } = require('../utils/validators');

exports.getProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient profile not found' });
    res.json({ patient });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const validation = patientProfileSchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ message: 'Validation failed', errors: validation.error.format() });

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient profile not found' });

    const { phone, age, gender, medicalHistory, city } = req.body;
    if (phone) patient.phone = phone;
    if (age) patient.age = Number(age);
    if (gender) patient.gender = gender;
    if (medicalHistory !== undefined) patient.medicalHistory = medicalHistory;
    if (city) {
      const normalizedCity = city.toLowerCase().trim();
      patient.city = normalizedCity;
      await User.findByIdAndUpdate(req.user._id, { city: normalizedCity });
    }
    await patient.save();
    res.json({ message: 'Profile updated', patient });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * ⚡ PRO PRODUCTION UPGRADE: 
 * AI processing is now a non-blocking background task.
 */
exports.uploadScan = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient profile not found' });
    if (!req.file) return res.status(400).json({ message: 'Please upload a dental image' });

    // 1. Create a "processing" report immediately
    const report = new Report({
      patientId: patient._id,
      patientName: patient.name,
      patientCity: patient.city,
      imagePath: `/uploads/${req.file.filename}`,
      aiFindings: { issueDetected: false, confidence: 0, conditions: [], description: "Analyzing image..." },
      status: 'processing'
    });
    
    await report.save();

    // 2. Respond immediately to the client
    res.status(202).json({ 
      message: 'Image received. AI analysis is running in the background. You will be notified when complete.', 
      reportId: report._id,
      status: 'processing'
    });

    // 3. Process in background using setImmediate
    setImmediate(async () => {
      const io = req.app.get('socketio');
      const userIdStr = req.user._id.toString();

      if (io) {
        io.to(userIdStr).emit('AI_ANALYSIS_STARTED', {
          message: 'Your dental scan is being analyzed',
          reportId: report._id
        });
        io.to(userIdStr).emit('notification', {
          type: 'AI_ANALYSIS_STARTED',
          message: 'Your dental scan is being analyzed',
          reportId: report._id
        });
      }

      try {
        // Run AI analysis
        const aiResults = await analyzeImage(req.file.path);
        
        report.aiFindings = aiResults;
        report.status = 'completed';
        
        if (aiResults.issueDetected) {
          const matchingDoctors = await Doctor.find({
            city: patient.city.toLowerCase().trim(),
            isApproved: true
          });

          if (matchingDoctors.length > 0) {
            // Simple load balancing: find doctor with fewer assigned reports
            let selectedDoctor = null;
            let minReports = Infinity;

            for (const doc of matchingDoctors) {
              const reportCount = await Report.countDocuments({
                doctorId: doc._id,
                status: { $in: ['assigned', 'reviewed', 'completed'] }
              });
              if (reportCount < minReports) { minReports = reportCount; selectedDoctor = doc; }
            }

            report.doctorId = selectedDoctor._id;
            report.doctorName = selectedDoctor.name;
            report.doctorCity = selectedDoctor.city;
            report.locationMatched = true;
          } else {
            report.locationMatched = false;
          }
        }

        await report.save();

        // 4. Notify via Socket.io
        if (io) {
          io.to(userIdStr).emit('AI_ANALYSIS_COMPLETED', {
            message: 'Your dental report is ready',
            reportId: report._id
          });
          io.to(userIdStr).emit('notification', {
            type: 'AI_ANALYSIS_COMPLETED',
            message: 'Your dental report is ready',
            reportId: report._id,
            status: report.status
          });
        }
      } catch (bgError) {
        console.error('Background AI Processing Error:', bgError);
        
        report.status = 'failed';
        const isInvalidImage = bgError.message.includes('Only teeth images are allowed');
        report.errorMessage = isInvalidImage ? 'Uploaded image is not a valid dental scan' : 'AI analysis unavailable';
        report.aiFindings.description = report.errorMessage;
        await report.save();
        
        if (io) {
          io.to(userIdStr).emit('AI_ANALYSIS_FAILED', {
            message: 'Unable to analyze scan. Please try again.',
            reportId: report._id
          });
          io.to(userIdStr).emit('notification', {
            type: 'AI_ANALYSIS_FAILED',
            message: 'Unable to analyze scan. Please try again.',
            reportId: report._id
          });
        }
      }
    });

  } catch (error) {
    console.error('Upload scan error:', error);
    res.status(500).json({ message: 'Server error during scan initiation' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient profile not found' });
    const reports = await Report.find({ patientId: patient._id }).sort({ createdAt: -1 });
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient profile not found' });
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.patientId.toString() !== patient._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient profile not found' });
    const doctors = await Doctor.find({ city: patient.city, isApproved: true });
    res.json({ doctors, city: patient.city });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
