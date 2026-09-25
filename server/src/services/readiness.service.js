/**
 * AI Placement Readiness Engine — Service Layer
 * Orchestrates candidate evaluation, unified data aggregation (Resume + Interview + Skill),
 * score computation, category classification, and weak area analysis.
 */

const Resume = require("../models/Resume.js");
const Interview = require("../models/Interview.js");
const SkillAssessment = require("../models/SkillAssessment.js");
const ReadinessHistory = require("../models/ReadinessHistory.js");
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

const WEAK_AREA_RECOMMENDATIONS = {
  "DSA": "Focus on array/string algorithms, two-pointer techniques, and binary tree traversals.",
  "DBMS": "Practice writing complex SQL JOINs, indexing strategies, and database normalization forms.",
  "OOP": "Review SOLID principles, inheritance vs composition, and design patterns (Factory, Observer).",
  "OS": "Study process scheduling, deadlocks, multithreading synchronization, and virtual memory.",
  "CN": "Understand the TCP/IP stack, DNS resolution flow, HTTP/HTTPS handshake, and WebSocket protocols.",
  "Programming": "Practice solving medium-level coding problems with clean idiomatic syntax and test cases.",
  "Cloud": "Build hands-on experience with cloud primitives (AWS S3, EC2, IAM, or Docker containerization).",
  "AI/ML": "Review gradient descent, loss functions, evaluation metrics (F1-score, PR-AUC), and model validation.",
  "Communication": "Structure interview explanations with the STAR method (Situation, Task, Action, Result).",
  "Communication Skills": "Practice verbalizing your thought process aloud before writing code or making design choices.",
  "Interview Performance": "Review core technical concepts and articulate clear trade-offs between approaches.",
  "Technical Interview": "Review core algorithmic patterns and articulate trade-offs between time and space complexity.",
  "Technical Explanation Depth": "Dive deeper into low-level mechanics, memory allocations, and edge cases in your answers.",
  "Resume Quality": "Add quantifiable impact metrics (e.g. reduced latency by 35%) and verify ATS keywords.",
};

/**
 * Pure calculation of readiness score and classification according to standard formula:
 * readinessScore = resumeScore * 0.25 + interviewScore * 0.35 + skillScore * 0.40
 */
function sanitizeScore(val) {
  if (val === undefined || val === null) return 0;
  const num = Number(val);
  if (isNaN(num) || !Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round((num + Number.EPSILON) * 100) / 100));
}

function calculateReadinessPure({ resumeScore = 0, interviewScore = 0, skillScore = 0, communicationScore = 0 }) {
  const rScore = sanitizeScore(resumeScore);
  const iScore = sanitizeScore(interviewScore);
  const sScore = sanitizeScore(skillScore);
  const cScore = communicationScore !== undefined && communicationScore !== null
    ? sanitizeScore(communicationScore)
    : 0;

  const rawScore = rScore * 0.25 + iScore * 0.35 + sScore * 0.40;
  const readinessScore = Math.max(0, Math.min(100, Math.round((rawScore + Number.EPSILON) * 100) / 100));
  const category = classifyCandidate(readinessScore);

  const weakList = [];
  const strongList = [];

  if (rScore < 60) weakList.push({ area: "Resume Quality", score: rScore, recommendation: WEAK_AREA_RECOMMENDATIONS["Resume Quality"] });
  else if (rScore >= 80) strongList.push("Resume Quality");

  if (iScore < 60) weakList.push({ area: "Interview Performance", score: iScore, recommendation: WEAK_AREA_RECOMMENDATIONS["Interview Performance"] });
  else if (iScore >= 80) strongList.push("Interview Performance");

  if (sScore < 60) weakList.push({ area: "Technical Skills", score: sScore, recommendation: "Improve fundamental core programming and engineering skills." });
  else if (sScore >= 80) strongList.push("Technical Skills");

  if (cScore > 0) {
    if (cScore < 60) weakList.push({ area: "Communication", score: cScore, recommendation: WEAK_AREA_RECOMMENDATIONS["Communication"] });
    else if (cScore >= 80) strongList.push("Communication");
  }

  weakList.sort((a, b) => a.score - b.score);

  return {
    readinessScore,
    category,
    scoreBreakdown: {
      resume: rScore,
      interview: iScore,
      technicalSkills: sScore,
      communication: cScore,
    },
    weakAreas: weakList,
    strongAreas: strongList,
  };
}

