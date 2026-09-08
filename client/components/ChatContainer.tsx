"use client";
import React, { useEffect, useRef } from "react";

export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";
export type PerformanceLevel = "STRONG" | "AVERAGE" | "WEAK";

export interface MessageAssessment {
  score?: number;
  strengths?: string[];
  weaknesses?: string[];
  reasoning?: string;
  action?: "FOLLOW_UP" | "NEW_QUESTION";
  actionReason?: string;
}

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  difficulty?: DifficultyLevel;
  performance?: PerformanceLevel;
  isQuestion?: boolean;
  isFollowUp?: boolean;
  assessment?: MessageAssessment;
}

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
}

const difficultyBadgeConfig: Record<
  DifficultyLevel,
  { label: string; icon: string; className: string }
> = {
  EASY: {
    label: "Easy Question",
    icon: "🟢",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  MEDIUM: {
    label: "Medium Question",
    icon: "🟡",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  HARD: {
    label: "Hard Question",
    icon: "🔴",
    className: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  },
};

const performanceBadgeConfig: Record<
  PerformanceLevel,
  { label: string; icon: string; className: string }
> = {
  STRONG: {
    label: "Strong Performance (+1 Level ↗)",
    icon: "⚡",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  AVERAGE: {
    label: "Average Performance (= Same Level)",
    icon: "⚖️",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  },
  WEAK: {
    label: "Needs Improvement (-1 Level ↘)",
    icon: "📉",
    className: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  },
};

const ChatContainer = ({ messages, isLoading }: ChatContainerProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-muted/20">
      {messages.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Start an interview to begin</p>
        </div>
      )}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.isUser ? "justify-end" : "justify-start"} mb-3`}
        >
          <div
            className={`max-w-md lg:max-w-xl px-4 py-3 rounded-2xl shadow-sm ${
              message.isUser
                ? "bg-primary text-primary-foreground rounded-br-none"
                : "bg-background text-foreground border border-border/80 rounded-bl-none"
            }`}
          >
            {/* Question Badges: Difficulty & Follow-up indicator */}
            {!message.isUser && message.isQuestion && (
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {message.difficulty && (
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      difficultyBadgeConfig[message.difficulty]?.className || ""
                    }`}
                  >
                    <span>{difficultyBadgeConfig[message.difficulty]?.icon}</span>
                    {difficultyBadgeConfig[message.difficulty]?.label || message.difficulty}
                  </span>
                )}
                {message.isFollowUp ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30">
                    <span>🔍</span>
                    Follow-Up Question
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                    <span>🎯</span>
                    New Topic
                  </span>
                )}
              </div>
            )}

            {/* AI Evaluation Badges: Performance & Score & Action */}
            {!message.isUser && !message.isQuestion && (
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {message.performance && (
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      performanceBadgeConfig[message.performance]?.className || ""
                    }`}
                  >
                    <span>{performanceBadgeConfig[message.performance]?.icon}</span>
                    {performanceBadgeConfig[message.performance]?.label || message.performance}
                  </span>
                )}
                {message.assessment?.score !== undefined && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Score: {message.assessment.score}%
                  </span>
                )}
                {message.assessment?.action && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      message.assessment.action === "FOLLOW_UP"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {message.assessment.action === "FOLLOW_UP" ? "Next: 🔍 Follow-Up" : "Next: 🎯 New Topic"}
                  </span>
                )}
              </div>
            )}

            <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>

            {/* Assessment Breakdown (Strengths, Weaknesses, Reasoning) */}
            {!message.isUser && message.assessment && (
              <div className="mt-3 pt-2.5 border-t border-border/50 text-xs space-y-2">
                {message.assessment.strengths && message.assessment.strengths.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1">
                      <span>✓</span> Key Strengths:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px] pl-1">
                      {message.assessment.strengths.map((s, idx) => (
                        <li key={idx} className="leading-tight">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {message.assessment.weaknesses && message.assessment.weaknesses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1">
                      <span>⚠</span> Areas to Improve:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px] pl-1">
                      {message.assessment.weaknesses.map((w, idx) => (
                        <li key={idx} className="leading-tight">{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {message.assessment.reasoning && (
                  <p className="text-[10px] text-muted-foreground italic border-l-2 border-primary/30 pl-2 mt-1">
                    {message.assessment.reasoning}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-background text-foreground border border-border/80 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <p className="text-xs text-muted-foreground font-medium">AI is evaluating & preparing next question...</p>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatContainer;
