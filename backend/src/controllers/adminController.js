const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Report = require('../models/Report');
const User = require('../models/User');

exports.getPendingDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isApproved: false }).sort({ createdAt: -1 });
    const result = await Promise.all(doctors.map(async (doc) => {
      const pendingReports = await Report.countDocuments({ patientCity: doc.city, status: 'pending_no_doctor' });
      return { ...doc.toObject(), pendingReportsInCity: pendingReports };
    }));
    res.json({ doctors: result });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getApprovedDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isApproved: true }).sort({ approvedAt: -1 });
    const result = await Promise.all(doctors.map(async (doc) => {
      const assignedReports = await Report.countDocuments({ doctorId: doc._id });
      return { ...doc.toObject(), assignedReportsCount: assignedReports };
    }));
    res.json({ doctors: result });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ doctor });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    doctor.isApproved = true;
    doctor.approvedBy = req.user._id;
    doctor.approvedAt = new Date();
    await doctor.save();

    // Auto-assign pending reports in same city
    const unassignedReports = await Report.find({
      patientCity: doctor.city,
      status: 'pending_no_doctor',
      doctorId: null
    });

    let assignedCount = 0;
    for (const report of unassignedReports) {
      report.doctorId = doctor._id;
      report.doctorName = doctor.name;
      report.doctorCity = doctor.city;
      report.status = 'assigned';
      report.locationMatched = true;
      await report.save();
      assignedCount++;
    }

    res.json({ message: `Doctor approved. ${assignedCount} pending report(s) auto-assigned.`, doctor });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rejectDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    await User.findByIdAndDelete(doctor.userId);
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Doctor rejected and removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    await User.findByIdAndDelete(doctor.userId);
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Doctor removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const { city, status } = req.query;
    let filter = {};
    if (city) filter.patientCity = city.toLowerCase().trim();
    if (status) filter.status = status;
    const reports = await Report.find(filter).sort({ createdAt: -1 });
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalDoctors = await Doctor.countDocuments({ isApproved: true });
    const pendingDoctors = await Doctor.countDocuments({ isApproved: false });
    const totalPatients = await Patient.countDocuments();
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending_no_doctor' });
    const assignedReports = await Report.countDocuments({ status: 'assigned' });
    const reviewedReports = await Report.countDocuments({ status: 'reviewed' });

    // City-wise doctor distribution
    const cityDist = await Doctor.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalDoctors, pendingDoctors, totalPatients, totalReports,
      pendingReports, assignedReports, reviewedReports,
      cityDistribution: cityDist
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
