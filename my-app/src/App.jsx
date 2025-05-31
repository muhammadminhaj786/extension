import { useState, useEffect } from 'react';

function App() {
  const [isSidePanel] = useState(window.location.hash === '#sidepanel');
  
  if (isSidePanel) {
    return <SidePanel />;
  }

  return <Popup />;
}

function Popup() {
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState('Ready');

  const handleOpenSidePanel = async () => {
    try {
      setStatus('Opening side panel...');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Open and enable side panel
      await chrome.sidePanel.open({ windowId: tab.windowId });
      await chrome.sidePanel.setOptions({
        path: 'index.html#sidepanel',
        enabled: true
      });
      
      setStatus('Side panel opened');
    } catch (error) {
      console.error('Error:', error);
      setStatus('Error opening side panel');
    }
  };

  return (
    <div className="w-[300px] p-4 bg-white">
      <h1 className="text-xl font-bold mb-4">Chat Extension</h1>
      <div className="mb-4">
        <button
          onClick={handleOpenSidePanel}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Open Chat Panel
        </button>
      </div>
      <div className="text-sm text-gray-600">{status}</div>
    </div>
  );
}

function SidePanel() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [port, setPort] = useState(null);

  useEffect(() => {
    // Establish connection to background
    const newPort = chrome.runtime.connect({ name: 'sidepanel' });
    setPort(newPort);
    
    // Message handler
    const messageHandler = (msg) => {
      console.log('Side panel received:', msg);
      
      if (msg.type === 'CONNECTION_ESTABLISHED') {
        setConnectionStatus('connected');
      }
      
      if (msg.type === 'NEW_MESSAGE') {
        setMessages(prev => [
          ...prev,
          { 
            sender: 'user', 
            text: msg.text,
            id: Date.now() + Math.random()
          }
        ]);
        
        // Simulate AI response
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              sender: 'ai',
              text: `Response to: "${msg.text}"`,
              id: Date.now() + Math.random()
            }
          ]);
        }, 800);
      }
    };

    newPort.onMessage.addListener(messageHandler);
    
    // Handle disconnection
    newPort.onDisconnect.addListener(() => {
      setConnectionStatus('disconnected');
    });

    // Cleanup
    return () => {
      newPort.disconnect();
      newPort.onMessage.removeListener(messageHandler);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Send message through background
    chrome.runtime.sendMessage({
      type: 'NEW_MESSAGE',
      text: inputValue,
      timestamp: Date.now()
    }).catch(err => console.error('Send failed:', err));

    setInputValue('');
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Chat Panel</h2>
        <div className={`text-xs px-2 py-1 rounded ${
          connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 
          connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' : 
          'bg-red-100 text-red-800'
        }`}>
          {connectionStatus}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[80%] p-3 rounded-lg ${
              msg.sender === 'user'
                ? 'ml-auto bg-blue-500 text-white'
                : 'mr-auto bg-gray-200 text-gray-800'
            }`}
          >
            {msg.text}
            <div className="text-xs opacity-70 mt-1">
              {new Date(msg.id).toLocaleTimeString()}
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
            disabled={connectionStatus !== 'connected' || !inputValue.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;