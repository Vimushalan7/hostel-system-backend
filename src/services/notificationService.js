const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Initialize Firebase Admin (Only if credentials exist)
let isFirebaseInitialized = false;
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, '').replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    isFirebaseInitialized = true;
    console.log('Firebase Admin initialized for push notifications');
  }
} catch (e) {
  console.warn('Firebase Admin not initialized. Push notifications will be skipped.', e.message);
}

exports.sendNotification = async ({ userId, title, message, type, relatedComplaintId }) => {
  try {
    // 1. Save to database (In-App Notification)
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      relatedComplaintId,
    });

    // 2. Send FCM Push Notification (if Firebase is initialized and user has a token)
    if (isFirebaseInitialized) {
      const user = await User.findById(userId).select('fcmToken');
      if (user && user.fcmToken) {
        const payload = {
          notification: {
            title,
            body: message,
          },
          data: {
            type: type || 'system',
            relatedComplaintId: relatedComplaintId ? relatedComplaintId.toString() : '',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
          token: user.fcmToken,
        };
        
        await getMessaging().send(payload).catch(err => {
            console.error('Failed to send FCM push:', err.message);
            // We don't throw here to not break the flow just because a push failed
        });
      }
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw to prevent crashing the main thread (e.g. complaint status update)
  }
};
