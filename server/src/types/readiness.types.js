/**
 * AI Placement Readiness Engine — Type Definitions and JSDoc Schemas
 */

/**
 * @typedef {'fresher' | 'internship_seeker' | 'experienced'} CandidateType
 */

/**
 * @typedef {'Placement Ready' | 'High Potential Candidate' | 'Needs Improvement'} ReadinessCategory
 */

/**
 * @typedef {Object} ReadinessWeights
 * @property {number} resume - Weight for resume score (e.g. 0.25)
 * @property {number} interview - Weight for interview score (e.g. 0.35)
 * @property {number} skill - Weight for skill assessment score (e.g. 0.40)
 */

/**
 * @typedef {Object} ReadinessThresholds
 * @property {number} placementReady - Minimum score for 'Placement Ready' (e.g. 80)
 * @property {number} highPotential - Minimum score for 'High Potential Candidate' (e.g. 65)
 */

/**
 * @typedef {Object} ReadinessAnalyzeRequest
 * @property {number} resumeScore - Score from resume evaluation (0-100)
 * @property {number} interviewScore - Score from adaptive interview (0-100)
 * @property {number} skillScore - Score from technical skill assessments (0-100)
 * @property {number} [communicationScore] - Optional communication score (0-100)
 * @property {string[]} [technicalSkills] - Detected/declared technical skills
 * @property {string[]} [missingSkills] - Candidate's missing or improvement skills
 * @property {CandidateType} [candidateType='fresher'] - Experience level classification
 * @property {Object} [interviewAnalysis] - Optional detailed interview dimensions
 */

/**
 * @typedef {Object} ReadinessScoreBreakdown
 * @property {number} resume
 * @property {number} interview
 * @property {number} skillAssessment
 * @property {number} [communication]
 */

/**
 * @typedef {Object} ReadinessAnalyzeResponseData
 * @property {number} overallScore - Weighted score (0.00 - 100.00)
 * @property {ReadinessCategory} category - Classification tier
 * @property {ReadinessScoreBreakdown} scoreBreakdown
 * @property {Object} weights - Applied weight distribution
 * @property {string[]} weakAreas - Identified areas needing attention
 * @property {string[]} missingSkills - Normalized missing skill list
 * @property {CandidateType} candidateType
 * @property {string[]} [technicalSkills]
 */

/**
 * @typedef {Object} ReadinessAnalyzeResponse
 * @property {boolean} success
 * @property {ReadinessAnalyzeResponseData} [data]
 * @property {{ code: string, message: string, details?: string[] }} [error]
 */

module.exports = {};
