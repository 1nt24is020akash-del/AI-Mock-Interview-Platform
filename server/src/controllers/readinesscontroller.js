/**
 * AI Placement Readiness Engine — Controller
 * Handles HTTP requests for candidate readiness analysis.
 */

const { analyzeReadiness } = require("../services/readiness.service.js");

/**
 * POST /api/readiness/analyze
 * Analyzes candidate scores, calculates readiness score, classifies candidate tier,
 * identifies weak areas, and returns structured assessment.
 */
async function analyzeCandidateReadiness(req, res) {
  try {
    const analysis = analyzeReadiness(req.body);

    if (!analysis.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: analysis.validationErrors.join(" "),
          details: analysis.validationErrors,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: analysis.data,
    });
  } catch (error) {
    console.error("[ReadinessController] Error analyzing candidate:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to analyze candidate readiness due to an unexpected error.",
      },
    });
  }
}

module.exports = {
  analyzeCandidateReadiness,
};
