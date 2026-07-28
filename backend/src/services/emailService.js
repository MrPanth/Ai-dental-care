const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"AI Dental Care" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

const sendAppointmentConfirmation = async (appointment, patient, doctor) => {
  const patientHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #0f172a;">
      <h2 style="color: #2563eb; margin-top: 0;">Appointment Confirmed!</h2>
      <p>Hello <strong>${patient.name}</strong>,</p>
      <p>Your dental appointment has been successfully booked.</p>
      <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Doctor:</strong> Dr. ${doctor.name}</p>
        <p style="margin: 0 0 8px 0;"><strong>Clinic:</strong> ${doctor.clinicName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Address:</strong> ${doctor.clinicAddress}</p>
        <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
        <p style="margin: 0 0 8px 0;"><strong>Time:</strong> ${appointment.time}</p>
        <p style="margin: 0;"><strong>Appointment ID:</strong> ${appointment._id}</p>
      </div>
      <p style="font-size: 14px; color: #64748b;">Please arrive 10 minutes before your scheduled time.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">AI Dental Care Team</p>
    </div>
  `;

  const doctorHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #0f172a;">
      <h2 style="color: #2563eb; margin-top: 0;">New Appointment Booked</h2>
      <p>Hello <strong>Dr. ${doctor.name}</strong>,</p>
      <p>A new patient has booked an appointment with you.</p>
      <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Patient:</strong> ${patient.name}</p>
        <p style="margin: 0 0 8px 0;"><strong>Patient Email:</strong> ${patient.email}</p>
        <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
        <p style="margin: 0 0 8px 0;"><strong>Time:</strong> ${appointment.time}</p>
        <p style="margin: 0;"><strong>Appointment ID:</strong> ${appointment._id}</p>
      </div>
      <p style="font-size: 14px; color: #64748b;">This appointment is visible in your dashboard.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">AI Dental Care Team</p>
    </div>
  `;

  const results = await Promise.allSettled([
    sendEmail(patient.email, 'Appointment Confirmation - AI Dental Care', patientHtml),
    sendEmail(doctor.email, 'New Appointment Notification - AI Dental Care', doctorHtml)
  ]);

  results.forEach((res, i) => {
    if (res.status === 'rejected') {
      console.error(`Failed to send email to ${i === 0 ? 'patient' : 'doctor'}:`, res.reason);
    }
  });
};

const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #0f172a;">
      <h2 style="color: #2563eb; margin-top: 0;">Password Reset Request</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>You requested a password reset for your AI Dental Care account. Click the link below to create a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #64748b;">This link is valid for 15 minutes. If you did not request this, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">AI Dental Care Team</p>
    </div>
  `;
  return await sendEmail(email, 'Password Reset - AI Dental Care', html);
};

module.exports = {
  sendEmail,
  sendAppointmentConfirmation,
  sendPasswordResetEmail
};
