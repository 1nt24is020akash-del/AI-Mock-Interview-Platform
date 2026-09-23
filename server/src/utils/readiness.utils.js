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
  SKILL_ASSESSMENT_DOMAINS,
  SKILL_TIER_THRESHOLDS,
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

/**
 * Categorizes a collection of skill scores into strong, moderate, and weak areas.
 * - Strong: score >= 80
 * - Moderate: 60 <= score < 80
 * - Weak: score < 60
 *
 * @param {Object|Map} skillsObj - Skill name to score map
 * @param {Object} [thresholds=SKILL_TIER_THRESHOLDS] - Threshold boundaries
 * @returns {{ strongAreas: string[], moderateAreas: string[], weakAreas: string[], skills: Object }}
 */
function categorizeSkills(skillsObj, thresholds = SKILL_TIER_THRESHOLDS) {
  if (!skillsObj || typeof skillsObj !== "object") {
    return { strongAreas: [], moderateAreas: [], weakAreas: [], skills: {} };
  }

  const strongLimit = typeof thresholds.strong === "number" ? thresholds.strong : 80;
  const modLimit = typeof thresholds.moderate === "number" ? thresholds.moderate : 60;

  const strongAreas = [];
  const moderateAreas = [];
  const weakAreas = [];
  const normalizedScores = {};

  const entries =
    skillsObj instanceof Map
      ? Array.from(skillsObj.entries())
      : typeof skillsObj.toObject === "function"
      ? Object.entries(skillsObj.toObject())
      : Object.entries(skillsObj);

  for (const [skill, val] of entries) {
    if (typeof val === "number" && !isNaN(val)) {
      normalizedScores[skill] = val;
      if (val >= strongLimit) {
        strongAreas.push(skill);
      } else if (val >= modLimit) {
        moderateAreas.push(skill);
      } else {
        weakAreas.push(skill);
      }
    }
  }

  return {
    strongAreas,
    moderateAreas,
    weakAreas,
    skills: normalizedScores,
  };
}

/**
 * Validates a dictionary of skill scores.
 * All skill scores must be numbers between 0 and 100.
 *
 * @param {Object} scoresObj
 * @returns {{ isValid: boolean, errors: string[], sanitizedScores: Object }}
 */
