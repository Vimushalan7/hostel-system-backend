require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function makeWarden() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Find the most recently created user
    const user = await User.findOne().sort({ createdAt: -1 });
    
    if (user) {
      user.role = 'warden';
      await user.save();
      console.log(`Successfully made ${user.email} a warden!`);
    } else {
      console.log('No users found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

makeWarden();
