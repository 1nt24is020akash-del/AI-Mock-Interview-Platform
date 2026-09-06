"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  ExternalLink,
  Award,
  Briefcase,
  GraduationCap,
  Code2,
  Sparkles,
  Target,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Layers,
  Check,
  AlertTriangle,
  Mail,
  Phone,
  Globe,
} from "lucide-react";

interface Interview {
  id: string;
  date: string;
  score: number;
  duration: number;
  topic: string;
}

interface CandidateInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  location?: string;
}

interface CandidateLevelInfo {
  level: string;
  reasoning: string;
  yearsOfExperience: number;
}

interface CategorizedSkills {
  languages: string[];
  frontend: string[];
  backend: string[];
  databases: string[];
  cloudDevOps: string[];
  toolsAndOthers: string[];
}

interface ExperienceItem {
  role: string;
  company: string;
  duration: string;
  description: string;
  highlights?: string[];
}

interface EducationItem {
  degree: string;
  institution: string;
  year: string;
  gpa?: string;
}

interface ProjectItem {
  title: string;
  description: string;
  technologies: string[];
  link?: string;
}

interface CertificationItem {
  name: string;
  issuer: string;
  year?: string;
}

interface RecommendedDomain {
  label: string;
  matchScore: number;
  confidence?: number;
  priority: "High" | "Medium" | "Low";
  reason: string;
  matchedSkills?: string[];
}

interface ResumeQualityBreakdown {
  contactCompleteness: number;
  skillsClarity: number;
  experienceOrProjects: number;
  quantifiableImpact: number;
  structureCompleteness: number;
  formattingReadability: number;
}

interface ResumeQualityInfo {
  overallScore: number;
  rating: "Strong" | "Good" | "Needs Improvement";
  breakdown: ResumeQualityBreakdown;
  tips: string[];
}

interface ResumeAnalysis {
  candidate?: CandidateInfo;
  candidateLevel?: CandidateLevelInfo;
  summary: string;
  skills?: CategorizedSkills;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  projects?: ProjectItem[];
  certifications?: CertificationItem[];
  achievements?: string[];
  recommendedDomains: RecommendedDomain[];
  strengths: string[];
  improvements?: string[];
  missingInformation?: string[];
  resumeQuality?: ResumeQualityInfo;
  experienceLevel?: "Junior" | "Mid" | "Senior" | "Fresher";
  skillsDetected?: string[];
}

const INTERVIEW_DOMAINS = [
  {
    label: "JavaScript/Node.js",
    icon: "🟨",
    desc: "ES6+, async, Node runtime",
  },
  { label: "React", icon: "⚛️", desc: "Hooks, state, lifecycle" },
  { label: "Python", icon: "🐍", desc: "OOP, data structures, stdlib" },
  { label: "Data Science", icon: "📊", desc: "ML, pandas, statistics" },
  { label: "DevOps", icon: "⚙️", desc: "CI/CD, Docker, Kubernetes" },
  { label: "System Design", icon: "🏗️", desc: "Scalability, architecture" },
  { label: "Database Design", icon: "🗄️", desc: "SQL, NoSQL, indexing" },
  { label: "General", icon: "🎯", desc: "Behavioural & fundamentals" },
];

