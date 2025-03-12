import React from 'react';
import { MessageSquare, X, Send, Bot, UserCircle2, Wifi, WifiOff } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import DOMPurify from 'dompurify';

export const ChatWidget: React.FC = () => {
  const { 
    messages, 
    settings, 
    isOpen, 
    toggleWidget, 
    addMessage,
    setOperatorMode,
    toggleOnlineStatus 
  } = useChatStore();
  const [input, setInput] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show welcome message when widget is opened
  React.useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage({
        content: settings.welcomeMessage,
        sender: 'bot',
      });
    }
  }, [isOpen, messages.length, settings.welcomeMessage, addMessage]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    addMessage({
      content: input,
      sender: 'user',
    });

    // Simulate response based on operator mode
    setTimeout(() => {
      if (settings.operatorMode === 'auto') {
        addMessage({
          content: settings.fallbackMessage,
          sender: 'bot',
        });
      } else if (settings.operatorMode === 'ai') {
        addMessage({
          content: 'AI Assistant: I understand your message and I\'m here to help.',
          sender: 'ai',
        });
      }
    }, 1000);

    setInput('');
  };

  const handleQuickAction = (message: string) => {
    addMessage({
      content: message,
      sender: 'user',
    });
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
          className="p-4 rounded-full shadow-lg relative"
          style={{ backgroundColor: settings.primaryColor }}
        >
          <MessageSquare className="w-6 h-6 text-white" />
          {settings.hasUnreadMessages && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-xl flex flex-col">
      {/* Header */}
      <div
        className="p-4 rounded-t-lg flex justify-between items-center"
        style={{ backgroundColor: settings.primaryColor }}
      >
        <div className="text-white">
          <h3 className="font-bold">{settings.businessName}</h3>
          <div className="flex items-center gap-2">
            <p className="text-sm opacity-90">{settings.representativeName}</p>
            {settings.isOnline && <span className="w-2 h-2 bg-green-400 rounded-full"></span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Operator Controls - Only visible in admin mode */}
          <div className="flex gap-2 mr-4">
            <button
              onClick={() => setOperatorMode('auto')}
              className={`p-1 rounded ${
                settings.operatorMode === 'auto' ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              title="Auto Reply Mode"
            >
              <MessageSquare className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setOperatorMode('ai')}
              className={`p-1 rounded ${
                settings.operatorMode === 'ai' ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              title="AI Mode"
            >
              <Bot className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setOperatorMode('live')}
              className={`p-1 rounded ${
                settings.operatorMode === 'live' ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              title="Live Chat Mode"
            >
              <UserCircle2 className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={toggleOnlineStatus}
              className={`p-1 rounded hover:bg-white/10`}
              title={settings.isOnline ? 'Go Offline' : 'Go Online'}
            >
              {settings.isOnline ? (
                <Wifi className="w-4 h-4 text-white" />
              ) : (
                <WifiOff className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <button onClick={toggleWidget} className="text-white hover:opacity-80">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white rounded-tr-none'
                  : message.sender === 'ai'
                  ? 'bg-purple-100 text-purple-900 rounded-tl-none'
                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
              }`}
            >
              {message.isHtml ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(message.content),
                  }}
                />
              ) : (
                <p>{message.content}</p>
              )}
              <div className="text-xs mt-1 opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-t flex gap-2">
        {settings.quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleQuickAction(action.message)}
            className="px-3 py-1 text-sm rounded-full bg-gray-100 hover:bg-gray-200"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2"
          style={{ focusRingColor: settings.primaryColor }}
        />
        <button
          onClick={handleSend}
          className="p-2 rounded-lg"
          style={{ backgroundColor: settings.primaryColor }}
        >
          <Send className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};