const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { formatToWhatsAppId } = require('./utils/formatter');
const { enqueueMessage } = require('./services/queue');

const app = express();

// Security Hardening
app.use(helmet());
app.disable('x-powered-by');

// Parse JSON payload
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cloudflare compatibility: trust proxy
app.set('trust proxy', 1);

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all requests
app.use('/', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'WA Gateway API is running' });
});

// Send message endpoint
app.post('/send-message', (req, res) => {
  const { number, message, mediaUrl } = req.body;

  if (!number || !message) {
    return res.status(400).json({ error: 'number and message are required' });
  }

  const formattedNumber = formatToWhatsAppId(number);
  if (!formattedNumber) {
    return res.status(400).json({ error: 'invalid number format' });
  }

  enqueueMessage(formattedNumber, message, mediaUrl);

  res.status(202).json({
    status: 'queued',
    message: 'Message has been added to the queue for delivery',
    to: formattedNumber,
    hasMedia: !!mediaUrl
  });
});

// Request logger middleware
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
