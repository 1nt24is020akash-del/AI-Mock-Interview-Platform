"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  RotateCcw,
  LayoutDashboard,
  Brain,
  HelpCircle,
  Clock,
  User,
  Award,
  Layers,
  Check,
  X,
} from "lucide-react";

export interface DifficultyHistoryItem {
  questionIndex: number;
  questionText: string;
  candidateAnswer?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  score?: number | null;
  performance?: "STRONG" | "AVERAGE" | "WEAK" | null;
  action?: string;
  actionReason?: string;
  strengths?: string[];
  weaknesses?: string[];
  reasoning?: string;
  feedback?: string;
  isFollowUp?: boolean;
  skipped?: boolean;
  repeatedAnswer?: boolean;
  timestamp?: string | Date;
}

export interface AdaptiveReportCardProps {
  candidateName?: string;
  candidateEmail?: string;
  role: string;
  totalQuestions: number;
  questionsAnswered: number;
  questionsSkipped: number;
  repeatedAnswersCount?: number;
  startingDifficulty?: string;
  finalDifficulty?: string;
  score: number;
  durationMinutes?: number | string;
  difficultyHistory?: DifficultyHistoryItem[];
  integrityReport?: {
    tabSwitches?: number;
    fullscreenExits?: number;
    faceNotDetectedCount?: number;
    multipleFacesCount?: number;
    attentionWarnings?: number;
    screenShareInterruptions?: number;
    integrityStatus?: string;
  } | null;
  feedback?: string;
  onReturnToDashboard?: () => void;
  onRetake?: () => void;
  isModal?: boolean;
}

const difficultyBadgeConfig: Record<
  string,
  { label: string; icon: string; style: string; border: string; bg: string }
> = {
  EASY: {
    label: "Easy",
    icon: "🟢",
    style: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
  },
  MEDIUM: {
    label: "Medium",
    icon: "🟡",
    style: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
  },
  HARD: {
    label: "Hard",
    icon: "🔴",
    style: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    border: "border-rose-500/40",
    bg: "bg-rose-500/10",
  },
};

/**
 * Generate a dynamic explanation of how the interview adapted based on real difficultyHistory.
 */
function generateAdaptiveExplanation(
  history: DifficultyHistoryItem[],
  startDiff: string,
  endDiff: string,
  score: number
): string {
  if (!history || history.length === 0) {
    return `The interview initiated at ${startDiff} difficulty and evaluated your responses dynamically based on technical depth and accuracy, concluding at ${endDiff} difficulty.`;
  }

  const explanations: string[] = [];
  explanations.push(
    `The interview commenced at ${startDiff} tier to establish a baseline.`
  );

  for (let i = 0; i < history.length; i++) {
    const item = history[i];
    const qNum = item.questionIndex || i + 1;
    const diff = item.difficulty || "MEDIUM";

    if (item.skipped) {
      explanations.push(
        `On Q${qNum}, you skipped the question; the adaptive engine safely preserved your difficulty at ${diff} without penalizing your technical average.`
      );
    } else if (item.repeatedAnswer) {
      explanations.push(
        `On Q${qNum}, a repeated answer from earlier in the session was detected; difficulty was maintained at ${diff} while the system pivoted to a fresh topic.`
      );
    } else if (typeof item.score === "number") {
      const qScore = item.score;
      const scoreTenth = (qScore / 10).toFixed(1);

      if (qScore >= 80) {
        if (item.isFollowUp) {
          explanations.push(
            `In follow-up Q${qNum} (${diff}, ${scoreTenth}/10), your strong performance prompted an upward difficulty adjustment to challenge deeper architectural reasoning.`
          );
        } else {
          explanations.push(
            `In Q${qNum} (${diff}, ${scoreTenth}/10), you demonstrated strong technical mastery, causing the engine to promote the difficulty tier to probe advanced concepts.`
          );
        }
      } else if (qScore < 50) {
        explanations.push(
          `In Q${qNum} (${diff}, ${scoreTenth}/10), the response showed foundational gaps, prompting the engine to adjust difficulty downwards to evaluate core principles.`
        );
      } else {
        explanations.push(
          `In Q${qNum} (${diff}, ${scoreTenth}/10), you gave a solid answer with working knowledge, maintaining the ${diff} tier while transitioning topics.`
        );
      }

      if (item.action === "FOLLOW_UP") {
        explanations.push(
          `Because your answer on Q${qNum} introduced key technical concepts, an intelligent contextual follow-up was generated to test depth.`
        );
      }
    }
  }

  explanations.push(
    `The session finalized at ${endDiff} difficulty with an overall score of ${(score / 10).toFixed(1)}/10 (${score}%).`
  );

  return explanations.join(" ");
}

