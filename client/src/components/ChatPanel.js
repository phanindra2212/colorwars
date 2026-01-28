import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';

const ChatPanel = ({ roomId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { socket } = useSocket();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data) => {
      setMessages(prev => [...prev, data]);
    };

    socket.on('chat_message', handleChatMessage);

    return () => {
      socket.off('chat_message', handleChatMessage);
    };
  }, [socket]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !socket) {
      return;
    }

    socket.emit('chat_message', {
      roomId: roomId,
      message: inputMessage.trim()
    });

    setInputMessage('');
    setIsTyping(false);
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>Chat</h3>
      
      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            fontStyle: 'italic',
            padding: '2rem'
          }}>
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="chat-message">
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                {message.username}
                <span style={{ 
                  fontSize: '0.8rem', 
                  color: '#666', 
                  marginLeft: '8px',
                  fontWeight: '400'
                }}>
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <div style={{ color: '#333' }}>{message.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-container">
        <input
          type="text"
          className="input chat-input"
          value={inputMessage}
          onChange={handleInputChange}
          placeholder="Type a message..."
          maxLength={200}
        />
        <button 
          type="submit" 
          className="btn"
          disabled={!inputMessage.trim()}
          style={{ padding: '8px 16px' }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;