/**
 * Saves a point-in-time readiness snapshot to ReadinessHistory.
 */
async function saveReadinessSnapshot(userId, customData = {}) {
  if (!userId) return null;

  try {
    let unified = null;
    try {
      unified = await getUnifiedCandidateData(userId);
    } catch {
      // Unified data might be partial
    }

    const resumeScore = typeof customData.resumeScore === "number"
      ? customData.resumeScore
      : (unified?.resume?.resumeScore ?? 0);

    const interviewScore = typeof customData.interviewScore === "number"
      ? customData.interviewScore
      : (unified?.interview?.overallInterviewScore ?? 0);

    let skillScore = 0;
    if (typeof customData.skillScore === "number") {
      skillScore = customData.skillScore;
    } else if (unified?.skills && Object.keys(unified.skills).length > 0) {
      const vals = Object.values(unified.skills).filter((v) => typeof v === "number");
      if (vals.length > 0) {
        skillScore = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      }
    }

    const communicationScore = typeof customData.communicationScore === "number"
      ? customData.communicationScore
      : (unified?.interview?.communicationScore ?? 0);

    const rawScore = resumeScore * 0.25 + interviewScore * 0.35 + skillScore * 0.40;
    const score = Math.round((rawScore + Number.EPSILON) * 100) / 100;
    const category = classifyCandidate(score);

    const weakList = [];
    const strongList = [];

    if (resumeScore > 0) {
      if (resumeScore < 60) weakList.push({ name: "Resume Quality", score: resumeScore });
      else if (resumeScore >= 80) strongList.push("Resume Quality");
    }
    if (interviewScore > 0) {
      if (interviewScore < 60) weakList.push({ name: "Interview Performance", score: interviewScore });
      else if (interviewScore >= 80) strongList.push("Interview Performance");
    }
    if (communicationScore > 0) {
      if (communicationScore < 60) weakList.push({ name: "Communication", score: communicationScore });
      else if (communicationScore >= 80) strongList.push("Communication");
    }

    if (unified?.skills) {
      for (const [sName, sScore] of Object.entries(unified.skills)) {
        if (typeof sScore === "number") {
          if (sScore < 60) weakList.push({ name: sName, score: sScore });
          else if (sScore >= 80) strongList.push(sName);
        }
      }
    }

    weakList.sort((a, b) => a.score - b.score);
    const weakAreas = Array.from(new Set(weakList.map((w) => w.name)));
    const strongAreas = Array.from(new Set(strongList));

    const snapshot = await ReadinessHistory.create({
      userId,
      score,
      resumeScore,
      interviewScore,
      skillScore,
      communicationScore,
      category,
      weakAreas,
      strongAreas,
      source: customData.source || "auto_snapshot",
      createdAt: customData.createdAt || new Date(),
    });

    return snapshot;
  } catch (err) {
    console.error("[ReadinessService] Error saving readiness snapshot:", err);
    return null;
  }
}

/**
 * Retrieves the historical readiness snapshots for a candidate.
 */
async function getReadinessHistory(userId) {
  if (!userId) {
    return {
      history: [],
      currentScore: null,
      previousScore: null,
      improvement: null,
      category: null,
    };
  }

  const history = await ReadinessHistory.find({ userId }).sort({ createdAt: 1 }).lean();

  if (!history || history.length === 0) {
    return {
      history: [],
      currentScore: null,
      previousScore: null,
      improvement: null,
      category: null,
      message: "No historical snapshots recorded yet.",
    };
  }

  const currentDoc = history[history.length - 1];
  const previousDoc = history.length >= 2 ? history[history.length - 2] : null;

  const currentScore = currentDoc.score;
  const previousScore = previousDoc ? previousDoc.score : null;
  const improvement =
    previousScore !== null
      ? Math.round(((currentScore - previousScore) + Number.EPSILON) * 100) / 100
      : null;

  return {
    history,
    currentScore,
    previousScore,
    improvement,
    category: currentDoc.category,
    lastUpdated: currentDoc.createdAt,
  };
}

