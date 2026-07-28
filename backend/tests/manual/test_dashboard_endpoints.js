require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../../src/models/Doctor');
const Report = require('../../src/models/Report');

const APPROVED_DOCTOR_USER_ID = '6a4b6dbd0e3e7137e81bfe0e'; // Dr. Bob Smith
const UNASSIGNED_REPORT_ID = '6a4b72cc0e3e7137e81bfe41';   // Report with doctorId = null

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare_db');
  console.log('Connected to MongoDB');

  try {
    const doctor = await Doctor.findOne({ userId: APPROVED_DOCTOR_USER_ID });
    console.log('Doctor:', doctor.name, 'ID:', doctor._id);

    const report = await Report.findById(UNASSIGNED_REPORT_ID);
    console.log('Report ID:', report._id, 'doctorId:', report.doctorId);

    console.log('Attempting: report.doctorId.toString()');
    if (report.doctorId.toString() !== doctor._id.toString()) {
      console.log('Access denied');
    }
  } catch (error) {
    console.log('\n--- CAPTURED ERROR & STACK TRACE ---');
    console.error(error.stack);
    console.log('------------------------------------\n');
  }

  await mongoose.connection.close();
  process.exit(0);
}

run();
