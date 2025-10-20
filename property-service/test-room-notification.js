/**
 * Test Room Approval Notification
 * 
 * This script tests the room approval notification system
 * 
 * Usage:
 * 1. Update OWNER_ID, PROPERTY_ID, and ROOM_ID with real values
 * 2. Run: node test-room-notification.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Update these with your real values
const OWNER_ID = '68f5255641863e4cbe37dc4f'; // Owner's user ID
const PROPERTY_ID = '67152d1a0e7e8c42e8a1234'; // Property ID
const ROOM_ID = '67152d1a0e7e8c42e8a5678'; // Room ID (subdocument ID)

const testRoomNotification = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lyvo';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Import models
    const Notification = require('./src/models/Notification');
    const Property = require('./src/controller').Property;

    // Create a test room approval notification
    console.log('📝 Creating test room approval notification...\n');
    
    const notification = await Notification.create({
      recipient_id: OWNER_ID,
      recipient_type: 'owner',
      title: 'Room Approved! ✅',
      message: `Room 101 in "St George Hostel" has been approved and is now available for booking!`,
      type: 'room_approved',
      related_property_id: PROPERTY_ID,
      related_room_id: ROOM_ID,
      action_url: `/owner-properties/${PROPERTY_ID}`,
      created_by: 'admin-test',
      metadata: {
        property_name: 'St George Hostel',
        room_number: '101',
        room_type: 'Single',
        property_id: PROPERTY_ID,
        room_id: ROOM_ID
      }
    });

    console.log('✅ Room approval notification created successfully!');
    console.log('\n📋 Notification Details:');
    console.log('   ID:', notification._id);
    console.log('   Title:', notification.title);
    console.log('   Message:', notification.message);
    console.log('   Property Name:', notification.metadata.property_name);
    console.log('   Room Number:', notification.metadata.room_number);
    console.log('   Room Type:', notification.metadata.room_type);
    console.log('   Is Read:', notification.is_read);
    console.log('   Created:', notification.createdAt);

    console.log('\n✅ Test completed successfully!');
    console.log('\n🔗 Next steps:');
    console.log('1. Log in as the owner (ID:', OWNER_ID, ')');
    console.log('2. Check the bell icon in the navbar');
    console.log('3. You should see the room approval notification');
    console.log('4. Hover over it to see the "Mark as Read" button (X icon)');
    console.log('5. Click the X to mark it as read and make it disappear');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error details:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the test
testRoomNotification();

