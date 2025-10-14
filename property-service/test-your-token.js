const jwt = require('jsonwebtoken');
require('dotenv').config();

// Replace this with your actual token from localStorage
const yourToken = 'YOUR_TOKEN_HERE';

console.log('=== Testing Your Actual Token ===');
console.log('Token:', yourToken.substring(0, 50) + '...');

// Test with JWT_SECRET
try {
    const payload = jwt.verify(yourToken, process.env.JWT_SECRET);
    console.log('✅ Token verification successful with JWT_SECRET!');
    console.log('Payload:', payload);
    
    const mongoId = payload?._id || payload?.id || payload?.userId || payload?.sub;
    console.log('Mongo ID:', mongoId);
    
} catch (error) {
    console.log('❌ Token verification failed with JWT_SECRET:', error.message);
}

// Test with USER_JWT_SECRET
try {
    const payload2 = jwt.verify(yourToken, process.env.USER_JWT_SECRET);
    console.log('✅ Token verification successful with USER_JWT_SECRET!');
    console.log('Payload:', payload2);
} catch (error) {
    console.log('❌ Token verification failed with USER_JWT_SECRET:', error.message);
}
