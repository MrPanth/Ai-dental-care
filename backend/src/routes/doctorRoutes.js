const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploader } = require('../utils/uploader');
const {
  getProfile, updateProfile, getReports,
  getReportById, addFeedback, getStats
} = require('../controllers/doctorController');

router.use(protect, authorize('doctor'));

router.get('/profile', getProfile);
router.put('/profile', uploader.single('profilePhoto'), updateProfile);
router.get('/reports', getReports);
router.get('/reports/:id', getReportById);
router.put('/reports/:id/feedback', addFeedback);
router.get('/stats', getStats);

module.exports = router;
