import React, { useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import DOMPurify from 'dompurify';

export const ChatWidget: React.FC = () => {
  const { 
    messages, 
    settings, 
    isOpen, 
    loading,
    toggleWidget, 
    addMessage,
    clearMessages,
    initializeChat
  } = useChatStore();
  
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      initializeChat();
    }
  }, [isOpen, initializeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      clearMessages();
    }
  }, [isOpen, clearMessages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    await addMessage({
      content: input,
      sender: 'user',
    });

    setInput('');
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 flex flex-col items-end">
        {settings.hasUnreadMessages && (
          <div className="animate-bounce mb-2 px-3 py-1 bg-red-500 text-white rounded-full text-sm">
            New message!
          </div>
        )}
        <button
          onClick={toggleWidget}
          className="p-4 rounded-full shadow-lg"
          style={{ backgroundColor: settings.primaryColor }}
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl flex flex-col overflow-hidden">
      <div
        className="p-4 flex justify-between items-center"
        style={{ backgroundColor: settings.primaryColor }}
      >
        <div className="text-white">
          <h3 className="font-bold">{settings.businessName}</h3>
          <p className="text-sm opacity-90">{settings.representativeName}</p>
        </div>
        <button onClick={toggleWidget} className="text-white hover:opacity-80">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] max-h-[500px] bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === 'user'
                      ? `text-white rounded-br-none`
                      : message.sender === 'ai'
                      ? 'bg-purple-100 text-purple-900 rounded-bl-none'
                      : 'bg-white text-gray-900 rounded-bl-none'
                  }`}
                  style={message.sender === 'user' ? { backgroundColor: settings.primaryColor } : {}}
                >
                  {message.isTyping ? (
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  ) : message.isHtml ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(message.content)
                      }}
                    />
                  ) : (
                    <p>{message.content}</p>
                  )}
                  {!message.isTyping && (
                    <div className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              focusRingColor: settings.primaryColor + '40'
            }}
          />
          <button
            onClick={handleSend}
            className="p-2 rounded-lg text-white transition-colors"
            style={{ 
              backgroundColor: settings.primaryColor,
              hover: settings.secondaryColor
            }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};