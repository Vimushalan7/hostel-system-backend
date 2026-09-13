require('dotenv').config();
const mongoose = require('mongoose');

async function checkNotifs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Notification = require('./src/models/Notification');
    const notifs = await Notification.find().sort({ createdAt: -1 }).limit(5);
    console.log(notifs);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
checkNotifs();
