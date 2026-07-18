const { formatToWhatsAppId } = require('./formatter');

describe('Formatter Utility', () => {
  it('should format number starting with 0 to 62', () => {
    expect(formatToWhatsAppId('08123456789')).toBe('628123456789@c.us');
  });

  it('should format number starting with 62', () => {
    expect(formatToWhatsAppId('628123456789')).toBe('628123456789@c.us');
  });

  it('should clean up spaces and symbols', () => {
    expect(formatToWhatsAppId('+62 812-3456-789')).toBe('628123456789@c.us');
  });

  it('should return null for empty input', () => {
    expect(formatToWhatsAppId('')).toBeNull();
  });
});
