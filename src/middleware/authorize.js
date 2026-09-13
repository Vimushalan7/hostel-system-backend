const { sendError } = require('../utils/responseHelper');

/**
 * Role-based authorization middleware factory.
 * Usage: authorize('warden') or authorize('student', 'warden')
 *
 * IMPORTANT: Must be used AFTER authenticate middleware.
 * Role is always taken from req.user (loaded from DB), never from the request body/token.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    // Role is from the DB-loaded user document
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      // Log unauthorized access attempt (useful for security monitoring)
      console.warn(
        `🚨 Unauthorized access attempt: user ${req.user._id} (role: ${userRole}) ` +
        `tried to access a route requiring: [${allowedRoles.join(', ')}] — ` +
        `${req.method} ${req.originalUrl}`
      );
      return sendError(res, 'You are not authorized to access this resource.', 403);
    }

    next();
  };
};

/**
 * Convenience shorthand for warden-only routes.
 */
const requireWarden = authorize('warden');

/**
 * Convenience shorthand for student-only routes.
 */
const requireStudent = authorize('student');

module.exports = { authorize, requireWarden, requireStudent };