/**
 * Retrieves the current placement readiness profile for a candidate.
 */
async function getCurrentReadiness(userId) {
  if (!userId) {
    throw new Error("Candidate ID is required.");
  }

  const unified = await getUnifiedCandidateData(userId);
  const historySummary = await getReadinessHistory(userId);

  const resumeScore = unified.resume?.resumeScore ?? 0;
  const interviewScore = unified.interview?.overallInterviewScore ?? 0;

  let skillScore = 0;
  if (unified.skills && Object.keys(unified.skills).length > 0) {
    const vals = Object.values(unified.skills).filter((v) => typeof v === "number");
    if (vals.length > 0) {
      skillScore = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    }
  }

  const communicationScore = unified.interview?.communicationScore ?? 0;

  const rawScore = resumeScore * 0.25 + interviewScore * 0.35 + skillScore * 0.40;
  const readinessScore = Math.round((rawScore + Number.EPSILON) * 100) / 100;
  const category = classifyCandidate(readinessScore);

  const weakList = [];
  const strongList = [];

  if (unified.resume) {
    if (resumeScore < 60) {
      weakList.push({
        area: "Resume Quality",
        score: resumeScore,
        recommendation: WEAK_AREA_RECOMMENDATIONS["Resume Quality"],
      });
    } else if (resumeScore >= 80) {
      strongList.push("Resume Quality");
    }
  }

  if (unified.interview) {
    if (interviewScore < 60) {
      weakList.push({
        area: "Interview Performance",
        score: interviewScore,
        recommendation: WEAK_AREA_RECOMMENDATIONS["Interview Performance"],
      });
    } else if (interviewScore >= 80) {
      strongList.push("Interview Performance");
    }

    if (communicationScore < 60) {
      weakList.push({
        area: "Communication",
        score: communicationScore,
        recommendation: WEAK_AREA_RECOMMENDATIONS["Communication"],
      });
    } else if (communicationScore >= 80) {
      strongList.push("Communication");
    }
  }

  if (unified.skills) {
    for (const [skill, val] of Object.entries(unified.skills)) {
      if (typeof val === "number") {
        if (val < 60) {
          weakList.push({
            area: skill,
            score: val,
            recommendation:
              WEAK_AREA_RECOMMENDATIONS[skill] ||
              `Improve proficiency and practice core interview questions in ${skill}.`,
          });
        } else if (val >= 80) {
          strongList.push(skill);
        }
      }
    }
  }

  if (unified.resume?.missingSkills) {
    for (const ms of unified.resume.missingSkills) {
      if (ms && !weakList.some((w) => w.area.toLowerCase() === ms.toLowerCase())) {
        weakList.push({
          area: ms,
          score: 40,
          recommendation: `Target missing resume competency: ${ms}. Add verified projects or coursework.`,
        });
      }
    }
  }

  weakList.sort((a, b) => a.score - b.score);

  return {
    candidateId: String(userId),
    candidateName: unified.candidateName,
    candidateType: unified.candidateType,
    readinessScore,
    category,
    scoreBreakdown: {
      resume: resumeScore,
      interview: interviewScore,
      technicalSkills: skillScore,
      communication: communicationScore,
    },
    weakAreas: weakList,
    strongAreas: Array.from(new Set(strongList)),
    moderateAreas: unified.moderateAreas || [],
    dataAvailability: unified.dataAvailability,
    historySummary: {
      currentScore: historySummary.currentScore,
      previousScore: historySummary.previousScore,
      improvement: historySummary.improvement,
      totalSnapshots: historySummary.history.length,
    },
    rawUnified: unified,
  };
}

module.exports = {
  analyzeReadiness,
  getUnifiedCandidateData,
  saveCandidateSkills,
  saveCandidateResume,
  saveReadinessSnapshot,
  getReadinessHistory,
  getCurrentReadiness,
  calculateReadinessPure,
  WEAK_AREA_RECOMMENDATIONS,
};
