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
    };
    this.init();
  }

  async init() {
    try {
      await this.initSupabase();
      await this.loadSettings();
      await this.createChatSession();
      this.createWidget();
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

      if (error) throw error;

      if (data) {
        this.settings = {
          businessName: data.business_name || this.settings.businessName,
          representativeName: data.representative_name || this.settings.representativeName,
          primaryColor: data.primary_color || this.settings.primaryColor,
          secondaryColor: data.secondary_color || this.settings.secondaryColor,
          welcomeMessage: data.welcome_message || this.settings.welcomeMessage,
          fallbackMessage: data.fallback_message || this.settings.fallbackMessage,
        };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Continue with default settings
    }
  }

  async createChatSession() {
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

    if (error) throw error;
    this.sessionId = data.id;
  }

  initRealtime() {
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

    // Subscribe to settings changes
    this.supabase
      .channel(`widget_settings:${this.config.uid}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'widget_settings',
        filter: `user_id=eq.${this.config.uid}`,
      }, this.handleSettingsUpdate.bind(this))
      .subscribe();
  }

  handleSettingsUpdate(payload) {
    const settings = payload.new;
    if (settings) {
      this.settings = {
        businessName: settings.business_name || this.settings.businessName,
        representativeName: settings.representative_name || this.settings.representativeName,
        primaryColor: settings.primary_color || this.settings.primaryColor,
        secondaryColor: settings.secondary_color || this.settings.secondaryColor,
        welcomeMessage: settings.welcome_message || this.settings.welcomeMessage,
        fallbackMessage: settings.fallback_message || this.settings.fallbackMessage,
      };
      this.updateWidgetStyles();
      this.updateWidgetContent();
    }
  }

  handleSessionUpdate(payload) {
    const session = payload.new;
    if (session.status === 'active' && payload.old.status !== 'active') {
      this.addSystemMessage('An agent has joined the chat.');
    } else if (session.status === 'closed' && payload.old.status !== 'closed') {
      this.addSystemMessage('Chat session has ended.');
    }
  }

  addSystemMessage(content) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message system';
    messageEl.textContent = content;
    document.querySelector('.chat-messages').appendChild(messageEl);
  }

  async handleNewMessage(payload) {
    const message = payload.new;
    this.messages.push(message);
    this.renderMessage(message);

    if (message.sender === 'user') {
      // Check auto-reply rules
      const { data: autoRules } = await this.supabase
        .from('auto_reply_rules')
        .select('*')
        .eq('user_id', this.config.uid);

      const { data: advancedRules } = await this.supabase
        .from('advanced_reply_rules')
        .select('*')
        .eq('user_id', this.config.uid);

      // Check for matches in both rule sets
      const matchedRule = [...(autoRules || []), ...(advancedRules || [])]
        .find(rule => this.matchesRule(message.content, rule));

      if (matchedRule) {
        await this.sendMessage(matchedRule.response, 'bot', matchedRule.is_html);
      }
    }
  }

  matchesRule(content, rule) {
    const messageText = content.toLowerCase();
    const keywords = rule.keywords.map(k => k.toLowerCase());

    switch (rule.match_type) {
      case 'exact':
        return keywords.some(k => messageText === k);
      case 'fuzzy':
        return keywords.some(k => messageText.includes(k));
      case 'regex':
        return keywords.some(k => {
          try {
            return new RegExp(k, 'i').test(messageText);
          } catch (e) {
            return false;
          }
        });
      default:
        return false;
    }
  }

  async sendMessage(content, sender, isHtml = false) {
    try {
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

      if (error) throw error;
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
    
    if (headerTitle) {
      headerTitle.textContent = this.settings.businessName;
    }
    if (headerSubtitle) {
      headerSubtitle.textContent = this.settings.representativeName;
    }
  }

  getStyles() {
    return `
      #business-chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
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
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
      }

      .chat-window.open {
        display: flex;
      }

      .chat-header {
        padding: 16px;
        background: ${this.settings.primaryColor};
        color: white;
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      .message {
        margin-bottom: 12px;
        max-width: 80%;
        clear: both;
      }

      .message.user {
        float: right;
        background: ${this.settings.primaryColor};
        color: white;
        border-radius: 12px 12px 0 12px;
        padding: 8px 12px;
      }

      .message.bot, .message.ai {
        float: left;
        background: #f0f0f0;
        color: #333;
        border-radius: 12px 12px 12px 0;
        padding: 8px 12px;
      }

      .message.system {
        clear: both;
        text-align: center;
        color: #666;
        font-style: italic;
        margin: 8px 0;
        font-size: 0.9em;
      }

      .message.agent {
        float: left;
        background: ${this.settings.secondaryColor};
        color: white;
        border-radius: 12px 12px 12px 0;
        padding: 8px 12px;
      }

      .chat-input {
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
      }

      .chat-input input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        outline: none;
      }

      .chat-input button {
        padding: 8px 16px;
        background: ${this.settings.primaryColor};
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      }

      .chat-input button:hover {
        background: ${this.settings.secondaryColor};
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
        <p class="text-sm opacity-80">${this.settings.representativeName}</p>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input">
        <input type="text" placeholder="Type your message...">
        <button>Send</button>
      </div>
    `;
    container.appendChild(chatWindow);

    // Add event listeners
    button.addEventListener('click', () => {
      chatWindow.classList.toggle('open');
      if (chatWindow.classList.contains('open') && this.messages.length === 0) {
        this.sendMessage(this.settings.welcomeMessage, 'bot');
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
    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.sender}`;
    
    if (message.is_html) {
      messageEl.innerHTML = message.content;
    } else {
      messageEl.textContent = message.content;
    }
    
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Make it available globally
window.BusinessChatPlugin = BusinessChatPlugin;