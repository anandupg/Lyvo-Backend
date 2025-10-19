/**
 * Integration script to help connect chat service with existing booking service
 * This script shows how to modify your booking service to initiate chats
 */

// Example integration code for your booking service
// Add this to your booking approval logic

const initiateChatForBooking = async (bookingId, ownerId, seekerId) => {
  try {
    console.log('🚀 Initiating chat for booking:', bookingId);
    
    const response = await fetch('http://localhost:5002/api/chat/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.INTERNAL_API_KEY || 'your-internal-api-key'
      },
      body: JSON.stringify({
        bookingId,
        ownerId,
        seekerId
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Chat initiated successfully:', data.data.chatId);
      return data.data.chatId;
    } else {
      const errorData = await response.json();
      console.error('❌ Failed to initiate chat:', errorData);
      return null;
    }
  } catch (error) {
    console.error('❌ Error initiating chat:', error);
    return null;
  }
};

// Example: Add this to your booking approval endpoint
const approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Your existing booking approval logic here
    // ... update booking status to 'approved'
    
    // After successful approval, initiate chat
    const chatId = await initiateChatForBooking(
      bookingId,
      booking.ownerId,
      booking.seekerId
    );
    
    if (chatId) {
      // Optionally store chatId in booking document
      // await Booking.findByIdAndUpdate(bookingId, { chatId });
      console.log('Chat created for booking:', bookingId);
    }
    
    res.json({
      success: true,
      message: 'Booking approved and chat initiated',
      chatId
    });
    
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve booking'
    });
  }
};

// Example: Add this to your booking cancellation logic
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Your existing cancellation logic here
    // ... update booking status to 'cancelled'
    
    // Update chat status to readonly
    try {
      const chatResponse = await fetch(`http://localhost:5002/api/chat/booking/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.INTERNAL_API_KEY || 'your-internal-api-key'
        },
        body: JSON.stringify({ status: 'readonly' })
      });
      
      if (chatResponse.ok) {
        console.log('Chat status updated to readonly for booking:', bookingId);
      }
    } catch (chatError) {
      console.error('Failed to update chat status:', chatError);
    }
    
    res.json({
      success: true,
      message: 'Booking cancelled'
    });
    
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  }
};

// Environment variables to add to your booking service .env file:
const envExample = `
# Add these to your booking service .env file
INTERNAL_API_KEY=your-secure-internal-api-key-here
CHAT_SERVICE_URL=http://localhost:5002
`;

// Database migration to add chatId to bookings (optional)
const addChatIdToBookings = `
-- Add this migration to your booking service database
-- This is optional but recommended for better integration

ALTER TABLE bookings ADD COLUMN chatId VARCHAR(255);
CREATE INDEX idx_bookings_chat_id ON bookings(chatId);
`;

console.log('📋 Integration Instructions:');
console.log('1. Add INTERNAL_API_KEY to your booking service .env file');
console.log('2. Add CHAT_SERVICE_URL to your booking service .env file');
console.log('3. Copy the initiateChatForBooking function to your booking service');
console.log('4. Call initiateChatForBooking after successful booking approval');
console.log('5. Optionally add chatId field to your bookings table');
console.log('6. Start the chat service: npm start');
console.log('7. Test the integration with a real booking approval');

module.exports = {
  initiateChatForBooking,
  approveBooking,
  cancelBooking,
  envExample,
  addChatIdToBookings
};
