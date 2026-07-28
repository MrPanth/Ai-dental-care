const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const logDirectory = path.join(__dirname, '../../logs');

// Daily rotating error log
const errorTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDirectory, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error'
});

// Daily rotating combined activity log
const combinedTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDirectory, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

// Daily rotating security audit log
const securityTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDirectory, 'security-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info'
});

// Main logger for general errors & activities
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    errorTransport,
    combinedTransport
  ]
});

// Dedicated logger for security audits
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    securityTransport
  ]
});

// Expose securityLogger as a property on the default exported logger for backward compatibility
logger.securityLogger = securityLogger;

module.exports = logger;
