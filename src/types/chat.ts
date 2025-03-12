export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'ai';
  timestamp: Date;
  isHtml?: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  message: string;
}

export interface WidgetSettings {
  businessName: string;
  representativeName: string;
  primaryColor: string;
  secondaryColor: string;
  quickActions: QuickAction[];
  fallbackMessage: string;
  welcomeMessage: string;
  aiModeEnabled: boolean;
  operatorMode: 'ai' | 'live' | 'auto';
  isOnline: boolean;
  hasUnreadMessages: boolean;
}

export interface AutoReplyRule {
  id: string;
  keywords: string[];
  matchType: 'exact' | 'contains' | 'regex';
  response: string;
  isHtml: boolean;
}