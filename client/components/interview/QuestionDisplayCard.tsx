"use client";

import React, { useEffect, useState } from "react";
import { DifficultyLevel } from "./types";
import { Volume2, Sparkles, MessageCircleQuestion, CornerDownRight } from "lucide-react";

interface QuestionDisplayCardProps {
  questionText: string;
  difficulty: DifficultyLevel;
  isFollowUp?: boolean;
  questionNumber: number;
  totalQuestions: number;
  isSpeaking: boolean;
  interviewerName: string;
  onReplayVoice: () => void;
}

const difficultyBadgeConfig: Record<
  DifficultyLevel,
  { label: string; icon: string; style: string }
> = {
  EASY: {
    label: "Easy Level",
    icon: "🟢",
    style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  MEDIUM: {
    label: "Medium Level",
    icon: "🟡",
    style: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  HARD: {
    label: "Hard Level",
    icon: "🔴",
    style: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  },
};

export function QuestionDisplayCard({
  questionText,
  difficulty,
  isFollowUp = false,
  questionNumber,
  totalQuestions,
  isSpeaking,
  interviewerName,
  onReplayVoice,
}: QuestionDisplayCardProps) {
  const [displayedText, setDisplayedText] = useState("");

  // Progressive reveal / typing effect when new question arrives
  useEffect(() => {
    if (!questionText) {
      setDisplayedText("");
      return;
    }

    // Fast progressive reveal (20ms per character chunk)
    let index = 0;
    const interval = setInterval(() => {
      index += 4;
      if (index >= questionText.length) {
        setDisplayedText(questionText);
        clearInterval(interval);
      } else {
        setDisplayedText(questionText.slice(0, index));
      }
    }, 18);

    return () => clearInterval(interval);
  }, [questionText]);

  const diffConfig = difficultyBadgeConfig[difficulty] || difficultyBadgeConfig.MEDIUM;

  return (
    <div className="relative w-full rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl p-5 sm:p-6 shadow-2xl transition-all duration-300">
      {/* Header Badges row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Question Sequence Counter */}
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200 border border-zinc-700">
            <MessageCircleQuestion className="w-3.5 h-3.5 text-primary" />
            Question {questionNumber} of {totalQuestions}
          </span>

          {/* Difficulty Badge */}
          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${diffConfig.style}`}
          >
            <span>{diffConfig.icon}</span>
            <span>{diffConfig.label}</span>
          </span>

          {/* Topic vs Follow-up Badge */}
          {isFollowUp ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse">
              <CornerDownRight className="w-3 h-3" />
              Follow-Up Deep Dive
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-3 h-3" />
              New Topic
            </span>
          )}
        </div>

        {/* Audio Replay Button */}
        <button
          onClick={onReplayVoice}
          title="Replay question audio"
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-300 transition-colors"
        >
          <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? "text-emerald-400 animate-pulse" : "text-zinc-400"}`} />
          <span>{isSpeaking ? `${interviewerName} Speaking...` : "Replay Question"}</span>
        </button>
      </div>

      {/* Question Content */}
      <div className="space-y-2">
        <p className="text-base sm:text-lg md:text-xl font-medium text-zinc-100 leading-relaxed tracking-wide selection:bg-emerald-500/30">
          {displayedText || questionText}
          {displayedText.length < questionText.length && (
            <span className="inline-block w-2 h-5 ml-1 bg-emerald-400 animate-pulse align-middle" />
          )}
        </p>
      </div>
    </div>
  );
}
