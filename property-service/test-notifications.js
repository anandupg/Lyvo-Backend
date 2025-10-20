/**
 * Test script for Notification System
 * 
 * Usage:
 * 1. Make sure MongoDB is running
 * 2. Update USER_ID and PROPERTY_ID with real values
 * 3. Run: node test-notifications.js
 */

const mongoose = require('mongoose');
const Notification = require('./src/models/Notification');
require('dotenv').config();

// ========================================
// UPDATE THESE WITH YOUR REAL VALUES
// ========================================
const TEST_USER_ID = '68f5255641863e4cbe37dc4f'; // Replace with real owner user ID
const TEST_PROPERTY_ID = '67152d1a0e7e8c42e8a1234'; // Replace with real property ID

// ========================================

const testNotifications = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lyvo';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('\n📝 Creating test notifications...\n');

    // Test 1: Property Approved
    const notification1 = await Notification.create({
      recipient_id: TEST_USER_ID,
      recipient_type: 'owner',
      title: 'Property Approved! 🎉',
      message: 'Your property "St George Hostel" has been approved by the admin and is now live!',
      type: 'property_approved',
      related_property_id: TEST_PROPERTY_ID,
      action_url: `/owner-properties/${TEST_PROPERTY_ID}`,
      created_by: 'admin123',
      metadata: {
        property_name: 'St George Hostel',
        property_id: TEST_PROPERTY_ID
      }
    });
    console.log('✅ Created notification 1:', notification1.title);

    // Test 2: Property Rejected
    const notification2 = await Notification.create({
      recipient_id: TEST_USER_ID,
      recipient_type: 'owner',
      title: 'Property Rejected',
      message: 'Your property "Sunrise PG" has been rejected by the admin. Reason: Missing required documents.',
      type: 'property_rejected',
      action_url: `/owner-properties/${TEST_PROPERTY_ID}`,
      created_by: 'admin123',
      metadata: {
        property_name: 'Sunrise PG',
        reason: 'Missing required documents'
      }
    });
    console.log('✅ Created notification 2:', notification2.title);

    // Test 3: Room Approved
    const notification3 = await Notification.create({
      recipient_id: TEST_USER_ID,
      recipient_type: 'owner',
      title: 'Room Approved! ✅',
      message: 'Room 101 in "St George Hostel" has been approved and is now available for booking!',
      type: 'room_approved',
      related_property_id: TEST_PROPERTY_ID,
      action_url: `/owner-properties/${TEST_PROPERTY_ID}`,
      created_by: 'admin123',
      metadata: {
        property_name: 'St George Hostel',
        room_number: '101',
        room_type: 'Single'
      }
    });
    console.log('✅ Created notification 3:', notification3.title);

    // Test 4: Booking Request
    const notification4 = await Notification.create({
      recipient_id: TEST_USER_ID,
      recipient_type: 'owner',
      title: 'New Booking Request',
      message: 'You have a new booking request for "St George Hostel"',
      type: 'booking_request',
      related_property_id: TEST_PROPERTY_ID,
      action_url: `/owner-bookings`,
      created_by: 'seeker456',
      metadata: {
        property_name: 'St George Hostel'
      }
    });
    console.log('✅ Created notification 4:', notification4.title);

    // Test 5: Payment Received
    const notification5 = await Notification.create({
      recipient_id: TEST_USER_ID,
      recipient_type: 'owner',
      title: 'Payment Received 💰',
      message: 'Rent payment of ₹8,000 received from Tenant - John Doe',
      type: 'payment_received',
      related_property_id: TEST_PROPERTY_ID,
      action_url: `/owner-dashboard`,
      created_by: 'system',
      metadata: {
        amount: 8000,
        tenant_name: 'John Doe'
      }
    });
    console.log('✅ Created notification 5:', notification5.title);

    console.log('\n📊 Fetching all notifications for user...\n');
    const allNotifications = await Notification.find({
      recipient_id: TEST_USER_ID
    }).sort({ createdAt: -1 });

    console.log(`✅ Found ${allNotifications.length} notifications:`);
    allNotifications.forEach((n, index) => {
      console.log(`\n${index + 1}. ${n.title}`);
      console.log(`   Message: ${n.message}`);
      console.log(`   Type: ${n.type}`);
      console.log(`   Read: ${n.is_read ? '✅ Yes' : '❌ No'}`);
      console.log(`   Created: ${n.createdAt}`);
    });

    console.log('\n📈 Getting unread count...');
    const unreadCount = await Notification.countDocuments({
      recipient_id: TEST_USER_ID,
      is_read: false
    });
    console.log(`✅ Unread notifications: ${unreadCount}`);

    console.log('\n✅ Test completed successfully!');
    console.log('\n🔗 You can now:');
    console.log('1. Log in as the owner user');
    console.log('2. Check the navbar bell icon');
    console.log('3. Click to view notifications');
    console.log('4. Click a notification to mark it as read');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the test
testNotifications();

