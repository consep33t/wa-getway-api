const request = require('supertest');
const app = require('../app');
const whatsappService = require('../services/whatsapp');
const { EventEmitter } = require('events');

jest.mock('../services/whatsapp', () => {
  const sessionEvents = new (require('events').EventEmitter)();
  return {
    getStatus: jest.fn(),
    getQRState: jest.fn(),
    logoutClient: jest.fn(),
    refreshClient: jest.fn(),
    sessionEvents
  };
});

describe('Session API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/session/status', () => {
    it('should return the current status', async () => {
      whatsappService.getStatus.mockReturnValue('CONNECTED');
      const res = await request(app).get('/api/session/status');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ status: 'CONNECTED' });
    });
  });

  describe('GET /api/session/qr', () => {
    it('should return error if already connected', async () => {
      whatsappService.getStatus.mockReturnValue('CONNECTED');
      const res = await request(app).get('/api/session/qr');
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 404 if QR is not ready', async () => {
      whatsappService.getStatus.mockReturnValue('INITIALIZING');
      whatsappService.getQRState.mockReturnValue({ qr: null, generatedAt: null });
      const res = await request(app).get('/api/session/qr');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error');
    });

    it('should return QR data if available', async () => {
      whatsappService.getStatus.mockReturnValue('QR_READY');
      whatsappService.getQRState.mockReturnValue({ qr: 'data:image/png;base64,xxx', generatedAt: '2023-10-01' });
      const res = await request(app).get('/api/session/qr');
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.qr).toEqual('data:image/png;base64,xxx');
    });
  });

  describe('DELETE /api/session', () => {
    it('should logout the session', async () => {
      whatsappService.logoutClient.mockResolvedValue();
      const res = await request(app).delete('/api/session');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(whatsappService.logoutClient).toHaveBeenCalledTimes(1);
    });

    it('should return 500 on failure', async () => {
      whatsappService.logoutClient.mockRejectedValue(new Error('fail'));
      const res = await request(app).delete('/api/session');
      expect(res.statusCode).toEqual(500);
      expect(whatsappService.logoutClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/session/refresh', () => {
    it('should refresh the session', async () => {
      const res = await request(app).post('/api/session/refresh');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(whatsappService.refreshClient).toHaveBeenCalledTimes(1);
    });
  });
});
