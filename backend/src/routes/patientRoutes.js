const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const multer = require('multer');
const path = require('path');
const {
  getProfile, updateProfile, uploadScan,
  getReports, getReportById, getDoctors
} = require('../controllers/patientController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `scan-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only JPEG and PNG images are allowed'));
  }
});

router.use(protect, authorize('patient'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/upload-scan', upload.single('image'), uploadScan);
router.get('/reports', getReports);
router.get('/reports/:id', getReportById);
router.get('/doctors', getDoctors);

module.exports = router;
