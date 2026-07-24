const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
const { EventEmitter } = require('events');
const logger = require('../utils/logger');

const sessionEvents = new EventEmitter();

let client;
let currentStatus = 'INITIALIZING';
let currentQR = null;
let qrGeneratedAt = null;

const updateStatus = (status) => {
  currentStatus = status;
  sessionEvents.emit('status_changed', status);
};

const initializeClient = () => {
  logger.info('Initializing WhatsApp Client...');

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: 'sessions' }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      protocolTimeout: 300000,
    }
  });

  client.on('qr', async (qr) => {
    logger.info('QR Code received, please scan:');
    qrcodeTerminal.generate(qr, { small: true });
    
    try {
      currentQR = await qrcode.toDataURL(qr);
      qrGeneratedAt = new Date().toISOString();
      updateStatus('QR_READY');
      sessionEvents.emit('qr_updated', { qr: currentQR, generatedAt: qrGeneratedAt });
    } catch (err) {
      logger.error('Failed to generate base64 QR', { error: err.message });
    }
  });

  client.on('ready', () => {
    updateStatus('CONNECTED');
    currentQR = null;
    qrGeneratedAt = null;
    logger.info('WhatsApp Client is ready!');
  });

  // Fallback if ready event doesn't fire due to whatsapp-web.js bugs
  client.on('authenticated', () => {
    updateStatus('AUTHENTICATED');
    logger.info('WhatsApp Client authenticated');
    setTimeout(() => {
      if (currentStatus !== 'CONNECTED') {
        logger.warn('Ready event did not fire after 15s. Forcing CONNECTED');
        updateStatus('CONNECTED');
      }
    }, 15000);
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



  client.on('auth_failure', (msg) => {
    logger.error('WhatsApp Authentication failure', { message: msg });
    restartClient();
  });

  client.on('disconnected', (reason) => {
    logger.error('WhatsApp Client disconnected', { reason });
    updateStatus('DISCONNECTED');
    
    if (reason === 'LOGOUT') {
      try {
        const fs = require('fs');
        const path = require('path');
        const sessionDir = path.join(process.cwd(), 'sessions');
        fs.rmSync(sessionDir, { recursive: true, force: true });
        logger.info('Cleaned up session folder due to LOGOUT');
      } catch (err) {
        logger.error('Failed to clean session folder', { error: err.message });
      }
    }
    
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
const getStatus = () => currentStatus;
const getQRState = () => ({ qr: currentQR, generatedAt: qrGeneratedAt });

const logoutClient = async () => {
  if (client) {
    try {
      await client.logout();
    } catch (err) {
      logger.error('Error logging out gracefully', { error: err.message });
    } finally {
      try {
        const fs = require('fs');
        const path = require('path');
        const sessionDir = path.join(process.cwd(), 'sessions');
        fs.rmSync(sessionDir, { recursive: true, force: true });
      } catch (e) {}
      updateStatus('DISCONNECTED');
      restartClient();
    }
  }
};

const refreshClient = () => {
  restartClient();
};

module.exports = {
  initializeClient,
  getClient,
  getStatus,
  getQRState,
  logoutClient,
  refreshClient,
  sessionEvents
};
