import React from 'react';
import { Route, Routes, NavLink, Navigate } from 'react-router-dom';
import { Settings, MessageSquare, Code, Bot, Users, LogOut } from 'lucide-react';
import { WidgetSettings } from '../components/WidgetSettings';
import { AutoReply } from '../components/AutoReply';
import { AdvancedReply } from '../components/AdvancedReply';
import { AiMode } from '../components/AiMode';
import { LiveChat } from '../components/LiveChat';
import { supabase } from '../lib/supabase';

export const Dashboard: React.FC = () => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-white border-r">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">Business Chat</h1>
        </div>
        <div className="px-3">
          <NavLink
            to="settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            Widget Settings
          </NavLink>
          <NavLink
            to="auto-reply"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <MessageSquare className="w-5 h-5" />
            Auto Reply
          </NavLink>
          <NavLink
            to="advanced-reply"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Code className="w-5 h-5" />
            Advanced Reply
          </NavLink>
          <NavLink
            to="ai-mode"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Bot className="w-5 h-5" />
            AI Mode
          </NavLink>
          <NavLink
            to="live-chat"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Users className="w-5 h-5" />
            Live Chat
          </NavLink>
        </div>
        <div className="mt-auto p-3">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 w-full text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <Routes>
          <Route path="settings" element={<WidgetSettings />} />
          <Route path="auto-reply" element={<AutoReply />} />
          <Route path="advanced-reply" element={<AdvancedReply />} />
          <Route path="ai-mode" element={<AiMode />} />
          <Route path="live-chat" element={<LiveChat />} />
          <Route path="*" element={<Navigate to="settings" replace />} />
        </Routes>
      </main>
    </div>
  );
};