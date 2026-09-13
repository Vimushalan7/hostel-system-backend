const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const ComplaintHistory = require('../models/ComplaintHistory');
const Department = require('../models/Department');
const MaintenanceStaff = require('../models/MaintenanceStaff');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { sendNotification } = require('../services/notificationService');

// ── GET ALL COMPLAINTS ─────────────────────────────────────────
exports.getAllComplaints = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Filters
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.category) query.category = req.query.category;
    if (req.query.block) query.block = req.query.block;

    // Search by title, description, or complaintId
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { complaintId: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('studentId', 'name studentId phone')
      .populate('assignedDepartment', 'name')
      .populate('assignedStaff', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, {
      complaints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, 'Complaints retrieved successfully');
  } catch (error) {
    console.error('Error in getAllComplaints:', error);
    return sendError(res, 'Server error while fetching complaints', 500);
  }
};

// ── GET ADMIN STATS ────────────────────────────────────────────
exports.getAdminStats = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      pending: 0,
      inProgress: 0,
      resolved: 0,
      escalated: 0,
      total: 0,
    };

    stats.forEach(stat => {
      if (stat._id === 'Submitted' || stat._id === 'Received') formattedStats.pending += stat.count;
      else if (stat._id === 'In Progress') formattedStats.inProgress = stat.count;
      else if (stat._id === 'Completed') formattedStats.resolved += stat.count;
      else if (stat._id === 'Escalated') formattedStats.escalated = stat.count;
      
      formattedStats.total += stat.count;
    });

    return sendSuccess(res, formattedStats, 'Stats retrieved successfully');
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    return sendError(res, 'Server error while fetching stats', 500);
  }
};

// ── GET COMPLAINT BY ID ────────────────────────────────────────
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('studentId', 'name studentId phone block roomNumber')
      .populate('assignedDepartment', 'name')
      .populate('assignedStaff', 'name phone');

    if (!complaint) {
      return sendError(res, 'Complaint not found', 404);
    }

    const history = await ComplaintHistory.find({ complaintId: complaint._id })
      .populate('performedBy', 'name role')
      .sort({ createdAt: 1 });

    return sendSuccess(res, { complaint, history }, 'Complaint details retrieved');
  } catch (error) {
    console.error('Error in getAdminComplaintById:', error);
    return sendError(res, 'Server error while fetching complaint details', 500);
  }
};

// ── UPDATE STATUS ──────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return sendError(res, 'Complaint not found', 404);
    }

    const validStatuses = ['Submitted', 'Received', 'In Progress', 'Completed', 'Reopened', 'Escalated'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }

    const oldStatus = complaint.status;
    complaint.status = status;
    if (status === 'Completed') {
      complaint.resolvedAt = new Date();
    }
    
    await complaint.save();

    await ComplaintHistory.create({
      complaintId: complaint._id,
      complaintHRId: complaint.complaintId,
      action: 'status_changed',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      remarks: remarks || `Status changed from ${oldStatus} to ${status}`,
      previousValue: oldStatus,
      newValue: status
    });

    // Send Notification to student
    await sendNotification({
      userId: complaint.studentId,
      title: 'Complaint Status Updated',
      message: `Your complaint (${complaint.complaintId}) is now ${status}.`,
      type: 'status_update',
      relatedComplaintId: complaint._id,
    });

    return sendSuccess(res, complaint, `Status updated to ${status}`);
  } catch (error) {
    console.error('Error in updateStatus:', error);
    return sendError(res, 'Server error while updating status', 500);
  }
};

