const winston = require('winston');
require('winston-daily-rotate-file');

class DiscordTransport extends winston.Transport {
  constructor(opts) {
    super(opts);
    this.webhookUrl = opts.webhookUrl || process.env.DISCORD_WEBHOOK_URL;
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    if (this.webhookUrl && (info.level === 'error' || info.level === 'fatal')) {
      const payload = {
        content: `**[${info.level.toUpperCase()}]** ${info.message}`,
      };
      
      if (info.stack) {
        payload.content += `\n\`\`\`\n${info.stack}\n\`\`\``;
      }

      fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.error('Failed to send log to Discord', err));
    }

    callback();
  }
}

const format = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  process.env.NODE_ENV === 'production' 
    ? winston.format.json() 
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format,
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new DiscordTransport({ level: 'error' })
  ],
});

logger.add(new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  )
}));

module.exports = logger;
