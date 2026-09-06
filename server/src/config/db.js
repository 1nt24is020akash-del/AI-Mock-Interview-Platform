const mongoose = require("mongoose");

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("MONGO_URI environment variable is missing!");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    // In serverless, do NOT process.exit(1) as it crashes the function instance
  }
};

module.exports = connectDB;
