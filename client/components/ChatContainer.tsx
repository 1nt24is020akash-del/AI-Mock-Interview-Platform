"use client";
import React, { useEffect, useRef } from "react";

export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";
export type PerformanceLevel = "STRONG" | "AVERAGE" | "WEAK";

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  difficulty?: DifficultyLevel;
  performance?: PerformanceLevel;
  isQuestion?: boolean;
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
            {!message.isUser && message.difficulty && (
              <div className="mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    difficultyBadgeConfig[message.difficulty]?.className || ""
                  }`}
                >
                  <span>{difficultyBadgeConfig[message.difficulty]?.icon}</span>
                  {difficultyBadgeConfig[message.difficulty]?.label || message.difficulty}
                </span>
              </div>
            )}
            {!message.isUser && message.performance && (
              <div className="mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    performanceBadgeConfig[message.performance]?.className || ""
                  }`}
                >
                  <span>{performanceBadgeConfig[message.performance]?.icon}</span>
                  {performanceBadgeConfig[message.performance]?.label || message.performance}
                </span>
              </div>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
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
