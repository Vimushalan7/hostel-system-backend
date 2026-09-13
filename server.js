require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const { configureCloudinary } = require('./src/config/cloudinary');

// Configure external services
configureCloudinary();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('================================================');
    console.log(`  🏨 Hostel System Backend`);
    console.log(`  🚀 Server running on port ${PORT}`);
    console.log(`  🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`  📡 Health: http://localhost:${PORT}/api/health`);
    console.log('================================================');
  });
}).catch((err) => {
  console.error('❌ Failed to connect to MongoDB. Server not started.', err.message);
  process.exit(1);
});
