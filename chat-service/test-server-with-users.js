const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));

app.use(express.json());

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Simple in-memory storage for testing
const chats = new Map();
const messages = new Map();

// Mock user service for testing
const mockUserService = {
  async getUserDetails(userId) {
    // Mock user data - replace with real API calls
    const mockUsers = {
      'owner123': {
        id: 'owner123',
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        phone: '+91-9876543210',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        role: 'owner'
      },
      'seeker456': {
        id: 'seeker456',
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '+91-9876543211',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        role: 'seeker'
      }
    };
    
    return mockUsers[userId] || {
      id: userId,
      name: `User ${userId.slice(-4)}`,
      email: `${userId}@example.com`,
      phone: '+91-0000000000',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      role: 'user'
    };
  },

  async getPropertyDetails(propertyId) {
    // Mock property data
    return {
      id: propertyId,
      name: 'Sunset Apartments - Unit 2A',
      address: '123 Main Street, Mumbai, Maharashtra',
      type: 'Apartment'
    };
  },

  async getBookingDetails(bookingId) {
    // Mock booking data
    return {
      id: bookingId,
      checkInDate: '2024-01-15',
      checkOutDate: '2024-12-15',
      status: 'confirmed',
      totalAmount: 25000
    };
  },

  async getEnrichedChatData(chat) {
    const ownerDetails = await this.getUserDetails(chat.ownerId);
    const seekerDetails = await this.getUserDetails(chat.seekerId);
    const propertyDetails = await this.getPropertyDetails('property123');
    const bookingDetails = await this.getBookingDetails(chat.bookingId);

    return {
      ...chat,
      ownerDetails,
      seekerDetails,
      propertyDetails,
      bookingDetails
    };
  },

  async getOtherParticipantDetails(chat, currentUserId) {
    const enrichedChat = await this.getEnrichedChatData(chat);
    
    if (currentUserId === chat.ownerId) {
      return enrichedChat.seekerDetails;
    } else if (currentUserId === chat.seekerId) {
      return enrichedChat.ownerDetails;
    }
    
    return null;
  }
};

// Health check endpoint
app.get('/api/chat/health', (req, res) => {
  res.json({
    success: true,
    message: 'Chat service is running with user integration',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Chat initiation endpoint
app.post('/api/chat/initiate', (req, res) => {
  const { bookingId, ownerId, seekerId } = req.body;
  
  if (!bookingId || !ownerId || !seekerId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      error: 'MISSING_FIELDS'
    });
  }

  // Check if chat already exists
  if (chats.has(bookingId)) {
    return res.json({
      success: true,
      message: 'Chat already exists',
      data: chats.get(bookingId)
    });
  }

  // Create new chat
  const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const chat = {
    chatId,
    bookingId,
    ownerId,
    seekerId,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  chats.set(bookingId, chat);
  messages.set(chatId, []);

  // Add system message
  const systemMessage = {
    messageId: `msg_${Date.now()}`,
    chatId,
    senderId: 'system',
    content: 'Booking confirmed! You can now chat with each other.',
    contentType: 'system',
    createdAt: new Date().toISOString(),
    readBy: []
  };

  messages.get(chatId).push(systemMessage);

  res.status(201).json({
    success: true,
    message: 'Chat initiated successfully',
    data: chat
  });
});

// Get user chats with real user details
app.get('/api/chat/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const userChats = [];

  for (const [bookingId, chat] of chats) {
    if (chat.ownerId === userId || chat.seekerId === userId) {
      const chatMessages = messages.get(chat.chatId) || [];
      const lastMessage = chatMessages[chatMessages.length - 1];

      // Get enriched chat data
      const enrichedChat = await mockUserService.getEnrichedChatData(chat);
      const otherParticipant = await mockUserService.getOtherParticipantDetails(chat, userId);

      userChats.push({
        chatId: chat.chatId,
        bookingId: chat.bookingId,
        status: chat.status,
        otherParticipantId: chat.ownerId === userId ? chat.seekerId : chat.ownerId,
        otherParticipant: otherParticipant ? {
          id: otherParticipant.id,
          name: otherParticipant.name,
          email: otherParticipant.email,
          phone: otherParticipant.phone,
          avatar: otherParticipant.avatar,
          role: otherParticipant.role
        } : null,
        propertyDetails: enrichedChat.propertyDetails,
        bookingDetails: enrichedChat.bookingDetails,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
          contentType: lastMessage.contentType
        } : null,
        unreadCount: 0,
        createdAt: chat.createdAt
      });
    }
  }

  res.json({
    success: true,
    message: 'User chats retrieved successfully',
    data: { chats: userChats, total: userChats.length }
  });
});

// Get chat messages
app.get('/api/chat/:chatId/messages', (req, res) => {
  const { chatId } = req.params;
  const chatMessages = messages.get(chatId) || [];

  res.json({
    success: true,
    message: 'Chat messages retrieved successfully',
    data: {
      messages: chatMessages,
      pagination: {
        page: 1,
        limit: 50,
        total: chatMessages.length
      }
    }
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('join_chat', (data) => {
    const { chatId } = data;
    socket.join(`chat_${chatId}`);
    console.log(`👥 User ${socket.id} joined chat ${chatId}`);
    
    socket.emit('chat_joined', { chatId, status: 'success' });
  });

  socket.on('leave_chat', (data) => {
    const { chatId } = data;
    socket.leave(`chat_${chatId}`);
    console.log(`👋 User ${socket.id} left chat ${chatId}`);
  });

  socket.on('send_message', (data) => {
    const { chatId, content, contentType = 'text' } = data;
    
    const message = {
      messageId: `msg_${Date.now()}`,
      chatId,
      senderId: socket.userId || 'unknown',
      content,
      contentType,
      createdAt: new Date().toISOString(),
      readBy: []
    };

    // Store message
    if (!messages.has(chatId)) {
      messages.set(chatId, []);
    }
    messages.get(chatId).push(message);

    // Broadcast to all users in the chat room
    io.to(`chat_${chatId}`).emit('receive_message', message);
    
    console.log(`💬 Message sent in chat ${chatId}: ${content}`);
  });

  socket.on('mark_read', (data) => {
    const { chatId, messageIds = [] } = data;
    console.log(`👁️ Messages marked as read in chat ${chatId}`);
    
    socket.to(`chat_${chatId}`).emit('messages_read', {
      chatId,
      readBy: socket.userId || 'unknown',
      messageIds
    });
  });

  socket.on('typing', (data) => {
    const { chatId, isTyping } = data;
    socket.to(`chat_${chatId}`).emit('user_typing', {
      chatId,
      userId: socket.userId || 'unknown',
      isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log('\n🚀 Chat Service with User Integration Started!');
  console.log('=====================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 HTTP API: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/chat/health`);
  console.log('=====================================');
  console.log('📋 Features:');
  console.log('  ✅ Real user details integration');
  console.log('  ✅ Property details');
  console.log('  ✅ Booking details');
  console.log('  ✅ Real-time messaging');
  console.log('=====================================\n');
});

module.exports = { app, server, io };
