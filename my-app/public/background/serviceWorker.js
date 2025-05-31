// Track all connections
const connections = new Map();

// Handle new connections
chrome.runtime.onConnect.addListener((port) => {
  console.log(`Connected: ${port.name}`);
  connections.set(port.name, port);

  // Handle disconnection
  port.onDisconnect.addListener(() => {
    console.log(`Disconnected: ${port.name}`);
    connections.delete(port.name);
  });

  // Initial handshake
  port.postMessage({ type: 'CONNECTION_ESTABLISHED' });
});

// Handle messages from any part of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received:', message);
  
  if (message.type === 'NEW_MESSAGE') {
    // Broadcast to all connections
    connections.forEach((port) => {
      try {
        port.postMessage(message);
      } catch (err) {
        console.error('Failed to send:', err);
        connections.delete(port.name);
      }
    });
  }
  
  return true;
});

console.log('Background worker ready');