export interface AutoReplyRule {
  id: string;
  userId: string;
  keywords: string[];
  matchType: 'exact' | 'fuzzy' | 'regex' | 'synonym';
  response: string;
  createdAt: Date;
}

export interface AdvancedReplyRule {
  id: string;
  userId: string;
  keywords: string[];
  matchType: 'exact' | 'fuzzy' | 'regex' | 'synonym';
  response: string;
  isHtml: boolean;
  createdAt: Date;
}

export interface WidgetSettings {
  userId: string;
  businessName: string;
  representativeName: string;
  primaryColor: string;
  secondaryColor: string;
  welcomeMessage: string;
  fallbackMessage: string;
  aiContext?: string;
  aiEnabled: boolean;
  aiModel?: string;
  aiApiKey?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  sender: 'user' | 'bot' | 'ai' | 'agent';
  timestamp: Date;
  isHtml?: boolean;
}