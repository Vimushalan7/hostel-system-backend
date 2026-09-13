const User = require('../models/User');
const { sendSuccess, sendError, sendNotFound } = require('../utils/responseHelper');

/**
 * GET /api/users/me
 * Returns the authenticated user's profile.
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-googleId -fcmToken');

    if (!user) {
      return sendNotFound(res, 'User profile not found.');
    }

    return sendSuccess(res, {
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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    return sendError(res, 'Failed to fetch profile.', 500);
  }
};

/**
 * PUT /api/users/me
 * Updates the authenticated user's profile.
 * Students can update: studentId, phone, block, roomNumber.
 * Role is NEVER updated via this endpoint.
 */
const updateProfile = async (req, res) => {
  try {
    const { studentId, phone, block, roomNumber } = req.body;

    // Whitelist fields — role cannot be changed via this endpoint
    const updateData = {};
    if (studentId !== undefined) updateData.studentId = studentId?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (block !== undefined) updateData.block = block?.trim() || null;
    if (roomNumber !== undefined) updateData.roomNumber = roomNumber?.trim() || null;

    if (Object.keys(updateData).length === 0) {
      return sendError(res, 'No valid fields to update.', 400);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-googleId -fcmToken');

    if (!updatedUser) {
      return sendNotFound(res, 'User not found.');
    }

    return sendSuccess(res, {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profilePhoto: updatedUser.profilePhoto,
      role: updatedUser.role,
      studentId: updatedUser.studentId,
      phone: updatedUser.phone,
      block: updatedUser.block,
      roomNumber: updatedUser.roomNumber,
      isProfileComplete: !!(updatedUser.studentId && updatedUser.phone && updatedUser.block && updatedUser.roomNumber),
    }, 'Profile updated successfully');

  } catch (error) {
    console.error('Update profile error:', error.message);
    return sendError(res, 'Failed to update profile.', 500);
  }
};

module.exports = { getProfile, updateProfile };
