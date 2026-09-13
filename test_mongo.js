const mongoose = require('mongoose');

async function testConnection() {
  const uri = "mongodb://antigravity14037_db_user:l04RlAKRw15sHprb@ac-zwjhckm-shard-00-00.mb5zwf3.mongodb.net:27017,ac-zwjhckm-shard-00-01.mb5zwf3.mongodb.net:27017,ac-zwjhckm-shard-00-02.mb5zwf3.mongodb.net:27017/hostel_system?ssl=true&replicaSet=atlas-e24zh1-shard-0&authSource=admin&retryWrites=true&w=majority";
  try {
    console.log("Connecting...");
    await mongoose.connect(uri);
    console.log("Connected successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }
}

testConnection();
