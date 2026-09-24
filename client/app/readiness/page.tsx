"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
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
  Sliders,
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
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import {
  CandidateRoadmap,
  CandidateType,
  ReadinessCurrentData,
  ReadinessCurrentResponse,
  RoadmapResponse,
} from "@/lib/readinessTypes";

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
  { label: string; icon: any; description: string }
> = {
  fresher: {
    label: "Fresher",
    icon: GraduationCap,
    description: "Core CS Fundamentals (DSA, DBMS, OS, OOP) & Foundations",
  },
  internship_seeker: {
    label: "Internship Seeker",
    icon: Briefcase,
    description: "Practical Coding, REST APIs, Git Workflows & Projects",
  },
  experienced: {
    label: "Experienced",
    icon: Rocket,
    description: "High-Scale Distributed System Design & Architecture",
  },
};

/**
 * Circular Progress Gauge Component
 * Renders an SVG circular gauge showing readiness percentage, tier badge, and SVG stroke.
 */
function CircularGauge({
  score,
  category,
}: {
  score: number;
  category: string;
}) {
  const radius = 70;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = "#f43f5e"; // rose
  let textColor = "text-rose-400";
  let badgeColor = "bg-rose-500/10 text-rose-300 border-rose-500/30";

  if (score >= 80) {
    strokeColor = "#10b981"; // emerald
    textColor = "text-emerald-400";
    badgeColor = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
  } else if (score >= 65) {
    strokeColor = "#f59e0b"; // amber
    textColor = "text-amber-400";
    badgeColor = "bg-amber-500/10 text-amber-300 border-amber-500/30";
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-zinc-900/90 to-zinc-950 rounded-2xl border border-zinc-800 shadow-xl">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="rotate-[-90deg] transition-all duration-1000 ease-out"
        >
          {/* Background Track */}
          <circle
            stroke="#27272a"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress Arc */}
          <circle
            stroke={strokeColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Display */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`text-4xl font-black tracking-tight ${textColor}`}>
            {score}
          </span>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
            / 100
          </span>
        </div>
      </div>

      <div className="mt-3 text-center space-y-1.5">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${badgeColor}`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {category}
        </span>
        <p className="text-[11px] text-zinc-400 font-medium max-w-[200px] leading-snug">
          {score >= 80
            ? "Fully optimized for tier-1 placement drives."
            : score >= 65
            ? "Solid potential. Target weak areas for top offers."
            : "Requires targeted practice across key competencies."}
        </p>
      </div>
    </div>
  );
}

export default function PlacementReadinessPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  const [data, setData] = useState<ReadinessCurrentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Skill editing modal state
  const [editingSkills, setEditingSkills] = useState(false);
  const [skillInputs, setSkillInputs] = useState<Record<string, number>>({});
  const [savingSkills, setSavingSkills] = useState(false);

  // Candidate tier state
  const [candidateType, setCandidateType] = useState<CandidateType>("fresher");
  const [updatingType, setUpdatingType] = useState(false);

  // AI Roadmap state
  const [roadmap, setRoadmap] = useState<CandidateRoadmap | null>(null);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);

  const fetchCurrentReadiness = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get<ReadinessCurrentResponse>(
        "/api/readiness/current"
      );
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
        if (res.data.data.candidateType) {
          setCandidateType(res.data.data.candidateType);
        }
        if (res.data.data.rawUnified?.skills) {
          setSkillInputs(res.data.data.rawUnified.skills);
        } else {
          const init: Record<string, number> = {};
          DEFAULT_DOMAINS.forEach((d) => (init[d] = 70));
          setSkillInputs(init);
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
    try {
      const res = await axiosInstance.get<RoadmapResponse>(
        "/api/readiness/roadmap"
      );
      if (res.data?.success && res.data.data) {
        setRoadmap(res.data.data);
      }
    } catch {
      // Roadmap not generated yet
    }
  };

  useEffect(() => {
    fetchCurrentReadiness();
    fetchRoadmap();
  }, []);

  const handleCandidateTypeChange = async (newType: CandidateType) => {
    if (newType === candidateType) return;
    setCandidateType(newType);
    setUpdatingType(true);
    try {
      await axiosInstance.post("/api/readiness/candidate-type", {
        candidateType: newType,
      });
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
          candidateType: activeType,
          readinessScore: data?.readinessScore ?? 65,
          weakAreas: (data?.weakAreas || []).map((w) => w.area),
          missingSkills: data?.rawUnified?.resume?.missingSkills || [],
          interviewPerformance: data?.rawUnified?.interview || {},
          skillScores: data?.rawUnified?.skills || {},
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
    try {
      await axiosInstance.post("/api/readiness/skills", {
        scores: skillInputs,
      });
      setEditingSkills(false);
      await fetchCurrentReadiness();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to update skills.");
    } finally {
      setSavingSkills(false);
    }
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getPriorityBadge = (priority: "High" | "Medium" | "Low") => {
    if (priority === "High")
      return "bg-rose-500/10 text-rose-300 border-rose-500/30";
    if (priority === "Medium")
      return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ── Left Sidebar Navigation (Desktop) ── */}
      <Sidebar className="hidden md:flex" />

      {/* ── Main Content Area ── */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Placement Readiness Engine • Day 4 Dashboard</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Placement Readiness Dashboard
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Holistic readiness gauge connecting Resume Analysis, Adaptive
              Interview Performance, and Technical Skill Benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => router.push("/progress-history")}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs bg-zinc-900 border-zinc-700 text-zinc-200 hover:text-white"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Progress History
            </Button>
            <Button
              onClick={() => {
                fetchCurrentReadiness();
                fetchRoadmap();
              }}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        </section>

        {loading ? (
          <Card className="p-16 text-center border border-zinc-800 bg-zinc-950/40 rounded-2xl">
            <RefreshCw className="w-9 h-9 mx-auto text-primary animate-spin mb-4" />
            <h3 className="text-base font-bold text-white">
              Computing Candidate Placement Readiness...
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Aggregating resume quality, verified mock interview scores, and
              algorithmic benchmarks using the standard weighting formula.
            </p>
          </Card>
        ) : error || !data ? (
          <Card className="p-8 text-center border border-rose-500/30 bg-rose-500/5 rounded-2xl">
            <AlertTriangle className="w-8 h-8 mx-auto text-rose-400 mb-3" />
            <h3 className="text-base font-semibold text-white">
              Unable to Load Readiness Data
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              {error || "No placement readiness profile could be found."}
            </p>
            <Button
              onClick={fetchCurrentReadiness}
              size="sm"
              variant="outline"
              className="mt-4 rounded-xl text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
            </Button>
          </Card>
        ) : (
          <>
            {/* ── 1. CIRCULAR GAUGE & COMPONENT BREAKDOWN ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Circular Gauge Card (Left, 4 columns) */}
              <div className="lg:col-span-4 flex flex-col justify-between">
                <CircularGauge
                  score={data.readinessScore}
                  category={data.category}
                />
              </div>

              {/* Score Breakdown Cards (Right, 8 columns) */}
              <Card className="lg:col-span-8 p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl shadow-xl flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div>
                      <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" />
                        Component Score Breakdown
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                        Formula: Readiness = (Resume × 25%) + (Interview × 35%) +
                        (Technical Skills × 40%)
                      </p>
                    </div>

                    {data.historySummary?.improvement !== null && (
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                          (data.historySummary.improvement ?? 0) >= 0
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {(data.historySummary.improvement ?? 0) >= 0
                          ? `+${data.historySummary.improvement}`
                          : data.historySummary.improvement}{" "}
                        vs Previous
                      </span>
                    )}
                  </div>

                  {/* 4 Score Progress Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {/* Resume Score */}
                    <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          Resume Score (25%)
                        </span>
                        <span className="font-mono font-black text-cyan-400 text-sm">
                          {data.scoreBreakdown.resume}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getBarColor(
                            data.scoreBreakdown.resume
                          )}`}
                          style={{ width: `${data.scoreBreakdown.resume}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        {data.dataAvailability.resume
                          ? "Verified ATS parsing & clarity score."
                          : "Resume not uploaded yet."}
                      </p>
                    </div>

                    {/* Interview Score */}
                    <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-emerald-400" />
                          Interview Score (35%)
                        </span>
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          {data.scoreBreakdown.interview}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getBarColor(
                            data.scoreBreakdown.interview
                          )}`}
                          style={{ width: `${data.scoreBreakdown.interview}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        {data.dataAvailability.interview
                          ? "Grounded in completed mock interview sessions."
                          : "No interview session completed yet."}
                      </p>
                    </div>

                    {/* Technical Skills Score */}
                    <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5 text-purple-400" />
                          Technical Skills Score (40%)
                        </span>
                        <span className="font-mono font-black text-purple-400 text-sm">
                          {data.scoreBreakdown.technicalSkills}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getBarColor(
                            data.scoreBreakdown.technicalSkills
                          )}`}
                          style={{
                            width: `${data.scoreBreakdown.technicalSkills}%`,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Average of Core CS (DSA, DBMS, OS, Cloud, OOP).
                      </p>
                    </div>

                    {/* Communication Score */}
                    <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                          Communication Score
                        </span>
                        <span className="font-mono font-black text-blue-400 text-sm">
                          {data.scoreBreakdown.communication}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getBarColor(
                            data.scoreBreakdown.communication
                          )}`}
                          style={{
                            width: `${data.scoreBreakdown.communication}%`,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Articulation, conciseness, and depth in technical Q&amp;A.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Candidate Track Switcher */}
                <div className="pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-primary" /> Target
                      Candidate Track
                    </span>
                    <Button
                      onClick={() => setEditingSkills(!editingSkills)}
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] rounded-lg border-zinc-700 bg-zinc-800 text-zinc-300"
                    >
                      <Sliders className="w-3 h-3 mr-1" />
                      {editingSkills ? "Hide Skill Editor" : "Edit Skills"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(
                      Object.keys(CANDIDATE_TYPE_CONFIG) as CandidateType[]
                    ).map((type) => {
                      const cfg = CANDIDATE_TYPE_CONFIG[type];
                      const Icon = cfg.icon;
                      const isSelected = candidateType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleCandidateTypeChange(type)}
                          disabled={updatingType || generatingRoadmap}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-primary/15 border-primary text-white shadow-sm"
                              : "bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon
                              className={`w-3.5 h-3.5 ${
                                isSelected ? "text-primary" : "text-zinc-500"
                              }`}
                            />
                            <span className="text-xs font-bold">{cfg.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>

            {/* ── 2. SKILL ASSESSMENT EDITOR (EXPANDABLE) ── */}
            {editingSkills && (
              <Card
                id="skills"
                className="p-6 bg-zinc-900 border border-purple-500/30 rounded-2xl shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Code2 className="w-4 h-4 text-purple-400" />
                    <span>Live Skill Assessment Benchmarks</span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    Adjust your technical proficiency (0-100)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {DEFAULT_DOMAINS.map((domain) => (
                    <div
                      key={domain}
                      className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-200">
                          {domain}
                        </span>
                        <span className="font-mono font-bold text-purple-400">
                          {skillInputs[domain] ?? 60}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={skillInputs[domain] ?? 60}
                        onChange={(e) =>
                          setSkillInputs({
                            ...skillInputs,
                            [domain]: Number(e.target.value),
                          })
                        }
                        className="w-full accent-purple-500 h-1.5 rounded bg-zinc-800 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    onClick={() => setEditingSkills(false)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSkills}
                    disabled={savingSkills}
                    size="sm"
                    className="rounded-xl text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold px-5"
                  >
                    {savingSkills ? "Saving..." : "Save & Recalculate"}
                  </Button>
                </div>
              </Card>
            )}

            {/* ── 3. DYNAMIC WEAK AREAS (<60) & STRONG AREAS (>=80) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weak Areas Card (Sorted Weakest First with Actionable Recommendations) */}
              <Card className="p-6 bg-zinc-900/90 border border-rose-500/20 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Weak Areas ({data.weakAreas.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Scoring &lt; 60% • Sorted Weakest First
                  </span>
                </div>

                {data.weakAreas.length > 0 ? (
                  <div className="space-y-3">
                    {data.weakAreas.map((w, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-zinc-950/80 border border-rose-500/20 space-y-1.5 hover:border-rose-500/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {w.area}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
                            {w.score}%
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-snug">
                          {w.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-500 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    No critical weak areas detected! All assessed domains score &ge;
                    60%.
                  </div>
                )}
              </Card>

              {/* Strong Areas Card (>=80%) */}
              <Card className="p-6 bg-zinc-900/90 border border-emerald-500/20 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Strong Areas ({data.strongAreas.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Validated Competencies &ge; 80%
                  </span>
                </div>

                {data.strongAreas.length > 0 ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-zinc-400">
                      Highlighted competencies ready to leverage in technical
                      interviews:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.strongAreas.map((skill, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-500 text-xs">
                    No domains currently evaluated &ge; 80%. Target moderate areas
                    to build strong competencies.
                  </div>
                )}

                {/* Moderate Skills list if available */}
                {data.moderateAreas && data.moderateAreas.length > 0 && (
                  <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Moderate Foundational
                      Skills (60% - 79%)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {data.moderateAreas.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-semibold"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* ── 4. AI PERSONALIZED ROADMAP INTEGRATION (DAY 3) ── */}
            <Card className="p-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> DAY 3: AI Career Roadmap
                    Engine
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <Compass className="w-5 h-5 text-primary" /> Personalized
                    Placement Learning Curriculum
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Grounded strictly in your performance metrics, candidate type (
                    <span className="capitalize text-zinc-200 font-semibold">
                      {candidateType.replace("_", " ")}
                    </span>
                    ), and verified gaps.
                  </p>
                </div>

                <Button
                  onClick={() => handleGenerateRoadmap()}
                  disabled={generatingRoadmap}
                  className="rounded-xl text-xs bg-gradient-to-r from-primary via-purple-600 to-indigo-600 hover:from-primary/90 text-white font-bold shadow-lg shadow-primary/20 px-5 py-2.5"
                >
                  {generatingRoadmap ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Generating AI Curriculum...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 mr-2" />
                      {roadmap ? "Regenerate AI Roadmap" : "Generate AI Roadmap"}
                    </>
                  )}
                </Button>
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
                  <h4 className="text-base font-bold text-white">
                    Synthesizing Tailored Learning Curriculum
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Synthesizing verified weak competencies across DSA, DBMS, and
                    ATS keywords into a 4-week actionable strategy...
                  </p>
                </div>
              ) : roadmap ? (
                <div className="space-y-6">
                  {/* Executive Assessment */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-inner">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      Executive Placement Strategy
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {roadmap.summary}
                    </p>
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
                        <span className="text-emerald-400 font-bold">
                          {roadmap.readinessScore}%
                        </span>
                      </span>
                      {roadmap.generatedAt && (
                        <>
                          <span className="text-zinc-600">•</span>
                          <span className="text-zinc-500 text-[11px]">
                            Generated:{" "}
                            {new Date(roadmap.generatedAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Priority Skill Gaps */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <Target className="w-4 h-4 text-rose-400" />
                      Target Skill Priorities ({roadmap.priorities?.length || 0})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {roadmap.priorities?.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-white">
                              {item.skill}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getPriorityBadge(
                                item.priority
                              )}`}
                            >
                              {item.priority} Priority
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <p className="text-zinc-300 text-[11px]">
                              <span className="text-zinc-500 font-bold">
                                Gap:
                              </span>{" "}
                              {item.reason}
                            </p>
                            <p className="text-zinc-300 text-[11px] font-medium">
                              <span className="text-zinc-500 font-bold">
                                Recommendation:
                              </span>{" "}
                              {item.recommendation}
                            </p>
                          </div>

                          {item.topics && item.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-zinc-800/80">
                              {item.topics.map((t, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-[10px] text-zinc-300 font-medium"
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

                  {/* Recommended Projects & Certifications */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Projects */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        Target Portfolio Projects
                      </h4>
                      <div className="space-y-3">
                        {roadmap.projects?.map((proj, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2"
                          >
                            <h5 className="font-bold text-xs text-cyan-300">
                              {proj.title}
                            </h5>
                            <p className="text-[11px] text-zinc-300 leading-relaxed">
                              {proj.description}
                            </p>
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

                    {/* Certifications & Interview Topics */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        Certifications &amp; Interview Topics
                      </h4>
                      <div className="space-y-3">
                        {roadmap.certifications?.map((cert, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1"
                          >
                            <h5 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                              {cert.name}
                            </h5>
                            <p className="text-[11px] text-zinc-400">
                              {cert.reason}
                            </p>
                          </div>
                        ))}

                        {roadmap.interviewTopics &&
                          roadmap.interviewTopics.length > 0 && (
                            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                              <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                                Core Technical Interview Questions
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

                  {/* 4-Week Actionable Placement Plan */}
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
                            <h5 className="font-bold text-xs text-white leading-snug">
                              {weekItem.focus}
                            </h5>

                            <div className="mt-2.5 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-zinc-500">
                                Goals:
                              </span>
                              <ul className="space-y-1 text-[11px] text-zinc-300">
                                {weekItem.goals?.map((g, gIdx) => (
                                  <li key={gIdx} className="flex items-start gap-1">
                                    <Check className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <span>{g}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-zinc-500">
                              Actions:
                            </span>
                            <ul className="space-y-1 text-[11px] text-zinc-400">
                              {weekItem.actionItems?.map((act, aIdx) => (
                                <li key={aIdx} className="flex items-start gap-1">
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
                  <h4 className="text-sm font-bold text-zinc-200">
                    No Roadmap Generated Yet
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Click &quot;Generate AI Roadmap&quot; above to create a tailored
                    4-week learning curriculum engineered specifically for your{" "}
                    <span className="capitalize">
                      {candidateType.replace("_", " ")}
                    </span>{" "}
                    placement profile.
                  </p>
                  <Button
                    onClick={() => handleGenerateRoadmap()}
                    size="sm"
                    className="mt-2 rounded-xl text-xs bg-primary hover:bg-primary/90 text-white font-bold"
                  >
                    <Zap className="w-3.5 h-3.5 mr-1.5" /> Generate Personalized
                    Roadmap
                  </Button>
                </div>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
