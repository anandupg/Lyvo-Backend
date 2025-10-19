# Chat Service Setup Guide

This guide will help you set up the Lyvo Chat Service for real-time communication between room owners and seekers.

## 🎯 Quick Start

### 1. Prerequisites Check
- [ ] Node.js v16+ installed
- [ ] MongoDB Atlas account
- [ ] Existing Lyvo backend running
- [ ] JWT secret from main backend

### 2. Installation Steps

```bash
# Navigate to chat service directory
cd Lyvo-Backend/chat-service

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit environment variables
nano .env  # or use your preferred editor
```

### 3. Environment Configuration

Update the `.env` file with your actual values:

```env
# Server Configuration
PORT=5002
NODE_ENV=development

# MongoDB Atlas - Replace with your actual connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lyvo_chat?retryWrites=true&w=majority

# JWT Secret - Use the SAME secret as your main backend
JWT_SECRET=your-actual-jwt-secret-from-main-backend

# Internal API Key - Generate a secure random string
INTERNAL_API_KEY=your-secure-internal-api-key

# CORS Origins - Add your frontend URLs
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Socket.io CORS (should match CORS_ORIGIN)
SOCKET_CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### 4. Start the Service

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start

# Or use the start scripts
# Windows: start.bat
# Linux/Mac: ./start.sh
```

### 5. Verify Installation

Open your browser and visit:
- **Health Check**: http://localhost:5002/api/chat/health
- **API Docs**: http://localhost:5002/api/chat/docs
- **Root Endpoint**: http://localhost:5002/

## 🔗 Integration Steps

### 1. Update Booking Service

Add this code to your booking service when a booking is approved:

```javascript
// In your booking approval logic
const initiateChat = async (bookingId, ownerId, seekerId) => {
  try {
    const response = await fetch('http://localhost:5002/api/chat/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.INTERNAL_API_KEY
      },
      body: JSON.stringify({
        bookingId,
        ownerId,
        seekerId
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Chat initiated:', data.data.chatId);
      return data.data.chatId;
    } else {
      console.error('Failed to initiate chat:', await response.text());
    }
  } catch (error) {
    console.error('Error initiating chat:', error);
  }
};

// Call this when booking status changes to 'approved'
await initiateChat(booking._id, booking.ownerId, booking.seekerId);
```

### 2. Frontend Integration

#### Install Socket.io Client

```bash
npm install socket.io-client
```

#### Create Chat Service

```javascript
// src/services/chatService.js
import io from 'socket.io-client';

class ChatService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io('http://localhost:5002', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat service');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat service');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Chat service error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinChat(chatId) {
    if (this.socket) {
      this.socket.emit('join_chat', { chatId });
    }
  }

  leaveChat(chatId) {
    if (this.socket) {
      this.socket.emit('leave_chat', { chatId });
    }
  }

  sendMessage(chatId, content, contentType = 'text') {
    if (this.socket) {
      this.socket.emit('send_message', {
        chatId,
        content,
        contentType
      });
    }
  }

  markAsRead(chatId, messageIds = []) {
    if (this.socket) {
      this.socket.emit('mark_read', { chatId, messageIds });
    }
  }

  setTyping(chatId, isTyping) {
    if (this.socket) {
      this.socket.emit('typing', { chatId, isTyping });
    }
  }

  onMessage(callback) {
    if (this.socket) {
      this.socket.on('receive_message', callback);
    }
  }

  onTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onMessagesRead(callback) {
    if (this.socket) {
      this.socket.on('messages_read', callback);
    }
  }
}

export default new ChatService();
```

#### Use in React Components

```javascript
// In your chat component
import { useEffect, useState } from 'react';
import chatService from '../services/chatService';

const ChatComponent = ({ chatId, user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Connect to chat service
    const token = localStorage.getItem('authToken');
    chatService.connect(token);

    // Join the chat
    chatService.joinChat(chatId);

    // Listen for messages
    chatService.onMessage((message) => {
      setMessages(prev => [...prev, message]);
    });

    // Cleanup on unmount
    return () => {
      chatService.leaveChat(chatId);
      chatService.disconnect();
    };
  }, [chatId]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      chatService.sendMessage(chatId, newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message) => (
          <div key={message.messageId} className="message">
            <strong>{message.senderId}:</strong> {message.content}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatComponent;
```

## 🧪 Testing the Setup

### 1. Test API Endpoints

```bash
# Health check
curl http://localhost:5002/api/chat/health

# Get API docs
curl http://localhost:5002/api/chat/docs
```

### 2. Test Chat Initiation

```bash
# Test chat initiation (replace with your actual API key)
curl -X POST http://localhost:5002/api/chat/initiate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-internal-api-key" \
  -d '{
    "bookingId": "test_booking_123",
    "ownerId": "owner_123",
    "seekerId": "seeker_456"
  }'
```

### 3. Test WebSocket Connection

```javascript
// Test in browser console
const socket = io('http://localhost:5002', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('join_chat', { chatId: 'your_chat_id' });
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if service is running on port 5002
   - Verify no other service is using the port

2. **Authentication Errors**
   - Ensure JWT secret matches main backend
   - Check token format: `Bearer <token>`

3. **MongoDB Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check network access in MongoDB Atlas
   - Ensure database user has proper permissions

4. **CORS Errors**
   - Update CORS_ORIGIN in .env file
   - Include all frontend URLs

5. **Socket Connection Fails**
   - Check SOCKET_CORS_ORIGIN configuration
   - Verify token is valid and not expired
   - Check browser console for errors

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

### Logs Location

Check console output for:
- Connection events
- Authentication attempts
- Message sending/receiving
- Error details

## 📞 Support

If you encounter issues:

1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB Atlas is accessible
4. Test with the provided curl commands
5. Check browser network tab for WebSocket errors

## 🎉 Success!

Once everything is working:

- ✅ Chat service is running on port 5002
- ✅ MongoDB connection is established
- ✅ API endpoints are responding
- ✅ WebSocket connections are working
- ✅ Frontend can connect and send messages
- ✅ Booking service can initiate chats

Your real-time chat system is now ready! 🚀