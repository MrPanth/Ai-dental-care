const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');

describe('Authentication API', () => {
  beforeAll(async () => {
    // Connect to test database or reuse connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (app.server) {
      await new Promise(resolve => app.server.close(resolve));
    }
  });

  beforeEach(async () => {
    // Clear users before each test (optional)
    // await User.deleteMany({ email: { $ne: 'admin@dentalcare.com' } });
  });

  it('should register a new patient', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Patient',
        email: `test-${Date.now()}@example.com`,
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'patient',
        city: 'mumbai'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should login an existing admin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@dentalcare.com',
        password: 'Admin@123'
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toEqual('admin');
  });
});
