require('dotenv').config();

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb+srv://sanniarafat85_db_user:D2bKZ4JuzTNLRGo8@cluster0.acwe0vx.mongodb.net/db?retryWrites=true&w=majority&appName=Cluster0';

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  return mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000
  });
}

module.exports = { connectDB };
