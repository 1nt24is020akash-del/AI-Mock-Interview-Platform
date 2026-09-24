const express = require("express");
const {
  analyzeCandidateReadiness,
  getUnifiedReadiness,
  updateSkillAssessment,
  updateResumeData,
  generateRoadmap,
  getRoadmap,
  updateCandidateType,
  getCurrentReadinessEndpoint,
  getReadinessHistoryEndpoint,
  calculateReadinessEndpoint,
  recordReadinessHistoryEndpoint,
} = require("../controllers/readinesscontroller.js");
const { optionalProtect } = require("../middleware/optionalAuth.js");

const router = express.Router();

// GET /api/readiness/current - Current readiness score, breakdown, category, weak/strong areas
router.get("/current", optionalProtect, getCurrentReadinessEndpoint);

// GET /api/readiness/history - Historical tracking snapshots and progress line data
router.get("/history", optionalProtect, getReadinessHistoryEndpoint);

// POST /api/readiness/calculate - Pure mathematical evaluation using standard formula
router.post("/calculate", optionalProtect, calculateReadinessEndpoint);

// POST /api/readiness/history - Record historical snapshot
router.post("/history", optionalProtect, recordReadinessHistoryEndpoint);

// POST /api/readiness/analyze - Pure mathematical evaluation & classification (Day 1 legacy compatibility)
router.post("/analyze", optionalProtect, analyzeCandidateReadiness);

// GET /api/readiness/candidate - Unified Readiness Data for current authenticated candidate
router.get("/candidate", optionalProtect, getUnifiedReadiness);

// GET /api/readiness/candidate/:candidateId - Unified Readiness Data by candidateId
router.get("/candidate/:candidateId", optionalProtect, getUnifiedReadiness);

// POST /api/readiness/skills - Submit or update skill assessment scores (0-100)
router.post("/skills", optionalProtect, updateSkillAssessment);

// POST /api/readiness/resume - Submit or update candidate resume profile
router.post("/resume", optionalProtect, updateResumeData);

// POST /api/readiness/roadmap/generate - Generate AI or deterministic personalized roadmap
router.post("/roadmap/generate", optionalProtect, generateRoadmap);

// GET /api/readiness/roadmap - Get latest roadmap for authenticated candidate
router.get("/roadmap", optionalProtect, getRoadmap);

// GET /api/readiness/roadmap/:candidateId - Get latest roadmap by candidate ID
router.get("/roadmap/:candidateId", optionalProtect, getRoadmap);

// POST /api/readiness/candidate-type - Update candidate target type (fresher, internship_seeker, experienced)
router.post("/candidate-type", optionalProtect, updateCandidateType);

module.exports = router;
