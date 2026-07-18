const app = require('./app');
const logger = require('./utils/logger');
const { initializeClient } = require('./services/whatsapp');

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  logger.info(`WA Gateway API is listening on port ${PORT}`);
  initializeClient();
});

