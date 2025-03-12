import React from 'react';
import { Route, Routes, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Settings, MessageSquare, Code, Bot, Users, LogOut, ChevronRight, Bell } from 'lucide-react';
import { WidgetSettings } from '../components/WidgetSettings';
import { AutoReply } from '../components/AutoReply';
import { AdvancedReply } from '../components/AdvancedReply';
import { AiMode } from '../components/AiMode';
import { LiveChat } from '../components/LiveChat';
import { supabase } from '../lib/supabase';
import { useChatStore } from '../store/chatStore';

export const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useChatStore();
  const [userName, setUserName] = React.useState('');
  const [notifications, setNotifications] = React.useState(0);

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserName(user.email.split('@')[0]);
      }
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard/settings':
        return 'Widget Settings';
      case '/dashboard/auto-reply':
        return 'Auto Reply Rules';
      case '/dashboard/advanced-reply':
        return 'Advanced Reply Rules';
      case '/dashboard/ai-mode':
        return 'AI Mode Settings';
      case '/dashboard/live-chat':
        return 'Live Chat';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <nav className="w-72 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Business Chat</h1>
              <p className="text-sm text-gray-500">Dashboard</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center uppercase font-bold">
                {userName.charAt(0)}
              </div>
              <div>
                <h3 className="font-medium">{userName}</h3>
                <p className="text-sm text-gray-500">Administrator</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <NavLink
              to="settings"
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                <span>Widget Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </NavLink>

            <NavLink
              to="auto-reply"
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5" />
                <span>Auto Reply</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </NavLink>

            <NavLink
              to="advanced-reply"
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Code className="w-5 h-5" />
                <span>Advanced Reply</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </NavLink>

            <NavLink
              to="ai-mode"
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5" />
                <span>AI Mode</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </NavLink>

            <NavLink
              to="live-chat"
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <span>Live Chat</span>
              </div>
              <div className="flex items-center gap-2">
                {settings.hasUnreadMessages && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                    New
                  </span>
                )}
                <ChevronRight className="w-4 h-4 opacity-50" />
              </div>
            </NavLink>
          </div>
        </div>

        <div className="mt-auto p-4 border-t">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <header className="bg-white border-b px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">{getPageTitle()}</h1>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell className="w-6 h-6" />
                {notifications > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              <div className="h-6 border-l border-gray-200" />
              <div className="flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-full ${
                  settings.isOnline ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-sm text-gray-600">
                  {settings.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <Routes>
            <Route path="settings" element={<WidgetSettings />} />
            <Route path="auto-reply" element={<AutoReply />} />
            <Route path="advanced-reply" element={<AdvancedReply />} />
            <Route path="ai-mode" element={<AiMode />} />
            <Route path="live-chat" element={<LiveChat />} />
            <Route path="*" element={<Navigate to="settings" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};