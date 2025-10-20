const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Get all notifications for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const notifications = await Notification.find({
      recipient_id: userId
    })
    .sort({ createdAt: -1 })
    .limit(50); // Last 50 notifications

    res.json({
      success: true,
      data: notifications,
      unread_count: notifications.filter(n => !n.is_read).length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Get unread notification count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const count = await Notification.countDocuments({
      recipient_id: userId,
      is_read: false
    });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient_id: userId
      },
      {
        is_read: true,
        read_at: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID is required'
      });
    }

    await Notification.updateMany(
      {
        recipient_id: userId,
        is_read: false
      },
      {
        is_read: true,
        read_at: new Date()
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
      error: error.message
    });
  }
});

// Delete a notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient_id: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// Create notification (for testing or manual creation)
router.post('/', async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
});

module.exports = router;

