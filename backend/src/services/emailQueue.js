const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const nodemailer = require('nodemailer');

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

let emailQueue = null;
let emailWorker = null;
let isRedisAvailable = false;

// Dynamic SMTP configuration matching emailService transporter
const transporterConfig = process.env.EMAIL_HOST ? {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
} : {
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};

const transporter = nodemailer.createTransport(transporterConfig);

// Helper function to send email directly via Nodemailer
async function sendDirectEmail(mailOptions) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('EMAIL_USER or EMAIL_PASS not set. Skipping real SMTP send. Subject:', mailOptions.subject);
      return { messageId: 'mock-message-id' };
    }
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully (SMTP):', info.messageId);
    return info;
  } catch (error) {
    console.error('SMTP email dispatch failed:', error);
    if (process.env.NODE_ENV === 'development') {
      console.warn('Suppressing email error in development environment.');
      return { messageId: 'mock-message-id-dev-fallback' };
    }
    throw error;
  }
}

// Establish connection to Redis with error event handlers and fast-fail retry strategy
try {
  const redisConnection = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 2000,
    retryStrategy(times) {
      if (times > 3) {
        // Stop retrying and trigger fallback mode
        return null;
      }
      return Math.min(times * 100, 2000);
    }
  });

  redisConnection.on('error', (err) => {
    if (isRedisAvailable) {
      console.warn('Redis connection lost. Falling back to direct email delivery. Details:', err.message);
      isRedisAvailable = false;
    }
  });

  redisConnection.on('connect', () => {
    console.log('Redis connected successfully for email queue.');
    isRedisAvailable = true;
  });

  // Initialize BullMQ Queue
  emailQueue = new Queue('emailQueue', {
    connection: redisConnection
  });

  // Initialize BullMQ Worker
  emailWorker = new Worker('emailQueue', async (job) => {
    console.log(`Processing email job ${job.id}: sending to ${job.data.to}`);
    await sendDirectEmail(job.data);
  }, {
    connection: redisConnection,
    concurrency: 2,
    limiter: {
      max: 10,
      duration: 1000
    }
  });

  emailWorker.on('failed', (job, err) => {
    console.error(`Email job ${job.id} failed:`, err.message);
  });

  emailWorker.on('completed', (job) => {
    console.log(`Email job ${job.id} completed successfully`);
  });

} catch (setupError) {
  console.warn('Could not initialize Redis connection. Falling back to direct email delivery. Details:', setupError.message);
  isRedisAvailable = false;
}

// Unified queueing helper
async function queueEmail(to, subject, html) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `"AI Dental Care" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  };

  if (isRedisAvailable && emailQueue) {
    try {
      await emailQueue.add('sendEmail', mailOptions, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: false
      });
      console.log(`Email queued for ${to} in background queue.`);
    } catch (queueErr) {
      console.warn('Redis unavailable, using fallback email delivery. Details:', queueErr.message);
      await sendDirectEmail(mailOptions);
    }
  } else {
    console.log('Redis unavailable, using fallback email delivery.');
    await sendDirectEmail(mailOptions);
  }
}

module.exports = {
  queueEmail
};
