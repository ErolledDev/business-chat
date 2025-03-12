import React from 'react';
import { Users, Send, Search, MoreVertical, Phone, Video, Archive, Edit2, Pin, Trash2, MessageSquarePlus, X } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface ChatSession {
  id: string;
  visitor_id: string;
  status: 'active' | 'closed';
  last_message?: string;
  unread_count?: number;
  created_at: string;
  visitor_name?: string;
  pinned?: boolean;
  notes?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'bot' | 'ai';
  created_at: string;
  read_at?: string | null;
}

interface MessageAction {
  messageId: string;
  position: { x: number; y: number };
}

export const LiveChat: React.FC = () => {
  const { settings, toggleOnlineStatus } = useChatStore();
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [activeMessageAction, setActiveMessageAction] = React.useState<MessageAction | null>(null);
  const [editingName, setEditingName] = React.useState<string>('');
  const [showNotes, setShowNotes] = React.useState(false);
  const [notes, setNotes] = React.useState('');

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
      markMessagesAsRead(selectedSession);
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

      const { data: sessionsData, error } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          chat_messages (
            content,
            created_at,
            read_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedSessions = sessionsData.map(session => ({
        ...session,
        last_message: session.chat_messages?.[session.chat_messages.length - 1]?.content || '',
        unread_count: session.chat_messages?.filter(msg => !msg.read_at)?.length || 0
      }));

      setSessions(processedSessions);
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

  const markMessagesAsRead = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .is('read_at', null);

      if (error) throw error;

      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, unread_count: 0 }
            : session
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSessionChange = (payload: any) => {
    if (payload.new) {
      loadSessions();
    }
  };

  const handleMessageChange = (payload: any) => {
    if (payload.new) {
      if (payload.new.session_id === selectedSession) {
        loadMessages(selectedSession);
        markMessagesAsRead(selectedSession);
      } else {
        setSessions(prev => {
          const updatedSessions = [...prev];
          const sessionIndex = updatedSessions.findIndex(s => s.id === payload.new.session_id);
          if (sessionIndex > -1) {
            const session = updatedSessions[sessionIndex];
            updatedSessions.splice(sessionIndex, 1);
            updatedSessions.unshift({
              ...session,
              last_message: payload.new.content,
              unread_count: (session.unread_count || 0) + 1
            });
          }
          return updatedSessions;
        });
      }
    }
  };

  const handleMessageAction = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setActiveMessageAction({
      messageId,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  const handleRenameVisitor = async (sessionId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ visitor_name: newName })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, visitor_name: newName }
          : session
      ));

      toast.success('Visitor renamed successfully');
    } catch (error) {
      console.error('Error renaming visitor:', error);
      toast.error('Failed to rename visitor');
    }
  };

  const togglePinSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ pinned: !session.pinned })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, pinned: !s.pinned }
          : s
      ));

      toast.success(session.pinned ? 'Chat unpinned' : 'Chat pinned');
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to update pin status');
    }
  };

  const updateNotes = async (sessionId: string, newNotes: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ notes: newNotes })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, notes: newNotes }
          : s
      ));

      toast.success('Notes updated');
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to update notes');
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const createNewSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          visitor_id: crypto.randomUUID(),
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      setSessions(prev => [data, ...prev]);
      setSelectedSession(data.id);
      toast.success('New conversation started');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create new conversation');
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

  const filteredSessions = sessions.filter(session => 
    session.visitor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString();
  };

  const isSystemMessage = (sender: string) => ['bot', 'ai', 'agent'].includes(sender);

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-xl shadow-lg overflow-hidden flex">
      <div className="w-80 border-r border-gray-200 flex flex-col min-w-0">
        <div className="p-4 border-b shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold">Active Chats</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={createNewSession}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                title="New Conversation"
              >
                <MessageSquarePlus className="w-5 h-5" />
              </button>
              <button
                onClick={toggleOnlineStatus}
                className={`px-3 py-1 rounded-full text-sm ${
                  settings.isOnline
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {settings.isOnline ? '● Online' : '○ Offline'}
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setSelectedSession(session.id)}
              className={`p-4 cursor-pointer border-b transition-colors ${
                selectedSession === session.id 
                  ? 'bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
                  session.status === 'active' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {session.visitor_id.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">
                      {session.visitor_name || `Visitor ${session.visitor_id.slice(0, 8)}`}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2 shrink-0">
                      {formatDate(session.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-500 truncate">
                      {session.last_message || 'No messages yet'}
                    </p>
                    {session.unread_count > 0 && (
                      <span className="shrink-0 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {session.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activeMessageAction && (
          <>
            <div
              className="fixed inset-0"
              onClick={() => setActiveMessageAction(null)}
            />
            <div
              className="absolute bg-white rounded-lg shadow-lg py-1 z-50"
              style={{
                top: activeMessageAction.position.y,
                left: activeMessageAction.position.x,
              }}
            >
              {messages.find(m => m.id === activeMessageAction.messageId)?.sender === 'user' && (
                <button
                  onClick={() => {
                    deleteMessage(activeMessageAction.messageId);
                    setActiveMessageAction(null);
                  }}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Message
                </button>
              )}
            </div>
          </>
        )}

        {showNotes && selectedSession && (
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg border-l transform transition-transform">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium">Notes</h3>
              <button
                onClick={() => setShowNotes(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => updateNotes(selectedSession, notes)}
                placeholder="Add notes about this conversation..."
                className="w-full h-40 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};