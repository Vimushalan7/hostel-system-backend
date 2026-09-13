require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('./src/models/Department');
const MaintenanceStaff = require('./src/models/MaintenanceStaff');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel_system';

const seedResources = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // Create Departments
    const depts = [
      { name: 'Electrical', description: 'Handles electrical issues' },
      { name: 'Plumbing', description: 'Handles water and plumbing issues' },
      { name: 'Cleaning', description: 'Housekeeping and cleaning' },
    ];

    const createdDepts = [];
    for (const d of depts) {
      let dept = await Department.findOne({ name: d.name });
      if (!dept) {
        dept = await Department.create(d);
        console.log(`Created department: ${d.name}`);
      } else {
        console.log(`Department already exists: ${d.name}`);
      }
      createdDepts.push(dept);
    }

    // Create Staff
    const staffMembers = [
      { staffId: 'STF-ELEC-001', name: 'John Spark', phone: '555-0101', departmentName: 'Electrical' },
      { staffId: 'STF-ELEC-002', name: 'Mike Wire', phone: '555-0102', departmentName: 'Electrical' },
      { staffId: 'STF-PLUM-001', name: 'Mario Pipe', phone: '555-0201', departmentName: 'Plumbing' },
      { staffId: 'STF-PLUM-002', name: 'Luigi Valve', phone: '555-0202', departmentName: 'Plumbing' },
      { staffId: 'STF-CLN-001', name: 'Sarah Clean', phone: '555-0301', departmentName: 'Cleaning' },
    ];

    for (const s of staffMembers) {
      let staff = await MaintenanceStaff.findOne({ staffId: s.staffId });
      if (!staff) {
        const dept = createdDepts.find(d => d.name === s.departmentName);
        if (dept) {
          s.department = dept._id;
          await MaintenanceStaff.create(s);
          console.log(`Created staff: ${s.name}`);
        }
      } else {
        console.log(`Staff already exists: ${s.name}`);
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedResources();
