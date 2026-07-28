const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getPendingDoctors, getApprovedDoctors, getDoctorById,
  approveDoctor, rejectDoctor, deleteDoctor,
  getAllReports, getStats
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/doctors/pending', getPendingDoctors);
router.get('/doctors/approved', getApprovedDoctors);
router.get('/doctors/:id', getDoctorById);
router.put('/doctors/:id/approve', approveDoctor);
router.put('/doctors/:id/reject', rejectDoctor);
router.delete('/doctors/:id', deleteDoctor);
router.get('/reports', getAllReports);
router.get('/stats', getStats);

module.exports = router;
