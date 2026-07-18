const app = require('./app');
const logger = require('./utils/logger');
const { initializeClient } = require('./services/whatsapp');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  logger.info(`WA Gateway API is listening on port ${PORT}`);
  
  // Clean up any left-over Chromium locks from abnormal shutdown
  try {
    execSync('find sessions -name "SingletonLock" -delete 2>/dev/null || true');
    execSync('find sessions -name "SingletonCookie" -delete 2>/dev/null || true');
    logger.info('Cleaned up previous browser lock files');
  } catch (err) {}
  
  initializeClient();
});

