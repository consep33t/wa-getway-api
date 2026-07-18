const logger = require('../utils/logger');
const { getClient, getStatus } = require('./whatsapp');

const messageQueue = [];
let isProcessing = false;

const { MessageMedia } = require('whatsapp-web.js');

const resetState = () => {
  messageQueue.length = 0;
  isProcessing = false;
};

const enqueueMessage = (to, message, mediaUrl = null) => {
  messageQueue.push({ to, message, mediaUrl });
  logger.info(`Message queued for ${to}. Queue size: ${messageQueue.length}`);
  if (!isProcessing) {
    processQueue();
  }
};

const processQueue = async () => {
  if (messageQueue.length === 0) {
    isProcessing = false;
    return;
  }
  
  isProcessing = true;
  const task = messageQueue.shift();

  if (!getStatus()) {
    logger.warn(`WhatsApp client is not ready. Re-queuing message for ${task.to}`);
    messageQueue.unshift(task); // put it back at the front
    
    // wait a bit before trying again
    setTimeout(processQueue, 5000);
    return;
  }

  try {
    const client = getClient();
    
    if (task.mediaUrl) {
      logger.info(`Downloading media from ${task.mediaUrl}`);
      try {
        const media = await MessageMedia.fromUrl(task.mediaUrl, { unsafeMime: true });
        await client.sendMessage(task.to, media, { caption: task.message });
      } catch (mediaErr) {
        logger.error(`Failed to load media from ${task.mediaUrl}, falling back to text.`, { error: mediaErr.message });
        await client.sendMessage(task.to, task.message + '\n\n' + task.mediaUrl);
      }
    } else {
      await client.sendMessage(task.to, task.message);
    }
    
    logger.info(`Message sent to ${task.to}`);
  } catch (error) {
    logger.error(`Failed to send message to ${task.to}`, { error: error.message });
  }

  // Random delay between 10s and 20s
  const delay = Math.floor(Math.random() * (20000 - 10000 + 1)) + 10000;
  logger.info(`Waiting ${delay}ms before sending the next message...`);
  
  setTimeout(processQueue, delay);
};

module.exports = {
  enqueueMessage,
  processQueue,
  resetState
};
