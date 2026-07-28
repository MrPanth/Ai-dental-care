const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { registerSchema, loginSchema } = require('../utils/validators');
const { sendPasswordResetEmail } = require('../services/emailService');

const CITIES = [
  'mumbai', 'delhi', 'bangalore', 'hyderabad', 'ahmedabad',
  'chennai', 'kolkata', 'pune', 'jaipur', 'lucknow',
  'kanpur', 'nagpur', 'indore', 'thane', 'bhopal',
  'visakhapatnam', 'pimpri-chinchwad', 'patna', 'vadodara',
  'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad',
  'meerut', 'rajkot', 'varanasi', 'srinagar', 'aurangabad',
  'dhanbad', 'amritsar', 'navi mumbai', 'allahabad',
  'ranchi', 'howrah', 'coimbatore', 'jabalpur', 'gwalior',
  'vijayawada', 'jodhpur', 'madurai', 'raipur', 'kota',
  'chandigarh', 'guwahati', 'solapur', 'hubli-dharwad',
  'mysore', 'tiruchirappalli', 'bareilly', 'aligarh',
  'tiruppur', 'moradabad', 'jalandhar', 'bhubaneswar',
  'salem', 'warangal', 'guntur', 'bhiwandi', 'saharanpur',
  'gorakhpur', 'bikaner', 'amravati', 'noida', 'jamshedpur',
  'bhilai', 'cuttack', 'firozabad', 'kochi', 'nellore',
  'bhavnagar', 'dehradun', 'durgapur', 'asansol', 'rourkela',
  'nanded', 'kolhapur', 'ajmer', 'akola', 'gulbarga',
  'jamnagar', 'ujjain', 'loni', 'siliguri', 'jhansi',
  'ulhasnagar', 'jammu', 'sangli-miraj', 'mangalore',
  'erode', 'belgaum', 'ambattur', 'tirunelveli', 'malegaon',
  'gaya', 'jalgaon', 'udaipur', 'maheshtala'
];

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });
};

exports.register = async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: 'Validation failed', errors: validation.error.format() });
    }

    const { name, email, password, role, city,
      specialization, licenseNumber, experience, phone,
      clinicName, clinicAddress, age, gender, medicalHistory } = req.body;

    const normalizedCity = city.toLowerCase().trim();
    if (!CITIES.includes(normalizedCity)) {
      return res.status(400).json({ message: 'Please select a valid city from the list' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role, city: normalizedCity });

    if (role === 'doctor') {
      if (!specialization || !licenseNumber || !experience || !phone || !clinicName || !clinicAddress) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: 'Missing required doctor fields' });
      }
      const existingLicense = await Doctor.findOne({ licenseNumber });
      if (existingLicense) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: 'License number already registered' });
      }
      const documents = req.files ? req.files.map(f => f.path) : [];
      await Doctor.create({
        userId: user._id, name, email,
        specialization, licenseNumber,
        experience: Number(experience), phone, clinicName, clinicAddress,
        city: normalizedCity, documents
      });
    } else {
      await Patient.create({
        userId: user._id, name, email,
        age: age ? Number(age) : undefined,
        gender, phone, city: normalizedCity,
        medicalHistory: medicalHistory || ''
      });
    }

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        city: user.city,
        isApproved: role === 'doctor' ? false : undefined
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: 'Invalid input', errors: validation.error.format() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    let isApproved = undefined;
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }
      isApproved = doctor.isApproved;
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        city: user.city,
        isApproved
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    let profile = null;
    if (user.role === 'doctor') profile = await Doctor.findOne({ userId: user._id });
    else if (user.role === 'patient') profile = await Patient.findOne({ userId: user._id });
    res.json({ user, profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCities = (req, res) => {
  res.json({ cities: CITIES });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Safe response to prevent enumeration
      return res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      });
    }

    // Generate secure token
    const rawToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Store token with 15 minutes expiry
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (emailError) {
      console.error('Forgot password email send error:', emailError);
    }

    res.json({
      success: true,
      message: 'If the email exists, a reset link has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
