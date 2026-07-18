const logger = require('../utils/logger');
const { getClient, getStatus } = require('./whatsapp');

const messageQueue = [];
let isProcessing = false;

const resetState = () => {
  messageQueue.length = 0;
  isProcessing = false;
};

const enqueueMessage = (to, message) => {
  messageQueue.push({ to, message });
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
    await client.sendMessage(task.to, task.message);
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
