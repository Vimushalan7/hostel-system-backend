const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['status_update', 'system', 'reminder'],
    default: 'system',
  },
  relatedComplaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Index for fetching a user's notifications sorted by time
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
