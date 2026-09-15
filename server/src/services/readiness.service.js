/**
 * AI Placement Readiness Engine — Service Layer
 * Orchestrates candidate evaluation, score computation, category classification, and weak area analysis.
 */

const {
  READINESS_WEIGHTS,
  READINESS_THRESHOLDS,
} = require("../config/readiness.config.js");

const {
  calculateReadinessScore,
  classifyCandidate,
  detectWeakAreas,
  validateReadinessInput,
} = require("../utils/readiness.utils.js");

/**
 * Evaluates candidate readiness from structured metrics.
 *
 * @param {Object} inputData - Raw candidate performance metrics
 * @param {Object} [customConfig] - Optional weights or threshold overrides
 * @returns {Object} Structured analysis result or validation errors
 */
function analyzeReadiness(inputData, customConfig = {}) {
  // 1. Validate incoming data
  const validation = validateReadinessInput(inputData);
  if (!validation.isValid) {
    return {
      success: false,
      validationErrors: validation.errors,
    };
  }

  const {
    resumeScore,
    interviewScore,
    skillScore,
    communicationScore,
    technicalSkills,
    missingSkills,
    candidateType,
    interviewAnalysis,
  } = validation.sanitized;

  // 2. Resolve weights & thresholds
  const weights = customConfig.weights || READINESS_WEIGHTS;
  const thresholds = customConfig.thresholds || READINESS_THRESHOLDS;

  // 3. Calculate overall weighted score
  const overallScore = calculateReadinessScore(
    { resumeScore, interviewScore, skillScore },
    weights
  );

  // 4. Classify candidate into readiness tier
  const category = classifyCandidate(overallScore, thresholds);

  // 5. Detect candidate weak areas
  const weakAreas = detectWeakAreas({
    resumeScore,
    interviewScore,
    skillScore,
    communicationScore,
    missingSkills,
    interviewAnalysis,
  });

  // 6. Build structured output payload
  const scoreBreakdown = {
    resume: resumeScore,
    interview: interviewScore,
    skillAssessment: skillScore,
  };
  if (communicationScore !== undefined && communicationScore !== null) {
    scoreBreakdown.communication = communicationScore;
  }

  const formattedWeights = {
    resume: weights.resume,
    interview: weights.interview,
    skillAssessment: weights.skill,
  };

  return {
    success: true,
    data: {
      overallScore,
      category,
      scoreBreakdown,
      weights: formattedWeights,
      weakAreas,
      missingSkills,
      candidateType,
      ...(technicalSkills && technicalSkills.length > 0 ? { technicalSkills } : {}),
    },
  };
}

module.exports = {
  analyzeReadiness,
};
