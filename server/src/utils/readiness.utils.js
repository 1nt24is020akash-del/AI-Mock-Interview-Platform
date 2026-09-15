/**
 * AI Placement Readiness Engine — Utilities
 * Mathematical scoring, classification, skill normalization, weak-area detection, and validation.
 */

const {
  READINESS_WEIGHTS,
  READINESS_THRESHOLDS,
  READINESS_CATEGORIES,
  WEAK_AREA_THRESHOLDS,
  CANDIDATE_TYPES,
  DEFAULT_CANDIDATE_TYPE,
} = require("../config/readiness.config.js");

/**
 * Calculates the overall readiness score using configurable weights.
 * Default: Resume 25%, Interview 35%, Skill Assessment 40%
 *
 * @param {Object} scores - { resumeScore, interviewScore, skillScore }
 * @param {Object} [weights=READINESS_WEIGHTS] - Configurable weight distribution
 * @returns {number} Overall score rounded to 2 decimal places
 */
function calculateReadinessScore(
  { resumeScore, interviewScore, skillScore },
  weights = READINESS_WEIGHTS
) {
  const wResume = typeof weights.resume === "number" ? weights.resume : 0.25;
  const wInterview = typeof weights.interview === "number" ? weights.interview : 0.35;
  const wSkill = typeof weights.skill === "number" ? weights.skill : 0.40;

  const weightedTotal =
    resumeScore * wResume +
    interviewScore * wInterview +
    skillScore * wSkill;

  // Round precisely to 2 decimal places without premature integer truncation
  return Math.round((weightedTotal + Number.EPSILON) * 100) / 100;
}

/**
 * Classifies a candidate based on their overall score and configurable thresholds.
 * - >= 80: "Placement Ready"
 * - >= 65: "High Potential Candidate"
 * - < 65: "Needs Improvement"
 *
 * @param {number} score - Overall readiness score
 * @param {Object} [thresholds=READINESS_THRESHOLDS] - Threshold configuration
 * @returns {string} Category description
 */
function classifyCandidate(score, thresholds = READINESS_THRESHOLDS) {
  const ready = typeof thresholds.placementReady === "number" ? thresholds.placementReady : 80;
  const potential = typeof thresholds.highPotential === "number" ? thresholds.highPotential : 65;

  if (score >= ready) {
    return READINESS_CATEGORIES.PLACEMENT_READY;
  }
  if (score >= potential) {
    return READINESS_CATEGORIES.HIGH_POTENTIAL;
  }
  return READINESS_CATEGORIES.NEEDS_IMPROVEMENT;
}

/**
 * Normalizes an array of skills:
 * - Trims whitespace
 * - Discards empty strings and non-string elements
 * - Removes duplicates (case-insensitive) while preserving display casing
 *
 * @param {Array} skillsArray - Raw array of skill names
 * @returns {string[]} Clean, deduplicated array of skills
 */
function normalizeSkills(skillsArray) {
  if (!Array.isArray(skillsArray)) return [];

  const seen = new Set();
  const normalized = [];

  for (const item of skillsArray) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;

    const lowerKey = trimmed.toLowerCase();
    if (!seen.has(lowerKey)) {
      seen.add(lowerKey);
      normalized.push(trimmed);
    }
  }

  return normalized;
}

/**
 * Identifies areas of weakness based on scores and optional interview analysis dimensions.
 *
 * Rules:
 * - communicationScore < 50 -> "Communication Skills"
 * - communicationScore < 60 -> "Communication"
 * - skillScore < 60 -> "Technical Skills"
 * - interviewScore < 60 -> "Interview Performance"
 * - resumeScore < 60 -> "Resume Quality"
 * - detailed interview dimensions if < 60
 *
 * @param {Object} params
 * @param {number} params.resumeScore
 * @param {number} params.interviewScore
 * @param {number} params.skillScore
 * @param {number} [params.communicationScore]
 * @param {string[]} [params.missingSkills]
 * @param {Object} [params.interviewAnalysis]
 * @returns {string[]} Deduplicated list of weak areas
 */
