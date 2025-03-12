// Business Chat Widget
class BusinessChatPlugin {
  constructor(config) {
    this.config = config;
    this.init();
  }

  init() {
    // Create widget container
    const container = document.createElement('div');
    container.id = 'business-chat-widget';
    document.body.appendChild(container);

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
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
        background: #2563eb;
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
        background: #2563eb;
        color: white;
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
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
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      }

      .chat-input button:hover {
        background: #1d4ed8;
      }
    `;
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
        <h3>Chat with us</h3>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input">
        <input type="text" placeholder="Type your message...">
        <button>Send</button>
      </div>
    `;
    container.appendChild(chatWindow);

    // Toggle chat window
    button.addEventListener('click', () => {
      chatWindow.classList.toggle('open');
    });

    // Initialize WebSocket connection
    this.initWebSocket();
  }

  initWebSocket() {
    // Connect to your WebSocket server
    const ws = new WebSocket('wss://your-websocket-server.com');
    
    ws.onopen = () => {
      console.log('Connected to chat server');
      // Send authentication
      ws.send(JSON.stringify({
        type: 'auth',
        uid: this.config.uid
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
  }

  handleMessage(data) {
    // Handle incoming messages
    const messagesContainer = document.querySelector('.chat-messages');
    const messageEl = document.createElement('div');
    messageEl.textContent = data.message;
    messagesContainer.appendChild(messageEl);
  }
}

// Make it available globally
window.BusinessChatPlugin = BusinessChatPlugin;