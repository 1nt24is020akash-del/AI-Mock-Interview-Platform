const mongoose = require("mongoose");

const RoadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  candidateType: {
    type: String,
    enum: ["fresher", "internship_seeker", "experienced"],
    default: "fresher",
  },
  readinessScore: { type: Number, default: 0 },
  summary: { type: String, required: true },
  priorities: [
    {
      skill: { type: String, required: true },
      priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
      reason: { type: String, default: "" },
      recommendation: { type: String, default: "" },
      topics: [{ type: String }],
    },
  ],
  projects: [
    {
      title: { type: String, required: true },
      description: { type: String, default: "" },
      technologies: [{ type: String }],
    },
  ],
  certifications: [
    {
      name: { type: String, default: "" },
      reason: { type: String, default: "" },
    },
  ],
  interviewTopics: [{ type: String }],
  weeklyPlan: [
    {
      week: { type: Number, required: true },
      focus: { type: String, required: true },
      goals: [{ type: String }],
      actionItems: [{ type: String }],
    },
  ],
  sourceSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  generatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Roadmap", RoadmapSchema);
