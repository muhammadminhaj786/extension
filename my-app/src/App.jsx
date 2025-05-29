import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setHasSubmitted(true);
      setChatMessages(prev => [...prev, { sender: 'user', text: inputValue }]);

      setTimeout(() => {
        setChatMessages(prev => [...prev, { sender: 'ai', text: 'Processing your request...' }]);
      }, 1000);

      setInputValue('');
    }
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--extension-width', '100vw');
  }, [hasSubmitted]);

  return (
    <div className={`app-container ${hasSubmitted ? 'split-view' : ''}`}>
      <div className="main-content">
        {!hasSubmitted ? (
          <div className="full-view">
            <h1>Welcome to the Extension</h1>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="What would you like to do?"
                autoFocus
              />
              <button type="submit">Go</button>
            </form>
          </div>
        ) : (
          <div className="action-panel">
            <h2>Action Panel</h2>
            <div className="action-content">
              Working on: {chatMessages[0]?.text}
            </div>
          </div>
        )}
      </div>

      {hasSubmitted && (
        <div className="chat-panel">
          <h2>Chat</h2>
          <div className="chat-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="chat-input">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
