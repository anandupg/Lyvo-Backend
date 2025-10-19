/**
 * Integration Script for Booking Approval
 * 
 * This script shows how to integrate chat creation with your booking approval process.
 * Add this code to your property service when a booking is approved.
 */

class ChatIntegration {
  constructor() {
    this.chatServiceUrl = 'http://localhost:5002';
  }

  /**
   * Create a chat when a booking is approved
   * Call this function after successful booking approval
   */
  async createChatForApprovedBooking(booking) {
    try {
      console.log('🔄 Creating chat for approved booking:', booking._id);

      const response = await fetch(`${this.chatServiceUrl}/api/chat/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: booking._id,
          ownerId: booking.ownerId,
          seekerId: booking.userId
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Chat created successfully:', data.data.chatId);
        console.log('👤 Owner:', booking.ownerName);
        console.log('👤 Tenant:', booking.userName);
        console.log('🏠 Property:', booking.propertyName);
        console.log('🚪 Room:', booking.roomNumber);
        
        return {
          success: true,
          chatId: data.data.chatId,
          message: 'Chat created successfully'
        };
      } else {
        console.error('❌ Chat creation failed:', data.message);
        return {
          success: false,
          message: data.message
        };
      }
    } catch (error) {
      console.error('❌ Error creating chat:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Test the integration with your real booking data
   */
  async testIntegration() {
    console.log('🧪 Testing chat integration with real booking data...\n');

    // Your real booking data
    const realBooking = {
      _id: "68f4ec0764177a8e0ec6f9c1",
      userId: "68e7588ed0829f512ccf8b9f",
      userName: "ANANDU P GANESH",
      userEmail: "anandupganesh2026@mca.ajce.in",
      userPhone: "7306080450",
      propertyId: "68f3103b64177a8e0ec6f316",
      propertyName: "RJ Villas",
      roomId: "68f3103c64177a8e0ec6f318",
      roomNumber: "1",
      ownerId: "68d0548f159c0549a6c59079",
      ownerName: "Anandu P Ganesh",
      ownerEmail: "anandupg2022@gmail.com",
      ownerPhone: "",
      bookingId: "68f4ebf264177a8e0ec6f9b5",
      status: "active",
      monthlyRent: 3000,
      securityDeposit: 10000,
      amountPaid: 13000,
      checkInDate: "2025-10-19T13:47:51.055+00:00",
      confirmedAt: "2025-10-19T13:47:51.055+00:00"
    };

    const result = await this.createChatForApprovedBooking(realBooking);
    
    if (result.success) {
      console.log('\n🎉 Integration test successful!');
      console.log('📱 Both owner and tenant can now chat with real details:');
      console.log('   👤 Owner: Anandu P Ganesh');
      console.log('   👤 Tenant: ANANDU P GANESH');
      console.log('   🏠 Property: RJ Villas - Room 1');
      console.log('   💰 Rent: ₹3,000/month');
    } else {
      console.log('\n❌ Integration test failed:', result.message);
    }

    return result;
  }

  /**
   * Get chat details for a user
   */
  async getUserChats(userId) {
    try {
      const response = await fetch(`${this.chatServiceUrl}/api/chat/user/${userId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user chats:', error.message);
      return null;
    }
  }
}

// Example usage and testing
async function main() {
  const chatIntegration = new ChatIntegration();
  
  console.log('🚀 Chat Integration Script');
  console.log('========================\n');

  // Test the integration
  await chatIntegration.testIntegration();

  console.log('\n📋 Integration Code for Your Property Service:');
  console.log('===============================================');
  console.log(`
// Add this to your booking approval logic:

const chatIntegration = new ChatIntegration();

// After successful booking approval:
const chatResult = await chatIntegration.createChatForApprovedBooking(booking);

if (chatResult.success) {
  console.log('✅ Chat created for booking:', booking._id);
  // Optionally store chatId in your booking document
  // booking.chatId = chatResult.chatId;
  // await booking.save();
} else {
  console.error('❌ Failed to create chat:', chatResult.message);
}
  `);

  console.log('\n✅ Integration ready! Add the above code to your booking approval process.');
}

// Run the test if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ChatIntegration;
