/**
 * AI Placement Readiness Engine — Service Layer
 * Orchestrates candidate evaluation, unified data aggregation (Resume + Interview + Skill),
 * score computation, category classification, and weak area analysis.
 */

const Resume = require("../models/Resume.js");
const Interview = require("../models/Interview.js");
const SkillAssessment = require("../models/SkillAssessment.js");
const User = require("../models/User.js");

const {
  READINESS_WEIGHTS,
  READINESS_THRESHOLDS,
  SKILL_TIER_THRESHOLDS,
} = require("../config/readiness.config.js");

const {
  calculateReadinessScore,
  classifyCandidate,
  detectWeakAreas,
  validateReadinessInput,
  categorizeSkills,
  validateSkillScores,
  InterviewPerformanceAdapter,
  ResumePerformanceAdapter,
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

/**
 * Aggregates unified readiness data for a candidate across:
 * 1. Resume Analysis
 * 2. Adaptive Interview Performance
 * 3. Skill Assessment
 *
 * Handles missing data gracefully without throwing or creating fake scores.
 *
 * @param {string} candidateId - Candidate User ID
 * @returns {Promise<Object>} Unified candidate readiness profile
 */
async function getUnifiedCandidateData(candidateId) {
  if (!candidateId) {
    throw new Error("Candidate ID is required.");
  }

  // 1. Fetch data concurrently from all 3 sources and user record
  const [resumeDoc, interviewDocs, skillDoc, userDoc] = await Promise.all([
    Resume.findOne({ userId: candidateId }).lean().catch(() => null),
    Interview.find({ userId: candidateId }).sort({ createdAt: -1 }).lean().catch(() => []),
    SkillAssessment.findOne({ userId: candidateId }).lean().catch(() => null),
    User.findById(candidateId).lean().catch(() => null),
  ]);

  // 2. Adapt Resume Data
  const resume = ResumePerformanceAdapter(resumeDoc);

  // 3. Adapt Interview Performance Data (reusing existing Adaptive Interview Engine metrics)
  const interview = InterviewPerformanceAdapter(interviewDocs);

  // 4. Categorize Skill Assessment Data
  let skills = null;
  let strongAreas = [];
  let moderateAreas = [];
  let weakSkills = [];

  if (skillDoc && skillDoc.scores) {
    const categorized = categorizeSkills(skillDoc.scores);
    skills = categorized.skills;
    strongAreas = categorized.strongAreas;
    moderateAreas = categorized.moderateAreas;
    weakSkills = categorized.weakAreas;
  }

  // 5. Track Data Availability
  const dataAvailability = {
    resume: resume !== null,
    interview: interview !== null,
    skills: skills !== null,
  };

  // 6. Aggregate comprehensive weak areas across all available sources
  const combinedWeakSet = new Set(weakSkills);

  if (interview) {
    if (interview.communicationScore < 60) combinedWeakSet.add("Communication");
    if (interview.technicalScore < 60) combinedWeakSet.add("Technical Interview");
    if (interview.explanationQuality < 60) combinedWeakSet.add("Technical Explanation Depth");
  }

  if (resume) {
    if (resume.resumeScore < 60) combinedWeakSet.add("Resume Quality");
    (resume.missingSkills || []).forEach((s) => {
      if (s && s.length > 1) combinedWeakSet.add(s);
    });
  }

  const weakAreas = Array.from(combinedWeakSet);

  // 7. Calculate dynamic overall readiness score based on available sources
  let readinessScore = null;
  let category = null;

  const weights = READINESS_WEIGHTS || { resume: 0.25, interview: 0.35, skill: 0.40 };
  let weightedSum = 0;
  let totalWeight = 0;

  if (resume && typeof resume.resumeScore === "number") {
    weightedSum += resume.resumeScore * weights.resume;
    totalWeight += weights.resume;
  }
  if (interview && typeof interview.overallInterviewScore === "number") {
    weightedSum += interview.overallInterviewScore * weights.interview;
    totalWeight += weights.interview;
  }
  if (skills && Object.keys(skills).length > 0) {
    const skillVals = Object.values(skills).filter((v) => typeof v === "number");
    if (skillVals.length > 0) {
      const avgSkill = skillVals.reduce((a, b) => a + b, 0) / skillVals.length;
      weightedSum += avgSkill * weights.skill;
      totalWeight += weights.skill;
    }
  }

  if (totalWeight > 0) {
    readinessScore = Math.round(((weightedSum / totalWeight) + Number.EPSILON) * 100) / 100;
    category = classifyCandidate(readinessScore);
  }

  return {
    candidateId: String(candidateId),
    candidateName: userDoc?.name || "Candidate",
    candidateType: userDoc?.candidateType || "fresher",
    readinessScore,
    category,
    resume,
    interview,
    skills,
    weakAreas,
    strongAreas,
    moderateAreas,
    dataAvailability,
  };
}

/**
 * Saves or updates a candidate's skill assessment scores.
 * Validates that all scores are numbers between 0 and 100.
 *
 * @param {string} candidateId - Candidate User ID
 * @param {Object} scores - Key-value map of skill scores (e.g. { DSA: 75, DBMS: 80 })
 * @returns {Promise<Object>} Updated skill assessment record or validation errors
 */
async function saveCandidateSkills(candidateId, scores) {
  if (!candidateId) {
    return { success: false, validationErrors: ["Candidate ID is required."] };
  }

  const validation = validateSkillScores(scores);
  if (!validation.isValid) {
    return { success: false, validationErrors: validation.errors };
  }

  const updatedDoc = await SkillAssessment.findOneAndUpdate(
    { userId: candidateId },
    {
      userId: candidateId,
      scores: validation.sanitizedScores,
      updatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  const categorized = categorizeSkills(updatedDoc.scores);

  return {
    success: true,
    data: {
      candidateId: String(candidateId),
      scores: updatedDoc.scores,
      strongAreas: categorized.strongAreas,
      moderateAreas: categorized.moderateAreas,
      weakAreas: categorized.weakAreas,
      updatedAt: updatedDoc.updatedAt,
    },
  };
}

/**
 * Saves or updates a candidate's normalized resume profile.
 *
 * @param {string} candidateId - Candidate User ID
 * @param {Object} resumeData - Normalized resume details
 * @returns {Promise<Object>} Upserted resume profile
 */
async function saveCandidateResume(candidateId, resumeData) {
  if (!candidateId) {
    return { success: false, validationErrors: ["Candidate ID is required."] };
  }

  const normalized = ResumePerformanceAdapter(resumeData) || resumeData;

  const updated = await Resume.findOneAndUpdate(
    { userId: candidateId },
    {
      userId: candidateId,
      fileName: resumeData.fileName || "resume.pdf",
      resumeScore: normalized.resumeScore || 0,
      skills: normalized.skills || [],
      projects: normalized.projects || [],
      education: normalized.education || "",
      experience: normalized.experience || [],
      certifications: normalized.certifications || [],
      missingSkills: normalized.missingSkills || [],
      updatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return {
    success: true,
    data: updated,
  };
}

module.exports = {
  analyzeReadiness,
  getUnifiedCandidateData,
  saveCandidateSkills,
  saveCandidateResume,
};
