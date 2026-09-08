"use client";
import ChatContainer, {
  DifficultyLevel,
  Message,
  PerformanceLevel,
} from "@/components/ChatContainer";
import { InputBox } from "@/components/InputBox";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

interface InterviewSession {
  id: string;
  score?: number;
  feedback?: string;
  isComplete?: boolean;
}

const TOTAL_QUESTIONS = 3;

const domainEmoji: Record<string, string> = {
  JavaScript: "🟨",
  "JavaScript/Node.js": "🟨",
  React: "⚛️",
  Python: "🐍",
  "Data Science": "📊",
  DevOps: "⚙️",
  "System Design": "🏗️",
  "Database Design": "🗄️",
  General: "🎯",
};

const difficultyBadgeConfig: Record<
  DifficultyLevel,
  { label: string; icon: string; style: string }
> = {
  EASY: {
    label: "Easy",
    icon: "🟢",
    style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  MEDIUM: {
    label: "Medium",
    icon: "🟡",
    style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  HARD: {
    label: "Hard",
    icon: "🔴",
    style: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
  },
};

const InterviewContent = () => {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain") || "General";
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [interviewScore, setInterviewScore] = useState<number | null>(null);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>("MEDIUM");
  const [difficultyProgression, setDifficultyProgression] = useState<
    { questionIndex: number; difficulty: DifficultyLevel; performance?: PerformanceLevel }[]
  >([{ questionIndex: 1, difficulty: "MEDIUM" }]);
  const [sessionStartTime] = useState(Date.now());

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (isLoggedIn) startInterview();
  }, [isLoggedIn]);

  useEffect(() => {
    if (isInterviewComplete) return;
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isInterviewComplete]);

  const startInterview = async () => {
    try {
      setIsLoading(true);
      const { data } = await axiosInstance.post("/api/interviews/start", {
        domain,
      });
      if (data) {
        setSessionId(data.sessionId);
        setQuestionsAnswered(0);
        const startingDiff = (data.difficulty || "MEDIUM") as DifficultyLevel;
        setCurrentDifficulty(startingDiff);
        setDifficultyProgression([{ questionIndex: 1, difficulty: startingDiff }]);
        setMessages([
          {
            id: "1",
            content: data.question || "Tell me about yourself",
            isUser: false,
            timestamp: new Date(),
            difficulty: startingDiff,
            isQuestion: true,
          },
        ]);
      }
    } catch (error) {
      setMessages([
        {
          id: "1",
          content: "Connection error. Please check your network",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || !sessionId) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: userMessage,
        isUser: true,
        timestamp: new Date(),
      },
    ]);
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post(
        "/api/interviews/submit-answer",
        { sessionId, answer: userMessage, domain, questionsAnswered },
      );
      if (data) {
        const newCount = questionsAnswered + 1;
        setQuestionsAnswered(newCount);
        const newDiff = (data.currentDifficulty || currentDifficulty) as DifficultyLevel;
        const perf = data.performance as PerformanceLevel;
        setCurrentDifficulty(newDiff);
        setDifficultyProgression((prev) => [
          ...prev,
          { questionIndex: newCount + 1, difficulty: newDiff, performance: perf },
        ]);

        const isFollowUp = Boolean(data.isFollowUp || data.action === "FOLLOW_UP");
        const assessment = {
          score: typeof data.score === "number" ? data.score : undefined,
          strengths: Array.isArray(data.strengths) ? data.strengths : [],
          weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
          reasoning: data.reasoning || "",
          action: data.action,
          actionReason: data.actionReason,
        };

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content:
              data.feedback ||
              "Your response has been evaluated.",
            isUser: false,
            timestamp: new Date(),
            performance: perf,
            isQuestion: false,
            assessment,
          },
        ]);

        if (data.isComplete || newCount >= TOTAL_QUESTIONS) {
          const finalScore = typeof data.score === "number" ? data.score : 0;
          setInterviewScore(finalScore);
          setIsInterviewComplete(true);
        } else if (data.nextQuestion) {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: (Date.now() + 2).toString(),
                content: data.nextQuestion,
                isUser: false,
                timestamp: new Date(),
                difficulty: newDiff,
                isQuestion: true,
                isFollowUp,
              },
            ]);
          }, 500);
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "Connection error. Please try again",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleEndInterview = () => router.push("/dashboard");
  if (authLoading) return null;
  if (!isLoggedIn) return null;
  const score = interviewScore ?? 0;
  const scoreLabel =
    score >= 80
      ? {
          text: "Excellent! You're interview-ready 🚀",
          color: "text-green-600 dark:text-green-400",
        }
      : score >= 60
        ? {
            text: "Good effort! A few more sessions will get you there 💪",
            color: "text-blue-600 dark:text-blue-400",
          }
        : score >= 40
          ? {
              text: "Keep practicing! Every session makes you stronger 🌟",
              color: "text-orange-600 dark:text-orange-400",
            }
          : {
              text: "Needs significant practice. Review core technical concepts and try again 📚",
              color: "text-rose-600 dark:text-rose-400",
            };
  return (
    
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Domain info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center text-xl flex-shrink-0">
                {domainEmoji[domain] || "🎯"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-foreground truncate">
                    {domain} Interview
                  </h1>
                  {!isInterviewComplete && (
                    <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </span>
                  )}
                  {!isInterviewComplete && (
                    <span
                      className={`flex items-center gap-1.5 text-xs border px-2.5 py-0.5 rounded-full font-semibold transition-all duration-300 flex-shrink-0 ${
                        difficultyBadgeConfig[currentDifficulty].style
                      }`}
                    >
                      <span className="text-[10px]">{difficultyBadgeConfig[currentDifficulty].icon}</span>
                      {difficultyBadgeConfig[currentDifficulty].label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  AI Mock Interview Session
                </p>
              </div>
            </div>

            {/* Center: Progress */}
            {!isInterviewComplete && (
              <div className="hidden sm:flex flex-col items-center gap-1.5">
                <ProgressDots
                  current={questionsAnswered}
                  total={TOTAL_QUESTIONS}
                />
                <p className="text-xs text-muted-foreground">
                  Question {Math.min(questionsAnswered + 1, TOTAL_QUESTIONS)} of{" "}
                  {TOTAL_QUESTIONS}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isInterviewComplete && (
                <div className="hidden sm:flex items-center gap-1.5 bg-muted/50 border border-border/60 px-3 py-1.5 rounded-full">
                  <span className="text-xs text-muted-foreground">⏱</span>
                  <span className="text-sm font-mono font-semibold text-foreground tabular-nums">
                    {formatTime(elapsedSeconds)}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  isInterviewComplete
                    ? handleEndInterview()
                    : setShowExitConfirm(true)
                }
                className="rounded-full text-xs border-border/60 hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5 transition-colors"
              >
                {isInterviewComplete ? "Go to Dashboard" : "Exit"}
              </Button>
            </div>
          </div>
          {!isInterviewComplete && (
            <div className="sm:hidden mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <div className="flex items-center gap-2">
                  <span>
                    Q{Math.min(questionsAnswered + 1, TOTAL_QUESTIONS)} of{" "}
                    {TOTAL_QUESTIONS}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] border px-2 py-0.5 rounded-full font-medium ${
                      difficultyBadgeConfig[currentDifficulty].style
                    }`}
                  >
                    <span>{difficultyBadgeConfig[currentDifficulty].icon}</span>
                    {difficultyBadgeConfig[currentDifficulty].label}
                  </span>
                </div>
                <span className="font-mono">{formatTime(elapsedSeconds)}</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                  style={{
                    width: `${(questionsAnswered / TOTAL_QUESTIONS) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 max-w-4xl w-full mx-auto flex flex-col">
        {isInterviewComplete ? (
          <div className="flex-1 flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-lg space-y-5">
              {/* Score card */}
              <Card className="p-8 border border-border/60 text-center">
                <div className="text-3xl mb-3">
                  {score >= 60 ? "🎉" : score >= 40 ? "💪" : "📚"}
                </div>
                <h2 className="text-2xl font-black text-foreground mb-1">
                  Interview Complete!
                </h2>
                <p className="text-sm text-muted-foreground mb-8">
                  Here's how you performed
                </p>

                <ScoreRing score={score} />

                <p className={`text-sm font-semibold mt-6 ${scoreLabel.color}`}>
                  {scoreLabel.text}
                </p>
              </Card>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Questions", value: questionsAnswered, icon: "❓" },
                  {
                    label: "Final Level",
                    value: currentDifficulty,
                    icon: difficultyBadgeConfig[currentDifficulty].icon,
                  },
                  {
                    label: "Domain",
                    value: domain.split("/")[0],
                    icon: domainEmoji[domain] || "🎯",
                  },
                  {
                    label: "Duration",
                    value: formatTime(elapsedSeconds),
                    icon: "⏱",
                  },
                ].map((stat, i) => (
                  <Card
                    key={i}
                    className="p-3.5 text-center border border-border/50"
                  >
                    <div className="text-base mb-1">{stat.icon}</div>
                    <p className="text-sm font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stat.label}
                    </p>
                  </Card>
                ))}
              </div>

              {/* Score breakdown */}
              <Card className="p-6 border border-border/50">
                <p className="text-sm font-semibold text-foreground mb-4">
                  Performance Breakdown
                </p>
                {[
                  {
                    label: "Technical Accuracy",
                    pct: score === 0 ? 0 : Math.min(score + 5, 100),
                  },
                  {
                    label: "Communication Clarity",
                    pct: score === 0 ? 0 : Math.max(score - 8, 0),
                  },
                  {
                    label: "Problem-Solving Approach",
                    pct: score === 0 ? 0 : Math.min(score + 2, 100),
                  },
                ].map((bar, i) => (
                  <div key={i} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{bar.label}</span>
                      <span className="font-semibold text-foreground">
                        {bar.pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                        style={{ width: `${bar.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </Card>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsInterviewComplete(false);
                    setInterviewScore(null);
                    setQuestionsAnswered(0);
                    setCurrentDifficulty("MEDIUM");
                    setDifficultyProgression([{ questionIndex: 1, difficulty: "MEDIUM" }]);
                    setMessages([]);
                    setElapsedSeconds(0);
                    startInterview();
                  }}
                  className="rounded-full border-border/60"
                >
                  🔄 Try Again
                </Button>
                <Button
                  onClick={handleEndInterview}
                  className="rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold"
                >
                  Dashboard →
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ChatContainer messages={messages} isLoading={isLoading} />
            <div className="border-t border-border/50 bg-background">
              {/* Tip bar */}
              <div className="max-w-4xl mx-auto px-4 pt-2">
                <p className="text-xs text-muted-foreground text-center">
                  💡 Tip: Be specific and use examples from your experience for
                  stronger answers
                </p>
              </div>
              <InputBox onSend={handleSendMessage} disabled={isLoading} />
            </div>
          </>
        )}
      </div>

      {showExitConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowExitConfirm(false);
          }}
        >
          <Card className="w-full max-w-md p-6 border border-border shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xl">
                ⚠️
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Exit Interview?
                </h2>
                <p className="text-xs text-muted-foreground">
                  Your progress will not be marked as complete.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Are you sure you want to leave this interview session? You can always return to your dashboard or pick another domain anytime.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setShowExitConfirm(false)}
              >
                Resume Interview
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full text-xs"
                onClick={handleEndInterview}
              >
                Exit to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80
      ? "#22c55e"
      : score >= 60
        ? "#3b82f6"
        : score >= 40
          ? "#f97316"
          : "#ef4444";

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-border"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
          Score
        </span>
      </div>
    </div>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-500 ${
            i < current
              ? "bg-gradient-to-r from-primary to-accent w-6"
              : i === current
                ? "bg-primary/40 w-4 animate-pulse"
                : "bg-border w-2"
          }`}
        />
      ))}
    </div>
  );
}
export default InterviewContent;
