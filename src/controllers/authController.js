const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { signToken } = require('../utils/jwtUtils');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const getGoogleClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId.includes('FILL_YOUR')) {
    return null;
  }
  return new OAuth2Client(clientId);
};

/**
 * POST /api/auth/google
 * Receives a Google ID token from Flutter, verifies it,
 * finds or creates the user in MongoDB, and returns a JWT.
 *
 * SECURITY: The role is ALWAYS read from MongoDB. The client cannot influence it.
 */
const googleAuth = async (req, res) => {
  try {
    const { idToken, requestedRole } = req.body;

    if (!idToken) {
      return sendError(res, 'Google ID token is required.', 400);
    }

    const client = getGoogleClient();
    if (!client) {
      return sendError(res, 'Google OAuth is not configured on the server. Please check server environment variables.', 503);
    }

    // Verify the Google ID token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      console.error('Google token verification failed:', err.message);
      return sendError(res, 'Invalid Google authentication token. Please try again.', 401);
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: profilePhoto, email_verified } = payload;

    if (!email_verified) {
      return sendError(res, 'Google account email is not verified.', 401);
    }

    // Find or create the user in MongoDB
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if a user with this email already exists (from a different OAuth flow)
      const existingEmailUser = await User.findOne({ email: email.toLowerCase() });
      if (existingEmailUser) {
        // Link the Google ID to the existing account
        existingEmailUser.googleId = googleId;
        existingEmailUser.profilePhoto = profilePhoto || existingEmailUser.profilePhoto;
        existingEmailUser.lastLoginAt = new Date();
        if (requestedRole && ['student', 'warden'].includes(requestedRole)) {
          existingEmailUser.role = requestedRole;
        }
        await existingEmailUser.save();
        user = existingEmailUser;
      } else {
        // Create new user
        user = await User.create({
          googleId,
          name,
          email: email.toLowerCase(),
          profilePhoto: profilePhoto || null,
          role: (requestedRole && ['student', 'warden'].includes(requestedRole)) ? requestedRole : 'student',
          lastLoginAt: new Date(),
        });
        console.log(`✅ New user registered: ${email} (role: ${user.role})`);
      }
    } else {
      // Update profile info from Google on each login
      user.name = name;
      user.profilePhoto = profilePhoto || user.profilePhoto;
      user.lastLoginAt = new Date();
      if (requestedRole && ['student', 'warden'].includes(requestedRole) && user.role !== requestedRole) {
        user.role = requestedRole;
      }
      await user.save();
    }

    // Generate JWT — role is from the DB document
    const token = signToken(user._id, user.role);

    return sendSuccess(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        role: user.role,
        studentId: user.studentId,
        phone: user.phone,
        block: user.block,
        roomNumber: user.roomNumber,
        isProfileComplete: !!(user.studentId && user.phone && user.block && user.roomNumber),
      },
    }, 'Authentication successful');

  } catch (error) {
    console.error('Google auth error:', error.message);
    return sendError(res, 'Authentication failed. Please try again.', 500);
  }
};

/**
 * POST /api/auth/logout
 * Clears the FCM token on logout.
 */
const logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { fcmToken: null });
    }
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error.message);
    return sendError(res, 'Logout failed.', 500);
  }
};

/**
 * POST /api/auth/fcm-token
 * Updates the FCM token for push notifications.
 */
const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return sendError(res, 'FCM token is required.', 400);
    }
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    return sendSuccess(res, null, 'FCM token updated');
  } catch (error) {
    console.error('FCM token update error:', error.message);
    return sendError(res, 'Failed to update FCM token.', 500);
  }
};

module.exports = { googleAuth, logout, updateFcmToken };
