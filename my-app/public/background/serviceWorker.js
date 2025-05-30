// Initialize message storage
const messageCache = [];

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NEW_MESSAGE') {
    messageCache.push(message);
    if (messageCache.length > 50) messageCache.shift();
  }
  
  if (message.type === 'GET_MESSAGES') {
    sendResponse(messageCache);
  }
  
  return true;
});

// Connection handler
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    if (msg.type === 'INIT') {
      port.postMessage({
        type: 'MESSAGE_HISTORY',
        history: messageCache
      });
    }
  });
});

console.log('Background worker initialized');