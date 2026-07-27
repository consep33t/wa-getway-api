const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { formatToWhatsAppId } = require('./utils/formatter');
const { enqueueMessage } = require('./services/queue');
const sessionRoutes = require('./routes/sessionRoutes');
const { swaggerUi, specs } = require('./utils/swagger');

const app = express();

// Security Hardening
app.use(helmet());
app.disable('x-powered-by');

// Request logger middleware
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Parse JSON payload
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cloudflare compatibility: trust proxy
app.set('trust proxy', 1);

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // increased limit to 5000 to allow backend cron bulk notifications
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all requests
app.use('/', apiLimiter);

// Swagger Documentation Theme Controller
const { SwaggerTheme, SwaggerThemeNameEnum } = require('swagger-themes');
const theme = new SwaggerTheme();
const { customCss, customJs } = require('./utils/swagger-theme-injector');

// Theme CSS provider endpoint
app.get('/api-docs/theme/:themeName', (req, res) => {
  const t = req.params.themeName.toLowerCase();
  let css = '';
  switch(t) {
    case 'dark': css = theme.getBuffer(SwaggerThemeNameEnum.DARK); break;
    case 'nord': css = theme.getBuffer(SwaggerThemeNameEnum.NORD_DARK); break;
    case 'dracula': css = theme.getBuffer(SwaggerThemeNameEnum.DRACULA); break;
    case 'light': css = theme.getBuffer(SwaggerThemeNameEnum.CLASSIC); break;
    default: css = theme.getBuffer(SwaggerThemeNameEnum.DARK);
  }
  res.setHeader('Content-Type', 'text/css');
  res.send(css);
});

// Serve Swagger with initial professional UI enhancements and custom JS
const swaggerOptions = {
  customCss: customCss + theme.getBuffer(SwaggerThemeNameEnum.DARK),
  customJsStr: customJs,
  customSiteTitle: "WA Gateway API Docs",
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Mengecek status kesehatan API
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API berjalan normal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 */
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'WA Gateway API is running' });
});

// Session Management API
app.use('/api/session', sessionRoutes);

/**
 * @swagger
 * /send-message:
 *   post:
 *     summary: Mengirim pesan WhatsApp ke antrian
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - message
 *             properties:
 *               number:
 *                 type: string
 *                 description: Nomor WhatsApp penerima (format bebas)
 *               message:
 *                 type: string
 *                 description: Isi pesan teks
 *               mediaUrl:
 *                 type: string
 *                 description: URL media opsional
 *     responses:
 *       202:
 *         description: Pesan berhasil dimasukkan ke antrian
 *       400:
 *         description: Input tidak valid
 */
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

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
