# Notification System Implementation Guide

## 📋 Overview

This notification system allows admins to send real-time notifications to property owners when properties or rooms are approved/rejected. Notifications are stored in the database and can be marked as read by the owner.

---

## 🏗️ System Architecture

### **Backend Components**

1. **Notification Schema** (`models/Notification.js`)
   - Stores notification data in MongoDB
   - Fields: recipient_id, title, message, type, is_read, related entities, timestamps
   - Auto-expires after 30 days

2. **Notification Routes** (`routes/notificationRoutes.js`)
   - `GET /api/notifications` - Get all notifications for logged-in user
   - `GET /api/notifications/unread-count` - Get unread notification count
   - `PATCH /api/notifications/:id/read` - Mark notification as read
   - `PATCH /api/notifications/mark-all-read` - Mark all as read
   - `DELETE /api/notifications/:id` - Delete a notification

3. **Notification Service** (`services/notificationService.js`)
   - Helper functions to create notifications:
     - `notifyPropertyApproval(property, adminId)`
     - `notifyPropertyRejection(property, adminId, reason)`
     - `notifyRoomApproval(room, property, adminId)`
     - `notifyRoomRejection(room, property, adminId, reason)`

4. **Controller Updates** (`controller.js`)
   - `approvePropertyAdmin` - Now sends notifications on approve/reject
   - `approveRoomAdmin` - Now sends notifications on approve/reject

### **Frontend Components**

1. **Owner Navbar** (`components/owner/OwnerNavbar.jsx`)
   - Real-time notification display in navbar
   - Auto-polls for new notifications every 30 seconds
   - Click to mark as read and navigate to related page
   - Shows unread count badge
   - Differentiates read/unread with styling

---

## 🚀 How It Works

### **When Admin Approves/Rejects Property:**

1. Admin clicks "Approve" or "Reject" on a property in the admin panel
2. Backend updates property `approval_status`
3. Backend creates a notification using `NotificationService`
4. Notification is stored in MongoDB with:
   - Owner's user ID
   - Property name
   - Approval/rejection message
   - Link to property page
   - Timestamp
5. Owner's navbar automatically fetches the new notification (within 30 seconds or on next page load)

### **When Owner Views Notifications:**

1. Owner clicks the bell icon in navbar
2. Frontend fetches notifications from `/api/notifications`
3. Displays up to 5 most recent notifications
4. Unread notifications have blue background
5. Shows unread count badge on bell icon

### **When Owner Clicks Notification:**

1. Marks notification as read (PATCH request)
2. Navigates to the related page (e.g., `/owner-properties/:id`)
3. Updates unread count
4. Removes blue background styling

---

## 🔧 API Endpoints

### **Get Notifications**
```http
GET /api/notifications
Headers:
  Authorization: Bearer <token>
  x-user-id: <userId>

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Property Approved! 🎉",
      "message": "Your property 'St George' has been approved...",
      "type": "property_approved",
      "is_read": false,
      "createdAt": "2025-10-19T10:30:00Z",
      "action_url": "/owner-properties/123"
    }
  ],
  "unread_count": 3
}
```

### **Mark as Read**
```http
PATCH /api/notifications/:notificationId/read
Headers:
  Authorization: Bearer <token>
  x-user-id: <userId>

Response:
{
  "success": true,
  "data": { /* updated notification */ }
}
```

---

## 🎨 Notification Types

| Type | Title | Message | Icon |
|------|-------|---------|------|
| `property_approved` | Property Approved! 🎉 | Your property "{name}" has been approved... | ✅ |
| `property_rejected` | Property Rejected | Your property "{name}" has been rejected... | ❌ |
| `room_approved` | Room Approved! ✅ | Room {number} in "{property}" has been approved... | ✅ |
| `room_rejected` | Room Rejected | Room {number} in "{property}" has been rejected... | ❌ |
| `booking_request` | New Booking Request | You have a new booking request for "{property}" | 📅 |
| `payment_received` | Payment Received | Rent payment received from Tenant... | 💰 |
| `maintenance_request` | Maintenance Request | New maintenance request for Property... | 🔧 |

---

## 📝 Usage Examples

### **Backend: Send Notification from Admin Action**

```javascript
// In controller.js - After approving property
const NotificationService = require('./services/notificationService');

if (action === 'approve') {
  await NotificationService.notifyPropertyApproval(property, adminId);
} else {
  await NotificationService.notifyPropertyRejection(property, adminId, reason);
}
```

### **Frontend: Fetch Notifications**

```javascript
// In OwnerNavbar.jsx
const fetchNotifications = async () => {
  const response = await fetch(`${baseUrl}/api/notifications`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'x-user-id': userId
    }
  });
  
  const data = await response.json();
  setNotifications(data.data);
  setUnreadCount(data.unread_count);
};
```

### **Frontend: Mark as Read**

```javascript
const markAsRead = async (notificationId) => {
  await fetch(`${baseUrl}/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'x-user-id': userId
    }
  });
  
  fetchNotifications(); // Refresh
};
```

---

## ⚙️ Configuration

### **Environment Variables**

No additional environment variables needed! Uses existing:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - For authentication
- Port 3002 (property service)

### **Database Indexes**

Automatic indexes created:
- `recipient_id + is_read + createdAt` - For fast queries
- TTL index on `created_at` - Auto-delete after 30 days

---

## 🧪 Testing

### **Test Notification Creation**

```bash
# Create a test notification
curl -X POST http://localhost:3002/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_id": "USER_ID_HERE",
    "recipient_type": "owner",
    "title": "Test Notification",
    "message": "This is a test notification",
    "type": "general"
  }'
```

### **Test Fetching Notifications**

```bash
# Get all notifications
curl -X GET http://localhost:3002/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-user-id: YOUR_USER_ID"
```

---

## 🎯 Features

✅ **Real-time updates** - Auto-polls every 30 seconds  
✅ **Persistent storage** - Survives page reloads  
✅ **Mark as read button** - Hover to see X icon, click to dismiss  
✅ **Auto-hide read notifications** - Only shows unread in dropdown  
✅ **Unread count** - Badge on bell icon shows count  
✅ **Click navigation** - Direct links to related pages  
✅ **Auto-expiry** - Old notifications auto-delete after 30 days  
✅ **Loading states** - Smooth user experience  
✅ **Empty states** - Clear messaging when no notifications  
✅ **Visual indicators** - Blue background for unread  
✅ **Time formatting** - Human-readable timestamps  
✅ **Owner notifications** - Property/room approval, booking requests  
✅ **Seeker notifications** - Booking approval/rejection  

---

## 🚨 Important Notes

1. **Authentication Required**: All notification endpoints require valid JWT token and user ID
2. **Owner-Specific**: Currently only for property owners (role 3)
3. **Auto-Polling**: Notifications refresh every 30 seconds automatically
4. **Manual Refresh**: Click notification or "View all" to force refresh
5. **Database Cleanup**: Notifications older than 30 days are automatically deleted

---

## 🔮 Future Enhancements

- [ ] WebSocket integration for real-time push notifications
- [ ] Email notifications for critical events
- [ ] SMS notifications option
- [ ] Notification preferences/settings
- [ ] Batch notifications for multiple properties
- [ ] Notification history page with filters
- [ ] Push notifications for mobile app

---

## 📞 Support

For issues or questions about the notification system:
1. Check MongoDB connection
2. Verify JWT tokens are valid
3. Check browser console for errors
4. Verify property service is running on port 3002
5. Check notification routes are registered in `index.js`

---

**Last Updated:** October 19, 2025  
**Version:** 1.0.0

