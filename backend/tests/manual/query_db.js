const mongoose = require('mongoose');
const Report = require('../../src/models/Report');
const Appointment = require('../../src/models/Appointment');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare_db');
  console.log('Connected to DB');

  const reports = await Report.find();
  console.log('--- REPORTS ---');
  console.log(JSON.stringify(reports, null, 2));

  const appointments = await Appointment.find();
  console.log('--- APPOINTMENTS ---');
  console.log(JSON.stringify(appointments, null, 2));

  await mongoose.connection.close();
}

run().catch(console.error);
