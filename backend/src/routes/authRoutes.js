const express = require('express');
const router = express.Router();
const { register, login, getMe, getCities, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `doc-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only images and PDF documents are allowed for license verification'));
  }
});

router.post('/register', upload.array('documents', 5), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/cities', getCities);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
