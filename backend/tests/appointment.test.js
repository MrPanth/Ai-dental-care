const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Doctor = require('../src/models/Doctor');
const Appointment = require('../src/models/Appointment');

describe('Appointment API Workflow', () => {
  let patientToken, doctorToken, otherDoctorToken, patientId, doctorId, otherDoctorId;
  let testAppointmentId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare_db');
    }

    // Clean up collections for clean test run
    await User.deleteMany({ email: { $in: ['test_patient@example.com', 'test_doctor@example.com', 'other_doctor@example.com'] } });
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});

    // 1. Create Patient User & Profile
    const patientUser = await User.create({
      name: 'Test Patient',
      email: 'test_patient@example.com',
      password: 'Password123',
      role: 'patient',
      city: 'mumbai'
    });
    const patientProfile = await Patient.create({
      userId: patientUser._id,
      name: 'Test Patient',
      email: 'test_patient@example.com',
      city: 'mumbai'
    });
    patientId = patientProfile._id;

    // 2. Create Doctor User & Profile (Approved)
    const doctorUser = await User.create({
      name: 'Bob Smith',
      email: 'test_doctor@example.com',
      password: 'Password123',
      role: 'doctor',
      city: 'mumbai'
    });
    const doctorProfile = await Doctor.create({
      userId: doctorUser._id,
      name: 'Bob Smith',
      email: 'test_doctor@example.com',
      specialization: 'General Dentistry',
      licenseNumber: 'LIC-11111',
      experience: 10,
      phone: '1234567890',
      clinicName: 'Bob Dental',
      clinicAddress: '123 Bob Street',
      city: 'mumbai',
      isApproved: true
    });
    doctorId = doctorProfile._id;

    // 3. Create Other Doctor User & Profile (Approved)
    const otherDoctorUser = await User.create({
      name: 'Alice Cooper',
      email: 'other_doctor@example.com',
      password: 'Password123',
      role: 'doctor',
      city: 'mumbai'
    });
    const otherDoctorProfile = await Doctor.create({
      userId: otherDoctorUser._id,
      name: 'Alice Cooper',
      email: 'other_doctor@example.com',
      specialization: 'Oral Surgery',
      licenseNumber: 'LIC-22222',
      experience: 12,
      phone: '0987654321',
      clinicName: 'Alice Dental',
      clinicAddress: '456 Alice Street',
      city: 'mumbai',
      isApproved: true
    });
    otherDoctorId = otherDoctorProfile._id;

    // Get Login Tokens
    const patLogin = await request(app).post('/api/auth/login').send({ email: 'test_patient@example.com', password: 'Password123' });
    patientToken = patLogin.body.token;

    const docLogin = await request(app).post('/api/auth/login').send({ email: 'test_doctor@example.com', password: 'Password123' });
    doctorToken = docLogin.body.token;

    const otherDocLogin = await request(app).post('/api/auth/login').send({ email: 'other_doctor@example.com', password: 'Password123' });
    otherDoctorToken = otherDocLogin.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['test_patient@example.com', 'test_doctor@example.com', 'other_doctor@example.com'] } });
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await mongoose.connection.close();
    if (app.server) {
      await new Promise(resolve => app.server.close(resolve));
    }
  });

  it('should book a new appointment in pending status by default', async () => {
    const res = await request(app)
      .post('/api/appointments/book')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorId.toString(),
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        time: '11:00 AM'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.appointment).toHaveProperty('_id');
    expect(res.body.appointment.status).toEqual('pending');
    expect(res.body.appointment.doctorClinicName).toEqual('Bob Dental');
    expect(res.body.appointment.doctorClinicAddress).toEqual('123 Bob Street');
    testAppointmentId = res.body.appointment._id;
  });

  it('should deny unauthorized user from confirming appointment', async () => {
    const res = await request(app)
      .put(`/api/appointments/${testAppointmentId}/confirm`)
      .set('Authorization', `Bearer ${otherDoctorToken}`);

    expect(res.statusCode).toEqual(403);
  });

  it('should allow assigned doctor to confirm the pending appointment', async () => {
    const res = await request(app)
      .put(`/api/appointments/${testAppointmentId}/confirm`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toEqual('confirmed');
  });

  it('should allow doctor to complete the confirmed appointment', async () => {
    const res = await request(app)
      .put(`/api/appointments/${testAppointmentId}/complete`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toEqual('completed');
  });

  it('should allow doctor to reject a pending appointment, changing status to canceled', async () => {
    // Book another appointment
    const bookRes = await request(app)
      .post('/api/appointments/book')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorId.toString(),
        date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        time: '02:00 PM'
      });
    const apptId = bookRes.body.appointment._id;

    const res = await request(app)
      .put(`/api/appointments/${apptId}/reject`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toEqual('canceled');
  });

  it('should allow patient to cancel a pending appointment', async () => {
    // Book another appointment
    const bookRes = await request(app)
      .post('/api/appointments/book')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorId.toString(),
        date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        time: '04:00 PM'
      });
    const apptId = bookRes.body.appointment._id;

    const res = await request(app)
      .post(`/api/appointments/${apptId}/cancel`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toEqual('canceled');
  });
});
