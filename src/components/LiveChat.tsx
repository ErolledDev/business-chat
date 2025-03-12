import React from 'react';
import { MessageSquare, Users, Send } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface ChatSession {
  id: string;
  visitor_id: string;
  status: 'active' | 'closed';
  last_message?: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  created_at: string;
}

export const LiveChat: React.FC = () => {
  const { settings, toggleOnlineStatus } = useChatStore();
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    loadSessions();
    const subscription = supabase
      .channel('chat_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_sessions' 
      }, handleSessionChange)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_messages' 
      }, handleMessageChange)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession);
    }
  }, [selectedSession]);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load chat sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSessionChange = (payload: any) => {
    if (payload.new) {
      loadSessions();
    }
  };

  const handleMessageChange = (payload: any) => {
    if (payload.new && payload.new.session_id === selectedSession) {
      loadMessages(selectedSession);
    }
  };

  const sendMessage = async () => {
    if (!selectedSession || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: selectedSession,
          content: newMessage,
          sender: 'agent',
        });

      if (error) throw error;

      setNewMessage('');
      await loadMessages(selectedSession);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const closeSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ status: 'closed' })
        .eq('id', sessionId);

      if (error) throw error;
      
      if (sessionId === selectedSession) {
        setSelectedSession(null);
      }
      await loadSessions();
      toast.success('Chat session closed');
    } catch (error) {
      console.error('Error closing session:', error);
      toast.error('Failed to close session');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold">Live Chat</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-block w-3 h-3 rounded-full ${settings.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <button
            onClick={toggleOnlineStatus}
            className={`px-4 py-2 rounded-lg ${
              settings.isOnline
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {settings.isOnline ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Active Sessions</h3>
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100%-4rem)]">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session.id)}
                className={`p-4 cursor-pointer border-b ${
                  selectedSession === session.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Visitor {session.visitor_id.slice(0, 8)}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(session.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      session.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="col-span-2 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          {selectedSession ? (
            <>
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold">
                  Chat with Visitor {sessions.find(s => s.id === selectedSession)?.visitor_id.slice(0, 8)}
                </h3>
                <button
                  onClick={() => closeSession(selectedSession)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Close Chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-3 rounded-lg ${
                      message.sender === 'agent'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100'
                    }`}>
                      <p>{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a chat session to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};