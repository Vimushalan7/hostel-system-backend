require('dotenv').config();
const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const mongoose = require('mongoose');

async function pingPhone() {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');
    
    // Find Vimushalan.R
    const user = await User.findOne({ name: 'Vimushalan.R' });
    if (user && user.fcmToken) {
      console.log(`Sending ping to ${user.name}...`);
      await getMessaging().send({
        token: user.fcmToken,
        notification: {
          title: 'Direct Ping from AI',
          body: 'If you see this, push notifications are working on your phone!'
        },
        data: { click_action: 'FLUTTER_NOTIFICATION_CLICK' }
      });
      console.log('Successfully sent ping to Vimushalan.R');
    }

    const admin = await User.findOne({ name: 'Gopika.C' });
    if (admin && admin.fcmToken) {
      console.log(`Sending ping to ${admin.name}...`);
      await getMessaging().send({
        token: admin.fcmToken,
        notification: {
          title: 'Direct Ping from AI',
          body: 'If you see this, push notifications are working on your phone!'
        },
        data: { click_action: 'FLUTTER_NOTIFICATION_CLICK' }
      });
      console.log('Successfully sent ping to Gopika.C');
    }
  } catch (error) {
    console.error('Ping failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

pingPhone();
