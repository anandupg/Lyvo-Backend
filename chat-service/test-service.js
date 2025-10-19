/**
 * Simple test script to verify chat service functionality
 * Run with: node test-service.js
 */

const io = require('socket.io-client');

// Test configuration
const CHAT_SERVICE_URL = 'http://localhost:5002';
const TEST_JWT_TOKEN = 'your-test-jwt-token'; // Replace with actual token

console.log('🧪 Testing Lyvo Chat Service...\n');

// Test 1: Health Check
async function testHealthCheck() {
  console.log('1️⃣ Testing Health Check...');
  try {
    const response = await fetch(`${CHAT_SERVICE_URL}/api/chat/health`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Health check passed');
      console.log(`   Service: ${data.message}`);
      console.log(`   Timestamp: ${data.timestamp}\n`);
    } else {
      console.log('❌ Health check failed\n');
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message, '\n');
  }
}

// Test 2: API Documentation
async function testAPIDocs() {
  console.log('2️⃣ Testing API Documentation...');
  try {
    const response = await fetch(`${CHAT_SERVICE_URL}/api/chat/docs`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API docs accessible');
      console.log(`   Version: ${data.version}`);
      console.log(`   Endpoints: ${Object.keys(data.endpoints).length} available\n`);
    } else {
      console.log('❌ API docs failed\n');
    }
  } catch (error) {
    console.log('❌ API docs failed:', error.message, '\n');
  }
}

// Test 3: Socket.io Connection
function testSocketConnection() {
  console.log('3️⃣ Testing Socket.io Connection...');
  
  return new Promise((resolve) => {
    const socket = io(CHAT_SERVICE_URL, {
      auth: { token: TEST_JWT_TOKEN },
      transports: ['websocket', 'polling'],
      timeout: 5000
    });

    let connected = false;

    socket.on('connect', () => {
      if (!connected) {
        connected = true;
        console.log('✅ Socket.io connection successful');
        console.log(`   Socket ID: ${socket.id}`);
        socket.disconnect();
        resolve(true);
      }
    });

    socket.on('connect_error', (error) => {
      if (!connected) {
        console.log('❌ Socket.io connection failed:', error.message);
        resolve(false);
      }
    });

    socket.on('error', (error) => {
      if (!connected) {
        console.log('❌ Socket.io error:', error.message);
        resolve(false);
      }
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!connected) {
        console.log('❌ Socket.io connection timeout');
        socket.disconnect();
        resolve(false);
      }
    }, 5000);
  });
}

// Test 4: Chat Initiation (Internal API)
async function testChatInitiation() {
  console.log('4️⃣ Testing Chat Initiation...');
  
  try {
    const response = await fetch(`${CHAT_SERVICE_URL}/api/chat/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-api-key' // This will fail without proper key
      },
      body: JSON.stringify({
        bookingId: 'test_booking_123',
        ownerId: 'test_owner_456',
        seekerId: 'test_seeker_789'
      })
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Chat initiation endpoint protected (requires API key)');
      console.log(`   Error: ${data.error}\n`);
    } else if (data.success) {
      console.log('✅ Chat initiation successful');
      console.log(`   Chat ID: ${data.data.chatId}\n`);
    } else {
      console.log('❌ Chat initiation failed:', data.message, '\n');
    }
  } catch (error) {
    console.log('❌ Chat initiation failed:', error.message, '\n');
  }
}

// Test 5: Authentication Required Endpoints
async function testAuthRequired() {
  console.log('5️⃣ Testing Authentication Required Endpoints...');
  
  try {
    const response = await fetch(`${CHAT_SERVICE_URL}/api/chat/user/test-user-id`);
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ User chats endpoint protected (requires JWT)');
      console.log(`   Error: ${data.error}\n`);
    } else {
      console.log('❌ User chats endpoint not properly protected\n');
    }
  } catch (error) {
    console.log('❌ Auth test failed:', error.message, '\n');
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Chat Service Tests\n');
  console.log('='.repeat(50));
  
  await testHealthCheck();
  await testAPIDocs();
  await testSocketConnection();
  await testChatInitiation();
  await testAuthRequired();
  
  console.log('='.repeat(50));
  console.log('🏁 Tests completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. Update .env file with your actual configuration');
  console.log('2. Start the service: npm start');
  console.log('3. Test with real JWT tokens from your main backend');
  console.log('4. Integrate with your booking service');
  console.log('5. Add chat UI to your frontend');
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

// Main execution
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
