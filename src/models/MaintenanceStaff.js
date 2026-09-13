const mongoose = require('mongoose');

const maintenanceStaffSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    departmentName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    // Whether this staff member is currently available for assignments
    availability: {
      type: String,
      enum: ['available', 'busy', 'off_duty'],
      default: 'available',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Count of active assignments
    activeAssignments: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

maintenanceStaffSchema.index({ department: 1, availability: 1, isActive: 1 });

const MaintenanceStaff = mongoose.model('MaintenanceStaff', maintenanceStaffSchema);
module.exports = MaintenanceStaff;
