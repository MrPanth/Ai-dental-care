const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Omit sensitive data fields like password and JWT tokens
    logger.info({
      timestamp: new Date(),
      method: req.method,
      endpoint: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      role: req.user ? req.user.role : 'guest',
      userId: req.user ? req.user._id : null,
      ip: req.ip
    });
  });
  
  next();
};
