/**
 * AI Placement Readiness Engine — Client TypeScript Definitions
 */

export type CandidateType = 'fresher' | 'internship_seeker' | 'experienced';

export type ReadinessCategory =
  | 'Placement Ready'
  | 'High Potential Candidate'
  | 'Needs Improvement';

export interface ReadinessScoreBreakdown {
  resume: number;
  interview: number;
  skillAssessment: number;
  communication?: number;
}

export interface ReadinessWeights {
  resume: number;
  interview: number;
  skillAssessment: number;
}

export interface ReadinessAnalyzeRequest {
  resumeScore: number;
  interviewScore: number;
  skillScore: number;
  communicationScore?: number;
  technicalSkills?: string[];
  missingSkills?: string[];
  candidateType?: CandidateType;
  interviewAnalysis?: Record<string, number>;
}

export interface ReadinessAnalyzeResponseData {
  overallScore: number;
  category: ReadinessCategory;
  scoreBreakdown: ReadinessScoreBreakdown;
  weights: ReadinessWeights;
  weakAreas: string[];
  missingSkills: string[];
  candidateType: CandidateType;
  technicalSkills?: string[];
}

export interface ReadinessAnalyzeResponse {
  success: boolean;
  data?: ReadinessAnalyzeResponseData;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
}

// ── Day 2 Unified Readiness Types ─────────────────────────────────────

export interface UnifiedResumeData {
  resumeScore: number;
  skills: string[];
  projects: string[];
  education: string;
  experience: string[];
  certifications: string[];
  missingSkills: string[];
}

export interface UnifiedInterviewData {
  technicalScore: number;
  communicationScore: number;
  correctness: number;
  relevance: number;
  explanationQuality: number;
  difficultyPerformance: number;
  numberOfQuestions: number;
  questionsAttempted: number;
  questionsSkipped: number;
  followupPerformance: number;
  overallInterviewScore: number;
}

export interface UnifiedReadinessProfile {
  candidateId: string;
  candidateName?: string;
  candidateType?: CandidateType;
  readinessScore?: number | null;
  category?: ReadinessCategory | null;
  resume: UnifiedResumeData | null;
  interview: UnifiedInterviewData | null;
  skills: Record<string, number> | null;
  weakAreas: string[];
  strongAreas: string[];
  moderateAreas: string[];
  dataAvailability: {
    resume: boolean;
    interview: boolean;
    skills: boolean;
  };
}

export interface UnifiedReadinessResponse {
  success: boolean;
  data?: UnifiedReadinessProfile;
  error?: {
    code: string;
    message: string;
  };
}

// ── Day 3 Personalized Roadmap Types ────────────────────────────────────

export interface RoadmapPriorityItem {
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  recommendation: string;
  topics: string[];
}

export interface RoadmapProjectItem {
  title: string;
  description: string;
  technologies: string[];
}

export interface RoadmapCertificationItem {
  name: string;
  reason: string;
}

export interface RoadmapWeeklyPlanItem {
  week: number;
  focus: string;
  goals: string[];
  actionItems: string[];
}

export interface CandidateRoadmap {
  candidateType: CandidateType;
  readinessScore: number;
  summary: string;
  priorities: RoadmapPriorityItem[];
  projects: RoadmapProjectItem[];
  certifications: RoadmapCertificationItem[];
  interviewTopics: string[];
  weeklyPlan: RoadmapWeeklyPlanItem[];
  generatedAt?: string;
}

export interface RoadmapResponse {
  success: boolean;
  message?: string;
  data?: CandidateRoadmap;
  error?: {
    code: string;
    message: string;
  };
}

