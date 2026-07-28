const fs = require('fs');
const path = require('path');

async function testScanFlow() {
  const SERVER_URL = 'http://localhost:5001';
  const email = 'jane.doe@example.com';
  const password = 'Password123';
  const imagePath = 'c:\\Users\\ganji\\OneDrive\\Pictures\\AI-Dental-Care\\AI-Dental-Care\\for meeeee\\frontend\\teeth_sample.png';

  console.log('1. Logging in as Patient (jane.doe@example.com)...');
  const loginRes = await fetch(`${SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
    return;
  }

  const { token } = await loginRes.json();
  console.log('Login successful. Token obtained.');

  console.log('2. Preparing multipart/form-data with teeth_sample.png...');
  // We can construct a simple boundary-based multipart form since we don't have form-data library globally
  const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
  const fileBuffer = fs.readFileSync(imagePath);
  const fileName = 'teeth_sample.png';

  const header = 
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="image"; filename="${fileName}"\r\n` +
    `Content-Type: image/png\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;

  const requestBody = Buffer.concat([
    Buffer.from(header, 'utf-8'),
    fileBuffer,
    Buffer.from(footer, 'utf-8')
  ]);

  console.log('3. Uploading scan to /api/patient/upload-scan...');
  const uploadRes = await fetch(`${SERVER_URL}/api/patient/upload-scan`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: requestBody
  });

  if (uploadRes.status !== 202) {
    console.error('Upload failed:', uploadRes.status, await uploadRes.text());
    return;
  }

  const uploadData = await uploadRes.json();
  console.log('Upload Accepted! Response:', uploadData);
  const reportId = uploadData.reportId;

  console.log('4. Waiting 12 seconds for background AI analysis to complete...');
  await new Promise(resolve => setTimeout(resolve, 12000));

  console.log('5. Retrieving scan report details...');
  const reportRes = await fetch(`${SERVER_URL}/api/patient/reports/${reportId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!reportRes.ok) {
    console.error('Failed to get report:', await reportRes.text());
    return;
  }

  const { report } = await reportRes.json();
  console.log('\n--- SCAN RESULTS ---');
  console.log('Report ID:', report._id);
  console.log('Status:', report.status);
  console.log('Location Matched:', report.locationMatched);
  console.log('AI Findings:', JSON.stringify(report.aiFindings, null, 2));
  console.log('Matched Doctor:', report.doctorName || 'None');
  console.log('--------------------\n');
}

testScanFlow().catch(console.error);
