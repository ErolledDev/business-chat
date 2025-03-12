// Business Chat Widget
class BusinessChatPlugin {
  constructor(config) {
    if (!config.uid) {
      throw new Error('User ID (uid) is required');
    }
    
    this.config = config;
    this.supabaseUrl = 'https://sxnjvsdpdbnreophnzup.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4bmp2c2RwZGJucmVvcGhuenVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NDMwODMsImV4cCI6MjA1NzMxOTA4M30.NV4B_uhKQBefzeu3mdmNCPs87TKNlVi50dqwfgOvHf0';
    this.sessionId = null;
    this.messages = [];
    this.settings = {
      businessName: 'Business Chat',
      representativeName: 'Support Agent',
      primaryColor: '#2563eb',
      secondaryColor: '#1d4ed8',
      welcomeMessage: 'Welcome! How can we help you today?',
      fallbackMessage: "We'll get back to you soon!",
      aiEnabled: false,
      aiModel: null,
      aiContext: null,
      isLive: false
    };
    this.autoRules = [];
    this.advancedRules = [];
    this.init();
  }

  async init() {
    try {
      await this.initSupabase();
      await this.loadSettings();
      await this.loadRules();
      this.createWidget();
      await this.createChatSession();
      this.initRealtime();
    } catch (error) {
      console.error('Initialization error:', error);
      // Create widget with default settings if there's an error
      this.createWidget();
    }
  }

  async initSupabase() {
    // Load Supabase library
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    await new Promise((resolve) => {
      script.onload = resolve;
      document.head.appendChild(script);
    });

    // Initialize Supabase client
    this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
  }

  async loadSettings() {
    try {
      const { data, error } = await this.supabase
        .from('widget_settings')
        .select('*')
        .eq('user_id', this.config.uid)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error loading settings:', error);
        }
        return;
      }

      if (data) {
        this.settings = {
          businessName: data.business_name || this.settings.businessName,
          representativeName: data.representative_name || this.settings.representativeName,
          primaryColor: data.primary_color || this.settings.primaryColor,
          secondaryColor: data.secondary_color || this.settings.secondaryColor,
          welcomeMessage: data.welcome_message || this.settings.welcomeMessage,
          fallbackMessage: data.fallback_message || this.settings.fallbackMessage,
          aiEnabled: data.ai_enabled || false,
          aiModel: data.ai_model,
          aiContext: data.ai_context,
          isLive: false
        };

        // Update widget if it exists
        this.updateWidgetStyles();
        this.updateWidgetContent();
      }

      // Subscribe to settings changes
      this.supabase
        .channel(`widget_settings:${this.config.uid}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'widget_settings',
          filter: `user_id=eq.${this.config.uid}`,
        }, (payload) => {
          const newData = payload.new;
          if (newData) {
            this.settings = {
              businessName: newData.business_name || this.settings.businessName,
              representativeName: newData.representative_name || this.settings.representativeName,
              primaryColor: newData.primary_color || this.settings.primaryColor,
              secondaryColor: newData.secondary_color || this.settings.secondaryColor,
              welcomeMessage: newData.welcome_message || this.settings.welcomeMessage,
              fallbackMessage: newData.fallback_message || this.settings.fallbackMessage,
              aiEnabled: newData.ai_enabled || false,
              aiModel: newData.ai_model,
              aiContext: newData.ai_context,
              isLive: this.settings.isLive
            };
            this.updateWidgetStyles();
            this.updateWidgetContent();
          }
        })
        .subscribe();

    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async loadRules() {
    try {
      // Load auto reply rules
      const { data: autoRules, error: autoError } = await this.supabase
        .from('auto_reply_rules')
        .select('*')
        .eq('user_id', this.config.uid);

      if (!autoError) {
        this.autoRules = autoRules || [];
      }

      // Load advanced reply rules
      const { data: advancedRules, error: advError } = await this.supabase
        .from('advanced_reply_rules')
        .select('*')
        .eq('user_id', this.config.uid);

      if (!advError) {
        this.advancedRules = advancedRules || [];
      }
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  }

  async createChatSession() {
    try {
      const visitorId = localStorage.getItem('visitorId') || crypto.randomUUID();
      localStorage.setItem('visitorId', visitorId);

      const { data, error } = await this.supabase
        .from('chat_sessions')
        .insert({
          user_id: this.config.uid,
          visitor_id: visitorId,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat session:', error);
        return;
      }

      this.sessionId = data.id;

      // Add welcome message after session creation
      if (this.settings.welcomeMessage) {
        await this.sendMessage(this.settings.welcomeMessage, 'bot');
      }

      // Load existing messages for this session
      await this.loadMessages();
    } catch (error) {
      console.error('Error creating chat session:', error);
    }
  }

  async loadMessages() {
    if (!this.sessionId) return;

    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      this.messages = data || [];
      this.messages.forEach(message => this.renderMessage(message));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  initRealtime() {
    if (!this.sessionId) return;

    // Subscribe to new messages
    this.supabase
      .channel(`chat_messages:${this.sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${this.sessionId}`,
      }, this.handleNewMessage.bind(this))
      .subscribe();

    // Subscribe to session status changes
    this.supabase
      .channel(`chat_sessions:${this.sessionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_sessions',
        filter: `id=eq.${this.sessionId}`,
      }, this.handleSessionUpdate.bind(this))
      .subscribe();
  }

