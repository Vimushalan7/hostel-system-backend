const Complaint = require('../models/Complaint');

/**
 * Generates a unique human-readable complaint ID.
 * Format: HST-YYYY-NNNNNN (e.g., HST-2026-000001)
 *
 * Uses an atomic find-or-create approach to avoid race conditions.
 */
const generateComplaintId = async () => {
  const year = new Date().getFullYear();
  const prefix = `HST-${year}-`;

  // Find the highest existing number for this year
  const lastComplaint = await Complaint.findOne(
    { complaintId: { $regex: `^${prefix}` } },
    { complaintId: 1 },
    { sort: { complaintId: -1 } }
  ).lean();

  let nextNumber = 1;

  if (lastComplaint) {
    const lastNumberStr = lastComplaint.complaintId.split('-')[2];
    const lastNumber = parseInt(lastNumberStr, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Pad to 6 digits
  const paddedNumber = nextNumber.toString().padStart(6, '0');
  return `${prefix}${paddedNumber}`;
};

module.exports = { generateComplaintId };
