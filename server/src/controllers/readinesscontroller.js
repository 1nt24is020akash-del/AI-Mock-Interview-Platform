/**
 * AI Placement Readiness Engine — Controller
 * Handles HTTP endpoints for candidate readiness analysis, unified data retrieval,
 * and skill assessment management.
 */

const {
  analyzeReadiness,
  getUnifiedCandidateData,
  saveCandidateSkills,
  saveCandidateResume,
} = require("../services/readiness.service.js");
const {
  generatePersonalizedRoadmap,
  getCandidateRoadmap,
} = require("../services/roadmap.service.js");
const User = require("../models/User.js");

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

/**
 * GET /api/readiness/candidate/:candidateId?
 * Retrieves unified readiness data combining:
 * 1. Resume Analysis
 * 2. Adaptive Interview Performance
 * 3. Skill Assessment
 * Handles missing data gracefully.
 */
async function getUnifiedReadiness(req, res) {
  try {
    const candidateId = req.params.candidateId || req.userId;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_CANDIDATE_ID",
          message: "Candidate ID is required in URL path or via authentication token.",
        },
      });
    }

    const unifiedData = await getUnifiedCandidateData(candidateId);

    return res.status(200).json({
      success: true,
      data: unifiedData,
    });
  } catch (error) {
    console.error("[ReadinessController] Error fetching unified candidate data:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve candidate readiness data.",
      },
    });
  }
}

/**
 * POST /api/readiness/skills
 * Saves or updates candidate skill assessment scores (0-100).
 */
async function updateSkillAssessment(req, res) {
  try {
    const candidateId = req.userId || req.body.candidateId || req.params.candidateId;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_CANDIDATE_ID",
          message: "Candidate ID is required via authentication token or request body.",
        },
      });
    }

    const scores = req.body.scores || req.body;
    const result = await saveCandidateSkills(candidateId, scores);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: result.validationErrors.join(" "),
          details: result.validationErrors,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Skill assessment updated successfully.",
      data: result.data,
    });
  } catch (error) {
    console.error("[ReadinessController] Error updating skill assessment:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update skill assessment.",
      },
    });
  }
}

/**
 * POST /api/readiness/resume
 * Saves or updates normalized resume data for the candidate.
 */
async function updateResumeData(req, res) {
  try {
    const candidateId = req.userId || req.body.candidateId;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_CANDIDATE_ID",
          message: "Candidate ID is required via authentication token or request body.",
        },
      });
    }

    const result = await saveCandidateResume(candidateId, req.body);

    return res.status(200).json({
      success: true,
      message: "Candidate resume data saved successfully.",
      data: result.data,
    });
  } catch (error) {
    console.error("[ReadinessController] Error updating resume data:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update candidate resume data.",
      },
    });
  }
}

/**
 * POST /api/readiness/roadmap/generate
 * Generates an AI-powered or deterministic personalized learning roadmap.
 */
async function generateRoadmap(req, res) {
  try {
    const candidateId = req.userId || req.body.candidateId;
    let unifiedData = null;

    if (candidateId) {
      try {
        unifiedData = await getUnifiedCandidateData(candidateId);
      } catch (err) {
        console.warn("[ReadinessController] Could not fetch unified data for roadmap:", err.message);
      }
    }

    const candidateType = req.body.candidateType || unifiedData?.candidateType || "fresher";

    // If candidateId is provided and candidateType is passed, update user's candidateType in DB
    if (candidateId && req.body.candidateType) {
      await User.findByIdAndUpdate(candidateId, { candidateType }).catch(() => {});
    }

    // Merge unified profile data with any overrides from request body
    const candidateData = {
      candidateId,
      candidateType,
      readinessScore:
        req.body.readinessScore !== undefined
          ? req.body.readinessScore
          : unifiedData?.readinessScore !== undefined
          ? unifiedData.readinessScore
          : 65,
      weakAreas: req.body.weakAreas || unifiedData?.weakAreas || [],
      missingSkills: req.body.missingSkills || unifiedData?.resume?.missingSkills || [],
      interviewPerformance: req.body.interviewPerformance || unifiedData?.interview || {},
      skillScores: req.body.skillScores || unifiedData?.skills || {},
      resumeData: req.body.resumeData || unifiedData?.resume || {},
    };

    const roadmap = await generatePersonalizedRoadmap(candidateData);

    return res.status(200).json({
      success: true,
      message: "Personalized roadmap generated successfully.",
      data: roadmap,
    });
  } catch (error) {
    console.error("[ReadinessController] Error generating roadmap:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ROADMAP_GENERATION_FAILED",
        message: "Failed to generate personalized career roadmap.",
      },
    });
  }
}

/**
 * GET /api/readiness/roadmap/:candidateId?
 * Retrieves the latest stored roadmap for the candidate.
 */
async function getRoadmap(req, res) {
  try {
    const candidateId = req.params.candidateId || req.userId;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_CANDIDATE_ID",
          message: "Candidate ID is required to fetch roadmap.",
        },
      });
    }

    const roadmap = await getCandidateRoadmap(candidateId);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ROADMAP_NOT_FOUND",
          message: "No roadmap found for this candidate. Please generate one first.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: roadmap,
    });
  } catch (error) {
    console.error("[ReadinessController] Error fetching roadmap:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve candidate roadmap.",
      },
    });
  }
}

/**
 * POST /api/readiness/candidate-type
 * Updates candidate's target career tier (fresher, internship_seeker, experienced).
 */
async function updateCandidateType(req, res) {
  try {
    const candidateId = req.userId || req.body.candidateId;
    const { candidateType } = req.body;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_CANDIDATE_ID",
          message: "Candidate ID is required.",
        },
      });
    }

    const validTypes = ["fresher", "internship_seeker", "experienced"];
    if (!validTypes.includes(candidateType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_CANDIDATE_TYPE",
          message: `Candidate type must be one of: ${validTypes.join(", ")}. Received: '${candidateType}'`,
        },
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      candidateId,
      { candidateType },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: `Candidate type updated to ${candidateType}.`,
      data: {
        candidateId,
        candidateType: updatedUser?.candidateType || candidateType,
      },
    });
  } catch (error) {
    console.error("[ReadinessController] Error updating candidate type:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update candidate type.",
      },
    });
  }
}

module.exports = {
  analyzeCandidateReadiness,
  getUnifiedReadiness,
  updateSkillAssessment,
  updateResumeData,
  generateRoadmap,
  getRoadmap,
  updateCandidateType,
};
