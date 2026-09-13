const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { googleAuth, logout, updateFcmToken } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');

// POST /api/auth/google — Verify Google ID token, return JWT
router.post(
  '/google',
  authLimiter,
  [
    body('idToken')
      .notEmpty()
      .withMessage('Google ID token is required.')
      .isString()
      .withMessage('ID token must be a string.'),
  ],
  validate,
  googleAuth
);

// POST /api/auth/logout — Authenticated logout (clears FCM token)
router.post('/logout', authenticate, logout);

// POST /api/auth/fcm-token — Update FCM push notification token
router.post(
  '/fcm-token',
  authenticate,
  [
    body('fcmToken')
      .notEmpty()
      .withMessage('FCM token is required.')
      .isString(),
  ],
  validate,
  updateFcmToken
);

module.exports = router;
