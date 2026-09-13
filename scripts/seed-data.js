/**
 * Seed Development Data Script
 * Usage: node scripts/seed-data.js
 *
 * Creates sample departments, maintenance staff, and sample complaints for development.
 * WARNING: Only run this in development. It will NOT overwrite existing data.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Department = require('../src/models/Department');
const MaintenanceStaff = require('../src/models/MaintenanceStaff');
const Settings = require('../src/models/Settings');

const DEPARTMENTS = [
  { name: 'Electrical', description: 'Handles all electrical issues', headName: 'Mr. Rajesh Kumar', headPhone: '+91-9876543210' },
  { name: 'Plumbing', description: 'Handles water and plumbing issues', headName: 'Mr. Suresh Patel', headPhone: '+91-9876543211' },
  { name: 'Cleaning', description: 'Handles cleanliness and sanitation', headName: 'Mr. Mohan Das', headPhone: '+91-9876543212' },
  { name: 'Food', description: 'Handles mess and food quality issues', headName: 'Mr. Ramesh Singh', headPhone: '+91-9876543213' },
  { name: 'Internet', description: 'Handles network and internet connectivity', headName: 'Mr. Arun Tech', headPhone: '+91-9876543214' },
  { name: 'Room Maintenance', description: 'Handles furniture and room infrastructure', headName: 'Mr. Vijay Kumar', headPhone: '+91-9876543215' },
  { name: 'Security', description: 'Handles security and safety issues', headName: 'Mr. Ram Bahadur', headPhone: '+91-9876543216' },
  { name: 'Common Area', description: 'Handles common areas like corridors and bathrooms', headName: 'Mr. Deepak Sharma', headPhone: '+91-9876543217' },
  { name: 'General', description: 'Handles general and miscellaneous issues', headName: 'Mr. Warden', headPhone: '+91-9876543218' },
];

const seedData = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI || mongoURI.includes('FILL_YOUR')) {
    console.error('❌ MONGODB_URI not configured in .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Seed departments
    console.log('\n📂 Seeding departments...');
    for (const dept of DEPARTMENTS) {
      const existing = await Department.findOne({ name: dept.name });
      if (!existing) {
        await Department.create(dept);
        console.log(`   ✅ Created department: ${dept.name}`);
      } else {
        console.log(`   ℹ️  Department already exists: ${dept.name}`);
      }
    }

    // Seed maintenance staff
    console.log('\n👷 Seeding maintenance staff...');
    const electricalDept = await Department.findOne({ name: 'Electrical' });
    const plumbingDept = await Department.findOne({ name: 'Plumbing' });
    const internetDept = await Department.findOne({ name: 'Internet' });

    const staffData = [
      { staffId: 'STAFF-001', name: 'Ravi Kumar', phone: '+91-9001234567', department: electricalDept._id, departmentName: 'Electrical', availability: 'available' },
      { staffId: 'STAFF-002', name: 'Sanjay Sharma', phone: '+91-9001234568', department: electricalDept._id, departmentName: 'Electrical', availability: 'available' },
      { staffId: 'STAFF-003', name: 'Prakash Mehta', phone: '+91-9001234569', department: plumbingDept._id, departmentName: 'Plumbing', availability: 'available' },
      { staffId: 'STAFF-004', name: 'Dilip Joshi', phone: '+91-9001234570', department: plumbingDept._id, departmentName: 'Plumbing', availability: 'available' },
      { staffId: 'STAFF-005', name: 'Ankit Verma', phone: '+91-9001234571', department: internetDept._id, departmentName: 'Internet', availability: 'available' },
    ];

    for (const staff of staffData) {
      const existing = await MaintenanceStaff.findOne({ staffId: staff.staffId });
      if (!existing) {
        await MaintenanceStaff.create(staff);
        console.log(`   ✅ Created staff: ${staff.name} (${staff.staffId})`);
      } else {
        console.log(`   ℹ️  Staff already exists: ${staff.name}`);
      }
    }

    // Initialize default settings
    console.log('\n⚙️  Initializing default settings...');
    await Settings.initDefaults();

    console.log('\n✅ Seed data complete!');
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ MongoDB connection closed.');
  }
};

seedData();
