const mongoose = require('mongoose');

const CATEGORIES = [
  'Electrical', 'Plumbing', 'Cleaning', 'Food', 'Internet',
  'Room Maintenance', 'Security', 'Common Area', 'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const STATUSES = ['Submitted', 'Received', 'In Progress', 'Completed', 'Reopened'];

const complaintSchema = new mongoose.Schema(
  {
    // Human-readable ID: HST-2026-000001
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    block: {
      type: String,
      required: true,
      trim: true,
    },
    // Category chosen by student (may differ from AI suggestion)
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
    },
    // AI-suggested category and confidence
    aiSuggestedCategory: {
      type: String,
      enum: [...CATEGORIES, null],
      default: null,
    },
    categoryConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    // Priority chosen by student or overridden by warden
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'Medium',
    },
    aiSuggestedPriority: {
      type: String,
      enum: [...PRIORITIES, null],
      default: null,
    },
    priorityConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    aiReason: {
      type: String,
      default: null,
    },
    // Image stored via Cloudinary
    imageUrl: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    imageUploadedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'Submitted',
      index: true,
    },
    assignedDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceStaff',
      default: null,
    },
    wardenRemarks: {
      type: String,
      trim: true,
      default: null,
    },
    resolutionDetails: {
      type: String,
      trim: true,
      default: null,
    },
    // Timestamps for SLA tracking
    receivedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    reopenedAt: { type: Date, default: null },
    // Escalation
    isEscalated: { type: Boolean, default: false },
    escalatedAt: { type: Date, default: null },
    escalationReason: { type: String, default: null },
    // Reopening
    isReopened: { type: Boolean, default: false },
    reopenReason: { type: String, default: null },
    reopenCount: { type: Number, default: 0 },
    // Duplicate detection
    possibleDuplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null,
    },
    // Rating (after completion)
    rating: { type: Number, min: 1, max: 5, default: null },
    feedback: { type: String, trim: true, default: null },
    feedbackSubmittedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for common queries
complaintSchema.index({ studentId: 1, status: 1 });
complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ block: 1, status: 1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ isEscalated: 1, status: 1 });
complaintSchema.index({ createdAt: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
module.exports.CATEGORIES = CATEGORIES;
module.exports.PRIORITIES = PRIORITIES;
module.exports.STATUSES = STATUSES;
