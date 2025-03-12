import React from 'react';
import { MessageSquare, Users } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

export const LiveChat: React.FC = () => {
  const { settings, toggleOnlineStatus } = useChatStore();
  const [sessions, setSessions] = React.useState([
    { id: '1', visitor: 'Guest 1', status: 'active', lastMessage: 'Hello, I need help with...', time: '2 min ago' },
    { id: '2', visitor: 'Guest 2', status: 'waiting', lastMessage: 'What are your prices?', time: '5 min ago' },
  ]);

  return (
    <div className="max-w-4xl mx-auto p-6">
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Active Conversations</h3>
          </div>
        </div>

        <div className="divide-y">
          {sessions.map((session) => (
            <div key={session.id} className="p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{session.visitor}</h4>
                  <p className="text-sm text-gray-500">{session.lastMessage}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                    session.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {session.status === 'active' ? 'Active' : 'Waiting'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{session.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};