function validateSkillScores(scoresObj) {
  if (!scoresObj || typeof scoresObj !== "object" || Array.isArray(scoresObj)) {
    return {
      isValid: false,
      errors: ["Skill assessment scores must be provided as a JSON key-value object."],
      sanitizedScores: {},
    };
  }

  const errors = [];
  const sanitizedScores = {};

  for (const [skill, score] of Object.entries(scoresObj)) {
    if (typeof score !== "number" || isNaN(score) || !Number.isFinite(score)) {
      errors.push(`Score for skill "${skill}" must be a valid number between 0 and 100.`);
    } else if (score < 0 || score > 100) {
      errors.push(`Score for skill "${skill}" must be between 0 and 100. Received: ${score}`);
    } else {
      sanitizedScores[skill] = Math.round((score + Number.EPSILON) * 10) / 10;
    }
  }

  if (Object.keys(sanitizedScores).length === 0 && errors.length === 0) {
    errors.push("At least one skill score must be provided.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedScores,
  };
}

/**
 * Adapter: Extracts normalized interview performance metrics from candidate's Interview document(s).
 * Reuses existing Adaptive Interview Engine metrics:
 * - Technical score, communication score, correctness, relevance, explanation quality, difficulty performance
 *
 * @param {Object|Array} interviews - Interview document or array of interview documents
 * @returns {Object|null} Normalized interview metrics or null if no interviews
 */
function InterviewPerformanceAdapter(interviews) {
  if (!interviews) return null;
  const list = Array.isArray(interviews) ? interviews : [interviews];
  if (list.length === 0) return null;

  // Prioritize completed interviews, then most recent
  const completedList = list.filter((i) => i && i.isComplete);
  const target = completedList.length > 0 ? completedList[0] : list[0];
  if (!target) return null;

  const history = (target.difficultyHistory || []).filter(
    (h) => h && (typeof h.score === "number" || h.skipped)
  );

  const evaluatedHistory = history.filter((h) => typeof h.score === "number" && !h.skipped);

  // Technical Score: average of evaluated questions (or overall score)
  let technicalScore = target.score || 0;
  if (evaluatedHistory.length > 0) {
    const sum = evaluatedHistory.reduce((acc, h) => acc + (h.score || 0), 0);
    technicalScore = Math.round(sum / evaluatedHistory.length);
  }

  // Communication Score: derived from response length, feedback, or baseline technical score
  let communicationScore = technicalScore;
  if (evaluatedHistory.length > 0) {
    const commScores = evaluatedHistory.map((h) => {
      let qComm = h.score || 70;
      const answerLen = (h.candidateAnswer || "").length;
      if (answerLen > 150) qComm = Math.min(100, qComm + 5);
      else if (answerLen < 40) qComm = Math.max(30, qComm - 10);
      return qComm;
    });
    communicationScore = Math.round(commScores.reduce((a, b) => a + b, 0) / commScores.length);
  }

  // Correctness & Relevance & Explanation Quality
  const correctness = technicalScore;
  const relevance =
    target.repeatedAnswersCount > 0
      ? Math.max(50, technicalScore - 10)
      : Math.min(100, technicalScore + 5);
  const explanationQuality = communicationScore;

  // Difficulty Performance: weighted average by tier
  const hardQuestions = evaluatedHistory.filter((h) => (h.difficulty || "").toUpperCase() === "HARD");
  const mediumQuestions = evaluatedHistory.filter((h) => (h.difficulty || "").toUpperCase() === "MEDIUM");
  let difficultyPerformance = technicalScore;
  if (hardQuestions.length > 0) {
    const hardAvg = hardQuestions.reduce((a, h) => a + h.score, 0) / hardQuestions.length;
    difficultyPerformance = Math.round(hardAvg * 1.05);
  } else if (mediumQuestions.length > 0) {
    const medAvg = mediumQuestions.reduce((a, h) => a + h.score, 0) / mediumQuestions.length;
    difficultyPerformance = Math.round(medAvg);
  }
  difficultyPerformance = Math.min(100, Math.max(0, difficultyPerformance));

  // Follow-up performance
  const followUps = evaluatedHistory.filter((h) => h.isFollowUp);
  let followupPerformance = technicalScore;
  if (followUps.length > 0) {
    followupPerformance = Math.round(followUps.reduce((a, h) => a + h.score, 0) / followUps.length);
  }

  const numberOfQuestions = target.totalQuestionsAsked || history.length || 1;
  const questionsAttempted = target.questionsAnswered || evaluatedHistory.length;
  const questionsSkipped = target.questionsSkipped || history.filter((h) => h.skipped).length;

  return {
    technicalScore,
    communicationScore,
    correctness,
    relevance,
    explanationQuality,
    difficultyPerformance,
    numberOfQuestions,
    questionsAttempted,
    questionsSkipped,
    followupPerformance,
    overallInterviewScore: target.score || technicalScore,
  };
}

/**
 * Adapter: Extracts normalized resume data from candidate's Resume document or raw analysis.
 *
 * @param {Object} doc - Resume document or raw analysis
 * @returns {Object|null} Normalized resume data or null
 */
function ResumePerformanceAdapter(doc) {
  if (!doc) return null;

  // Extract resumeScore
  let resumeScore = 0;
  if (typeof doc.resumeScore === "number") {
    resumeScore = doc.resumeScore;
  } else if (doc.resumeQuality && typeof doc.resumeQuality.overallScore === "number") {
    resumeScore = doc.resumeQuality.overallScore;
  }

  // Skills
  let skills = [];
  if (Array.isArray(doc.skills)) {
    skills = doc.skills;
  } else if (Array.isArray(doc.skillsDetected)) {
    skills = doc.skillsDetected;
  } else if (doc.skills && typeof doc.skills === "object") {
    skills = [
      ...(doc.skills.languages || []),
      ...(doc.skills.frontend || []),
      ...(doc.skills.backend || []),
      ...(doc.skills.databases || []),
      ...(doc.skills.cloudDevOps || []),
      ...(doc.skills.toolsAndOthers || []),
    ];
  }
  skills = normalizeSkills(skills);

  // Projects
  let projects = [];
  if (Array.isArray(doc.projects)) {
    projects = doc.projects.map((p) =>
      typeof p === "string" ? p : p.title || p.name || ""
    ).filter(Boolean);
  }

  // Education
  let education = "";
  if (typeof doc.education === "string") {
    education = doc.education;
  } else if (Array.isArray(doc.education) && doc.education.length > 0) {
    const first = doc.education[0];
    education = typeof first === "string" ? first : `${first.degree || "Degree"} - ${first.institution || ""}`;
  } else if (Array.isArray(doc.educationList) && doc.educationList.length > 0) {
    const first = doc.educationList[0];
    education = `${first.degree || "Degree"} - ${first.institution || ""}`;
  }

  // Experience
  let experience = [];
  if (Array.isArray(doc.experience)) {
    experience = doc.experience
      .map((e) =>
        typeof e === "string" ? e : `${e.role || ""} at ${e.company || ""}`.trim()
      )
      .filter(Boolean);
  }

  // Certifications
  let certifications = [];
  if (Array.isArray(doc.certifications)) {
    certifications = doc.certifications.map((c) =>
      typeof c === "string" ? c : c.name || ""
    ).filter(Boolean);
  }

  // Missing Skills
  let missingSkills = [];
  if (Array.isArray(doc.missingSkills)) {
    missingSkills = doc.missingSkills;
  } else if (Array.isArray(doc.missingInformation)) {
    missingSkills = doc.missingInformation;
  }
  missingSkills = normalizeSkills(missingSkills);

  return {
    resumeScore,
    skills,
    projects,
    education,
    experience,
    certifications,
    missingSkills,
  };
}

module.exports = {
  calculateReadinessScore,
  classifyCandidate,
  normalizeSkills,
  detectWeakAreas,
  validateReadinessInput,
  categorizeSkills,
  validateSkillScores,
  InterviewPerformanceAdapter,
  ResumePerformanceAdapter,
};

