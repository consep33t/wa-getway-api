const request = require('supertest');
const app = require('./app');

jest.mock('./services/queue', () => ({
  enqueueMessage: jest.fn()
}));
const queue = require('./services/queue');

describe('App Shell & Health Check', () => {
  it('should return 200 OK for /health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('message', 'WA Gateway API is running');
  });

  it('should have security headers (helmet)', async () => {
    const res = await request(app).get('/health');
    // Helmet standard headers usually include x-frame-options, etc.
    expect(res.headers).toHaveProperty('x-dns-prefetch-control');
    expect(res.headers).not.toHaveProperty('x-powered-by'); // We disabled it
  });

  describe('POST /send-message', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should queue a valid message and return 202', async () => {
      const res = await request(app)
        .post('/send-message')
        .send({ number: '0812345', message: 'Test message' });

      expect(res.statusCode).toEqual(202);
      expect(res.body.status).toBe('queued');
      expect(queue.enqueueMessage).toHaveBeenCalledWith('62812345@c.us', 'Test message', undefined);
    });

    it('should return 400 if number is missing', async () => {
      const res = await request(app)
        .post('/send-message')
        .send({ message: 'Test message' });

      expect(res.statusCode).toEqual(400);
      expect(queue.enqueueMessage).not.toHaveBeenCalled();
    });
  });
});
