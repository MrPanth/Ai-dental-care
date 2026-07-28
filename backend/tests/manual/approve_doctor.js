const mongoose = require('mongoose');
const Doctor = require('../../src/models/Doctor');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare_db');
  console.log('Connected to DB');

  const doctor = await Doctor.findOne({ email: 'dave.test@example.com' });
  if (!doctor) {
    console.error('Test doctor not found!');
    process.exit(1);
  }

  doctor.isApproved = true;
  await doctor.save();
  console.log('Doctor dave.test@example.com approved successfully.');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch(console.error);
