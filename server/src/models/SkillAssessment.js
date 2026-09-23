const mongoose = require("mongoose");

const SkillAssessmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // One skill assessment profile per candidate
  },
  scores: {
    DSA: { type: Number, min: 0, max: 100, default: 0 },
    DBMS: { type: Number, min: 0, max: 100, default: 0 },
    OOP: { type: Number, min: 0, max: 100, default: 0 },
    OS: { type: Number, min: 0, max: 100, default: 0 },
    CN: { type: Number, min: 0, max: 100, default: 0 },
    Programming: { type: Number, min: 0, max: 100, default: 0 },
    Cloud: { type: Number, min: 0, max: 100, default: 0 },
    "AI/ML": { type: Number, min: 0, max: 100, default: 0 },
  },
  customSkills: {
    type: Map,
    of: Number,
    default: {},
  },
  notes: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now },
});

SkillAssessmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("SkillAssessment", SkillAssessmentSchema);
