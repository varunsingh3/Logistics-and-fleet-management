const mongoose = require('mongoose');

// Disable buffering so queries never hang or time out when MongoDB is unreachable
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/logifleet';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Could not reach MongoDB at ${uri} (${error.message}).`);
    console.log(`[MongoDB] ⚡ Running in In-Memory Database Mode with pre-seeded demo users and data.`);
    console.log(`[MongoDB] 💡 To connect to MongoDB Atlas, add your connection string to BACKEND/.env (MONGODB_URI=mongodb+srv://...)`);
    return null;
  }
};

module.exports = connectDB;
