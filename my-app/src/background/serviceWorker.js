// Store messages and connections
const messageHistory = [];
const connections = new Set();

// Handle new connections
chrome.runtime.onConnect.addListener((port) => {
  connections.add(port);
  
  // Send message history to new connection
  if (messageHistory.length > 0) {
    port.postMessage({
      type: 'MESSAGE_HISTORY',
      history: messageHistory
    });
  }

  // Handle disconnection
  port.onDisconnect.addListener(() => {
    connections.delete(port);
  });
});

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NEW_MESSAGE') {
    // Add to history (limit to last 50 messages)
    messageHistory.push(message);
    if (messageHistory.length > 50) messageHistory.shift();
    
    // Broadcast to all connections
    connections.forEach(port => {
      try {
        port.postMessage(message);
      } catch (err) {
        console.log('Failed to send to port:', err);
        connections.delete(port);
      }
    });
  }
  
  return true;
});