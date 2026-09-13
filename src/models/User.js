const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    studentId: {
      type: String,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    block: {
      type: String,
      trim: true,
      default: null,
    },
    roomNumber: {
      type: String,
      trim: true,
      default: null,
    },
    // Role is ALWAYS determined server-side. Never trust role from client.
    role: {
      type: String,
      enum: ['student', 'warden'],
      default: 'student',
      required: true,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for common queries
userSchema.index({ role: 1 });
userSchema.index({ block: 1, roomNumber: 1 });

// Mask sensitive fields when converting to JSON
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.fcmToken;
  delete obj.googleId;
  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
