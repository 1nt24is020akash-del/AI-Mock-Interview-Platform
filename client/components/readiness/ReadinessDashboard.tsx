"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  TrendingUp,
  RefreshCw,
  XCircle,
  HelpCircle,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Check,
  Code2,
  Calendar,
  Layers,
  GraduationCap,
  Target,
  Clock,
  Compass,
  Lightbulb,
  Rocket,
  Zap,
} from "lucide-react";
import {
  UnifiedReadinessProfile,
  UnifiedReadinessResponse,
  CandidateRoadmap,
  RoadmapResponse,
  CandidateType,
} from "@/lib/readinessTypes";

interface ReadinessDashboardProps {
  candidateId?: string;
  onNavigateToInterview?: () => void;
  onNavigateToResume?: () => void;
}

const DEFAULT_DOMAINS = [
  "DSA",
  "DBMS",
  "OOP",
  "OS",
  "CN",
  "Programming",
  "Cloud",
  "AI/ML",
];

const CANDIDATE_TYPE_CONFIG: Record<
  CandidateType,
  { label: string; icon: any; description: string; focus: string }
> = {
  fresher: {
    label: "Fresher",
    icon: GraduationCap,
    description: "Entry-level engineering & campus hiring.",
    focus: "Core CS Fundamentals (DSA, DBMS, OS, OOP) & Foundation Projects",
  },
  internship_seeker: {
    label: "Internship Seeker",
    icon: Briefcase,
    description: "Pre-placement & software engineering internships.",
    focus: "Practical Coding, Clean REST APIs, Git Workflows & Live Portfolio",
  },
  experienced: {
    label: "Experienced",
    icon: Rocket,
    description: "Mid/Senior roles & architectural transitions.",
    focus: "High-Scale Distributed System Design, Microservices & Scalability",
  },
};

