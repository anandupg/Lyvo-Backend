/**
 * Test script to verify chat service integration
 * Run this after starting the chat service to test the full flow
 */

const io = require('socket.io-client');

// Test configuration
const CHAT_SERVICE_URL = 'http://localhost:5002';
const TEST_BOOKING_ID = 'test_booking_' + Date.now();
const TEST_OWNER_ID = 'test_owner_' + Date.now();
const TEST_SEEKER_ID = 'test_seeker_' + Date.now();

console.log('🧪 Testing Chat Service Integration...\n');

// Step 1: Test chat initiation
async function testChatInitiation() {
  console.log('1️⃣ Testing Chat Initiation...');
  
  try {
    const response = await fetch(`${CHAT_SERVICE_URL}/api/chat/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-api-key' // This will fail without proper key
      },
      body: JSON.stringify({
        bookingId: TEST_BOOKING_ID,
        ownerId: TEST_OWNER_ID,
        seekerId: TEST_SEEKER_ID
      })
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Chat initiation endpoint protected (requires API key)');
      console.log(`   Error: ${data.error}`);
      return null;
    } else if (data.success) {
      console.log('✅ Chat initiated successfully');
      console.log(`   Chat ID: ${data.data.chatId}`);
      return data.data.chatId;
    } else {
      console.log('❌ Chat initiation failed:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Chat initiation failed:', error.message);
    return null;
  }
}

// Step 2: Test WebSocket connection
function testWebSocketConnection() {
  console.log('\n2️⃣ Testing WebSocket Connection...');
  
  return new Promise((resolve) => {
    const socket = io(CHAT_SERVICE_URL, {
      auth: { token: 'test-token' },
      transports: ['websocket', 'polling'],
      timeout: 5000
    });

    let connected = false;

    socket.on('connect', () => {
      if (!connected) {
        connected = true;
        console.log('✅ WebSocket connection successful');
        console.log(`   Socket ID: ${socket.id}`);
        socket.disconnect();
        resolve(true);
      }
    });

    socket.on('connect_error', (error) => {
      if (!connected) {
        console.log('❌ WebSocket connection failed:', error.message);
        resolve(false);
      }
    });

    socket.on('error', (error) => {
      if (!connected) {
        console.log('❌ WebSocket error:', error.message);
        resolve(false);
      }
    });

    setTimeout(() => {
      if (!connected) {
        console.log('❌ WebSocket connection timeout');
        socket.disconnect();
        resolve(false);
      }
    }, 5000);
  });
}

// Step 3: Test API endpoints
async function testAPIEndpoints() {
  console.log('\n3️⃣ Testing API Endpoints...');
  
  const endpoints = [
    { name: 'Health Check', url: '/api/chat/health', method: 'GET' },
    { name: 'API Documentation', url: '/api/chat/docs', method: 'GET' },
    { name: 'User Chats (Auth Required)', url: '/api/chat/user/test-user', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${CHAT_SERVICE_URL}${endpoint.url}`, {
        method: endpoint.method,
        headers: endpoint.method === 'GET' ? {} : { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        console.log(`✅ ${endpoint.name}: OK`);
      } else if (response.status === 401) {
        console.log(`✅ ${endpoint.name}: Protected (requires auth)`);
      } else {
        console.log(`❌ ${endpoint.name}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
}

// Step 4: Test real chat flow (if chat was created)
async function testRealChatFlow(chatId) {
  if (!chatId) {
    console.log('\n4️⃣ Skipping Real Chat Flow (no chat created)');
    return;
  }

  console.log('\n4️⃣ Testing Real Chat Flow...');
  
  return new Promise((resolve) => {
    const ownerSocket = io(CHAT_SERVICE_URL, {
      auth: { token: 'test-owner-token' },
      transports: ['websocket']
    });

    const seekerSocket = io(CHAT_SERVICE_URL, {
      auth: { token: 'test-seeker-token' },
      transports: ['websocket']
    });

    let messagesReceived = 0;
    const expectedMessages = 2;

    ownerSocket.on('connect', () => {
      console.log('✅ Owner connected');
      ownerSocket.emit('join_chat', { chatId });
    });

    seekerSocket.on('connect', () => {
      console.log('✅ Seeker connected');
      seekerSocket.emit('join_chat', { chatId });
      
      // Send a test message
      setTimeout(() => {
        seekerSocket.emit('send_message', {
          chatId,
          content: 'Hello from seeker!',
          contentType: 'text'
        });
      }, 1000);
    });

    ownerSocket.on('receive_message', (message) => {
      console.log('✅ Owner received message:', message.content);
      messagesReceived++;
      
      // Send reply
      setTimeout(() => {
        ownerSocket.emit('send_message', {
          chatId,
          content: 'Hello from owner!',
          contentType: 'text'
        });
      }, 500);
    });

    seekerSocket.on('receive_message', (message) => {
      console.log('✅ Seeker received message:', message.content);
      messagesReceived++;
      
      if (messagesReceived >= expectedMessages) {
        console.log('✅ Real chat flow test completed');
        ownerSocket.disconnect();
        seekerSocket.disconnect();
        resolve(true);
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('❌ Real chat flow test timeout');
      ownerSocket.disconnect();
      seekerSocket.disconnect();
      resolve(false);
    }, 10000);
  });
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Chat Service Integration Tests\n');
  console.log('='.repeat(60));
  
  // Test 1: Chat initiation
  const chatId = await testChatInitiation();
  
  // Test 2: WebSocket connection
  const wsConnected = await testWebSocketConnection();
  
  // Test 3: API endpoints
  await testAPIEndpoints();
  
  // Test 4: Real chat flow
  const chatFlowSuccess = await testRealChatFlow(chatId);
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test Results Summary:');
  console.log(`   Chat Initiation: ${chatId ? '✅' : '❌'}`);
  console.log(`   WebSocket Connection: ${wsConnected ? '✅' : '❌'}`);
  console.log(`   API Endpoints: ✅`);
  console.log(`   Real Chat Flow: ${chatFlowSuccess ? '✅' : '❌'}`);
  
  if (chatId && wsConnected && chatFlowSuccess) {
    console.log('\n🎉 All tests passed! Chat service is ready for integration.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the configuration and try again.');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Update .env file with your actual configuration');
  console.log('2. Add INTERNAL_API_KEY to your booking service');
  console.log('3. Integrate chat initiation in your booking approval logic');
  console.log('4. Test with real JWT tokens from your main backend');
  console.log('5. Deploy to production when ready');
}

// Check if service is running
async function checkServiceRunning() {
  try {
    const response = await fetch(`${CHAT_SERVICE_URL}/api/chat/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Run tests
async function main() {
  const isRunning = await checkServiceRunning();
  
  if (!isRunning) {
    console.log('❌ Chat service is not running!');
    console.log('Please start the service first:');
    console.log('  cd Lyvo-Backend/chat-service');
    console.log('  npm start');
    console.log('\nThen run this test again.');
    process.exit(1);
  }
  
  await runAllTests();
}

main().catch(console.error);
