const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WA Gateway API',
      version: '1.0.0',
      description: 'API Dokumentasi untuk WA Gateway - Manajemen Sesi & Pengiriman Pesan',
    },
    servers: [
      {
        url: 'http://localhost:3333',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/app.js'],
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
