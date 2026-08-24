const express = require('express');
const router = express.Router();
const { register, login, getMe, getCities, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { uploader } = require('../utils/uploader');

router.post('/register', uploader.array('documents', 5), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/cities', getCities);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
