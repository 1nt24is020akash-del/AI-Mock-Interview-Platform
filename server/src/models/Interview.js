const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["ai", "user"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isFollowUp: { type: Boolean, default: false },
  assessment: {
    score: { type: Number },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    reasoning: { type: String },
    action: { type: String },
  },
});

const InterviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  domain: { type: String, required: true },
  score: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // minutes
  questionsAnswered: { type: Number, default: 0 },
  consecutiveFollowUps: { type: Number, default: 0 },
  messages: [MessageSchema],
  currentDifficulty: {
    type: String,
    enum: ["EASY", "MEDIUM", "HARD"],
    default: "MEDIUM",
  },
  difficultyHistory: [
    {
      questionIndex: { type: Number },
      difficulty: { type: String, enum: ["EASY", "MEDIUM", "HARD"] },
      score: { type: Number },
      performance: { type: String, enum: ["STRONG", "AVERAGE", "WEAK"] },
      action: { type: String, enum: ["FOLLOW_UP", "NEW_QUESTION"] },
      actionReason: { type: String, default: "" },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      reasoning: { type: String, default: "" },
      isFollowUp: { type: Boolean, default: false },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  feedback: { type: String, default: "" },
  isComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Interview", InterviewSchema);
