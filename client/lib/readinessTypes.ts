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
