require('dotenv').config();
const mongoose = require('mongoose');

async function checkTokens() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');
    const users = await User.find({ fcmToken: { $ne: null } }).select('name role fcmToken');
    console.log(`Users with FCM tokens: ${users.length}`);
    users.forEach(u => {
      console.log(`- ${u.name} (${u.role}): ${u.fcmToken.substring(0, 20)}...`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
checkTokens();
