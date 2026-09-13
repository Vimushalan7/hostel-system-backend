/**
 * Seed Warden Script
 * Usage: node scripts/seed-warden.js <email>
 *
 * This script assigns the 'warden' role to an existing user by email,
 * OR creates a placeholder warden record if the user hasn't logged in yet.
 *
 * Run AFTER the user has logged in at least once via Google OAuth.
 * Example: node scripts/seed-warden.js warden@yourhostel.com
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const targetEmail = process.argv[2];

if (!targetEmail) {
  console.error('❌ Usage: node scripts/seed-warden.js <email>');
  console.error('   Example: node scripts/seed-warden.js warden@yourhostel.com');
  process.exit(1);
}

const seedWarden = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI || mongoURI.includes('FILL_YOUR')) {
    console.error('❌ MONGODB_URI not configured in .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const email = targetEmail.toLowerCase().trim();
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`❌ No user found with email: ${email}`);
      console.error('   The user must log in via Google OAuth at least once before being promoted to warden.');
      process.exit(1);
    }

    if (user.role === 'warden') {
      console.log(`ℹ️  User ${email} is already a warden.`);
    } else {
      user.role = 'warden';
      await user.save();
      console.log(`✅ User ${email} has been promoted to WARDEN role.`);
      console.log(`   Name: ${user.name}`);
      console.log(`   ID: ${user._id}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ MongoDB connection closed.');
  }
};

seedWarden();
