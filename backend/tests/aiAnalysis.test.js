const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Report = require('../src/models/Report');
const fs = require('fs');

// Require the actual GoogleGenerativeAI and mock its prototype
const { GoogleGenerativeAI } = require('@google/generative-ai');

const mockGenerateContent = jest.fn();
GoogleGenerativeAI.prototype.getGenerativeModel = function() {
  return {
    generateContent: mockGenerateContent
  };
};

// Mock Sharp
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => {
    return {
      metadata: jest.fn().mockResolvedValue({ format: 'jpeg', width: 200, height: 200 })
    };
  });
});

describe('AI Analysis Pipeline Reliability', () => {
  let patientToken, patientId, testUserEmail, testUserId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare_db');
    }

    testUserEmail = 'ai_tester@example.com';
    await User.deleteMany({ email: testUserEmail });
    await Patient.deleteMany({});
    await Report.deleteMany({});

    // Create Patient User
    const user = await User.create({
      name: 'AI Tester',
      email: testUserEmail,
      password: 'Password123',
      role: 'patient',
      city: 'mumbai'
    });
    testUserId = user._id;

    const patient = await Patient.create({
      userId: user._id,
      name: 'AI Tester',
      email: testUserEmail,
      city: 'mumbai'
    });
    patientId = patient._id;

    // Get Token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUserEmail, password: 'Password123' });
    patientToken = loginRes.body.token;

    // Mock readFileSync to prevent missing file errors
    jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('dummy-image-data'));
  });

  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  afterAll(async () => {
    await User.deleteMany({ email: testUserEmail });
    await Patient.deleteMany({});
    await Report.deleteMany({});
    await mongoose.connection.close();
    if (app.server) {
      await new Promise(resolve => app.server.close(resolve));
    }
    jest.restoreAllMocks();
  });

  const waitForReportStatus = async (reportId) => {
    for (let i = 0; i < 20; i++) {
      const r = await Report.findById(reportId);
      if (r.status !== 'processing') {
        return r;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return await Report.findById(reportId);
  };

  it('Test 1: should successfully process a valid dental image and set status to completed', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          issueDetected: true,
          confidence: 90,
          conditions: ['Cavity'],
          severity: 'mild',
          description: 'A mild cavity was found. Please visit a dentist.'
        })
      }
    });

    const res = await request(app)
      .post('/api/patient/upload-scan')
      .set('Authorization', `Bearer ${patientToken}`)
      .attach('image', Buffer.from('dummy'), 'teeth.jpg');

    expect(res.statusCode).toEqual(202);
    expect(res.body.status).toEqual('processing');

    const finishedReport = await waitForReportStatus(res.body.reportId);
    expect(finishedReport.status).toEqual('completed');
    expect(finishedReport.aiFindings.issueDetected).toBe(true);
    expect(finishedReport.aiFindings.severity).toEqual('mild');
  });

  it('Test 2: should fail on an invalid dental image and set status to failed', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'INVALID_IMAGE'
      }
    });

    const res = await request(app)
      .post('/api/patient/upload-scan')
      .set('Authorization', `Bearer ${patientToken}`)
      .attach('image', Buffer.from('dummy'), 'face.jpg');

    expect(res.statusCode).toEqual(202);

    const finishedReport = await waitForReportStatus(res.body.reportId);
    expect(finishedReport.status).toEqual('failed');
    expect(finishedReport.errorMessage).toEqual('Uploaded image is not a valid dental scan');
    expect(finishedReport.aiFindings.description).toEqual('Uploaded image is not a valid dental scan');
  });

  it('Test 3: should handle Gemini timeout, perform retries, and set final status to failed', async () => {
    // Mock generateContent to hang indefinitely to trigger timeout race
    mockGenerateContent.mockImplementation(() => {
      return new Promise(resolve => setTimeout(resolve, 1000));
    });

    const res = await request(app)
      .post('/api/patient/upload-scan')
      .set('Authorization', `Bearer ${patientToken}`)
      .attach('image', Buffer.from('dummy'), 'teeth.jpg');

    expect(res.statusCode).toEqual(202);

    const finishedReport = await waitForReportStatus(res.body.reportId);
    expect(finishedReport.status).toEqual('failed');
    expect(finishedReport.errorMessage).toEqual('AI analysis unavailable');
    // Ensure it attempted 3 times
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  });

  it('Test 4: should succeed if temporary failure resolves during retry attempts', async () => {
    // First call fails with timeout, second call succeeds
    let callCount = 0;
    mockGenerateContent.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return new Promise(resolve => setTimeout(resolve, 1000)); // Will timeout
      }
      return Promise.resolve({
        response: {
          text: () => JSON.stringify({
            issueDetected: false,
            confidence: 95,
            conditions: [],
            severity: 'none',
            description: 'Healthy teeth.'
          })
        }
      });
    });

    const res = await request(app)
      .post('/api/patient/upload-scan')
      .set('Authorization', `Bearer ${patientToken}`)
      .attach('image', Buffer.from('dummy'), 'teeth.jpg');

    expect(res.statusCode).toEqual(202);

    const finishedReport = await waitForReportStatus(res.body.reportId);
    expect(finishedReport.status).toEqual('completed');
    expect(finishedReport.aiFindings.issueDetected).toBe(false);
    expect(finishedReport.aiFindings.confidence).toEqual(95);
  });

  it('Test 5: should ensure server continues running during AI service failures', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Generic network crash'));

    const res = await request(app)
      .post('/api/patient/upload-scan')
      .set('Authorization', `Bearer ${patientToken}`)
      .attach('image', Buffer.from('dummy'), 'teeth.jpg');

    expect(res.statusCode).toEqual(202);

    const finishedReport = await waitForReportStatus(res.body.reportId);
    expect(finishedReport.status).toEqual('failed');
    expect(finishedReport.errorMessage).toEqual('AI analysis unavailable');
  });
});
