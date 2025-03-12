import { create } from 'zustand';
import { ChatMessage, WidgetSettings } from '../types/chat';
import { chatApi } from '../api/chatApi';

interface ChatState {
  messages: ChatMessage[];
  settings: WidgetSettings;
  isOpen: boolean;
  addMessage: (message: { content: string; sender: ChatMessage['sender']; isHtml?: boolean }) => void;
  toggleWidget: () => void;
  updateSettings: (settings: Partial<WidgetSettings>) => void;
  setOperatorMode: (mode: 'ai' | 'live' | 'auto') => void;
  toggleOnlineStatus: () => void;
}

export const useChatStore = create<ChatState>((set) => {
  // Subscribe to API events
  chatApi.on('message', () => {
    set({ messages: chatApi.getMessages() });
  });

  chatApi.on('settingsUpdate', (settings) => {
    set({ settings });
  });

  return {
    messages: chatApi.getMessages(),
    settings: chatApi.getSettings(),
    isOpen: false,
    addMessage: ({ content, sender, isHtml = false }) => {
      chatApi.addMessage(content, sender, isHtml);
    },
    toggleWidget: () => {
      set((state) => {
        const newIsOpen = !state.isOpen;
        if (newIsOpen) {
          chatApi.clearUnreadMessages();
        }
        return { isOpen: newIsOpen };
      });
    },
    updateSettings: (newSettings) => {
      chatApi.updateSettings(newSettings);
    },
    setOperatorMode: (mode) => {
      chatApi.setOperatorMode(mode);
    },
    toggleOnlineStatus: () => {
      chatApi.toggleOnlineStatus();
    },
  };
});