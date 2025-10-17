const mongoose = require('mongoose');
const Tenant = require('./src/models/Tenant');
const Booking = require('./src/models/Booking');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lyvo';
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
    
    // List all databases
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('Available databases:', dbs.databases.map(db => db.name));
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test tenant creation
const testTenantCreation = async () => {
  try {
    await connectDB();
    
    // Find all bookings
    const allBookings = await Booking.find({});
    console.log(`Found ${allBookings.length} total bookings`);
    
    // Group by status
    const bookingsByStatus = {};
    allBookings.forEach(booking => {
      const status = booking.status;
      if (!bookingsByStatus[status]) {
        bookingsByStatus[status] = [];
      }
      bookingsByStatus[status].push(booking);
    });
    
    console.log('\nBookings by status:');
    Object.keys(bookingsByStatus).forEach(status => {
      console.log(`  ${status}: ${bookingsByStatus[status].length}`);
    });
    
    // Find confirmed bookings
    const confirmedBookings = await Booking.find({ status: 'confirmed' });
    console.log(`\nFound ${confirmedBookings.length} confirmed bookings`);
    
    if (confirmedBookings.length === 0) {
      console.log('No confirmed bookings found. Please approve a booking first.');
      console.log('\nAvailable bookings to approve:');
      const pendingBookings = await Booking.find({ status: 'pending_approval' });
      pendingBookings.forEach(booking => {
        console.log(`  Booking ${booking._id}: User ${booking.userId}, Property ${booking.propertyId}, Room ${booking.roomId}`);
      });
      return;
    }
    
    // Check existing tenants
    const existingTenants = await Tenant.find({});
    console.log(`Found ${existingTenants.length} existing tenants`);
    
    // Show booking details
    for (const booking of confirmedBookings) {
      console.log('\n--- Booking Details ---');
      console.log('Booking ID:', booking._id);
      console.log('User ID:', booking.userId);
      console.log('User Snapshot:', booking.userSnapshot);
      console.log('Property ID:', booking.propertyId);
      console.log('Room ID:', booking.roomId);
      console.log('Payment:', booking.payment);
      console.log('Status:', booking.status);
      
      // Check if tenant exists
      const existingTenant = await Tenant.findOne({ bookingId: booking._id });
      console.log('Tenant exists:', !!existingTenant);
      
      if (existingTenant) {
        console.log('Tenant details:', {
          userName: existingTenant.userName,
          userEmail: existingTenant.userEmail,
          propertyName: existingTenant.propertyName,
          roomNumber: existingTenant.roomNumber
        });
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
  }
};

testTenantCreation();