function ResumePanel({
  onDomainSelect,
}: {
  onDomainSelect: (d: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "analyzing" | "results">("upload");
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [activeSkillCategory, setActiveSkillCategory] = useState<string>("all");
  const [showAtsBreakdown, setShowAtsBreakdown] = useState(false);

  const analyzingSteps = [
    "Reading & extracting resume document...",
    "Validating document authenticity & structure...",
    "Categorizing technical skills & proficiencies...",
    "Evaluating candidate experience level & background...",
    "Calculating domain match scores & ATS quality score...",
  ];

  const handleFile = (f: File) => {
    const ext = f.name.toLowerCase().split(".").pop();
    const validExtensions = ["pdf", "doc", "docx", "txt"];
    const allowedMime = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream",
    ];

    if (!validExtensions.includes(ext || "") && !allowedMime.includes(f.type)) {
      setError("Please upload a supported resume format: PDF, DOC, DOCX, or TXT.");
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB in size.");
      return;
    }

    setFile(f);
    setError(null);
    setAnalysis(null);
    setStep("upload");
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setStep("analyzing");
    setError(null);
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % analyzingSteps.length;
      setAnalyzingStep(idx);
    }, 1200);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      const { data } = await axiosInstance.post("/api/resume/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnalysis(data.analysis);
      setStep("results");
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to analyze this document. Please upload a valid resume containing sufficient information about your skills, education, projects, experience, or qualifications."
      );
      setStep("upload");
    } finally {
      clearInterval(interval);
    }
  };

  const reset = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
    setStep("upload");
  };

  const getCandidateLevelBadgeClass = (level?: string) => {
    if (!level) return "bg-primary/10 text-primary border-primary/20";
    if (level.includes("Senior") || level.includes("Lead")) {
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
    }
    if (level.includes("Mid")) {
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
    }
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  };

  const getAtsScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 stroke-emerald-500";
    if (score >= 65) return "text-blue-500 stroke-blue-500";
    return "text-amber-500 stroke-amber-500";
  };

  return (
    <Card className="border border-border/50 overflow-hidden shadow-sm">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-card/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center text-xl shadow-inner">
            📄
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                AI Resume Intelligence & Analysis
              </h2>
              <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full border border-primary/20">
                100% Dynamic ATS
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Extract real skills, experience, projects & unlock tailored interview rounds
            </p>
          </div>
        </div>
        {step === "results" && (
          <button
            onClick={reset}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground border border-border/60 hover:border-primary/40 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Upload New Resume
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Upload Step */}
        {step === "upload" && (
          <div className="space-y-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                dragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : file
                    ? "border-primary/50 bg-primary/[0.02]"
                    : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />

              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl shadow-sm">
                    📋
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground truncate max-w-[280px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB · Ready to analyze
                    </p>
                    <span className="inline-block mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-medium">
                      ✓ Document Attached
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reset();
                    }}
                    className="ml-2 w-8 h-8 rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-xs text-muted-foreground transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl shadow-sm">
                    ☁️
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Drop your resume here, or{" "}
                      <span className="text-primary underline cursor-pointer">browse file</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports PDF, DOCX, DOC, TXT (Maximum size: 10 MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed flex items-start gap-3">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold">Validation Alert</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {!file && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    icon: "🔍",
                    label: "Dynamic Skill Extraction",
                    desc: "Languages, frontend, backend, databases, cloud",
                  },
                  {
                    icon: "📊",
                    label: "Candidate Level Detection",
                    desc: "Fresher, Junior, Mid, or Senior with reasoning",
                  },
                  {
                    icon: "🎯",
                    label: "Domain Match Scoring",
                    desc: "Evidence-grounded fit for 8 interview areas",
                  },
                  {
                    icon: "🛡️",
                    label: "ATS Quality & Gaps",
                    desc: "Score breakdown, missing info & improvement tips",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-3.5 rounded-xl bg-muted/20 border border-border/40 flex flex-col justify-between"
                  >
                    <span className="text-xl mb-1.5">{item.icon}</span>
                    <p className="text-xs font-bold text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={!file}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold py-6 text-sm shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4 mr-2" />
              Analyze Resume & Extract Profile
            </Button>
          </div>
        )}

        {/* Analyzing Step */}
        {step === "analyzing" && (
          <div className="py-14 flex flex-col items-center gap-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-primary/15" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-3xl">
                🤖
              </div>
            </div>
            <div className="text-center space-y-1.5 max-w-sm">
              <p className="text-base font-bold text-foreground">
                Analyzing Your Resume
              </p>
              <p className="text-xs text-primary font-medium transition-all duration-300">
                {analyzingSteps[analyzingStep]}
              </p>
            </div>
            <div className="w-72 bg-muted rounded-full h-2 overflow-hidden border border-border/50">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full animate-pulse transition-all duration-500"
                style={{ width: `${((analyzingStep + 1) / analyzingSteps.length) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Deep parsing sections, technical stack, metrics, and domain matches...
            </p>
          </div>
        )}

        {/* Results Step */}
        {step === "results" && analysis && (
          <div className="space-y-6">
            {/* 1. Candidate Overview Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/[0.04] via-accent/[0.02] to-card border border-border/60 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xl font-black text-foreground">
                      {analysis.candidate?.name || "Candidate Profile"}
                    </h3>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${getCandidateLevelBadgeClass(
                        analysis.candidateLevel?.level || analysis.experienceLevel
                      )}`}
                    >
                      {analysis.candidateLevel?.level || `${analysis.experienceLevel || "Junior"} Level`}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-primary mt-1">
                    {analysis.candidate?.title || "Software Engineering Candidate"}
                  </p>

                  {/* Contact Links & Badges */}
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                    {analysis.candidate?.email && (
                      <span className="flex items-center gap-1.5 bg-muted/40 border border-border/50 px-2.5 py-1 rounded-lg">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        {analysis.candidate.email}
                      </span>
                    )}
                    {analysis.candidate?.phone && (
                      <span className="flex items-center gap-1.5 bg-muted/40 border border-border/50 px-2.5 py-1 rounded-lg">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        {analysis.candidate.phone}
                      </span>
                    )}
                    {analysis.candidate?.github && (
                      <a
                        href={
                          analysis.candidate.github.startsWith("http")
                            ? analysis.candidate.github
                            : `https://${analysis.candidate.github}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted border border-border/50 px-2.5 py-1 rounded-lg text-foreground transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 text-primary fill-current" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                        GitHub
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </a>
                    )}
                    {analysis.candidate?.linkedin && (
                      <a
                        href={
                          analysis.candidate.linkedin.startsWith("http")
                            ? analysis.candidate.linkedin
                            : `https://${analysis.candidate.linkedin}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted border border-border/50 px-2.5 py-1 rounded-lg text-foreground transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 text-blue-500 fill-current" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        LinkedIn
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </a>
                    )}
                    {analysis.candidate?.portfolio && (
                      <a
                        href={
                          analysis.candidate.portfolio.startsWith("http")
                            ? analysis.candidate.portfolio
                            : `https://${analysis.candidate.portfolio}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted border border-border/50 px-2.5 py-1 rounded-lg text-foreground transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5 text-emerald-500" />
                        Portfolio
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>

                {/* ATS Resume Quality Score Card */}
                {analysis.resumeQuality && (
                  <div className="flex-shrink-0 p-4 rounded-xl bg-card border border-border/60 shadow-sm flex flex-col items-center text-center min-w-[170px]">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      ATS Quality Score
                    </span>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className={`text-3xl font-black ${getAtsScoreColor(analysis.resumeQuality.overallScore)}`}>
                        {analysis.resumeQuality.overallScore}
                      </span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        analysis.resumeQuality.overallScore >= 80
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : analysis.resumeQuality.overallScore >= 65
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}
                    >
                      {analysis.resumeQuality.rating || "Evaluated"}
                    </span>
                    <button
                      onClick={() => setShowAtsBreakdown(!showAtsBreakdown)}
                      className="mt-2 text-[10px] text-primary hover:underline flex items-center gap-1"
                    >
                      {showAtsBreakdown ? "Hide Details" : "View Breakdown"}
                      {showAtsBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Expandable ATS Score Breakdown */}
              {showAtsBreakdown && analysis.resumeQuality?.breakdown && (
                <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Contact Info", score: analysis.resumeQuality.breakdown.contactCompleteness },
                    { label: "Skills Clarity", score: analysis.resumeQuality.breakdown.skillsClarity },
                    { label: "Experience / Projects", score: analysis.resumeQuality.breakdown.experienceOrProjects },
                    { label: "Quantifiable Impact", score: analysis.resumeQuality.breakdown.quantifiableImpact },
                    { label: "Section Structure", score: analysis.resumeQuality.breakdown.structureCompleteness },
                    { label: "Readability", score: analysis.resumeQuality.breakdown.formattingReadability },
                  ].map((m) => (
                    <div key={m.label} className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                      <div className="flex justify-between text-[11px] mb-1 font-medium">
                        <span className="text-muted-foreground">{m.label}</span>
                        <span className="font-bold text-foreground">{m.score}%</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-1 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${m.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Candidate Level Reasoning & Professional Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <p className="text-xs font-bold text-foreground">Candidate Level Reasoning</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {analysis.candidateLevel?.reasoning ||
                      `Candidate evaluated as ${analysis.experienceLevel || "Junior"} developer based on skills and background.`}
                  </p>
                </div>
                {analysis.candidateLevel && analysis.candidateLevel.yearsOfExperience > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Detected Tenure:</span>
                    <span className="font-bold text-foreground">
                      ~{analysis.candidateLevel.yearsOfExperience}+ Years
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-card border border-border/60 md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-xs font-bold text-foreground">Professional Summary</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            </div>

            {/* 3. Categorized Skills Matrix */}
            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-bold text-foreground">
                    Extracted Technical Skills & Stacks
                  </h4>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {["all", "languages", "frontend", "backend", "databases", "cloudDevOps", "toolsAndOthers"].map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveSkillCategory(cat)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          activeSkillCategory === cat
                            ? "bg-primary text-primary-foreground font-bold"
                            : "bg-muted/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat === "all"
                          ? "All Skills"
                          : cat === "languages"
                          ? "Languages"
                          : cat === "frontend"
                          ? "Frontend"
                          : cat === "backend"
                          ? "Backend"
                          : cat === "databases"
                          ? "Databases"
                          : cat === "cloudDevOps"
                          ? "Cloud / DevOps"
                          : "Tools"}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Render Categorized Skills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Languages */}
                {(activeSkillCategory === "all" || activeSkillCategory === "languages") &&
                  analysis.skills?.languages &&
                  analysis.skills.languages.length > 0 && (
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                      <p className="text-[11px] font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <span>💻</span> Programming Languages ({analysis.skills.languages.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.skills.languages.map((s) => (
                          <span
                            key={s}
                            className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Frontend */}
                {(activeSkillCategory === "all" || activeSkillCategory === "frontend") &&
                  analysis.skills?.frontend &&
                  analysis.skills.frontend.length > 0 && (
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                      <p className="text-[11px] font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <span>🎨</span> Frontend Engineering ({analysis.skills.frontend.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.skills.frontend.map((s) => (
                          <span
                            key={s}
                            className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Backend */}
                {(activeSkillCategory === "all" || activeSkillCategory === "backend") &&
                  analysis.skills?.backend &&
                  analysis.skills.backend.length > 0 && (
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                      <p className="text-[11px] font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <span>⚙️</span> Backend & APIs ({analysis.skills.backend.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.skills.backend.map((s) => (
                          <span
                            key={s}
                            className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Databases */}
                {(activeSkillCategory === "all" || activeSkillCategory === "databases") &&
                  analysis.skills?.databases &&
                  analysis.skills.databases.length > 0 && (
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                      <p className="text-[11px] font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <span>🗄️</span> Databases & Storage ({analysis.skills.databases.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.skills.databases.map((s) => (
                          <span
                            key={s}
                            className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Cloud & DevOps */}
                {(activeSkillCategory === "all" || activeSkillCategory === "cloudDevOps") &&
                  analysis.skills?.cloudDevOps &&
                  analysis.skills.cloudDevOps.length > 0 && (
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                      <p className="text-[11px] font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <span>☁️</span> Cloud & DevOps ({analysis.skills.cloudDevOps.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.skills.cloudDevOps.map((s) => (
                          <span
                            key={s}
                            className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Tools & Others */}
                {(activeSkillCategory === "all" || activeSkillCategory === "toolsAndOthers") &&
                  analysis.skills?.toolsAndOthers &&
                  analysis.skills.toolsAndOthers.length > 0 && (
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                      <p className="text-[11px] font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <span>🛠️</span> Developer Tools & Others ({analysis.skills.toolsAndOthers.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.skills.toolsAndOthers.map((s) => (
                          <span
                            key={s}
                            className="text-xs bg-muted text-foreground border border-border/60 px-2 py-0.5 rounded-md font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Fallback if flat skillsDetected used */}
                {(!analysis.skills ||
                  Object.values(analysis.skills).every((arr) => !arr || arr.length === 0)) &&
                  analysis.skillsDetected &&
                  analysis.skillsDetected.length > 0 && (
                    <div className="col-span-full p-3 rounded-xl bg-muted/20 border border-border/40">
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.skillsDetected.map((s) => (
                          <span
                            key={s}
                            className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-md font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* 4. Recommended Interview Domains with Match Scores & Direct Launch */}
            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-bold text-foreground">
                    Recommended Interview Domains
                  </h4>
                </div>
                <span className="text-xs text-muted-foreground">
                  Click any domain to start a tailored interview session
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.recommendedDomains.map((rec, i) => {
                  const meta = INTERVIEW_DOMAINS.find((d) => d.label === rec.label);
                  const score = rec.matchScore || rec.confidence || 75;

                  return (
                    <div
                      key={rec.label}
                      className="p-4 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-primary/[0.02] transition-all flex flex-col justify-between group space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{meta?.icon || "🎯"}</span>
                            <div>
                              <p className="text-sm font-bold text-foreground">{rec.label}</p>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  rec.priority === "High" || i === 0
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                }`}
                              >
                                {rec.priority || (i === 0 ? "High" : "Medium")} Priority
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-primary">{score}%</p>
                            <span className="text-[10px] text-muted-foreground">Match</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-border/60 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                            style={{ width: `${score}%` }}
                          />
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {rec.reason}
                        </p>

                        {rec.matchedSkills && rec.matchedSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {rec.matchedSkills.map((ms) => (
                              <span
                                key={ms}
                                className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded"
                              >
                                {ms}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => onDomainSelect(rec.label)}
                        className="w-full mt-2 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-xs py-2 border border-primary/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Start {rec.label} Interview
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Projects & Experience Section */}
            {((analysis.projects && analysis.projects.length > 0) ||
              (analysis.experience && analysis.experience.length > 0)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Projects */}
                {analysis.projects && analysis.projects.length > 0 && (
                  <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                      <Briefcase className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-bold text-foreground">
                        Key Projects Extracted ({analysis.projects.length})
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {analysis.projects.map((proj, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1.5"
                        >
                          <p className="text-xs font-bold text-foreground">{proj.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {proj.description}
                          </p>
                          {proj.technologies && proj.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {proj.technologies.map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience & Education */}
                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm space-y-4">
                  {/* Experience */}
                  {analysis.experience && analysis.experience.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                        <Award className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-bold text-foreground">Experience Analysis</h4>
                      </div>
                      <div className="space-y-3">
                        {analysis.experience.map((exp, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-foreground">{exp.role}</p>
                              <span className="text-[10px] text-muted-foreground">{exp.duration}</span>
                            </div>
                            <p className="text-[11px] text-primary font-medium">{exp.company}</p>
                            {exp.description && (
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                {exp.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {analysis.education && analysis.education.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-bold text-foreground">Education</h4>
                      </div>
                      {analysis.education.map((edu, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-foreground">{edu.degree}</p>
                            <p className="text-muted-foreground text-[11px]">{edu.institution}</p>
                          </div>
                          <span className="text-primary font-semibold text-[11px]">{edu.year}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. Strengths & Areas for Improvement (Side-by-Side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <h4 className="text-sm font-bold">Identified Strengths</h4>
                </div>
                <ul className="space-y-2">
                  {analysis.strengths.map((s, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div className="p-5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <h4 className="text-sm font-bold">Actionable Improvements</h4>
                </div>
                <ul className="space-y-2">
                  {(analysis.improvements && analysis.improvements.length > 0
                    ? analysis.improvements
                    : [
                        "Incorporate quantifiable business impact metrics (e.g. % performance increase).",
                        "Ensure GitHub repository links are provided for public code evaluation.",
                        "Highlight automated testing and cloud deployment practices.",
                      ]
                  ).map((imp, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 7. Missing Information & ATS Action Checklist */}
            {analysis.missingInformation && analysis.missingInformation.length > 0 && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <div className="flex items-center gap-2 mb-2 text-foreground font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>ATS Optimization Checklist (Detected Gaps to Improve Rank)</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {analysis.missingInformation.map((gap, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-card border border-border/60 px-3 py-1 rounded-lg text-muted-foreground flex items-center gap-1.5"
                    >
                      <span className="text-amber-500">⚠</span>
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
const page = () => {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const [interviews, setIntervies] = useState<Interview[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [ShowDomainSelector, setShowDomainSelector] = useState(false);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);
  const [filterDomain, setFilterDomain] = useState<String>("All");
  const [activeTab, setActiveTab] = useState<"history" | "resume">("history");
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (isLoggedIn) fetchInterviews();
  }, [isLoggedIn]);
  const fetchInterviews = async () => {
    try {
      setDataLoading(true);
      const { data } = await axiosInstance.get("/api/interviews");
      setIntervies(data.interviews || []);
    } catch (error) {
      console.error("Failed to fetch interviews:", error);
    } finally {
      setDataLoading(false);
    }
  };
  const viewSessionDetails = async (id: string) => {
    try {
      setLoadingDetails(true);
      const { data } = await axiosInstance.get(`/api/interviews/${id}`);
      setSelectedSession(data.interview);
    } catch (error) {
      console.error("Failed to load interview details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };
  const handleSelectDomain = (domain: string) => {
    router.push(`/interview?domain=${encodeURIComponent(domain)}`);
  };
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }
  if (!isLoggedIn) return null;

  const avgScore = interviews.length
    ? Math.round(
        interviews.reduce((s, i) => s + i.score, 0) / interviews.length,
      )
    : null;
  const totalMinutes = interviews.reduce((s, i) => s + i.duration, 0);
  const bestScore = interviews.length
    ? Math.max(...interviews.map((i) => i.score))
    : null;
  const recentScores = [...interviews].slice(-6).map((i) => i.score);
  const uniqueDomains = [
    "All",
    ...Array.from(new Set(interviews.map((i) => i.topic))),
  ];
  const filtered =
    filterDomain === "All"
      ? interviews
      : interviews.filter((i) => i.topic === filterDomain);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        {/* ── Header ── */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">
              👋 Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-foreground">
              Your Dashboard
            </h1>
          </div>
          <Button
            size="lg"
            onClick={() => setShowDomainSelector(true)}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-full px-6 font-semibold shadow-md hover:shadow-lg transition-all self-start sm:self-auto"
          >
            ⚡ New Interview
          </Button>
        </section>
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Sessions",
              value: interviews.length.toString(),
              sub: `${interviews.length} session${interviews.length !== 1 ? "s" : ""}`,
              icon: "📋",
            },
            {
              label: "Average Score",
              value: avgScore !== null ? `${avgScore}%` : "—",
              sub:
                avgScore !== null
                  ? avgScore >= 80
                    ? "Excellent 🔥"
                    : avgScore >= 60
                      ? "Good 👍"
                      : "Keep going 💪"
                  : "No data yet",
              icon: "📊",
              accent: true,
            },
            {
              label: "Best Score",
              value: bestScore !== null ? `${bestScore}%` : "—",
              sub: bestScore !== null ? "Personal best" : "No data yet",
              icon: "🏆",
            },
            {
              label: "Practice Time",
              value:
                totalMinutes >= 60
                  ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
                  : `${totalMinutes}m`,
              sub: "Total invested",
              icon: "⏱",
            },
          ].map((stat, i) => (
            <Card
              key={i}
              className={`p-5 border ${
                (stat as any).accent
                  ? "border-primary/30 bg-primary/[0.03]"
                  : "border-border/50"
              } hover:border-primary/40 transition-colors`}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium">
                  {stat.label}
                </p>
                <span className="text-lg">{stat.icon}</span>
              </div>
              <p
                className={`text-2xl font-black mb-0.5 ${
                  (stat as any).accent
                    ? "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                    : "text-foreground"
                }`}
              >
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </Card>
          ))}
        </section>
        {recentScores.length >= 2 && (
          <Card className="p-5 border border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground mb-0.5">
                  Score Trend
                </p>
                <p className="text-xs text-muted-foreground">
                  Last {recentScores.length} sessions
                </p>
              </div>
              <div className="flex items-end gap-3">
                <MiniSparkline scores={recentScores} />
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Latest</p>
                  <p className="text-sm font-bold text-primary">
                    {recentScores[recentScores.length - 1]}%
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
        <section>
          <div className="flex items-center gap-1 mb-6 border-b border-border/50">
            {(["history", "resume"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "history"
                  ? "📋 Interview History"
                  : "📄 Resume Analysis"}
              </button>
            ))}
          </div>
          {activeTab === "history" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <p className="text-sm text-muted-foreground">
                  Your recent practice sessions
                </p>
                {uniqueDomains.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {uniqueDomains.map((d) => (
                      <button
                        key={d}
                        onClick={() => setFilterDomain(d)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                          filterDomain === d
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {dataLoading ? (
                <div>
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-5 border border-border/50">
                      <div className="animate-pulse flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-muted flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                        <div className="w-16 h-8 bg-muted rounded-full" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : filtered.length === 0 && interviews.length === 0 ? (
                <Card className="p-12 text-center border-2 border-dashed border-border">
                  <div className="text-5xl mb-4">📝</div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    No sessions yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                    Start a practice interview or upload your resume for
                    personalised domain suggestions.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      onClick={() => setShowDomainSelector(true)}
                      className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-full px-5 text-sm"
                    >
                      ⚡ Start Interview
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("resume")}
                      className="rounded-full px-5 text-sm"
                    >
                      📄 Analyse Resume
                    </Button>
                  </div>
                </Card>
              ) : filtered.length === 0 ? (
                <Card className="p-8 text-center border border-border/50">
                  <p className="text-muted-foreground text-sm">
                    No sessions for "{filterDomain}"
                  </p>
                </Card>
              ) : (
                <div>
                  {[...filtered].reverse().map((interview) => {
                    const meta = INTERVIEW_DOMAINS.find(
                      (d) => d.label === interview.topic,
                    );
                    return (
                      <Card
                        key={interview.id}
                        className="p-5 border border-border/50 hover:border-primary/40 hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-muted/50 border border-border/60 flex items-center justify-center text-xl flex-shrink-0 group-hover:border-primary/30 transition-colors">
                            {meta?.icon || "🎯"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-foreground text-sm truncate">
                                {interview.topic}
                              </p>
                              <ScoreBadge score={interview.score} />
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                              <span>
                                📅{" "}
                                {new Date(interview.date).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                              <span>⏱ {interview.duration} min</span>
                            </div>
                          </div>
                          <div className="hidden md:flex flex-col items-end gap-1 w-28">
                            <p className="text-xs text-muted-foreground">
                              Score
                            </p>
                            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                                style={{ width: `${interview.score}%` }}
                              />
                            </div>
                            <p className="text-xs font-semibold text-foreground">
                              {interview.score}%
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={loadingDetails}
                              onClick={() => viewSessionDetails(interview.id)}
                              className="rounded-full text-xs border-border/60 hidden sm:flex"
                            >
                              Details
                            </Button>
                            <Button
                              size="sm"
                              className="rounded-full text-xs bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
                              onClick={() =>
                                handleSelectDomain(interview.topic)
                              }
                            >
                              Retake
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {activeTab === "resume" && (
            <ResumePanel onDomainSelect={handleSelectDomain} />
          )}
        </section>
      </div>
      {ShowDomainSelector && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDomainSelector(false);
          }}
        >
          <Card className="w-full max-w-xl p-6 border border-border shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-foreground mb-1">
                  Pick a Domain
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose what you want to practice today
                </p>
              </div>
              <button
                onClick={() => setShowDomainSelector(false)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
              {INTERVIEW_DOMAINS.map((domain) => (
                <button
                  key={domain.label}
                  onMouseEnter={() => setHoveredDomain(domain.label)}
                  onMouseLeave={() => setHoveredDomain(null)}
                  onClick={() => {
                    setShowDomainSelector(false);
                    handleSelectDomain(domain.label);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 ${
                    hoveredDomain === domain.label
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/60 hover:border-primary/40"
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{domain.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {domain.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {domain.desc}
                    </p>
                  </div>
                  <span
                    className={`ml-auto text-primary transition-opacity text-xs ${hoveredDomain === domain.label ? "opacity-100" : "opacity-0"}`}
                  >
                    →
                  </span>
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              className="w-full rounded-xl text-muted-foreground hover:text-foreground text-sm"
              onClick={() => setShowDomainSelector(false)}
            >
              Cancel
            </Button>
          </Card>
        </div>
      )}

      {selectedSession && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSession(null);
          }}
        >
          <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col p-6 border border-border shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl">
                  {INTERVIEW_DOMAINS.find((d) => d.label === selectedSession.domain)?.icon || "🎯"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {selectedSession.domain} Interview Details
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Completed on{" "}
                    {new Date(selectedSession.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {selectedSession.duration} min duration
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div className="flex items-center justify-between p-4 bg-muted/30 border border-border/50 rounded-xl">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Final Performance Score</p>
                  <p className="text-2xl font-black text-primary">{selectedSession.score}%</p>
                </div>
                <ScoreBadge score={selectedSession.score} />
              </div>

              {selectedSession.feedback && (
                <div className="p-4 bg-primary/[0.03] border border-primary/20 rounded-xl">
                  <p className="text-xs font-bold text-foreground mb-1">Overall Feedback</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedSession.feedback}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-foreground mb-3">Interview Transcript</p>
                <div className="space-y-3">
                  {selectedSession.messages?.map((msg: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl text-xs leading-relaxed border ${
                        msg.role === "user"
                          ? "bg-primary/5 border-primary/20 ml-6"
                          : "bg-muted/40 border-border/60 mr-6"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5 font-semibold">
                        <span>{msg.role === "user" ? "👤 You" : "🤖 AI Interviewer"}</span>
                        {msg.timestamp && (
                          <span className="text-[10px] text-muted-foreground font-normal ml-auto">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <p className="text-foreground whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setSelectedSession(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                className="rounded-full text-xs bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold"
                onClick={() => {
                  const dom = selectedSession.domain;
                  setSelectedSession(null);
                  handleSelectDomain(dom);
                }}
              >
                Retake Interview →
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400"
      : score >= 60
        ? "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
        : "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-bold ${color}`}
    >
      {score >= 80 ? "🟢" : score >= 60 ? "🔵" : "🟠"} {score}%
    </span>
  );
}
function MiniSparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const max = Math.max(...scores, 100);
  const min = Math.min(...scores, 0);
  const range = max - min || 1;
  const w = 80,
    h = 28;
  const pts = scores
    .map(
      (s, i) =>
        `${(i / (scores.length - 1)) * w},${h - ((s - min) / range) * h}`,
    )
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
    >
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {scores.map((s, i) => {
        const x = (i / (scores.length - 1)) * w;
        const y = h - ((s - min) / range) * h;
        return (
          <circle key={i} cx={x} cy={y} r="2.5" className="fill-primary" />
        );
      })}
    </svg>
  );
}
export default page;
