import { create } from 'zustand';
import { ChatMessage, WidgetSettings } from '../types/chat';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface ChatState {
  messages: ChatMessage[];
  settings: WidgetSettings;
  isOpen: boolean;
  loading: boolean;
  addMessage: (message: { content: string; sender: ChatMessage['sender']; isHtml?: boolean }) => Promise<void>;
  toggleWidget: () => void;
  updateSettings: (settings: Partial<WidgetSettings>) => void;
  setOperatorMode: (mode: 'ai' | 'live' | 'auto') => void;
  toggleOnlineStatus: () => void;
  clearMessages: () => void;
  initializeChat: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  settings: {
    businessName: 'My Business',
    representativeName: 'Support Agent',
    primaryColor: '#2563eb',
    secondaryColor: '#1d4ed8',
    quickActions: [],
    fallbackMessage: "We've received your message and will get back to you soon!",
    welcomeMessage: "👋 Welcome! How can we help you today?",
    aiModeEnabled: false,
    operatorMode: 'auto',
    isOnline: false,
    hasUnreadMessages: false,
  },
  isOpen: false,
  loading: false,

  initializeChat: async () => {
    try {
      set({ loading: true });
      
      // Initialize session if needed
      const sessionId = localStorage.getItem('chatSessionId');
      if (!sessionId) {
        const { data: session, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            visitor_id: 'visitor_' + Math.random().toString(36).substr(2, 9),
            status: 'active'
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        localStorage.setItem('chatSessionId', session.id);
      }

      // Load messages
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      
      set({ 
        messages: messages?.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: new Date(msg.created_at),
          isHtml: msg.is_html
        })) || []
      });

      // Load settings
      const { data: settings, error: settingsError } = await supabase
        .from('widget_settings')
        .select('*')
        .single();

      if (settings && !settingsError) {
        set(state => ({
          settings: {
            ...state.settings,
            businessName: settings.business_name,
            representativeName: settings.representative_name,
            primaryColor: settings.primary_color,
            secondaryColor: settings.secondary_color,
            welcomeMessage: settings.welcome_message,
            fallbackMessage: settings.fallback_message,
            aiModeEnabled: settings.ai_enabled
          }
        }));
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to initialize chat');
    } finally {
      set({ loading: false });
    }
  },

  addMessage: async ({ content, sender, isHtml = false }) => {
    try {
      const sessionId = localStorage.getItem('chatSessionId');
      if (!sessionId) {
        throw new Error('No active chat session');
      }

      // Add message to database
      const { data: message, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          content,
          sender,
          is_html: isHtml,
          status: 'sent'
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Update local state
      set(state => ({
        messages: [...state.messages, {
          id: message.id,
          content: message.content,
          sender: message.sender,
          timestamp: new Date(message.created_at),
          isHtml: message.is_html
        }]
      }));

      // If it's a user message, check for auto-replies
      if (sender === 'user') {
        set(state => ({ settings: { ...state.settings, hasUnreadMessages: true } }));

        // Show typing indicator
        set(state => ({
          messages: [...state.messages, {
            id: 'typing',
            content: '',
            sender: 'bot',
            timestamp: new Date(),
            isTyping: true
          }]
        }));

        // Check auto-reply rules
        const { data: rules } = await supabase
          .from('auto_reply_rules')
          .select('*');

        let response = null;

        // Check auto-reply rules
        if (rules?.length) {
          for (const rule of rules) {
            if (matchesRule(content.toLowerCase(), rule)) {
              response = {
                content: rule.response,
                sender: 'bot' as const,
                isHtml: false
              };
              break;
            }
          }
        }

        // If no auto-reply match, check advanced rules
        if (!response) {
          const { data: advancedRules } = await supabase
            .from('advanced_reply_rules')
            .select('*');

          if (advancedRules?.length) {
            for (const rule of advancedRules) {
              if (matchesRule(content.toLowerCase(), rule)) {
                response = {
                  content: rule.response,
                  sender: 'bot' as const,
                  isHtml: rule.is_html
                };
                break;
              }
            }
          }
        }

        // If no rule matches, check AI mode
        if (!response) {
          const { data: settings } = await supabase
            .from('widget_settings')
            .select('ai_enabled, ai_context')
            .single();

          if (settings?.ai_enabled) {
            response = {
              content: await getAIResponse(content, settings.ai_context),
              sender: 'ai' as const,
              isHtml: false
            };
          }
        }

        // Remove typing indicator
        set(state => ({
          messages: state.messages.filter(m => m.id !== 'typing')
        }));

        // Send response if any
        if (response) {
          setTimeout(() => {
            get().addMessage(response!);
          }, 1000);
        } else {
          // Send fallback message
          setTimeout(() => {
            get().addMessage({
              content: get().settings.fallbackMessage,
              sender: 'bot'
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to send message');
    }
  },

  toggleWidget: () => {
    set(state => {
      const newIsOpen = !state.isOpen;
      if (newIsOpen) {
        // Clear unread messages when opening
        return { 
          isOpen: newIsOpen, 
          settings: { 
            ...state.settings, 
            hasUnreadMessages: false 
          } 
        };
      }
      return { isOpen: newIsOpen };
    });
  },

  updateSettings: (newSettings) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings }
    }));
  },

  setOperatorMode: (mode) => {
    set(state => ({
      settings: { ...state.settings, operatorMode: mode }
    }));
  },

  toggleOnlineStatus: () => {
    set(state => ({
      settings: { 
        ...state.settings, 
        isOnline: !state.settings.isOnline,
        hasUnreadMessages: state.settings.isOnline ? false : state.settings.hasUnreadMessages
      }
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  }
}));

// Helper functions
function matchesRule(content: string, rule: any): boolean {
  const keywords = rule.keywords.map((k: string) => k.toLowerCase());

  switch (rule.match_type) {
    case 'exact':
      return keywords.some(k => content === k);
    case 'fuzzy':
      return keywords.some(k => content.includes(k));
    case 'regex':
      return keywords.some(k => {
        try {
          const regex = new RegExp(k, 'i');
          return regex.test(content);
        } catch (e) {
          return false;
        }
      });
    case 'synonym':
      return keywords.some(k => content.includes(k));
    default:
      return false;
  }
}

async function getAIResponse(content: string, context?: string): Promise<string> {
  // For now, return a simple AI response
  // In production, this would integrate with an actual AI service
  return `AI: I understand your message about "${content}". How can I help you further?`;
}