export function AdaptiveReportCard({
  candidateName = "Candidate",
  candidateEmail,
  role,
  totalQuestions,
  questionsAnswered,
  questionsSkipped,
  repeatedAnswersCount = 0,
  startingDifficulty = "MEDIUM",
  finalDifficulty = "MEDIUM",
  score,
  durationMinutes = 0,
  difficultyHistory = [],
  integrityReport,
  feedback,
  onReturnToDashboard,
  onRetake,
  isModal = false,
}: AdaptiveReportCardProps) {
  // Track expanded state for individual question review cards (default all expanded)
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  const toggleCard = (index: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const isCardExpanded = (index: number) => expandedCards[index] !== false;

  // Filter out any un-evaluated initial placeholder records where score is null and not skipped
  const validHistory = (difficultyHistory || []).filter(
    (h) => h && (typeof h.score === "number" || h.skipped)
  );

  // Compute aggregate strengths and weaknesses from validHistory
  const rawStrengths: string[] = [];
  const rawWeaknesses: string[] = [];

  validHistory.forEach((h) => {
    if (Array.isArray(h.strengths)) {
      h.strengths.forEach((s) => {
        const clean = s?.trim();
        if (clean && clean.length > 3) rawStrengths.push(clean);
      });
    }
    if (Array.isArray(h.weaknesses)) {
      h.weaknesses.forEach((w) => {
        const clean = w?.trim();
        if (clean && clean.length > 3) rawWeaknesses.push(clean);
      });
    }
  });

  // Deduplicate
  const aggregatedStrengths = Array.from(new Set(rawStrengths));
  const aggregatedWeaknesses = Array.from(new Set(rawWeaknesses));

  // Determine starting and ending difficulty
  const startDiff = (
    validHistory[0]?.difficulty || startingDifficulty || "MEDIUM"
  ).toUpperCase();
  const endDiff = (
    validHistory[validHistory.length - 1]?.difficulty ||
    finalDifficulty ||
    "MEDIUM"
  ).toUpperCase();

  const scoreOutOfTen = (score / 10).toFixed(1);

  const performanceTier =
    score >= 80
      ? {
          title: "Strong Performance",
          subtitle: "Candidate demonstrates high technical competence, clear articulation, and architectural depth.",
          badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          icon: "🚀",
          color: "text-emerald-400",
        }
      : score >= 60
      ? {
          title: "Solid Foundation",
          subtitle: "Candidate understands core mechanics with good practical working knowledge; room for optimization depth.",
          badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
          icon: "💪",
          color: "text-blue-400",
        }
      : score >= 40
      ? {
          title: "Developing Skills",
          subtitle: "Candidate understands surface concepts but requires deeper study into system internals, trade-offs, and edge cases.",
          badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          icon: "📚",
          color: "text-amber-400",
        }
      : {
          title: "Needs Practice",
          subtitle: "Fundamental technical gaps observed. Recommended to review essential principles and re-practice.",
          badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
          icon: "🔄",
          color: "text-rose-400",
        };

  const dynamicAdaptationText = generateAdaptiveExplanation(
    validHistory,
    startDiff,
    endDiff,
    score
  );

  return (
    <div className={`space-y-6 text-zinc-100 ${isModal ? "p-1" : "max-w-4xl mx-auto py-6 px-4"}`}>
      {/* ── 1. CANDIDATE & SESSION SUMMARY HEADER ── */}
      <Card className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-inner">
              <User className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {candidateName}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {role}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {candidateEmail ? `${candidateEmail} · ` : ""}Adaptive Technical Interview Assessment Report
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-right">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Session Status</p>
              <p className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5 justify-end">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </p>
            </div>
          </div>
        </div>

        {/* High-level Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Total Questions</span>
            <p className="text-lg font-black text-white mt-0.5">{totalQuestions}</p>
          </div>
          <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Answered</span>
            <p className="text-lg font-black text-emerald-400 mt-0.5">{questionsAnswered}</p>
          </div>
          <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Skipped</span>
            <p className="text-lg font-black text-amber-400 mt-0.5">{questionsSkipped}</p>
          </div>
          <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Start Difficulty</span>
            <p className="text-xs font-bold mt-1 text-zinc-200 flex items-center gap-1">
              <span>{difficultyBadgeConfig[startDiff]?.icon || "🟡"}</span>
              {startDiff}
            </p>
          </div>
          <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Final Difficulty</span>
            <p className="text-xs font-bold mt-1 text-zinc-200 flex items-center gap-1">
              <span>{difficultyBadgeConfig[endDiff]?.icon || "🟡"}</span>
              {endDiff}
            </p>
          </div>
          <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Average Score</span>
            <p className="text-lg font-black text-emerald-400 mt-0.5">
              {scoreOutOfTen}<span className="text-xs font-normal text-zinc-400">/10</span>
            </p>
          </div>
        </div>
      </Card>

      {/* ── 2. OVERALL PERFORMANCE SCORECARD ── */}
      <Card className="p-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-inner flex-shrink-0">
            <div className="text-center">
              <span className="text-3xl font-black text-white tracking-tight">{scoreOutOfTen}</span>
              <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">/ 10</span>
            </div>
            <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-black shadow-md">
              {score}%
            </div>
          </div>

          <div className="space-y-1 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border mb-1">
              <span>{performanceTier.icon}</span>
              <span className={performanceTier.color}>{performanceTier.title}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">Overall Candidate Evaluation</h3>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              {feedback || performanceTier.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap md:flex-col items-center justify-center gap-2 w-full md:w-auto flex-shrink-0">
          {onRetake && (
            <Button
              onClick={onRetake}
              size="sm"
              className="w-full sm:w-auto rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs border border-zinc-700"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Retake Interview
            </Button>
          )}
          {onReturnToDashboard && (
            <Button
              onClick={onReturnToDashboard}
              size="sm"
              className="w-full sm:w-auto rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs shadow-lg shadow-emerald-950/40"
            >
              <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Dashboard
            </Button>
          )}
        </div>
      </Card>

      {/* ── 3. DIFFICULTY PROGRESSION TIMELINE ── */}
      <Card className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Difficulty Progression Timeline
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {validHistory.length} Session Transitions
          </span>
        </div>

        {/* Step-by-Step Flow Path */}
        <div className="py-2 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max pb-2">
            {validHistory.map((item, idx) => {
              const qNum = item.questionIndex || idx + 1;
              const diff = item.difficulty || "MEDIUM";
              const qScore = typeof item.score === "number" ? (item.score / 10).toFixed(1) : "0.0";
              const isSkipped = item.skipped;
              const isFollowUp = item.isFollowUp;
              const isRepeated = item.repeatedAnswer;
              const badgeCfg = difficultyBadgeConfig[diff] || difficultyBadgeConfig["MEDIUM"];

              return (
                <React.Fragment key={idx}>
                  <div className={`p-3.5 rounded-xl border ${badgeCfg.border} ${badgeCfg.bg} space-y-1.5 min-w-[155px] shadow-sm transition-all hover:scale-[1.02]`}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-zinc-200">Q{qNum}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badgeCfg.style}`}>
                        {badgeCfg.icon} {diff}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {isSkipped ? (
                        <span className="text-xs font-bold text-amber-400">Skipped</span>
                      ) : (
                        <span className="text-sm font-black text-white">
                          {qScore}<span className="text-[10px] text-zinc-400 font-normal">/10</span>
                        </span>
                      )}

                      <span className="text-[10px] font-bold text-zinc-400 uppercase">
                        {isSkipped ? "NO SCORE" : item.performance || "AVERAGE"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 pt-1 text-[10px]">
                      {isFollowUp && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold">
                          Follow-Up
                        </span>
                      )}
                      {isRepeated && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold">
                          Repeated
                        </span>
                      )}
                      {!isFollowUp && !isRepeated && !isSkipped && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          Topic
                        </span>
                      )}
                    </div>
                  </div>

                  {idx < validHistory.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Path Text Representation */}
        <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl flex items-center justify-between text-xs font-mono text-zinc-300">
          <span className="text-zinc-400 font-sans">Progression Flow:</span>
          <span className="font-bold text-emerald-400">
            {validHistory
              .map(
                (h, i) =>
                  `Q${h.questionIndex || i + 1} ${h.difficulty || "MEDIUM"} (${
                    h.skipped ? "Skip" : typeof h.score === "number" ? `${(h.score / 10).toFixed(1)}/10` : "0/10"
                  })`
              )
              .join(" ➔ ")}
          </span>
        </div>
      </Card>

      {/* ── 4. HOW THE INTERVIEW ADAPTED (DYNAMIC EXPLANATION) ── */}
      <Card className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <Brain className="w-4 h-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            How the Interview Adapted (Engine Logic)
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80">
          {dynamicAdaptationText}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] text-zinc-400">
          <div className="p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/60 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Score ≥ 80% $\rightarrow$ Promoted to harder tier</span>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/60 flex items-center gap-2">
            <Minus className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>50-79% $\rightarrow$ Maintained tier for depth</span>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/60 flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span>Score &lt; 50% $\rightarrow$ Demoted to evaluate core basics</span>
          </div>
        </div>
      </Card>

      {/* ── 5. AGGREGATED STRENGTHS & WEAKNESSES ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths Card */}
        <Card className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 pb-2 border-b border-zinc-800">
            <CheckCircle2 className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Demonstrated Strengths ({aggregatedStrengths.length})
            </h4>
          </div>

          {aggregatedStrengths.length > 0 ? (
            <ul className="space-y-2 text-xs">
              {aggregatedStrengths.map((str, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-zinc-200"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{str}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500 italic p-3 text-center bg-zinc-950/40 rounded-xl">
              Provide more comprehensive technical answers to demonstrate strengths.
            </p>
          )}
        </Card>

        {/* Weaknesses Card */}
        <Card className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 pb-2 border-b border-zinc-800">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Areas for Improvement ({aggregatedWeaknesses.length})
            </h4>
          </div>

          {aggregatedWeaknesses.length > 0 ? (
            <ul className="space-y-2 text-xs">
              {aggregatedWeaknesses.map((weak, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-zinc-200"
                >
                  <X className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{weak}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500 italic p-3 text-center bg-zinc-950/40 rounded-xl">
              No significant technical weaknesses flagged during this session!
            </p>
          )}
        </Card>
      </div>

      {/* ── 6. QUESTION-BY-QUESTION DETAILED REVIEW ── */}
      <Card className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Question-by-Question Detailed Review
            </h3>
          </div>
          <span className="text-xs text-zinc-400">
            Click to expand or collapse each question
          </span>
        </div>

        <div className="space-y-3">
          {validHistory.map((item, idx) => {
            const qNum = item.questionIndex || idx + 1;
            const diff = item.difficulty || "MEDIUM";
            const qScore = typeof item.score === "number" ? (item.score / 10).toFixed(1) : "0.0";
            const isSkipped = item.skipped;
            const isFollowUp = item.isFollowUp;
            const isRepeated = item.repeatedAnswer;
            const isExpanded = isCardExpanded(idx);
            const badgeCfg = difficultyBadgeConfig[diff] || difficultyBadgeConfig["MEDIUM"];

            return (
              <div
                key={idx}
                className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/70 transition-colors"
              >
                {/* Header / Accordion trigger */}
                <button
                  type="button"
                  onClick={() => toggleCard(idx)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-900/60 transition-colors"
                >
                  <div className="flex items-center gap-3 pr-2">
                    <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-200 flex-shrink-0">
                      Q{qNum}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeCfg.style} flex-shrink-0`}>
                      {badgeCfg.icon} {diff}
                    </span>
                    {isFollowUp && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 flex-shrink-0">
                        Follow-Up
                      </span>
                    )}
                    {isRepeated && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 flex-shrink-0">
                        Repeated Answer
                      </span>
                    )}
                    <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                      {item.questionText || `Question ${qNum}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      {isSkipped ? (
                        <span className="text-xs font-bold text-amber-400">Skipped</span>
                      ) : (
                        <span className="text-sm font-extrabold text-white">
                          {qScore}<span className="text-[10px] font-normal text-zinc-400">/10</span>
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Card Details */}
                {isExpanded && (
                  <div className="p-4 pt-0 space-y-3 border-t border-zinc-800/80 bg-zinc-900/30 text-xs">
                    {/* Full Question Text */}
                    <div className="pt-2">
                      <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                        Technical Question:
                      </p>
                      <p className="text-xs text-zinc-200 font-medium bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                        {item.questionText}
                      </p>
                    </div>

                    {/* Candidate's Response */}
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                        Candidate Answer:
                      </p>
                      <div className={`p-3 rounded-lg border ${isSkipped ? "bg-amber-500/10 border-amber-500/20 text-amber-300 italic" : "bg-zinc-950 border-zinc-800 text-zinc-300"}`}>
                        {item.candidateAnswer || (isSkipped ? "[Skipped Question]" : "No candidate response captured.")}
                      </div>
                    </div>

                    {/* AI Feedback & Reasoning */}
                    {(item.feedback || item.reasoning) && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
                        <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI Interviewer Feedback:
                        </p>
                        {item.feedback && (
                          <p className="text-xs text-zinc-200 leading-relaxed">
                            {item.feedback}
                          </p>
                        )}
                        {item.reasoning && (
                          <p className="text-[11px] text-zinc-400 italic">
                            Reasoning: {item.reasoning}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Question Strengths & Weaknesses if present */}
                    {((item.strengths && item.strengths.length > 0) || (item.weaknesses && item.weaknesses.length > 0)) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {item.strengths && item.strengths.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Strengths:</span>
                            {item.strengths.map((s, si) => (
                              <p key={si} className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                                <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" /> {s}
                              </p>
                            ))}
                          </div>
                        )}
                        {item.weaknesses && item.weaknesses.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Weaknesses:</span>
                            {item.weaknesses.map((w, wi) => (
                              <p key={wi} className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                                <X className="w-3 h-3 text-amber-400 flex-shrink-0" /> {w}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── 7. PROCTORING INTEGRITY AUDIT (IF AVAILABLE) ── */}
      {integrityReport && (
        <Card className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Proctoring & Session Integrity Audit
            </h4>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                integrityReport.integrityStatus === "VERIFIED"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              }`}
            >
              {integrityReport.integrityStatus === "VERIFIED" ? "✓ High Integrity" : "⚠️ Review Recommended"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-400 text-[10px] block">Tab Switches</span>
              <span className="font-mono font-bold text-white text-sm">
                {integrityReport.tabSwitches || 0}
              </span>
            </div>
            <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-400 text-[10px] block">Fullscreen Exits</span>
              <span className="font-mono font-bold text-white text-sm">
                {integrityReport.fullscreenExits || 0}
              </span>
            </div>
            <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-400 text-[10px] block">Face Absence Signals</span>
              <span className="font-mono font-bold text-white text-sm">
                {integrityReport.faceNotDetectedCount || 0}
              </span>
            </div>
            <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-400 text-[10px] block">Screen Interruptions</span>
              <span className="font-mono font-bold text-white text-sm">
                {integrityReport.screenShareInterruptions || 0}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
