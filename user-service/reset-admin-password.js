/**
 * Script to reset admin password
 * Usage: node reset-admin-password.js <admin-email> <new-password>
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./src/model');

async function resetAdminPassword() {
  try {
    // Get email and password from command line arguments
    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
      console.log('\n❌ Error: Please provide both email and new password');
      console.log('Usage: node reset-admin-password.js <admin-email> <new-password>');
      console.log('Example: node reset-admin-password.js admin@lyvo.com Admin@123\n');
      process.exit(1);
    }

    // Validate password
    if (newPassword.length < 8) {
      console.log('\n❌ Error: Password must be at least 8 characters long\n');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find admin user
    console.log(`🔍 Looking for admin with email: ${email}`);
    const admin = await User.findOne({ email: email.toLowerCase() });

    if (!admin) {
      console.log(`\n❌ Error: No user found with email: ${email}`);
      console.log('Please check the email address and try again.\n');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Check if user is admin
    if (admin.role !== 2) {
      console.log(`\n❌ Error: User ${email} is not an admin (role: ${admin.role})`);
      console.log('This script only works for admin users (role: 2).\n');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Found admin: ${admin.name} (${admin.email})`);
    console.log(`   Role: ${admin.role} (Admin)`);
    console.log(`   Current password set: ${admin.password ? 'Yes' : 'No'}`);

    // Hash new password
    console.log('\n🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    console.log('💾 Updating password in database...');
    admin.password = hashedPassword;
    await admin.save();

    console.log('✅ Password updated successfully!\n');
    console.log('📋 Summary:');
    console.log(`   Admin Email: ${admin.email}`);
    console.log(`   Admin Name: ${admin.name}`);
    console.log(`   New Password: ${newPassword}`);
    console.log('\n✨ You can now login with the new password!\n');

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
resetAdminPassword();

