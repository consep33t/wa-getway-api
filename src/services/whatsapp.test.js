const { initializeClient, getClient, getStatus } = require('./whatsapp');
const { Client } = require('whatsapp-web.js');

jest.mock('whatsapp-web.js', () => {
  const mClient = {
    on: jest.fn(),
    initialize: jest.fn().mockResolvedValue(true),
    destroy: jest.fn().mockResolvedValue(true)
  };
  return {
    Client: jest.fn(() => mClient),
    LocalAuth: jest.fn()
  };
});

jest.mock('qrcode-terminal', () => ({
  generate: jest.fn()
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,xxx')
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('WhatsApp Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize client and register events', () => {
    initializeClient();
    const client = getClient();
    
    expect(Client).toHaveBeenCalled();
    expect(client.initialize).toHaveBeenCalled();
    expect(client.on).toHaveBeenCalledWith('qr', expect.any(Function));
    expect(client.on).toHaveBeenCalledWith('ready', expect.any(Function));
    expect(client.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
    expect(client.on).toHaveBeenCalledWith('auth_failure', expect.any(Function));
    
    expect(getStatus()).toBe('INITIALIZING'); // not ready initially
  });
});
