const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

/**
 * 🔒 Enterprise File Upload Security Configuration
 * Supports Local Disk Storage and maps Cloud Object Storage (AWS S3 / Google Cloud Storage) hooks.
 */

// Toggle between Cloud Storage (S3/GCS) and Local Disk based on ENV
const isCloudStorageEnabled = !!(process.env.AWS_BUCKET_NAME || process.env.GCS_BUCKET_NAME);

let storageConfig;

if (isCloudStorageEnabled) {
  /**
   * 🚀 Cloud Storage Driver Prep:
   * Uses memoryStorage so that the buffer can be streamed directly to S3/GCS.
   * Signed URLs are generated when querying file endpoints.
   */
  storageConfig = multer.memoryStorage();
  console.log('Production: Cloud Object Storage driver initialized.');
} else {
  // Local Disk Storage driver with hardened filename sanitization
  storageConfig = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
      // 1. Generate cryptographically secure random key
      const randomKey = crypto.randomBytes(16).toString('hex');
      
      // 2. Strict whitelist verification of extension to prevent double extensions (e.g., shell.php.jpg)
      const baseExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9]/g, '');
      const validExtensions = {
        jpeg: '.jpeg',
        jpg: '.jpg',
        png: '.png',
        pdf: '.pdf'
      };
      
      const cleanExt = validExtensions[baseExt] || '.dat';
      
      // 3. Final sanitized file name format
      cb(null, `${randomKey}-${Date.now()}${cleanExt}`);
    }
  });
  console.log('Development/On-Prem: Local Disk uploader initialized.');
}

const uploader = multer({
  storage: storageConfig,
  limits: {
    fileSize: 10 * 1024 * 1024 // Strict 10MB maximum limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed MIME types: image/jpeg, image/png, application/pdf
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];

    const fileExt = path.extname(file.originalname).toLowerCase();
    const isExtensionValid = allowedExtensions.includes(fileExt);
    const isMimeValid = allowedMimeTypes.includes(file.mimetype);

    if (isExtensionValid && isMimeValid) {
      return cb(null, true);
    }
    
    cb(new Error('Invalid file type. Only JPEG, PNG images and PDF documents under 10MB are permitted.'));
  }
});

/**
 * 🛠️ Cloud Storage Signed URL Prep helper (Reference implementation)
 * In production, instead of returning direct file paths, controllers call this to generate temporary URLs.
 */
function getSignedUrl(filePath) {
  if (!isCloudStorageEnabled) {
    // Fallback to local server path
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5001';
    return `${serverUrl}/uploads/${path.basename(filePath)}`;
  }
  
  // AWS S3 Signed URL Mock logic
  // const s3 = new AWS.S3();
  // return s3.getSignedUrl('getObject', { Bucket: process.env.AWS_BUCKET_NAME, Key: filePath, Expires: 3600 });
  return `https://s3.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${filePath}?sig=mock_signed_url`;
}

module.exports = {
  uploader,
  getSignedUrl,
  isCloudStorageEnabled
};
