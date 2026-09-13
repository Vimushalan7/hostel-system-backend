const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const ComplaintHistory = require('../models/ComplaintHistory');
const User = require('../models/User');
const { generateComplaintId } = require('../utils/complaintIdGenerator');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const aiService = require('../services/aiService');
const { sendNotification } = require('../services/notificationService');

/**
 * POST /api/complaints
 * Create a new complaint (Student only)
 */
const createComplaint = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority = 'Medium',
      block,
      roomNumber,
      imageUrl,
      imagePublicId,
    } = req.body;

    const hostelBlock = block || req.user.block;
    const hostelRoom = roomNumber || req.user.roomNumber;

    if (!hostelBlock || !hostelRoom) {
      return sendError(
        res,
        'Hostel block and room number are required. Please update your profile or specify them.',
        400
      );
    }

    // Generate human-readable complaint ID
    const complaintId = await generateComplaintId();

    const complaint = await Complaint.create({
      complaintId,
      studentId: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      block: hostelBlock.trim(),
      roomNumber: hostelRoom.trim(),
      status: 'Submitted',
      imageUrl: imageUrl || null,
      imagePublicId: imagePublicId || null,
      imageUploadedAt: imageUrl ? new Date() : null,
    });

    // Create initial history record
    await ComplaintHistory.create({
      complaintId: complaint._id,
      complaintHRId: complaint.complaintId,
      action: 'created',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      newValue: {
        title: complaint.title,
        category: complaint.category,
        priority: complaint.priority,
        status: 'Submitted',
      },
      remarks: 'Complaint lodged by student',
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('studentId', 'name email studentId phone block roomNumber profilePhoto')
      .lean();

    // Notify all admin/warden users about the new complaint
    try {
      const admins = await User.find({ role: 'warden' }).select('_id');
      await Promise.all(admins.map(admin =>
        sendNotification({
          userId: admin._id,
          title: '🔔 New Complaint Submitted',
          message: `${req.user.name} submitted a new complaint: "${complaint.title}" (${complaint.complaintId})`,
          type: 'new_complaint',
          relatedComplaintId: complaint._id,
        })
      ));
    } catch (notifErr) {
      console.warn('Admin notification failed:', notifErr.message);
    }

    return sendSuccess(res, populatedComplaint, 'Complaint lodged successfully', 201);
  } catch (error) {
    console.error('Create complaint error:', error);
    return sendError(res, 'Failed to create complaint. Please try again.', 500);
  }
};

/**
 * GET /api/complaints/my
 * Get complaints submitted by the current authenticated student
 */
const getMyComplaints = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { studentId: req.user._id };

    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }

    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { complaintId: searchRegex },
        { description: searchRegex },
      ];
    }

    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('assignedDepartment', 'name code')
        .populate('assignedStaff', 'name phone')
        .lean(),
      Complaint.countDocuments(query),
    ]);

    return sendSuccess(res, {
      complaints,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, 'Complaints retrieved successfully');
  } catch (error) {
    console.error('Get my complaints error:', error);
    return sendError(res, 'Failed to retrieve complaints.', 500);
  }
};

/**
 * GET /api/complaints/stats/student
 * Summary statistics for the logged-in student's dashboard
 */
const getStudentStats = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $match: { studentId: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statMap = {
      total: 0,
      submitted: 0,
      received: 0,
      inProgress: 0,
      completed: 0,
      reopened: 0,
      active: 0,
    };

    stats.forEach((item) => {
      statMap.total += item.count;
      if (item._id === 'Submitted') statMap.submitted = item.count;
      if (item._id === 'Received') statMap.received = item.count;
      if (item._id === 'In Progress') statMap.inProgress = item.count;
      if (item._id === 'Completed') statMap.completed = item.count;
      if (item._id === 'Reopened') statMap.reopened = item.count;
    });

    statMap.active = statMap.submitted + statMap.received + statMap.inProgress + statMap.reopened;

    // Also get recent 5 complaints
    const recentComplaints = await Complaint.find({ studentId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('assignedDepartment', 'name code')
      .lean();

    return sendSuccess(res, {
      stats: statMap,
      recentComplaints,
    }, 'Student dashboard statistics retrieved');
  } catch (error) {
    console.error('Get student stats error:', error);
    return sendError(res, 'Failed to retrieve stats.', 500);
  }
};

/**
 * GET /api/complaints/:id
 * Get details of a single complaint by MongoDB ID or complaintId (e.g. HST-2026-000001)
 */
const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { complaintId: id.toUpperCase() };
    }

    const complaint = await Complaint.findOne(query)
      .populate('studentId', 'name email studentId phone block roomNumber profilePhoto')
      .populate('assignedDepartment', 'name code description')
      .populate('assignedStaff', 'name phone email role')
      .lean();

    if (!complaint) {
      return sendError(res, 'Complaint not found', 404);
    }

    // Authorization check: students can only see their own complaints
    if (req.user.role === 'student') {
      const ownerId = complaint.studentId?._id || complaint.studentId;
      if (ownerId.toString() !== req.user._id.toString()) {
        return sendError(res, 'You are not authorized to view this complaint', 403);
      }
    }

    // Fetch timeline/history
    const history = await ComplaintHistory.find({ complaintId: complaint._id })
      .sort({ createdAt: 1 })
      .lean();

    return sendSuccess(res, { complaint, history }, 'Complaint details retrieved');
  } catch (error) {
    console.error('Get complaint by ID error:', error);
    return sendError(res, 'Failed to retrieve complaint details.', 500);
  }
};

// ── AI CLASSIFY ────────────────────────────────────────────────
const aiClassify = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title || !description) {
      return sendError(res, 'Title and description are required for AI classification', 400);
    }

    const classification = await aiService.classifyComplaint(title, description);
    return sendSuccess(res, classification, 'AI classification complete');
  } catch (error) {
    console.error('Error in aiClassify:', error);
    if (error.message.includes('GEMINI_API_KEY')) {
      return sendError(res, 'AI Service is not configured on the server', 503);
    }
    return sendError(res, 'Server error during AI classification', 500);
  }
};

// ── DELETE COMPLAINT ──────────────────────────────────────────
const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { complaintId: id.toUpperCase() };
    }

    const complaint = await Complaint.findOne(query);

    if (!complaint) {
      return sendError(res, 'Complaint not found', 404);
    }

    // Authorization check: students can only delete their own complaints
    if (req.user.role === 'student') {
      const ownerId = complaint.studentId?._id || complaint.studentId;
      if (ownerId.toString() !== req.user._id.toString()) {
        return sendError(res, 'You are not authorized to delete this complaint', 403);
      }
    }

    // Constraints: Only allow deletion if status is Submitted or Received
    if (!['Submitted', 'Received'].includes(complaint.status)) {
      return sendError(
        res,
        `Cannot delete complaint because it is already ${complaint.status}`,
        400
      );
    }

    // Delete history
    await ComplaintHistory.deleteMany({ complaintId: complaint._id });

    // Delete related notifications
    const Notification = require('../models/Notification');
    await Notification.deleteMany({ relatedComplaintId: complaint._id });

    // Delete the complaint
    await Complaint.findByIdAndDelete(complaint._id);

    return sendSuccess(res, null, 'Complaint deleted successfully');
  } catch (error) {
    console.error('Delete complaint error:', error);
    return sendError(res, 'Failed to delete complaint.', 500);
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getStudentStats,
  getComplaintById,
  aiClassify,
  deleteComplaint,
};