export default function ReadinessDashboard({
  candidateId,
  onNavigateToInterview,
  onNavigateToResume,
}: ReadinessDashboardProps) {
  const [profile, setProfile] = useState<UnifiedReadinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Skill Assessment editing state
  const [editingSkills, setEditingSkills] = useState(false);
  const [skillInputs, setSkillInputs] = useState<Record<string, number>>({});
  const [savingSkills, setSavingSkills] = useState(false);
  const [skillMessage, setSkillMessage] = useState<string | null>(null);

  // Candidate Type state
  const [candidateType, setCandidateType] = useState<CandidateType>("fresher");
  const [updatingType, setUpdatingType] = useState(false);

  // Roadmap state
  const [roadmap, setRoadmap] = useState<CandidateRoadmap | null>(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);

  const fetchReadinessData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = candidateId
        ? `/api/readiness/candidate/${candidateId}`
        : `/api/readiness/candidate`;
      const res = await axiosInstance.get<UnifiedReadinessResponse>(url);
      if (res.data?.success && res.data.data) {
        setProfile(res.data.data);
        if (res.data.data.candidateType) {
          setCandidateType(res.data.data.candidateType);
        }
        if (res.data.data.skills) {
          setSkillInputs(res.data.data.skills);
        } else {
          // Initialize defaults for editing
          const initial: Record<string, number> = {};
          DEFAULT_DOMAINS.forEach((d) => (initial[d] = 70));
          setSkillInputs(initial);
        }
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "Failed to load placement readiness profile. Please ensure you are logged in."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRoadmap = async () => {
    setLoadingRoadmap(true);
    try {
      const url = candidateId
        ? `/api/readiness/roadmap/${candidateId}`
        : `/api/readiness/roadmap`;
      const res = await axiosInstance.get<RoadmapResponse>(url);
      if (res.data?.success && res.data.data) {
        setRoadmap(res.data.data);
      }
    } catch {
      // Roadmap not generated yet is expected
    } finally {
      setLoadingRoadmap(false);
    }
  };

  useEffect(() => {
    fetchReadinessData();
    fetchRoadmap();
  }, [candidateId]);

  const handleCandidateTypeChange = async (newType: CandidateType) => {
    if (newType === candidateType) return;
    setCandidateType(newType);
    setUpdatingType(true);
    try {
      await axiosInstance.post("/api/readiness/candidate-type", {
        candidateId: candidateId || profile?.candidateId,
        candidateType: newType,
      });
      // Regenerate roadmap tailored to new candidate tier
      await handleGenerateRoadmap(newType);
    } catch (err: any) {
      console.warn("Could not save candidate type:", err);
    } finally {
      setUpdatingType(false);
    }
  };

  const handleGenerateRoadmap = async (overrideType?: CandidateType) => {
    setGeneratingRoadmap(true);
    setRoadmapError(null);
    try {
      const activeType = overrideType || candidateType;
      const res = await axiosInstance.post<RoadmapResponse>(
        "/api/readiness/roadmap/generate",
        {
          candidateId: candidateId || profile?.candidateId,
          candidateType: activeType,
          readinessScore: profile?.readinessScore ?? 65,
          weakAreas: profile?.weakAreas ?? [],
          missingSkills: profile?.resume?.missingSkills ?? [],
          interviewPerformance: profile?.interview ?? {},
          skillScores: profile?.skills ?? {},
        }
      );
      if (res.data?.success && res.data.data) {
        setRoadmap(res.data.data);
      }
    } catch (err: any) {
      setRoadmapError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "Failed to generate career roadmap. Please try again."
      );
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  const handleSaveSkills = async () => {
    setSavingSkills(true);
    setSkillMessage(null);
    try {
      await axiosInstance.post("/api/readiness/skills", {
        candidateId: candidateId || profile?.candidateId,
        scores: skillInputs,
      });
      setSkillMessage("Skill assessment updated successfully!");
      setEditingSkills(false);
      await fetchReadinessData();
    } catch (err: any) {
      setSkillMessage(
        err?.response?.data?.error?.message || "Failed to update skills."
      );
    } finally {
      setSavingSkills(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 60) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-rose-400 bg-rose-500/10 border-rose-500/30";
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getPriorityBadge = (priority: "High" | "Medium" | "Low") => {
    if (priority === "High") {
      return "bg-rose-500/10 text-rose-300 border-rose-500/30";
    }
    if (priority === "Medium") {
      return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    }
    return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
  };

  if (loading) {
    return (
      <Card className="p-12 text-center border border-border/60 bg-zinc-950/40">
        <RefreshCw className="w-8 h-8 mx-auto text-primary animate-spin mb-4" />
        <h3 className="text-base font-semibold text-foreground">
          Aggregating Placement Readiness Data...
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Connecting Resume Analysis, Adaptive Interview Metrics, and Skill Assessments
        </p>
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card className="p-8 text-center border border-rose-500/30 bg-rose-500/5">
        <AlertTriangle className="w-8 h-8 mx-auto text-rose-400 mb-3" />
        <h3 className="text-base font-semibold text-foreground">
          Unable to Load Readiness Data
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          {error || "No placement readiness profile could be found."}
        </p>
        <Button
          onClick={fetchReadinessData}
          size="sm"
          variant="outline"
          className="mt-4 rounded-full text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
        </Button>
      </Card>
    );
  }

  const {
    resume,
    interview,
    skills,
    weakAreas,
    strongAreas,
    moderateAreas,
    dataAvailability,
    readinessScore,
    category,
    candidateName,
  } = profile;

  return (
    <div className="space-y-6">
      {/* ── 1. HEADER & DATA AVAILABILITY BADGES ── */}
      <Card className="p-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> AI Placement Readiness Engine (Unified Data)
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Candidate Readiness Hub
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Candidate: <span className="text-zinc-200 font-bold">{candidateName || "Candidate"}</span> • Target Profile:{" "}
              <span className="text-primary font-semibold capitalize">{candidateType.replace("_", " ")}</span>
              {readinessScore !== null && readinessScore !== undefined && (
                <> • Readiness Score: <span className="text-emerald-400 font-bold">{readinessScore}%</span> ({category})</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                fetchReadinessData();
                fetchRoadmap();
              }}
              size="sm"
              variant="outline"
              className="rounded-xl text-xs bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        {/* Candidate Target Level Selector */}
        <div className="space-y-2 pt-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-primary" /> Target Candidate Role & Preparation Track
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(Object.keys(CANDIDATE_TYPE_CONFIG) as CandidateType[]).map((type) => {
              const cfg = CANDIDATE_TYPE_CONFIG[type];
              const Icon = cfg.icon;
              const isSelected = candidateType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleCandidateTypeChange(type)}
                  disabled={updatingType || generatingRoadmap}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-primary/15 border-primary text-white shadow-lg shadow-primary/10 ring-1 ring-primary/40"
                      : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-zinc-500"}`} />
                    <span className="text-xs font-bold">{cfg.label}</span>
                    {isSelected && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-snug">{cfg.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Source Availability Tracker */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-3 rounded-xl border flex items-center justify-between ${dataAvailability.resume ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-200" : "bg-zinc-950/60 border-zinc-800 text-zinc-500"}`}>
            <div className="flex items-center gap-2 text-xs">
              <FileText className={`w-4 h-4 ${dataAvailability.resume ? "text-emerald-400" : "text-zinc-600"}`} />
              <span className="font-semibold">Resume Analysis</span>
            </div>
            {dataAvailability.resume ? (
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500">Not Uploaded</span>
            )}
          </div>

          <div className={`p-3 rounded-xl border flex items-center justify-between ${dataAvailability.interview ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-200" : "bg-zinc-950/60 border-zinc-800 text-zinc-500"}`}>
            <div className="flex items-center gap-2 text-xs">
              <Award className={`w-4 h-4 ${dataAvailability.interview ? "text-emerald-400" : "text-zinc-600"}`} />
              <span className="font-semibold">Adaptive Interview</span>
            </div>
            {dataAvailability.interview ? (
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500">Incomplete</span>
            )}
          </div>

          <div className={`p-3 rounded-xl border flex items-center justify-between ${dataAvailability.skills ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-200" : "bg-zinc-950/60 border-zinc-800 text-zinc-500"}`}>
            <div className="flex items-center gap-2 text-xs">
              <Code2 className={`w-4 h-4 ${dataAvailability.skills ? "text-emerald-400" : "text-zinc-600"}`} />
              <span className="font-semibold">Skill Assessment</span>
            </div>
            {dataAvailability.skills ? (
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500">Pending</span>
            )}
          </div>
        </div>
      </Card>

      {/* ── 2. THREE UNIFIED SOURCES GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SOURCE 1: RESUME ANALYSIS CARD */}
        <Card className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Resume Data</span>
              </div>
              {resume && (
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {resume.resumeScore}% Score
                </span>
              )}
            </div>

            {resume ? (
              <div className="space-y-3 text-xs">
                {resume.education && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Education</span>
                    <p className="font-semibold text-zinc-200 mt-0.5">{resume.education}</p>
                  </div>
                )}

                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Detected Skills ({resume.skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {resume.skills.slice(0, 8).map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[11px] border border-zinc-700">
                        {s}
                      </span>
                    ))}
                    {resume.skills.length > 8 && (
                      <span className="text-[10px] text-zinc-400 self-center">+{resume.skills.length - 8} more</span>
                    )}
                  </div>
                </div>

                {resume.missingSkills && resume.missingSkills.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Missing Resume Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {resume.missingSkills.map((m, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[11px] border border-amber-500/30">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 space-y-2 bg-zinc-950/40 rounded-xl p-4 border border-zinc-800/80">
                <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-medium">No resume uploaded yet.</p>
                <p className="text-[11px] text-zinc-500">Upload your CV to automatically populate skills, experience, and ATS quality score.</p>
                {onNavigateToResume && (
                  <Button onClick={onNavigateToResume} size="sm" className="mt-2 rounded-xl text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                    Upload Resume
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* SOURCE 2: ADAPTIVE INTERVIEW PERFORMANCE CARD */}
        <Card className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Interview Performance</span>
              </div>
              {interview && (
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {interview.overallInterviewScore}% Overall
                </span>
              )}
            </div>

            {interview ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Technical Score</span>
                    <p className="text-base font-black text-white mt-0.5">{interview.technicalScore}%</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Communication</span>
                    <p className="text-base font-black text-white mt-0.5">{interview.communicationScore}%</p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Correctness & Relevance</span>
                    <span className="font-bold text-zinc-200">{interview.correctness}% / {interview.relevance}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Explanation Depth</span>
                    <span className="font-bold text-zinc-200">{interview.explanationQuality}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Questions Attempted / Skipped</span>
                    <span className="font-bold text-zinc-200">{interview.questionsAttempted} / {interview.questionsSkipped}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Difficulty Performance</span>
                    <span className="font-bold text-zinc-200">{interview.difficultyPerformance}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2 bg-zinc-950/40 rounded-xl p-4 border border-zinc-800/80">
                <Award className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-medium">No interview sessions completed.</p>
                <p className="text-[11px] text-zinc-500">Complete an adaptive mock interview to record live performance and verbal articulation metrics.</p>
                {onNavigateToInterview && (
                  <Button onClick={onNavigateToInterview} size="sm" className="mt-2 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                    Start Mock Interview
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* SOURCE 3: SKILL ASSESSMENT CARD */}
        <Card className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                <Code2 className="w-4 h-4 text-purple-400" />
                <span>Skill Assessment</span>
              </div>
              <Button
                onClick={() => setEditingSkills(!editingSkills)}
                size="sm"
                variant="outline"
                className="h-7 text-[11px] rounded-lg border-zinc-700 bg-zinc-800 text-zinc-200 hover:text-white"
              >
                <Sliders className="w-3 h-3 mr-1" /> {editingSkills ? "Close" : "Edit Scores"}
              </Button>
            </div>

            {/* Editing mode or Display mode */}
            {editingSkills ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                <p className="text-[11px] text-zinc-400">Update your benchmark scores (0-100 scale):</p>
                {DEFAULT_DOMAINS.map((domain) => (
                  <div key={domain} className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-zinc-300 w-24">{domain}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={skillInputs[domain] ?? 60}
                      onChange={(e) =>
                        setSkillInputs({ ...skillInputs, [domain]: Number(e.target.value) })
                      }
                      className="w-full accent-purple-500 h-1.5 rounded bg-zinc-800 cursor-pointer"
                    />
                    <span className="font-mono text-[11px] w-8 text-right font-bold text-purple-400">
                      {skillInputs[domain] ?? 60}
                    </span>
                  </div>
                ))}

                <Button
                  onClick={handleSaveSkills}
                  disabled={savingSkills}
                  size="sm"
                  className="w-full mt-2 rounded-xl text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  {savingSkills ? "Saving..." : "Save Assessment"}
                </Button>
                {skillMessage && <p className="text-[10px] text-zinc-400 text-center">{skillMessage}</p>}
              </div>
            ) : skills ? (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {Object.entries(skills).map(([skill, score]) => (
                  <div key={skill} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-zinc-300">{skill}</span>
                      <span className={`font-mono font-bold text-[10px] px-1.5 py-0.2 rounded border ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getBarColor(score)}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 space-y-2 bg-zinc-950/40 rounded-xl p-4 border border-zinc-800/80">
                <Code2 className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-medium">No skill assessment recorded.</p>
                <p className="text-[11px] text-zinc-500">Benchmark your technical competencies across DSA, DBMS, System Design, and Core CS.</p>
                <Button onClick={() => setEditingSkills(true)} size="sm" className="mt-2 rounded-xl text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold">
                  Enter Skill Scores
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── 3. SKILL CLASSIFICATION: STRONG, MODERATE, WEAK AREAS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Strong Areas Card */}
        <Card className="p-4 bg-zinc-900/90 border border-emerald-500/20 rounded-2xl shadow-md space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-400 border-b border-zinc-800 pb-2">
            <CheckCircle2 className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Strong Skills ({strongAreas.length})
            </h4>
          </div>
          <p className="text-[11px] text-zinc-400">Validated competencies scoring &ge; 80%:</p>
          {strongAreas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {strongAreas.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">No skills currently evaluated at &ge; 80%.</p>
          )}
        </Card>

        {/* Moderate Areas Card */}
        <Card className="p-4 bg-zinc-900/90 border border-amber-500/20 rounded-2xl shadow-md space-y-2.5">
          <div className="flex items-center gap-2 text-amber-400 border-b border-zinc-800 pb-2">
            <TrendingUp className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Moderate Skills ({moderateAreas.length})
            </h4>
          </div>
          <p className="text-[11px] text-zinc-400">Good foundational knowledge (60 - 79%):</p>
          {moderateAreas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {moderateAreas.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold"
                >
                  ~ {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">No moderate skills found.</p>
          )}
        </Card>

        {/* Weak Areas Card */}
        <Card className="p-4 bg-zinc-900/90 border border-rose-500/20 rounded-2xl shadow-md space-y-2.5">
          <div className="flex items-center gap-2 text-rose-400 border-b border-zinc-800 pb-2">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Weak Areas & Improvement ({weakAreas.length})
            </h4>
          </div>
          <p className="text-[11px] text-zinc-400">Deficiencies scoring &lt; 60% or missing:</p>
          {weakAreas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {weakAreas.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                >
                  ! {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">No critical weak areas detected!</p>
          )}
        </Card>
      </div>

      {/* ── 4. DAY 3: AI PERSONALIZED ROADMAP SECTION ── */}
      <Card className="p-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> DAY 3: AI Career Roadmap Engine
            </div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" /> Personalized Placement Learning Roadmap
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Grounded strictly in your performance metrics, candidate type (
              <span className="capitalize text-zinc-200 font-semibold">{candidateType.replace("_", " ")}</span>
              ), and verified gaps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleGenerateRoadmap()}
              disabled={generatingRoadmap}
              className="rounded-xl text-xs bg-gradient-to-r from-primary via-purple-600 to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white font-bold shadow-lg shadow-primary/20 px-4 py-2"
            >
              {generatingRoadmap ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> Generating AI Roadmap...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 mr-2" />
                  {roadmap ? "Regenerate AI Roadmap" : "Generate AI Roadmap"}
                </>
              )}
            </Button>
          </div>
        </div>

        {roadmapError && (
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{roadmapError}</span>
          </div>
        )}

        {generatingRoadmap ? (
          <div className="py-14 text-center space-y-4 bg-zinc-950/40 rounded-2xl border border-zinc-800/80">
            <Sparkles className="w-10 h-10 text-primary mx-auto animate-pulse" />
            <h4 className="text-base font-bold text-white">Synthesizing Personalized Career Roadmap</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Analyzing candidate gaps across DSA, DBMS, Resume ATS keywords, and Adaptive Interview
              performance metrics...
            </p>
          </div>
        ) : roadmap ? (
          <div className="space-y-6">
            {/* 4.1 Executive Summary */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-inner">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
                <Lightbulb className="w-4 h-4 text-primary" /> Executive Placement Assessment
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{roadmap.summary}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-zinc-800/60 text-xs">
                <span className="text-zinc-400">
                  Target Tier:{" "}
                  <span className="text-zinc-200 font-bold capitalize">
                    {roadmap.candidateType.replace("_", " ")}
                  </span>
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">
                  Readiness Score:{" "}
                  <span className="text-emerald-400 font-bold">{roadmap.readinessScore}%</span>
                </span>
                {roadmap.generatedAt && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-500 text-[11px]">
                      Generated: {new Date(roadmap.generatedAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 4.2 Priority Skill Gaps */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-400" />
                Target Skill Priorities ({roadmap.priorities?.length || 0})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roadmap.priorities?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2.5 shadow-sm hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{item.skill}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getPriorityBadge(
                          item.priority
                        )}`}
                      >
                        {item.priority} Priority
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-500">
                          Identified Gap:
                        </span>
                        <p className="text-zinc-300 text-[11px] mt-0.5">{item.reason}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-500">
                          Action Recommendation:
                        </span>
                        <p className="text-zinc-300 text-[11px] mt-0.5 font-medium">
                          {item.recommendation}
                        </p>
                      </div>
                    </div>

                    {item.topics && item.topics.length > 0 && (
                      <div className="pt-1.5 border-t border-zinc-800/80">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">
                          Core Topics:
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {item.topics.map((t, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-[10px] text-zinc-300 font-medium"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 4.3 Recommended Projects & Certifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Targeted Projects */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Recommended Portfolio Projects ({roadmap.projects?.length || 0})
                </h4>
                <div className="space-y-3">
                  {roadmap.projects?.map((proj, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2"
                    >
                      <h5 className="font-bold text-xs text-cyan-300">{proj.title}</h5>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">{proj.description}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {proj.technologies?.map((tech, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Certifications */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Target Industry Certifications ({roadmap.certifications?.length || 0})
                </h4>
                <div className="space-y-3">
                  {roadmap.certifications?.map((cert, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1.5"
                    >
                      <h5 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        {cert.name}
                      </h5>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{cert.reason}</p>
                    </div>
                  ))}

                  {/* Core Interview Topics */}
                  {roadmap.interviewTopics && roadmap.interviewTopics.length > 0 && (
                    <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                        Key Interview Topics to Master
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {roadmap.interviewTopics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-semibold"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4.4 4-Week Actionable Step-by-Step Learning Plan */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                4-Week Actionable Placement Plan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {roadmap.weeklyPlan?.map((weekItem) => (
                  <div
                    key={weekItem.week}
                    className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
                        <span className="text-[11px] font-black uppercase text-emerald-400">
                          Week {weekItem.week}
                        </span>
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <h5 className="font-bold text-xs text-white leading-snug">{weekItem.focus}</h5>

                      {/* Goals */}
                      <div className="mt-3 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-zinc-500">
                          Core Goals:
                        </span>
                        <ul className="space-y-1 text-[11px] text-zinc-300">
                          {weekItem.goals?.map((g, gIdx) => (
                            <li key={gIdx} className="flex items-start gap-1.5">
                              <Check className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Action Items */}
                    <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-500">
                        Action Items:
                      </span>
                      <ul className="space-y-1 text-[11px] text-zinc-400">
                        {weekItem.actionItems?.map((act, aIdx) => (
                          <li key={aIdx} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center space-y-3 bg-zinc-950/40 rounded-xl p-6 border border-zinc-800/80">
            <Compass className="w-8 h-8 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-bold text-zinc-200">No Roadmap Generated Yet</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Click &quot;Generate AI Roadmap&quot; above to create a tailored 4-week learning curriculum
              engineered specifically for your <span className="capitalize">{candidateType.replace("_", " ")}</span> placement profile.
            </p>
            <Button
              onClick={() => handleGenerateRoadmap()}
              size="sm"
              className="mt-2 rounded-xl text-xs bg-primary hover:bg-primary/90 text-white font-bold"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5" /> Generate Personalized Roadmap
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
