import { ChatMessage, WidgetSettings } from '../types/chat';
import { supabase } from '../lib/supabase';

class ChatAPI {
  private static instance: ChatAPI;
  private eventListeners: Map<string, Set<Function>>;
  private settings: WidgetSettings;
  private messages: ChatMessage[];
  private welcomeMessageShown: boolean;

  private constructor() {
    this.eventListeners = new Map();
    this.messages = [];
    this.welcomeMessageShown = false;
    this.settings = {
      businessName: 'My Business',
      representativeName: 'Support Agent',
      primaryColor: '#2563eb',
      secondaryColor: '#1d4ed8',
      quickActions: [
        { id: '1', label: 'Pricing', message: 'I would like to know about your pricing.' },
        { id: '2', label: 'Support', message: 'I need technical support.' },
        { id: '3', label: 'Features', message: 'What features do you offer?' },
      ],
      fallbackMessage: "We've received your message and will get back to you soon!",
      welcomeMessage: "👋 Welcome! How can we help you today?",
      aiModeEnabled: false,
      operatorMode: 'auto',
      isOnline: false,
      hasUnreadMessages: false,
    };
  }

  public static getInstance(): ChatAPI {
    if (!ChatAPI.instance) {
      ChatAPI.instance = new ChatAPI();
    }
    return ChatAPI.instance;
  }

  public on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
  }

  public off(event: string, callback: Function) {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }

  public getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  public async addMessage(content: string, sender: ChatMessage['sender'], isHtml: boolean = false) {
    try {
      // Create message object
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        sender,
        timestamp: new Date(),
        isHtml,
      };

      // Add to local messages
      this.messages.push(message);
      this.emit('message', message);

      // If it's a user message, handle auto-replies and AI
      if (sender === 'user') {
        this.settings.hasUnreadMessages = true;
        this.emit('unreadMessages', true);

        // Check for auto-replies
        const response = await this.checkAutoReplies(content);
        if (response) {
          setTimeout(() => {
            this.addMessage(response.content, response.sender, response.isHtml);
          }, 1000);
        }
      }

      // Save to database if we're in live chat mode
      if (this.settings.operatorMode === 'live') {
        await this.saveMessageToDatabase(message);
      }
    } catch (error) {
      console.error('Error adding message:', error);
    }
  }

  private async checkAutoReplies(content: string): Promise<{ content: string; sender: ChatMessage['sender']; isHtml?: boolean } | null> {
    try {
      // First check auto-reply rules
      const { data: autoRules } = await supabase
        .from('auto_reply_rules')
        .select('*');

      if (autoRules) {
        for (const rule of autoRules) {
          if (this.matchesRule(content, rule)) {
            return {
              content: rule.response,
              sender: 'bot'
            };
          }
        }
      }

      // Then check advanced rules
      const { data: advancedRules } = await supabase
        .from('advanced_reply_rules')
        .select('*');

      if (advancedRules) {
        for (const rule of advancedRules) {
          if (this.matchesRule(content, rule)) {
            return {
              content: rule.response,
              sender: 'ai',
              isHtml: rule.is_html
            };
          }
        }
      }

      // Check if AI is enabled
      if (this.settings.aiModeEnabled) {
        const aiResponse = await this.getAIResponse(content);
        return {
          content: aiResponse,
          sender: 'ai'
        };
      }

      // Return fallback message if no rules match
      return {
        content: this.settings.fallbackMessage,
        sender: 'bot'
      };
    } catch (error) {
      console.error('Error checking auto-replies:', error);
      return null;
    }
  }

  private matchesRule(content: string, rule: any): boolean {
    const userContent = content.toLowerCase();
    const keywords = rule.keywords.map((k: string) => k.toLowerCase());

    switch (rule.match_type) {
      case 'exact':
        return keywords.some(k => userContent === k);
      case 'fuzzy':
        return keywords.some(k => userContent.includes(k));
      case 'regex':
        return keywords.some(k => {
          try {
            const regex = new RegExp(k, 'i');
            return regex.test(content);
          } catch (e) {
            return false;
          }
        });
      default:
        return false;
    }
  }

  private async getAIResponse(content: string): Promise<string> {
    // Implement your AI logic here
    return `AI: I understand your message about "${content}". How can I help you further?`;
  }

  private async saveMessageToDatabase(message: ChatMessage) {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: message.content,
          sender: message.sender,
          is_html: message.isHtml,
          created_at: message.timestamp.toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  }

  public getSettings(): WidgetSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<WidgetSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.emit('settingsUpdate', this.settings);
  }

  public setOperatorMode(mode: 'ai' | 'live' | 'auto') {
    this.settings.operatorMode = mode;
    this.emit('operatorModeChange', mode);
  }

  public toggleOnlineStatus() {
    this.settings.isOnline = !this.settings.isOnline;
    if (this.settings.isOnline) {
      this.settings.hasUnreadMessages = false;
    }
    this.emit('onlineStatusChange', this.settings.isOnline);
  }

  public clearUnreadMessages() {
    this.settings.hasUnreadMessages = false;
    this.emit('unreadMessages', false);
  }

  public showWelcomeMessage() {
    if (!this.welcomeMessageShown) {
      this.addMessage(this.settings.welcomeMessage, 'bot');
      this.welcomeMessageShown = true;
    }
  }
}

export const chatApi = ChatAPI.getInstance();