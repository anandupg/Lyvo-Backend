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

// Real booking data from your MongoDB
const realBookingData = {
  "_id": "68f4ec0764177a8e0ec6f9c1",
  "userId": "68e7588ed0829f512ccf8b9f",
  "userName": "ANANDU P GANESH",
  "userEmail": "anandupganesh2026@mca.ajce.in",
  "userPhone": "7306080450",
  "propertyId": "68f3103b64177a8e0ec6f316",
  "propertyName": "RJ Villas",
  "roomId": "68f3103c64177a8e0ec6f318",
  "roomNumber": "1",
  "ownerId": "68d0548f159c0549a6c59079",
  "ownerName": "Anandu P Ganesh",
  "ownerEmail": "anandupg2022@gmail.com",
  "ownerPhone": "",
  "bookingId": "68f4ebf264177a8e0ec6f9b5",
  "paymentId": "pay_RVLxydcL97k8BB",
  "razorpayOrderId": "order_RVLxohwD4HjkZR",
  "razorpayPaymentId": "pay_RVLxydcL97k8BB",
  "amountPaid": 13000,
  "checkInDate": "2025-10-19T13:47:51.055+00:00",
  "checkOutDate": null,
  "status": "active",
  "securityDeposit": 10000,
  "monthlyRent": 3000,
  "specialRequests": "",
  "confirmedBy": "68d0548f159c0549a6c59079",
  "confirmedAt": "2025-10-19T13:47:51.055+00:00",
  "createdAt": "2025-10-19T13:47:51.056+00:00",
  "updatedAt": "2025-10-19T13:47:51.056+00:00"
};

// Mock user service for testing with real data
const mockUserService = {
  async getBookingDetails(bookingId) {
    // Return real booking data
    if (bookingId === realBookingData.bookingId || bookingId === realBookingData._id) {
      return realBookingData;
    }
    return null;
  },

  async getEnrichedChatData(chat) {
    const bookingDetails = await this.getBookingDetails(chat.bookingId);
    
    if (!bookingDetails) {
      console.error('No booking details found for chat:', chat.bookingId);
      return chat;
    }

    // Extract owner details from real booking data
    const ownerDetails = {
      id: bookingDetails.ownerId,
      name: bookingDetails.ownerName,
      email: bookingDetails.ownerEmail,
      phone: bookingDetails.ownerPhone || 'No phone provided',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${bookingDetails.ownerName}`,
      role: 'owner'
    };

    // Extract tenant details from real booking data
    const seekerDetails = {
      id: bookingDetails.userId,
      name: bookingDetails.userName,
      email: bookingDetails.userEmail,
      phone: bookingDetails.userPhone,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${bookingDetails.userName}`,
      role: 'seeker'
    };

    // Extract property details from real booking data
    const propertyDetails = {
      id: bookingDetails.propertyId,
      name: bookingDetails.propertyName,
      address: bookingDetails.propertyName,
      type: 'Property',
      roomId: bookingDetails.roomId,
      roomNumber: bookingDetails.roomNumber
    };

    return {
      ...chat,
      ownerDetails,
      seekerDetails,
      propertyDetails,
      bookingDetails: {
        id: bookingDetails._id || bookingDetails.id,
        checkInDate: bookingDetails.checkInDate,
        checkOutDate: bookingDetails.checkOutDate,
        status: bookingDetails.status,
        monthlyRent: bookingDetails.monthlyRent,
        securityDeposit: bookingDetails.securityDeposit,
        amountPaid: bookingDetails.amountPaid,
        specialRequests: bookingDetails.specialRequests,
        confirmedAt: bookingDetails.confirmedAt
      }
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
    message: 'Chat service is running with REAL booking data',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    realData: {
      tenant: realBookingData.userName,
      owner: realBookingData.ownerName,
      property: realBookingData.propertyName,
      room: realBookingData.roomNumber
    }
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

// Get user chats with REAL user details
app.get('/api/chat/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const userChats = [];

  for (const [bookingId, chat] of chats) {
    if (chat.ownerId === userId || chat.seekerId === userId) {
      const chatMessages = messages.get(chat.chatId) || [];
      const lastMessage = chatMessages[chatMessages.length - 1];

      // Get enriched chat data with REAL booking data
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
    message: 'User chats retrieved successfully with REAL data',
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
  console.log('\n🚀 Chat Service with REAL Booking Data Started!');
  console.log('=====================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 HTTP API: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/chat/health`);
  console.log('=====================================');
  console.log('📋 REAL DATA INTEGRATION:');
  console.log(`  👤 Tenant: ${realBookingData.userName}`);
  console.log(`  👤 Owner: ${realBookingData.ownerName}`);
  console.log(`  🏠 Property: ${realBookingData.propertyName}`);
  console.log(`  🚪 Room: ${realBookingData.roomNumber}`);
  console.log(`  💰 Rent: ₹${realBookingData.monthlyRent}/month`);
  console.log(`  📅 Check-in: ${new Date(realBookingData.checkInDate).toLocaleDateString()}`);
  console.log('=====================================\n');
});

module.exports = { app, server, io };
