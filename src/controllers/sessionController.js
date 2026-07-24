const whatsappService = require('../services/whatsapp');
const logger = require('../utils/logger');

const getStatus = (req, res) => {
  const status = whatsappService.getStatus();
  res.json({ status });
};

const getQR = (req, res) => {
  const status = whatsappService.getStatus();
  if (status === 'CONNECTED' || status === 'AUTHENTICATED') {
    return res.status(400).json({ error: 'WhatsApp is already connected' });
  }
  
  const qrState = whatsappService.getQRState();
  if (!qrState.qr) {
    return res.status(404).json({ error: 'QR code not available yet' });
  }

  res.json({
    status: 'success',
    data: {
      qr: qrState.qr,
      generatedAt: qrState.generatedAt,
      expiresInSeconds: 20
    }
  });
};

const logoutSession = async (req, res) => {
  try {
    await whatsappService.logoutClient();
    res.json({ status: 'success', message: 'Session logged out and disconnected' });
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({ error: 'Failed to logout session' });
  }
};

const refreshSession = (req, res) => {
  whatsappService.refreshClient();
  res.json({ status: 'success', message: 'Session refresh initiated' });
};

const streamQR = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial state
  sendEvent('status', { status: whatsappService.getStatus() });
  const qrState = whatsappService.getQRState();
  if (qrState.qr) {
    sendEvent('qr', {
      qr: qrState.qr,
      generatedAt: qrState.generatedAt,
      expiresInSeconds: 20
    });
  }

  const onStatusChange = (status) => {
    sendEvent('status', { status });
  };

  const onQRUpdate = (data) => {
    sendEvent('qr', {
      qr: data.qr,
      generatedAt: data.generatedAt,
      expiresInSeconds: 20
    });
  };

  whatsappService.sessionEvents.on('status_changed', onStatusChange);
  whatsappService.sessionEvents.on('qr_updated', onQRUpdate);

  req.on('close', () => {
    whatsappService.sessionEvents.removeListener('status_changed', onStatusChange);
    whatsappService.sessionEvents.removeListener('qr_updated', onQRUpdate);
    res.end();
  });
};

module.exports = {
  getStatus,
  getQR,
  logoutSession,
  refreshSession,
  streamQR
};