  handleNewMessage(payload) {
    const message = payload.new;
    if (message) {
      this.messages.push(message);
      this.renderMessage(message);
    }
  }

  handleSessionUpdate(payload) {
    const session = payload.new;
    if (session.status === 'active' && payload.old.status !== 'active') {
      this.settings.isLive = true;
      this.addSystemMessage('An agent has joined the chat.');
      this.updateWidgetContent();
    } else if (session.status === 'closed' && payload.old.status !== 'closed') {
      this.settings.isLive = false;
      this.addSystemMessage('Chat session has ended.');
      this.updateWidgetContent();
    }
  }

  addSystemMessage(content) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message system';
    messageEl.textContent = content;
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
      messagesContainer.appendChild(messageEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  async processAutoReply(content) {
    // Check auto reply rules
    for (const rule of this.autoRules) {
      if (this.matchesRule(content, rule)) {
        await this.sendMessage(rule.response, 'bot');
        return true;
      }
    }

    // Check advanced reply rules
    for (const rule of this.advancedRules) {
      if (this.matchesRule(content, rule)) {
        await this.sendMessage(rule.response, 'bot', rule.is_html);
        return true;
      }
    }

    return false;
  }

  matchesRule(content, rule) {
    const userContent = content.toLowerCase();
    
    switch (rule.match_type) {
      case 'exact':
        return rule.keywords.some(keyword => 
          userContent === keyword.toLowerCase()
        );
      
      case 'fuzzy':
        return rule.keywords.some(keyword =>
          userContent.includes(keyword.toLowerCase())
        );
      
      case 'regex':
        return rule.keywords.some(keyword => {
          try {
            const regex = new RegExp(keyword, 'i');
            return regex.test(content);
          } catch (e) {
            return false;
          }
        });
      
      case 'synonym':
        // Basic synonym matching - could be enhanced with a proper synonym database
        return rule.keywords.some(keyword =>
          userContent.split(/\s+/).some(word => 
            word === keyword.toLowerCase()
          )
        );
      
      default:
        return false;
    }
  }

  async sendMessage(content, sender, isHtml = false) {
    if (!this.sessionId) {
      console.error('No active chat session');
      return;
    }

    try {
      // If it's a user message, process it through rules first
      if (sender === 'user') {
        const messageHandled = await this.processAutoReply(content);
        
        // If no rule matched and AI is enabled, we could process with AI here
        if (!messageHandled && !this.settings.isLive) {
          await this.sendMessage(this.settings.fallbackMessage, 'bot');
        }
      }

      const { data, error } = await this.supabase
        .from('chat_messages')
        .insert({
          session_id: this.sessionId,
          content,
          sender,
          is_html: isHtml,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        // If the message fails to send, show it locally anyway
        this.renderMessage({
          content,
          sender,
          is_html: isHtml,
          created_at: new Date().toISOString()
        });
        return;
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  updateWidgetStyles() {
    const styleEl = document.getElementById('business-chat-widget-styles');
    if (styleEl) {
      styleEl.textContent = this.getStyles();
    }
  }

  updateWidgetContent() {
    const headerTitle = document.querySelector('#business-chat-widget .chat-header h3');
    const headerSubtitle = document.querySelector('#business-chat-widget .chat-header p');
    const statusIndicator = document.querySelector('#business-chat-widget .chat-header .status-indicator');
    
    if (headerTitle) {
      headerTitle.textContent = this.settings.businessName;
    }
    if (headerSubtitle) {
      headerSubtitle.textContent = this.settings.isLive 
        ? 'Live Chat Agent' 
        : this.settings.representativeName;
    }
    if (statusIndicator) {
      statusIndicator.className = `status-indicator ${this.settings.isLive ? 'online' : ''}`;
    }
  }

  getStyles() {
    return `
      #business-chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }

      .chat-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${this.settings.primaryColor};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: transform 0.2s;
      }

      .chat-button:hover {
        transform: scale(1.1);
      }

      .chat-icon {
        width: 24px;
        height: 24px;
        fill: white;
      }

      .chat-window {
        position: fixed;
        bottom: 100px;
        right: 20px;
        width: 380px;
        height: 600px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
      }

      .chat-window.open {
        display: flex;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .chat-header {
        padding: 20px;
        background: ${this.settings.primaryColor};
        color: white;
        border-radius: 16px 16px 0 0;
      }

      .chat-header h3 {
        margin: 0;
        font-size: 1.2em;
        font-weight: 600;
      }

      .chat-header p {
        margin: 4px 0 0;
        font-size: 0.9em;
        opacity: 0.9;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #64748b;
      }

      .status-indicator.online {
        background: #22c55e;
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f8fafc;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .message {
        max-width: 85%;
        word-wrap: break-word;
        padding: 12px 16px;
        border-radius: 16px;
        position: relative;
        font-size: 0.95em;
        line-height: 1.4;
      }

      .message.user {
        align-self: flex-end;
        background: ${this.settings.primaryColor};
        color: white;
        border-radius: 16px 16px 4px 16px;
        margin-left: 20%;
      }

      .message.bot {
        align-self: flex-start;
        background: white;
        color: #1f2937;
        border-radius: 16px 16px 16px 4px;
        margin-right: 20%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .message.system {
        align-self: center;
        background: rgba(0, 0, 0, 0.05);
        color: #64748b;
        font-size: 0.85em;
        padding: 8px 12px;
        border-radius: 12px;
        max-width: 90%;
        text-align: center;
      }

      .message-time {
        font-size: 0.75em;
        opacity: 0.8;
        margin-top: 4px;
        text-align: right;
      }

      .chat-input {
        padding: 16px 20px;
        background: white;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .chat-input input {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        outline: none;
        font-size: 0.95em;
        transition: all 0.2s;
      }

      .chat-input input:focus {
        border-color: ${this.settings.primaryColor};
        box-shadow: 0 0 0 3px ${this.settings.primaryColor}15;
      }

      .chat-input button {
        padding: 12px;
        background: ${this.settings.primaryColor};
        color: white;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .chat-input button:hover {
        background: ${this.settings.secondaryColor};
        transform: scale(1.05);
      }

      .chat-input button svg {
        width: 20px;
        height: 20px;
      }

      .typing-indicator {
        align-self: flex-start;
        display: flex;
        gap: 4px;
        padding: 12px 16px;
        background: white;
        border-radius: 16px;
        margin-bottom: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .typing-dot {
        width: 6px;
        height: 6px;
        background: #94a3b8;
        border-radius: 50%;
        animation: typing 1s infinite;
      }

      .typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .typing-dot:nth-child(3) { animation-delay: 0.4s; }

      @keyframes typing {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }

      /* Scrollbar Styling */
      .chat-messages::-webkit-scrollbar {
        width: 6px;
      }

      .chat-messages::-webkit-scrollbar-track {
        background: transparent;
      }

      .chat-messages::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }

      .chat-messages::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;
  }

  createWidget() {
    // Create widget container
    const container = document.createElement('div');
    container.id = 'business-chat-widget';
    document.body.appendChild(container);

    // Add styles
    const styles = document.createElement('style');
    styles.id = 'business-chat-widget-styles';
    styles.textContent = this.getStyles();
    document.head.appendChild(styles);

    // Create widget button
    const button = document.createElement('div');
    button.className = 'chat-button';
    button.innerHTML = `
      <svg class="chat-icon" viewBox="0 0 24 24">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    `;
    container.appendChild(button);

    // Create chat window
    const chatWindow = document.createElement('div');
    chatWindow.className = 'chat-window';
    chatWindow.innerHTML = `
      <div class="chat-header">
        <h3>${this.settings.businessName}</h3>
        <p>
          <span class="status-indicator"></span>
          ${this.settings.representativeName}
        </p>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input">
        <input type="text" placeholder="Type your message...">
        <button>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    `;
    container.appendChild(chatWindow);

    // Add event listeners
    button.addEventListener('click', () => {
      chatWindow.classList.toggle('open');
      if (chatWindow.classList.contains('open')) {
        chatWindow.querySelector('input').focus();
      }
    });

    const input = chatWindow.querySelector('input');
    const sendButton = chatWindow.querySelector('button');

    const sendMessage = () => {
      const content = input.value.trim();
      if (content) {
        this.sendMessage(content, 'user');
        input.value = '';
      }
    };

    sendButton.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }

  renderMessage(message) {
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) return;

    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.sender}`;
    
    const messageContent = document.createElement('div');
    if (message.is_html) {
      messageContent.innerHTML = message.content;
    } else {
      messageContent.textContent = message.content;
    }
    messageEl.appendChild(messageContent);

    // Add timestamp
    const timeEl = document.createElement('div');
    timeEl.className = 'message-time';
    timeEl.textContent = new Date(message.created_at).toLocaleTimeString();
    messageEl.appendChild(timeEl);
    
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Make it available globally
window.BusinessChatPlugin = BusinessChatPlugin;