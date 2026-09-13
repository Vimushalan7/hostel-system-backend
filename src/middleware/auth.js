const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/responseHelper');

/**
 * Authentication middleware.
 * Verifies the JWT in the Authorization header.
 * Attaches the full user document to req.user.
 * NEVER trusts role from the token payload alone — always reloads from DB.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return sendError(res, 'Invalid authorization header format.', 401);
    }

    // Verify JWT signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Session expired. Please log in again.', 401);
      }
      return sendError(res, 'Invalid authentication token.', 401);
    }

    // Reload user from database to get current role (NEVER trust role from token alone)
    const user = await User.findById(decoded.userId).select('-fcmToken');

    if (!user) {
      return sendError(res, 'User not found. Please log in again.', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Account has been deactivated.', 403);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    return sendError(res, 'Authentication failed. Please try again.', 500);
  }
};

module.exports = { authenticate };
