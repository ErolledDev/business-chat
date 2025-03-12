import React from 'react';
import { Users, Send, Search, MoreVertical, Phone, Video, Archive, Edit2, Pin, Trash2, MessageSquarePlus, X, MessageSquare } from 'lucide-react';
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
  status?: 'sent' | 'delivered' | 'read';
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

      // First get all sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Then get the last message for each session
      const sessionsWithMessages = await Promise.all(
        sessionsData.map(async (session) => {
          const { data: messages, error: messagesError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', session.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (messagesError) throw messagesError;

          const unreadCount = await getUnreadCount(session.id);

          return {
            ...session,
            last_message: messages?.[0]?.content || '',
            unread_count: unreadCount
          };
        })
      );

      setSessions(sessionsWithMessages);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load chat sessions');
    } finally {
      setLoading(false);
    }
  };

  const getUnreadCount = async (sessionId: string) => {
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .is('read_at', null);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
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
      const { error } = await supabase.rpc('mark_messages_as_read', {
        p_session_id: sessionId,
        p_message_id: messages[messages.length - 1]?.id
      });

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
          status: 'sent'
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
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <MessageSquare className="w-8 h-8 mb-2" />
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
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
            ))
          )}
        </div>
      </div>

      {selectedSession ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                {sessions.find(s => s.id === selectedSession)?.visitor_id.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-medium">
                  {sessions.find(s => s.id === selectedSession)?.visitor_name || 
                   `Visitor ${sessions.find(s => s.id === selectedSession)?.visitor_id.slice(0, 8)}`}
                </h3>
                <p className="text-sm text-gray-500">
                  Session started {formatDate(sessions.find(s => s.id === selectedSession)?.created_at || '')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => closeSession(selectedSession)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                title="Close Chat"
              >
                <Archive className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                title="Notes"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => togglePinSession(selectedSession)}
                className={`p-2 rounded-full ${
                  sessions.find(s => s.id === selectedSession)?.pinned
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Pin Chat"
              >
                <Pin className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleMessageAction(e, message.id);
                }}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.sender === 'ai'
                      ? 'bg-purple-100 text-purple-900'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p>{message.content}</p>
                  <div className="text-xs mt-1 opacity-70 flex items-center gap-1">
                    {formatTime(message.created_at)}
                    {message.status === 'read' && (
                      <span className="text-xs">✓✓</span>
                    )}
                  </div>
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
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4" />
            <p>Select a conversation to start chatting</p>
          </div>
        </div>
      )}

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
  );
};