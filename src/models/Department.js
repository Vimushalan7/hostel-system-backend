const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: [
        'Electrical', 'Plumbing', 'Cleaning', 'Food', 'Internet',
        'Room Maintenance', 'Security', 'Common Area', 'General',
      ],
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    headName: {
      type: String,
      trim: true,
      default: null,
    },
    headPhone: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // SLA (Service Level Agreement) hours per priority
    slaHours: {
      Low: { type: Number, default: 72 },
      Medium: { type: Number, default: 48 },
      High: { type: Number, default: 24 },
      Critical: { type: Number, default: 4 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Department = mongoose.model('Department', departmentSchema);
module.exports = Department;
