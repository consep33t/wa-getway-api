const formatToWhatsAppId = (number) => {
  if (!number) return null;
  let formatted = number.toString().replace(/\D/g, '');
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.slice(1);
  }
  if (!formatted.endsWith('@c.us')) {
    formatted += '@c.us';
  }
  return formatted;
};

module.exports = {
  formatToWhatsAppId
};
