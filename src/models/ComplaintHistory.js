const mongoose = require('mongoose');

const complaintHistorySchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    // Human-readable complaint ID (for display)
    complaintHRId: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'created',
        'received',
        'assigned_department',
        'assigned_staff',
        'status_changed',
        'priority_changed',
        'remarks_added',
        'resolution_added',
        'completed',
        'reopened',
        'escalated',
        'image_uploaded',
        'feedback_submitted',
      ],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByName: {
      type: String,
      required: true,
    },
    performedByRole: {
      type: String,
      enum: ['student', 'warden', 'system'],
      required: true,
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

complaintHistorySchema.index({ complaintId: 1, createdAt: 1 });

const ComplaintHistory = mongoose.model('ComplaintHistory', complaintHistorySchema);
module.exports = ComplaintHistory;
