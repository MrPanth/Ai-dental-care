const Doctor = require('../models/Doctor');
const Report = require('../models/Report');
const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    res.json({ doctor });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const { phone, clinicName, clinicAddress, city, specialization, experience } = req.body;
    if (phone) doctor.phone = phone;
    if (clinicName) doctor.clinicName = clinicName;
    if (clinicAddress) doctor.clinicAddress = clinicAddress;
    if (specialization) doctor.specialization = specialization;
    if (experience) doctor.experience = Number(experience);
    if (city) {
      doctor.city = city.toLowerCase().trim();
      // Also update user city
      await User.findByIdAndUpdate(req.user._id, { city: city.toLowerCase().trim() });
    }
    if (req.file) {
      doctor.profilePhoto = `/uploads/${req.file.filename}`;
    }
    await doctor.save();
    res.json({ message: 'Profile updated', doctor });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    if (!doctor.isApproved) return res.status(403).json({ message: 'Account not yet approved' });

    const reports = await Report.find({
      doctorId: doctor._id,
      patientCity: doctor.city
    }).sort({ createdAt: -1 });

    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (!report.doctorId) {
      return res.status(403).json({ message: 'Report is not assigned to a doctor yet' });
    }

    if (report.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Access denied. This report is not assigned to you.' });
    }
    if (report.patientCity !== doctor.city) {
      return res.status(403).json({ message: 'Access denied. Location mismatch.' });
    }

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addFeedback = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (!report.doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Report is not assigned to this doctor'
      });
    }

    if (report.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This report is not assigned to you.'
      });
    }
    if (report.patientCity !== doctor.city) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Location mismatch.'
      });
    }

    const { notes, recommendation } = req.body;
    report.doctorFeedback = {
      reviewed: true,
      notes: notes || '',
      recommendation: recommendation || '',
      reviewedAt: new Date()
    };
    report.status = 'reviewed';
    await report.save();

    res.json({ message: 'Feedback submitted', report });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const totalReports = await Report.countDocuments({ doctorId: doctor._id });
    const pendingReports = await Report.countDocuments({ doctorId: doctor._id, status: 'assigned' });
    const reviewedReports = await Report.countDocuments({ doctorId: doctor._id, status: 'reviewed' });
    const recentReports = await Report.find({ doctorId: doctor._id }).sort({ createdAt: -1 }).limit(5);

    res.json({ totalReports, pendingReports, reviewedReports, recentReports, doctor });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
