const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploader } = require('../utils/uploader');
const {
  getProfile, updateProfile, uploadScan,
  getReports, getReportById, getDoctors
} = require('../controllers/patientController');

router.use(protect, authorize('patient'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/upload-scan', uploader.single('image'), uploadScan);
router.get('/reports', getReports);
router.get('/reports/:id', getReportById);
router.get('/doctors', getDoctors);

module.exports = router;
