import { ChatMessage, WidgetSettings } from '../types/chat';

class ChatAPI {
  private static instance: ChatAPI;
  private eventListeners: Map<string, Set<Function>>;
  private settings: WidgetSettings;
  private messages: ChatMessage[];

  private constructor() {
    this.eventListeners = new Map();
    this.messages = [];
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

  // Event handling
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

  // Messages
  public getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  public addMessage(content: string, sender: ChatMessage['sender'], isHtml: boolean = false) {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      sender,
      timestamp: new Date(),
      isHtml,
    };
    this.messages.push(message);
    this.emit('message', message);

    if (!this.settings.isOnline && sender === 'user') {
      this.settings.hasUnreadMessages = true;
      this.emit('unreadMessages', true);
    }
  }

  // Settings
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
}

export const chatApi = ChatAPI.getInstance();