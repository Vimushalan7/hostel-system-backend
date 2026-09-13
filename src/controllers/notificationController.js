const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// Get all notifications for the authenticated user
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ userId: req.user._id });

    return sendSuccess(res, {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, 'Notifications retrieved');
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return sendError(res, 'Server error while fetching notifications', 500);
  }
};

// Mark single notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }

    return sendSuccess(res, notification, 'Notification marked as read');
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return sendError(res, 'Server error', 500);
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return sendError(res, 'Server error', 500);
  }
};
