const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  createComplaint,
  getMyComplaints,
  getStudentStats,
  getComplaintById,
  aiClassify,
  deleteComplaint,
} = require('../controllers/complaintController');

const { authenticate } = require('../middleware/auth');
const { requireStudent } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { CATEGORIES, PRIORITIES } = require('../models/Complaint');

// All complaint routes require authentication
router.use(authenticate);

// Student routes
router.post(
  '/',
  requireStudent,
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Complaint title is required')
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isIn(CATEGORIES)
      .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
    body('priority')
      .optional()
      .isIn(PRIORITIES)
      .withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
    body('block')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Block cannot be empty if specified'),
    body('roomNumber')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Room number cannot be empty if specified'),
  ],
  validate,
  createComplaint
);

router.post('/classify', requireStudent, aiClassify);
router.get('/my', requireStudent, getMyComplaints);
router.get('/stats/student', requireStudent, getStudentStats);

// Single complaint details (students can access their own, wardens can access any)
router.get('/:id', getComplaintById);

// Delete complaint (students can delete their own 'Submitted'/'Received' complaints)
router.delete('/:id', requireStudent, deleteComplaint);

module.exports = router;
