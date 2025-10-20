/**
 * Script to check all admin users and their password status
 * Usage: node check-admin-users.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./src/model');

async function checkAdminUsers() {
  try {
    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all admin users (role = 2)
    console.log('🔍 Searching for admin users...\n');
    const admins = await User.find({ role: 2 }).select('name email role password isVerified isActive createdAt');

    if (admins.length === 0) {
      console.log('❌ No admin users found in the database.\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`✅ Found ${admins.length} admin user(s):\n`);
    console.log('═'.repeat(80));

    admins.forEach((admin, index) => {
      console.log(`\n${index + 1}. Admin Details:`);
      console.log('─'.repeat(80));
      console.log(`   📧 Email:        ${admin.email}`);
      console.log(`   👤 Name:         ${admin.name || 'N/A'}`);
      console.log(`   🆔 ID:           ${admin._id}`);
      console.log(`   🔑 Password Set: ${admin.password ? '✅ Yes' : '❌ No (Need to set)'}`);
      console.log(`   ✓  Verified:     ${admin.isVerified ? '✅ Yes' : '❌ No'}`);
      console.log(`   🟢 Active:       ${admin.isActive !== false ? '✅ Yes' : '❌ No'}`);
      console.log(`   📅 Created:      ${admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log('\n💡 To reset an admin password, run:');
    console.log('   node reset-admin-password.js <admin-email> <new-password>');
    console.log('\n   Example:');
    console.log('   node reset-admin-password.js admin@lyvo.com Admin@123\n');

    // Close connection
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run the script
checkAdminUsers();

