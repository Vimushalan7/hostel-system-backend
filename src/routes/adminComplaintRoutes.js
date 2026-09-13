const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireWarden } = require('../middleware/authorize');
const adminComplaintController = require('../controllers/adminComplaintController');

const router = express.Router();

// All routes here require authentication AND warden role
router.use(authenticate, requireWarden);

// Dashboard stats
router.get('/stats', adminComplaintController.getAdminStats);

// Analytics
router.get('/analytics', adminComplaintController.getAnalytics);

// Resources
router.get('/departments', adminComplaintController.getDepartments);
router.get('/staff', adminComplaintController.getStaff);

// Get all complaints with filters/pagination
router.get('/', adminComplaintController.getAllComplaints);

// Get single complaint details
router.get('/:id', adminComplaintController.getComplaintById);

// Update status
router.patch('/:id/status', adminComplaintController.updateStatus);

// Update priority
router.patch('/:id/priority', adminComplaintController.updatePriority);

// Assign staff/department
router.patch('/:id/assign', adminComplaintController.assignComplaint);

// Add warden remarks
router.patch('/:id/remarks', adminComplaintController.addRemarks);

module.exports = router;
