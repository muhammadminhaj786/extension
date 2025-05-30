let messages = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NEW_MESSAGE') {
    messages.push(message.text);
    // Broadcast to all side panels
    chrome.runtime.sendMessage(message);
  }
});