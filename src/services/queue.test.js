const { enqueueMessage } = require('./queue');
const whatsappService = require('./whatsapp');
const logger = require('../utils/logger');

jest.mock('./whatsapp');
jest.mock('../utils/logger');

describe('Queue Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');
    require('./queue').resetState();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should enqueue and process messages', async () => {
    whatsappService.getStatus.mockReturnValue(true);
    const mockSendMessage = jest.fn().mockResolvedValue(true);
    whatsappService.getClient.mockReturnValue({ sendMessage: mockSendMessage });

    enqueueMessage('628123@c.us', 'Hello');
    
    await Promise.resolve(); // flush microtasks

    expect(mockSendMessage).toHaveBeenCalledWith('628123@c.us', 'Hello');
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Waiting'));
  });

  it('should re-queue if client not ready', async () => {
    whatsappService.getStatus.mockReturnValue(false);
    
    enqueueMessage('628123@c.us', 'Hello');
    await Promise.resolve(); // flush

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('WhatsApp client is not ready'));
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
  });
});
