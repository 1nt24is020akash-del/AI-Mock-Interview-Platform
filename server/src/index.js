const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/db.js");
require("dotenv").config();
const authRoutes = require("./routes/auth.js");
const interviewRoutes = require("./routes/interview.js");
const resumeRoutes = require("./routes/resume.js");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB (handles both standalone server and serverless function)
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("DB connection error:", err);
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/resume", resumeRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

if (!process.env.VERCEL) {
  connectDB();
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`),
  );
}

module.exports = app;
