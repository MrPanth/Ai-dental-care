const { z } = require('zod');

// Auth validation
exports.registerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6),
  role: z.enum(['doctor', 'patient']),
  city: z.string(),
  // Doctor optional fields (validatet in controller if role === 'doctor')
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  experience: z.string().or(z.number()).optional(),
  phone: z.string().optional(),
  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
  // Patient optional fields
  age: z.string().or(z.number()).optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  medicalHistory: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

exports.loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Appointment validation
exports.appointmentSchema = z.object({
  doctorId: z.string(),
  date: z.string().or(z.date()),
  time: z.string().min(1, "Time is required"),
  reportId: z.string().optional().nullable()
});

// Profile validation
exports.patientProfileSchema = z.object({
  phone: z.string().optional(),
  age: z.string().or(z.number()).optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  medicalHistory: z.string().optional(),
  city: z.string().optional()
});

exports.doctorProfileSchema = z.object({
  phone: z.string().optional(),
  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
  experience: z.string().or(z.number()).optional(),
  specialization: z.string().optional(),
  city: z.string().optional()
});
