import { useState, useEffect } from 'react';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [isSidePanel, setIsSidePanel] = useState(window.location.hash === '#sidepanel');
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  if (isSidePanel) {
    return <SidePanel />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Resize current window to 70% width
      await chrome.windows.update(tab.windowId, { state: 'normal' });
      const window = await chrome.windows.get(tab.windowId);
      const newWidth = Math.floor(window.width * 0.7);
      
      await chrome.windows.update(tab.windowId, {
        width: newWidth,
        left: window.left
      });

      // Open side panel
      await chrome.sidePanel.open({ windowId: tab.windowId });
      await chrome.sidePanel.setOptions({
        path: 'index.html#sidepanel',
        enabled: true
      });

      // Send initial message
      chrome.runtime.sendMessage({
        type: 'NEW_MESSAGE',
        text: inputValue,
        timestamp: Date.now()
      }).catch(err => console.log('Message send error:', err));

      setInputValue('');
    } catch (error) {
      console.error('Error:', error);
      setConnectionStatus('error');
    }
  };

  return (
    <div className="w-[300px] p-4 bg-white">
      <h1 className="text-xl font-bold mb-4">Split View Extension</h1>
      <div className={`mb-2 text-sm ${connectionStatus === 'connected' ? 'text-green-600' : 'text-yellow-600'}`}>
        Status: {connectionStatus}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter URL or search"
          className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Go
        </button>
      </form>
    </div>
  );
}

function SidePanel() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [connection, setConnection] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    // Establish connection
    const port = chrome.runtime.connect();
    setConnection(port);
    setConnectionStatus('connected');

    // Message handler
    const messageHandler = (msg) => {
      if (msg.type === 'NEW_MESSAGE') {
        setMessages(prev => [...prev, { sender: 'user', text: msg.text, timestamp: msg.timestamp }]);
        // Simulate AI response
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            sender: 'ai', 
            text: `Processed: ${msg.text}`,
            timestamp: Date.now()
          }]);
        }, 1000);
      } else if (msg.type === 'MESSAGE_HISTORY') {
        setMessages(msg.history.map(m => ({
          sender: 'user',
          text: m.text,
          timestamp: m.timestamp
        })));
      }
    };

    // Listen for messages
    port.onMessage.addListener(messageHandler);

    // Handle disconnection
    port.onDisconnect.addListener(() => {
      setConnectionStatus('disconnected');
    });

    // Cleanup
    return () => {
      port.disconnect();
      port.onMessage.removeListener(messageHandler);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !connection) return;

    chrome.runtime.sendMessage({
      type: 'NEW_MESSAGE',
      text: inputValue,
      timestamp: Date.now()
    }).catch(err => console.log('Message send error:', err));

    setInputValue('');
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Chat Panel</h2>
        <span className={`text-xs ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
          {connectionStatus}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((msg, i) => (
            <div
              key={i}
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.sender === 'user'
                  ? 'ml-auto bg-blue-500 text-white'
                  : 'mr-auto bg-gray-200 text-gray-800'
              }`}
            >
              {msg.text}
              <div className="text-xs opacity-70 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={connectionStatus !== 'connected'}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={connectionStatus !== 'connected'}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;