function detectWeakAreas({
  resumeScore,
  interviewScore,
  skillScore,
  communicationScore,
  missingSkills,
  interviewAnalysis,
}) {
  const weakAreas = [];
  const { scoreFloor, criticalCommunicationFloor } = WEAK_AREA_THRESHOLDS;

  // 1. Communication evaluation
  if (typeof communicationScore === "number" && !isNaN(communicationScore)) {
    if (communicationScore < criticalCommunicationFloor) {
      weakAreas.push("Communication Skills");
    } else if (communicationScore < scoreFloor) {
      weakAreas.push("Communication");
    }
  }

  // 2. Technical skill assessment evaluation
  if (typeof skillScore === "number" && skillScore < scoreFloor) {
    weakAreas.push("Technical Skills");
  }

  // 3. Interview performance evaluation
  if (typeof interviewScore === "number" && interviewScore < scoreFloor) {
    weakAreas.push("Interview Performance");
  }

  // 4. Resume quality evaluation
  if (typeof resumeScore === "number" && resumeScore < scoreFloor) {
    weakAreas.push("Resume Quality");
  }

  // 5. Integrate detailed interview dimensions if present
  if (interviewAnalysis && typeof interviewAnalysis === "object") {
    const dimensionLabels = {
      technicalUnderstanding: "Technical Understanding",
      problemSolving: "Problem Solving",
      correctness: "Technical Correctness",
      relevance: "Answer Relevance",
      explanationQuality: "Explanation Depth",
      systemArchitecture: "System Architecture",
      codingProficiency: "Coding Proficiency",
    };

    for (const [key, label] of Object.entries(dimensionLabels)) {
      if (
        typeof interviewAnalysis[key] === "number" &&
        interviewAnalysis[key] < scoreFloor
      ) {
        weakAreas.push(label);
      }
    }
  }

  // Deduplicate entries while preserving insertion order
  return Array.from(new Set(weakAreas));
}

/**
 * Validates the candidate readiness input payload.
 *
 * Requirements:
 * - resumeScore, interviewScore, skillScore must be numbers between 0 and 100
 * - communicationScore (if provided) must be a number between 0 and 100
 * - candidateType (if provided) must be one of: 'fresher', 'internship_seeker', 'experienced'
 * - technicalSkills and missingSkills must be arrays if provided (or default to [])
 *
 * @param {Object} data - Raw request payload
 * @returns {{ isValid: boolean, errors: string[], sanitized: Object }}
 */
function validateReadinessInput(data) {
  const errors = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      isValid: false,
      errors: ["Request body must be a valid JSON object."],
      sanitized: null,
    };
  }

  // Score validation helper
  function validateScore(name, val, isRequired = true) {
    if (val === undefined || val === null) {
      if (isRequired) {
        errors.push(`${name} is required.`);
      }
      return null;
    }
    if (typeof val !== "number" || isNaN(val) || !Number.isFinite(val)) {
      errors.push(`${name} must be a valid number between 0 and 100.`);
      return null;
    }
    if (val < 0 || val > 100) {
      errors.push(`${name} must be between 0 and 100. Received: ${val}`);
      return null;
    }
    return val;
  }

  const resumeScore = validateScore("resumeScore", data.resumeScore, true);
  const interviewScore = validateScore("interviewScore", data.interviewScore, true);
  const skillScore = validateScore("skillScore", data.skillScore, true);
  const communicationScore = validateScore("communicationScore", data.communicationScore, false);

  // Candidate type validation
  let candidateType = DEFAULT_CANDIDATE_TYPE;
  if (data.candidateType !== undefined && data.candidateType !== null) {
    if (typeof data.candidateType !== "string") {
      errors.push("candidateType must be a string.");
    } else {
      const normalizedType = data.candidateType.trim().toLowerCase();
      if (!CANDIDATE_TYPES.includes(normalizedType)) {
        errors.push(
          `candidateType must be one of: ${CANDIDATE_TYPES.join(", ")}. Received: "${data.candidateType}"`
        );
      } else {
        candidateType = normalizedType;
      }
    }
  }

  // Technical skills validation & normalization
  let technicalSkills = [];
  if (data.technicalSkills !== undefined && data.technicalSkills !== null) {
    if (!Array.isArray(data.technicalSkills)) {
      errors.push("technicalSkills must be an array of strings.");
    } else {
      technicalSkills = normalizeSkills(data.technicalSkills);
    }
  }

  // Missing skills validation & normalization
  let missingSkills = [];
  if (data.missingSkills !== undefined && data.missingSkills !== null) {
    if (!Array.isArray(data.missingSkills)) {
      errors.push("missingSkills must be an array of strings.");
    } else {
      missingSkills = normalizeSkills(data.missingSkills);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors, sanitized: null };
  }

  return {
    isValid: true,
    errors: [],
    sanitized: {
      resumeScore,
      interviewScore,
      skillScore,
      communicationScore,
      technicalSkills,
      missingSkills,
      candidateType,
      interviewAnalysis: data.interviewAnalysis || null,
    },
  };
}

module.exports = {
  calculateReadinessScore,
  classifyCandidate,
  normalizeSkills,
  detectWeakAreas,
  validateReadinessInput,
};
