const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');

describe('Password Recovery API Workflow', () => {
  let testUserToken, testUserEmail, testUserId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare_db');
    }

    testUserEmail = 'recovery_tester@example.com';
    await User.deleteMany({ email: testUserEmail });

    // Create a tester user
    const user = await User.create({
      name: 'Recovery Tester',
      email: testUserEmail,
      password: 'OldPassword123',
      role: 'patient',
      city: 'mumbai'
    });
    testUserId = user._id;
  });

  afterAll(async () => {
    await User.deleteMany({ email: testUserEmail });
    await mongoose.connection.close();
    if (app.server) {
      await new Promise(resolve => app.server.close(resolve));
    }
  });

  it('should request password reset for existing user and set reset token in database', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUserEmail });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('If the email exists, a reset link has been sent');

    // Verify database updates
    const updatedUser = await User.findById(testUserId);
    expect(updatedUser.resetPasswordToken).not.toBeNull();
    expect(updatedUser.resetPasswordExpire).not.toBeNull();
    expect(updatedUser.resetPasswordExpire.getTime()).toBeGreaterThan(Date.now());
  });

  it('should return 200 OK without leakage when requesting password reset for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent_user@example.com' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('If the email exists, a reset link has been sent');
  });

  it('should fail to reset password if token is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password/thisisinvalidtoken')
      .send({ password: 'NewPassword123' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toEqual('Invalid or expired token');
  });

  it('should fail to reset password if token is expired', async () => {
    // Generate token
    const crypto = require('crypto');
    const rawToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Set token with expired date
    await User.findByIdAndUpdate(testUserId, {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: Date.now() - 1000 // 1 second ago
    });

    const res = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: 'NewPassword123' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toEqual('Invalid or expired token');
  });

  it('should reset password successfully with a valid token', async () => {
    // Generate valid token
    const crypto = require('crypto');
    const rawToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await User.findByIdAndUpdate(testUserId, {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: Date.now() + 15 * 60 * 1000 // 15 mins
    });

    const res = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: 'NewPassword123' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toEqual('Password reset successful');

    // Verify token fields are cleared in database
    const updatedUser = await User.findById(testUserId);
    expect(updatedUser.resetPasswordToken).toBeNull();
    expect(updatedUser.resetPasswordExpire).toBeNull();
  });

  it('should successfully login with the new password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: 'NewPassword123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toEqual(testUserEmail);
  });
});
