require('dotenv').config();
const mongoose = require('mongoose');
const { createComplaint } = require('./src/controllers/complaintController');

async function testCreate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');
    
    // Get student
    const student = await User.findOne({ role: 'student' });
    
    const req = {
      user: student,
      body: {
        title: 'Test Complaint from Script',
        description: 'Testing if admin notification triggers',
        category: 'Other',
        priority: 'Medium',
        block: 'Block A',
        roomNumber: '101'
      }
    };
    
    const res = {
      status: function(s) { this.statusCode = s; return this; },
      json: function(data) { console.log('Response:', data.message || data); }
    };

    console.log('Running createComplaint...');
    await createComplaint(req, res);
    
    console.log('Checking notifications...');
    const Notification = require('./src/models/Notification');
    const notifs = await Notification.find({ type: 'new_complaint' }).sort({ createdAt: -1 }).limit(1);
    console.log('Latest new_complaint notif:', notifs);
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

testCreate();
