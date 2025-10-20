const Notification = require('../models/Notification');

class NotificationService {
  /**
   * Create a notification
   */
  static async createNotification({
    recipient_id,
    recipient_type,
    title,
    message,
    type,
    related_property_id = null,
    related_room_id = null,
    related_booking_id = null,
    action_url = null,
    created_by = null,
    metadata = {}
  }) {
    try {
      const notification = new Notification({
        recipient_id,
        recipient_type,
        title,
        message,
        type,
        related_property_id,
        related_room_id,
        related_booking_id,
        action_url,
        created_by,
        metadata
      });

      await notification.save();
      console.log(`✅ Notification created for user ${recipient_id}: ${title}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Notify property approval
   */
  static async notifyPropertyApproval(property, adminId) {
    return await this.createNotification({
      recipient_id: property.owner_id,
      recipient_type: 'owner',
      title: 'Property Approved! 🎉',
      message: `Your property "${property.property_name}" has been approved by the admin and is now live!`,
      type: 'property_approved',
      related_property_id: property._id,
      action_url: `/owner-properties/${property._id}`,
      created_by: adminId,
      metadata: {
        property_name: property.property_name,
        property_id: property._id
      }
    });
  }

  /**
   * Notify property rejection
   */
  static async notifyPropertyRejection(property, adminId, reason = null) {
    return await this.createNotification({
      recipient_id: property.owner_id,
      recipient_type: 'owner',
      title: 'Property Rejected',
      message: `Your property "${property.property_name}" has been rejected by the admin.${reason ? ` Reason: ${reason}` : ''}`,
      type: 'property_rejected',
      related_property_id: property._id,
      action_url: `/owner-properties/${property._id}`,
      created_by: adminId,
      metadata: {
        property_name: property.property_name,
        property_id: property._id,
        reason
      }
    });
  }

  /**
   * Notify room approval
   */
  static async notifyRoomApproval(room, property, adminId) {
    return await this.createNotification({
      recipient_id: property.owner_id,
      recipient_type: 'owner',
      title: 'Room Approved! ✅',
      message: `Room ${room.room_number} in "${property.property_name}" has been approved and is now available for booking!`,
      type: 'room_approved',
      related_property_id: property._id,
      related_room_id: room._id,
      action_url: `/owner-properties/${property._id}`,
      created_by: adminId,
      metadata: {
        property_name: property.property_name,
        room_number: room.room_number,
        room_type: room.room_type,
        property_id: property._id,
        room_id: room._id
      }
    });
  }

  /**
   * Notify room rejection
   */
  static async notifyRoomRejection(room, property, adminId, reason = null) {
    return await this.createNotification({
      recipient_id: property.owner_id,
      recipient_type: 'owner',
      title: 'Room Rejected',
      message: `Room ${room.room_number} in "${property.property_name}" has been rejected by the admin.${reason ? ` Reason: ${reason}` : ''}`,
      type: 'room_rejected',
      related_property_id: property._id,
      related_room_id: room._id,
      action_url: `/owner-properties/${property._id}`,
      created_by: adminId,
      metadata: {
        property_name: property.property_name,
        room_number: room.room_number,
        room_type: room.room_type,
        property_id: property._id,
        room_id: room._id,
        reason
      }
    });
  }

  /**
   * Notify booking request (to owner)
   */
  static async notifyBookingRequest(booking, property, seekerId) {
    return await this.createNotification({
      recipient_id: property.owner_id,
      recipient_type: 'owner',
      title: 'New Booking Request',
      message: `You have a new booking request for "${property.property_name}"`,
      type: 'booking_request',
      related_property_id: property._id,
      related_booking_id: booking._id,
      action_url: `/owner-bookings/${booking._id}`,
      created_by: seekerId,
      metadata: {
        property_name: property.property_name,
        property_id: property._id,
        booking_id: booking._id
      }
    });
  }

  /**
   * Notify booking approval (to seeker)
   */
  static async notifyBookingApproval(booking, property, room, ownerId) {
    return await this.createNotification({
      recipient_id: booking.userId,
      recipient_type: 'seeker',
      title: 'Booking Approved! 🎉',
      message: `Your booking for "${property.property_name}" - Room ${room?.room_number || 'N/A'} has been approved by the owner!`,
      type: 'booking_approved',
      related_property_id: property._id,
      related_room_id: room?._id,
      related_booking_id: booking._id,
      action_url: `/seeker-post-booking-dashboard`,
      created_by: ownerId,
      metadata: {
        property_name: property.property_name,
        room_number: room?.room_number,
        property_id: property._id,
        room_id: room?._id,
        booking_id: booking._id
      }
    });
  }

  /**
   * Notify booking rejection (to seeker)
   */
  static async notifyBookingRejection(booking, property, room, ownerId, reason = null) {
    return await this.createNotification({
      recipient_id: booking.userId,
      recipient_type: 'seeker',
      title: 'Booking Rejected',
      message: `Your booking for "${property.property_name}" - Room ${room?.room_number || 'N/A'} has been rejected by the owner.${reason ? ` Reason: ${reason}` : ''}`,
      type: 'booking_rejected',
      related_property_id: property._id,
      related_room_id: room?._id,
      related_booking_id: booking._id,
      action_url: `/seeker-search-properties`,
      created_by: ownerId,
      metadata: {
        property_name: property.property_name,
        room_number: room?.room_number,
        property_id: property._id,
        room_id: room?._id,
        booking_id: booking._id,
        reason
      }
    });
  }

  /**
   * Send custom message from admin to owner
   */
  static async sendAdminMessageToOwner(ownerId, propertyId, propertyName, message, adminId) {
    return await this.createNotification({
      recipient_id: ownerId,
      recipient_type: 'owner',
      title: '📨 Message from Admin',
      message: message,
      type: 'general',
      related_property_id: propertyId,
      action_url: `/owner-properties/${propertyId}`,
      created_by: adminId,
      metadata: {
        property_name: propertyName,
        property_id: propertyId,
        message_type: 'admin_custom_message'
      }
    });
  }
}

module.exports = NotificationService;