// ── UPDATE PRIORITY ────────────────────────────────────────────
exports.updatePriority = async (req, res) => {
  try {
    const { priority, remarks } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return sendError(res, 'Complaint not found', 404);
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    if (!validPriorities.includes(priority)) {
      return sendError(res, 'Invalid priority', 400);
    }

    const oldPriority = complaint.priority;
    complaint.priority = priority;
    
    // Automatically escalate if priority changed to Critical
    if (priority === 'Critical' && (complaint.status === 'Submitted' || complaint.status === 'Received')) {
        complaint.status = 'Escalated';
    }

    await complaint.save();

    await ComplaintHistory.create({
      complaintId: complaint._id,
      complaintHRId: complaint.complaintId,
      action: 'priority_changed',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      remarks: remarks || `Priority changed from ${oldPriority} to ${priority}`,
      previousValue: oldPriority,
      newValue: priority
    });

    // Notify student about priority change
    await sendNotification({
      userId: complaint.studentId,
      title: '⚠️ Complaint Priority Updated',
      message: `Your complaint (${complaint.complaintId}) priority has been changed to ${priority}.`,
      type: 'priority_update',
      relatedComplaintId: complaint._id,
    });

    return sendSuccess(res, complaint, `Priority updated to ${priority}`);
  } catch (error) {
    console.error('Error in updatePriority:', error);
    return sendError(res, 'Server error while updating priority', 500);
  }
};

// ── ASSIGN COMPLAINT ───────────────────────────────────────────
exports.assignComplaint = async (req, res) => {
  try {
    const { departmentId, staffId, remarks } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return sendError(res, 'Complaint not found', 404);
    }

    let actionMsg = 'Complaint assigned';
    if (departmentId) {
        complaint.assignedDepartment = departmentId;
        actionMsg = 'Assigned to Department';
    }
    if (staffId) {
        complaint.assignedStaff = staffId;
        actionMsg = 'Assigned to Staff';
    }

    if (complaint.status === 'Submitted' || complaint.status === 'Received') {
        complaint.status = 'In Progress';
    }

    await complaint.save();

    await ComplaintHistory.create({
      complaintId: complaint._id,
      complaintHRId: complaint.complaintId,
      action: departmentId && staffId ? 'assigned_staff' : (departmentId ? 'assigned_department' : 'assigned'),
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      remarks: remarks || actionMsg,
    });

    return sendSuccess(res, complaint, 'Assignment successful');
  } catch (error) {
    console.error('Error in assignComplaint:', error);
    return sendError(res, 'Server error while assigning complaint', 500);
  }
};

// ── ADD WARDEN REMARKS ─────────────────────────────────────────
exports.addRemarks = async (req, res) => {
  try {
    const { remarks } = req.body;
    
    if (!remarks) {
        return sendError(res, 'Remarks cannot be empty', 400);
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return sendError(res, 'Complaint not found', 404);
    }

    complaint.wardenRemarks = remarks;
    await complaint.save();

    await ComplaintHistory.create({
      complaintId: complaint._id,
      complaintHRId: complaint.complaintId,
      action: 'remarks_added',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      remarks: remarks,
    });

    // Notify student about new admin remarks
    await sendNotification({
      userId: complaint.studentId,
      title: '💬 Admin Added Remarks',
      message: `Admin responded to your complaint (${complaint.complaintId}): "${remarks.substring(0, 80)}${remarks.length > 80 ? '...' : ''}"`,
      type: 'remarks_added',
      relatedComplaintId: complaint._id,
    });

    return sendSuccess(res, complaint, 'Remarks added successfully');
  } catch (error) {
    console.error('Error in addRemarks:', error);
    return sendError(res, 'Server error while adding remarks', 500);
  }
};

// ── GET ANALYTICS ──────────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    const statusDistribution = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const categoryDistribution = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const priorityDistribution = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    return sendSuccess(res, {
      statusDistribution,
      categoryDistribution,
      priorityDistribution,
    }, 'Analytics retrieved successfully');
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    return sendError(res, 'Server error while fetching analytics', 500);
  }
};

// ── GET DEPARTMENTS ────────────────────────────────────────────
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    return sendSuccess(res, departments, 'Departments retrieved successfully');
  } catch (error) {
    console.error('Error in getDepartments:', error);
    return sendError(res, 'Server error while fetching departments', 500);
  }
};

// ── GET STAFF ──────────────────────────────────────────────────
exports.getStaff = async (req, res) => {
  try {
    const query = { isActive: true };
    if (req.query.departmentId) {
      query.department = req.query.departmentId;
    }
    
    const staff = await MaintenanceStaff.find(query).sort({ name: 1 });
    return sendSuccess(res, staff, 'Staff retrieved successfully');
  } catch (error) {
    console.error('Error in getStaff:', error);
    return sendError(res, 'Server error while fetching staff', 500);
  }
};
