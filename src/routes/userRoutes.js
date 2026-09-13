const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { getProfile, updateProfile } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All user routes require authentication
router.use(authenticate);

// GET /api/users/me — Get authenticated user's profile
router.get('/me', getProfile);

// PUT /api/users/me — Update authenticated user's profile
router.put(
  '/me',
  [
    body('studentId')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Student ID must be at most 50 characters.'),
    body('phone')
      .optional()
      .isString()
      .trim()
      .matches(/^[+\d\s-]{7,20}$/)
      .withMessage('Please provide a valid phone number.'),
    body('block')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Block must be at most 20 characters.'),
    body('roomNumber')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Room number must be at most 20 characters.'),
    // Prevent any attempt to change role via this endpoint
    body('role')
      .not()
      .exists()
      .withMessage('Role cannot be changed via this endpoint.'),
  ],
  validate,
  updateProfile
);

module.exports = router;
