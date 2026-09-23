/**
 * AI Placement Readiness Engine — Configuration
 * Centralized configurable weights, thresholds, and candidate types.
 */

// Default weights: Resume 25%, Interview 35%, Skill Assessment 40%
// Must sum to 1.0 (100%)
const READINESS_WEIGHTS = Object.freeze({
  resume: 0.25,
  interview: 0.35,
  skill: 0.40,
});

// Verify weights sum to 1.0 at initialization time
const weightSum = Object.values(READINESS_WEIGHTS).reduce((acc, w) => acc + w, 0);
if (Math.abs(weightSum - 1.0) > 0.001) {
  console.warn(`[ReadinessConfig] Warning: READINESS_WEIGHTS sum to ${weightSum}, expected 1.0`);
}

// Candidate classification score thresholds
const READINESS_THRESHOLDS = Object.freeze({
  placementReady: 80,   // >= 80 -> "Placement Ready"
  highPotential: 65,    // >= 65 and < 80 -> "High Potential Candidate"
  // < 65 -> "Needs Improvement"
});

// Category label constants
const READINESS_CATEGORIES = Object.freeze({
  PLACEMENT_READY: "Placement Ready",
  HIGH_POTENTIAL: "High Potential Candidate",
  NEEDS_IMPROVEMENT: "Needs Improvement",
});

// Weak area identification thresholds
const WEAK_AREA_THRESHOLDS = Object.freeze({
  scoreFloor: 60,                 // Score < 60 flags an area as weak
  criticalCommunicationFloor: 50, // Communication < 50 flags "Communication Skills" (vs "Communication")
});

// Supported candidate types
const CANDIDATE_TYPES = Object.freeze([
  "fresher",
  "internship_seeker",
  "experienced",
]);

const DEFAULT_CANDIDATE_TYPE = "fresher";

// Standard Skill Assessment Domains
const SKILL_ASSESSMENT_DOMAINS = Object.freeze([
  "DSA",
  "DBMS",
  "OOP",
  "OS",
  "CN",
  "Programming",
  "Cloud",
  "AI/ML",
]);

// Skill tier thresholds: >=80 Strong, 60-79 Moderate, <60 Weak
const SKILL_TIER_THRESHOLDS = Object.freeze({
  strong: 80,
  moderate: 60,
});

module.exports = {
  READINESS_WEIGHTS,
  READINESS_THRESHOLDS,
  READINESS_CATEGORIES,
  WEAK_AREA_THRESHOLDS,
  CANDIDATE_TYPES,
  DEFAULT_CANDIDATE_TYPE,
  SKILL_ASSESSMENT_DOMAINS,
  SKILL_TIER_THRESHOLDS,
};
