const mongoose = require("mongoose");

/**
 * ReadinessHistory Model
 * Stores immutable point-in-time snapshots of candidate placement readiness.
 * Automatically recorded upon completing interviews, analyzing resumes, or updating skill assessments.
 */
const ReadinessHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  score: {
    type: Number,
    required: true,
  },
  resumeScore: {
    type: Number,
    default: 0,
  },
  interviewScore: {
    type: Number,
    default: 0,
  },
  skillScore: {
    type: Number,
    default: 0,
  },
  communicationScore: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    enum: ["Placement Ready", "High Potential Candidate", "Needs Improvement"],
    default: "Needs Improvement",
  },
  weakAreas: [
    {
      type: String,
    },
  ],
  strongAreas: [
    {
      type: String,
    },
  ],
  source: {
    type: String,
    enum: ["interview", "resume", "skill_assessment", "manual", "auto_snapshot"],
    default: "auto_snapshot",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model("ReadinessHistory", ReadinessHistorySchema);
