    this.isTyping = false;
    this.typingTimeout = null;
    this.hasNewMessage = false;

    this.init();
  }


    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  initRealtime() {
    if (!this.sessionId) return;

    this.supabase






      .channel(`chat_messages:${this.sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${this.sessionId}`,
      }, this.handleNewMessage.bind(this))
      .subscribe();


    this.supabase
      .channel(`chat_sessions:${this.sessionId}`)
      .on('postgres_changes', {


  handleNewMessage(payload) {
    const message = payload.new;
    if (message) {
      this.hideTypingIndicator();
      this.messages.push(message);
      this.renderMessage(message);
      if (!document.querySelector('.chat-window').classList.contains('open')) {
        this.hasNewMessage = true;
        this.updateNotificationIndicator();



      }
    }
  }
  }

  matchesRule(content, rule) {
    // Convert content to lowercase for case-insensitive matching
    const userContent = content.toLowerCase().trim();


    switch (rule.match_type) {
      case 'exact':
        // Check if any keyword exactly matches the entire user content
        return rule.keywords.some(keyword => 
          userContent === keyword.toLowerCase().trim()
        );

      case 'fuzzy':
        // Check if any keyword is included in the user content
        return rule.keywords.some(keyword =>
          userContent.includes(keyword.toLowerCase().trim())
        );

      case 'regex':
        // Try to match using regular expressions
        return rule.keywords.some(keyword => {
          try {
            const regex = new RegExp(keyword, 'i');
            return regex.test(content);
      case 'synonym':
        // Split user content into words and check if any keyword matches any word
        const words = userContent.split(/\s+/);
        return rule.keywords.some(keyword => 
          words.includes(keyword.toLowerCase().trim())
        );

      default:
        return false;
        if (error) {
          console.error('Error sending message:', error);
          // Fallback to local rendering if database insert fails
          this.renderMessage({
            content,
            sender,
            is_html: isHtml,
            created_at: new Date().toISOString()
          });
          return;
        }

        // Render the message from the database response
        this.messages.push(data);
        this.renderMessage(data);
      }
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

  updateNotificationIndicator() {
    const notificationDot = document.querySelector('.notification-dot');
    if (this.hasNewMessage) {
      notificationDot.style.display = 'block';
    } else {
      notificationDot.style.display = 'none';
    }
  }

  getStyles() {
    return `
      #business-chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
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
        position: relative;
      }

      .chat-button:hover {
        transform: scale(1.1);
      }

      .notification-dot {
        position: absolute;
        top: 0;
        right: 0;
        width: 12px;
        height: 12px;
        background-color: #ef4444;
        border-radius: 50%;
        display: none;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
        }
        
        70% {
          transform: scale(1);
          box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
        }
        
        100% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
        }
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
        z-index: 999999;
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
        padding: 12px 16px;
        border-radius: 16px;
        max-width: 80%;
        margin-bottom: 8px;
        word-wrap: break-word;
        position: relative;
      }

      .message.user {
        background: ${this.settings.primaryColor};
        color: white;
        align-self: flex-end;
        border-radius: 16px 16px 4px 16px;
      }

      .message.bot {
        background: white;
        color: #1f2937;
        align-self: flex-start;
        border-radius: 16px 16px 16px 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .message.ai {
        background: #f3e8ff;
        color: #6b21a8;
        align-self: flex-start;
        border-radius: 16px 16px 16px 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .message.agent {
        background: #e0f2fe;
        color: #075985;
        align-self: flex-start;
        border-radius: 16px 16px 16px 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .message.system {
        background: rgba(0, 0, 0, 0.05);
        color: #64748b;
        font-size: 0.85em;
        align-self: center;
        text-align: center;
        border-radius: 12px;
      }

      .typing-indicator {
        display: flex;
        gap: 4px;
        padding: 12px 16px;
        background: white;
        border-radius: 16px;
        align-self: flex-start;
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
    const container = document.createElement('div');
    container.id = 'business-chat-widget';
    document.body.appendChild(container);

    const styles = document.createElement('style');
    styles.id = 'business-chat-widget-styles';
    styles.textContent = this.getStyles();
    document.head.appendChild(styles);

    const button = document.createElement('div');
    button.className = 'chat-button';
    button.innerHTML = `
      <div class="notification-dot"></div>
      <svg class="chat-icon" viewBox="0 0 24 24">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    `;
    container.appendChild(button);

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

    button.addEventListener('click', () => {
      chatWindow.classList.toggle('open');
      if (chatWindow.classList.contains('open')) {
        chatWindow.querySelector('input').focus();
        this.hasNewMessage = false;
        this.updateNotificationIndicator();
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

    if (message.is_html) {
      // Sanitize HTML content before rendering
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = message.content;
      // Remove any script tags
      const scripts = tempDiv.getElementsByTagName('script');
      for (let i = scripts.length - 1; i >= 0; i--) {
        scripts[i].remove();
      }
      messageEl.innerHTML = tempDiv.innerHTML;
    } else {
      messageEl.textContent = message.content;
    }

    // Add timestamp
    const timestampEl = document.createElement('div');
    timestampEl.className = 'text-xs text-gray-500 mt-1';
    timestampEl.textContent = new Date(message.created_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    messageEl.appendChild(timestampEl);

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Make it available globally
window.BusinessChatPlugin = BusinessChatPlugin;
