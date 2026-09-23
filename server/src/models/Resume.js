const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // One active resume profile per user
  },
  fileName: { type: String, default: "" },
  resumeScore: { type: Number, default: 0 },
  skills: [{ type: String }],
  categorizedSkills: {
    languages: [{ type: String }],
    frontend: [{ type: String }],
    backend: [{ type: String }],
    databases: [{ type: String }],
    cloudDevOps: [{ type: String }],
    toolsAndOthers: [{ type: String }],
  },
  projects: [
    {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      technologies: [{ type: String }],
      link: { type: String, default: "" },
    },
  ],
  education: { type: String, default: "" },
  educationList: [
    {
      degree: { type: String, default: "" },
      institution: { type: String, default: "" },
      year: { type: String, default: "" },
      gpa: { type: String, default: "" },
    },
  ],
  experience: [
    {
      role: { type: String, default: "" },
      company: { type: String, default: "" },
      duration: { type: String, default: "" },
      description: { type: String, default: "" },
    },
  ],
  certifications: [{ type: String }],
  missingSkills: [{ type: String }],
  rawAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
  updatedAt: { type: Date, default: Date.now },
});

ResumeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Resume", ResumeSchema);
