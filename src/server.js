const app = require('./app');
const logger = require('./utils/logger');
const { initializeClient } = require('./services/whatsapp');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3333;

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { stack: err.stack });
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection', { stack: err.stack });
});

app.listen(PORT, () => {
  logger.info(`WA Gateway API is listening on port ${PORT}`);
  
  // Clean up any left-over Chromium locks from abnormal shutdown
  try {
    const sessionPath = path.join(__dirname, '../sessions', 'session');
    if (fs.existsSync(path.join(sessionPath, 'SingletonLock'))) {
      fs.unlinkSync(path.join(sessionPath, 'SingletonLock'));
    }
    if (fs.existsSync(path.join(sessionPath, 'SingletonCookie'))) {
      fs.unlinkSync(path.join(sessionPath, 'SingletonCookie'));
    }
    logger.info('Cleaned up previous browser lock files');
  } catch (err) {
    logger.warn('Failed to clean up lock files', { error: err.message });
  }
  
  initializeClient();
});
