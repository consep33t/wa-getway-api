const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const logger = require('../utils/logger');

let client;
let isReady = false;

const initializeClient = () => {
  logger.info('Initializing WhatsApp Client...');

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: 'sessions' }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      protocolTimeout: 300000,
    }
  });

  client.on('qr', (qr) => {
    logger.info('QR Code received, please scan:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    isReady = true;
    logger.info('WhatsApp Client is ready!');
  });

  client.on('message', async (msg) => {
    logger.info(`Message received from ${msg.from}`);
    const webhookUrl = process.env.INBOUND_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: msg.from,
            body: msg.body,
            timestamp: msg.timestamp
          })
        });
      } catch (err) {
        logger.error('Failed to forward inbound message to webhook', { error: err.message });
      }
    }
  });

  client.on('authenticated', () => {
    logger.info('WhatsApp Client authenticated');
  });

  client.on('auth_failure', (msg) => {
    logger.error('WhatsApp Authentication failure', { message: msg });
    restartClient();
  });

  client.on('disconnected', (reason) => {
    logger.error('WhatsApp Client disconnected', { reason });
    isReady = false;
    restartClient();
  });

  client.initialize().catch((err) => {
    logger.error('Failed to initialize WhatsApp Client', { stack: err.stack });
    restartClient();
  });
};

const restartClient = () => {
  logger.warn('Restarting WhatsApp Client in 5 seconds...');
  setTimeout(() => {
    if (client) {
      client.destroy().catch(() => {}).finally(() => {
        initializeClient();
      });
    } else {
      initializeClient();
    }
  }, 5000);
};

const getClient = () => client;
const getStatus = () => isReady;

module.exports = {
  initializeClient,
  getClient,
  getStatus
};
