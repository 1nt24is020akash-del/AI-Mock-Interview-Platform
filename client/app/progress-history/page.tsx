"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Award,
  FileText,
  Code2,
  Calendar,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Target,
  Minus,
  CheckCircle2,
} from "lucide-react";
import {
  ReadinessHistoryData,
  ReadinessHistoryRecord,
  ReadinessHistoryResponse,
} from "@/lib/readinessTypes";

/**
 * Interactive SVG Line Chart
 * Renders historical readiness snapshots with score points, grid lines, and gradient area.
 */
function HistoricalLineChart({
  records,
  activeMetric,
}: {
  records: ReadinessHistoryRecord[];
  activeMetric: "score" | "resumeScore" | "interviewScore" | "skillScore";
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!records || records.length === 0) return null;

  const width = 640;
  const height = 220;
  const paddingX = 45;
  const paddingTop = 25;
  const paddingBottom = 35;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingTop - paddingBottom;

  // Single point handling: center horizontally
  const getX = (index: number) => {
    if (records.length === 1) return paddingX + chartWidth / 2;
    return paddingX + (index / (records.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    return paddingTop + chartHeight - (clamped / 100) * chartHeight;
  };

  const points = records.map((r, i) => {
    const val = r[activeMetric] ?? r.score;
    return {
      x: getX(i),
      y: getY(val),
      val,
      date: new Date(r.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      category: r.category,
      record: r,
    };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, "");

  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x},${paddingTop + chartHeight} L ${
          points[0].x
        },${paddingTop + chartHeight} Z`
      : "";

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto min-w-[500px]"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines at 0, 25, 50, 75, 100 */}
        {[0, 25, 50, 75, 100].map((level) => {
          const yPos = getY(level);
          return (
            <g key={level}>
              <line
                x1={paddingX}
                y1={yPos}
                x2={width - paddingX}
                y2={yPos}
                stroke="#27272a"
                strokeDasharray={level === 0 || level === 100 ? "none" : "3,3"}
                strokeWidth="1"
              />
              <text
                x={paddingX - 10}
                y={yPos + 3}
                fill="#71717a"
                fontSize="10"
                textAnchor="end"
                fontFamily="monospace"
              >
                {level}
              </text>
            </g>
          );
        })}

        {/* Threshold Line at 80 (Placement Ready) */}
        <line
          x1={paddingX}
          y1={getY(80)}
          x2={width - paddingX}
          y2={getY(80)}
          stroke="#10b981"
          strokeOpacity="0.3"
          strokeDasharray="4,4"
        />
        <text
          x={width - paddingX + 5}
          y={getY(80) + 3}
          fill="#10b981"
          fontSize="9"
          fontWeight="bold"
        >
          80 Ready
        </text>

        {/* Filled Gradient Area */}
        {areaD && <path d={areaD} fill="url(#chartGradient)" />}

        {/* Line Stroke */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="url(#strokeGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Interactive Data Nodes */}
        {points.map((pt, idx) => (
          <g key={idx}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoveredIdx === idx ? 7 : 4.5}
              fill="#09090b"
              stroke="#8b5cf6"
              strokeWidth="2.5"
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />

            {/* X-axis date labels */}
            <text
              x={pt.x}
              y={height - 10}
              fill="#a1a1aa"
              fontSize="9"
              textAnchor="middle"
            >
              {pt.date}
            </text>
          </g>
        ))}
      </svg>

      {/* Hover Tooltip Overlay */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div
          className="absolute z-20 pointer-events-none p-2.5 rounded-xl bg-zinc-950/95 border border-zinc-700 shadow-2xl text-xs space-y-1 -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(points[hoveredIdx].x / width) * 100}%`,
            top: `${(points[hoveredIdx].y / height) * 100}%`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-zinc-400">
              {points[hoveredIdx].date}
            </span>
            <span className="font-mono font-bold text-white">
              {points[hoveredIdx].val}%
            </span>
          </div>
          <p className="text-[10px] font-semibold text-primary">
            {points[hoveredIdx].category}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ProgressHistoryPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  const [historyData, setHistoryData] = useState<ReadinessHistoryData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<
    "score" | "resumeScore" | "interviewScore" | "skillScore"
  >("score");

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get<ReadinessHistoryResponse>(
        "/api/readiness/history"
      );
      if (res.data?.success && res.data.data) {
        setHistoryData(res.data.data);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "Failed to load readiness history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const records = historyData?.history || [];
  const currentScore = historyData?.currentScore;
  const previousScore = historyData?.previousScore;
  const improvement = historyData?.improvement;
  const currentCategory = historyData?.category;

  const isImprovementPositive = (improvement ?? 0) > 0;
  const isImprovementNegative = (improvement ?? 0) < 0;

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
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Historical Tracking • Day 5 Analytics</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Placement Readiness Progress History
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Immutable historical timeline tracking score evolution, metric
              deltas, category transitions, and skill growth over time.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => router.push("/readiness")}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs bg-zinc-900 border-zinc-700 text-zinc-200 hover:text-white"
            >
              <Target className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Placement Readiness
            </Button>
            <Button
              onClick={fetchHistory}
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
              Loading Historical Tracking Snapshots...
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Querying MongoDB ReadinessHistory collection for chronological
              performance snapshots and score progression.
            </p>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center border border-rose-500/30 bg-rose-500/5 rounded-2xl">
            <AlertTriangle className="w-8 h-8 mx-auto text-rose-400 mb-3" />
            <h3 className="text-base font-semibold text-white">
              Error Loading Progress History
            </h3>
            <p className="text-xs text-zinc-400 mt-1">{error}</p>
            <Button
              onClick={fetchHistory}
              size="sm"
              variant="outline"
              className="mt-4 rounded-xl text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
            </Button>
          </Card>
        ) : records.length === 0 ? (
          /* ── First-Time User Empty State ── */
          <Card className="p-12 text-center border-2 border-dashed border-zinc-800 bg-zinc-950/40 rounded-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-white">
                No Historical Snapshots Recorded Yet
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Snapshots are automatically created each time you complete a
                mock interview, analyze a resume, or update your skill
                assessment benchmarks.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Button
                onClick={() => router.push("/practice")}
                size="sm"
                className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                <Award className="w-3.5 h-3.5 mr-1.5" /> Start Mock Interview
              </Button>
              <Button
                onClick={() => router.push("/resume")}
                size="sm"
                variant="outline"
                className="rounded-xl text-xs border-zinc-700 text-zinc-200"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Upload Resume
              </Button>
              <Button
                onClick={() => router.push("/readiness#skills")}
                size="sm"
                variant="outline"
                className="rounded-xl text-xs border-zinc-700 text-zinc-200"
              >
                <Code2 className="w-3.5 h-3.5 mr-1.5" /> Assess Skills
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* ── Summary Stat Cards (Current, Previous, Delta, Category) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Current Readiness Score */}
              <Card className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-md space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-primary" /> Current Readiness
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    {currentScore}%
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">/ 100</span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Latest evaluated snapshot score.
                </p>
              </Card>

              {/* Previous Score */}
              <Card className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-md space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" /> Previous Score
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-zinc-300">
                    {previousScore !== null ? `${previousScore}%` : "—"}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  {previousScore !== null
                    ? "Score prior to latest assessment."
                    : "First baseline snapshot."}
                </p>
              </Card>

              {/* Dynamic Improvement Indicator (+9, -7, 0) */}
              <Card className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-md space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Progress
                  Delta
                </span>
                <div className="flex items-center gap-2">
                  {improvement !== null ? (
                    <div
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-base font-black border ${
                        isImprovementPositive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : isImprovementNegative
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : "bg-zinc-800 text-zinc-300 border-zinc-700"
                      }`}
                    >
                      {isImprovementPositive ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : isImprovementNegative ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                      <span>
                        {isImprovementPositive
                          ? `+${improvement}`
                          : `${improvement}`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-zinc-400">
                      Baseline Set
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400">
                  {isImprovementPositive
                    ? `Great progress! Up by +${improvement} points.`
                    : isImprovementNegative
                    ? `Score lowered by ${improvement} points. Review weak areas.`
                    : "No delta yet from baseline."}
                </p>
              </Card>

              {/* Current Tier Category */}
              <Card className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-md space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Current
                  Tier
                </span>
                <div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                      currentCategory === "Placement Ready"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : currentCategory === "High Potential Candidate"
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                        : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                    }`}
                  >
                    {currentCategory || "Assessing"}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  {records.length} snapshot{records.length !== 1 ? "s" : ""}{" "}
                  recorded in history.
                </p>
              </Card>
            </div>

            {/* ── Interactive Progress Line Chart ── */}
            <Card className="p-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Readiness Trajectory Timeline
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Visualizing historical performance trends recorded in
                    MongoDB over time.
                  </p>
                </div>

                {/* Metric selector pills */}
                <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  {[
                    { id: "score", label: "Overall Readiness" },
                    { id: "resumeScore", label: "Resume" },
                    { id: "interviewScore", label: "Interview" },
                    { id: "skillScore", label: "Skills" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveMetric(m.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeMetric === m.id
                          ? "bg-primary text-black shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SVG Chart */}
              <HistoricalLineChart
                records={records}
                activeMetric={activeMetric}
              />
            </Card>

            {/* ── Historical Timeline & Evolution Table ── */}
            <Card className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Snapshot History &amp; Category Progression</span>
                </div>
                <span className="text-xs text-zinc-400">
                  {records.length} Total Snapshots
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      <th className="py-2.5 px-3">Date &amp; Time</th>
                      <th className="py-2.5 px-3">Trigger Source</th>
                      <th className="py-2.5 px-3 text-right">Readiness Score</th>
                      <th className="py-2.5 px-3">Category Tier</th>
                      <th className="py-2.5 px-3">Component Breakdown</th>
                      <th className="py-2.5 px-3">Identified Weak Areas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {[...records].reverse().map((rec, idx) => (
                      <tr
                        key={rec._id || idx}
                        className="hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="py-3 px-3 font-mono text-zinc-300">
                          {new Date(rec.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        <td className="py-3 px-3">
                          <span className="capitalize px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-medium">
                            {rec.source?.replace("_", " ") || "auto snapshot"}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <span
                            className={`font-mono font-black text-sm ${
                              rec.score >= 80
                                ? "text-emerald-400"
                                : rec.score >= 65
                                ? "text-amber-400"
                                : "text-rose-400"
                            }`}
                          >
                            {rec.score}%
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              rec.category === "Placement Ready"
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                : rec.category === "High Potential Candidate"
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {rec.category}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-zinc-400 text-[11px]">
                          Resume:{" "}
                          <span className="font-bold text-zinc-200">
                            {rec.resumeScore}%
                          </span>{" "}
                          • Interview:{" "}
                          <span className="font-bold text-zinc-200">
                            {rec.interviewScore}%
                          </span>{" "}
                          • Skills:{" "}
                          <span className="font-bold text-zinc-200">
                            {rec.skillScore}%
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {rec.weakAreas && rec.weakAreas.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {rec.weakAreas.map((w, wIdx) => (
                                <span
                                  key={wIdx}
                                  className="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px]"
                                >
                                  {w}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-500 italic text-[11px]">
                              None detected
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
