"use client";

import React from "react";
import { Message } from "@/components/ChatContainer";
import { X, Bot, User, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

interface LiveTranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  interviewerName: string;
}

export function LiveTranscriptDrawer({
  isOpen,
  onClose,
  messages,
  interviewerName,
}: LiveTranscriptDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg h-full bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/70">
          <div>
            <h3 className="text-base font-bold text-white">Interview Transcript</h3>
            <p className="text-xs text-zinc-400">
              Live log of questions, answers, and evaluations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transcript Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-zinc-500 text-sm">
              No interview records yet.
            </div>
          ) : (
            messages.map((m, idx) => (
              <div
                key={m.id || idx}
                className={`p-4 rounded-xl border text-sm leading-relaxed ${
                  m.isUser
                    ? "bg-zinc-800/80 border-zinc-700/80 text-zinc-200"
                    : m.isQuestion
                      ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-100"
                      : "bg-zinc-950/70 border-zinc-800 text-zinc-300"
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    {m.isUser ? (
                      <>
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-blue-300">Your Response</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">
                          {interviewerName} {m.isQuestion ? "(Question)" : "(Feedback)"}
                        </span>
                      </>
                    )}
                  </span>
                  {m.assessment?.score !== undefined && (
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Score: {m.assessment.score}%
                    </span>
                  )}
                </div>

                {/* Content */}
                <p className="whitespace-pre-wrap">{m.content}</p>

                {/* Structured Assessment (if available) */}
                {m.assessment && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2 text-xs">
                    {m.assessment.strengths && m.assessment.strengths.length > 0 && (
                      <div>
                        <span className="font-semibold text-emerald-400 flex items-center gap-1 mb-1">
                          <CheckCircle2 className="w-3 h-3" /> Key Strengths:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-zinc-400 pl-1">
                          {m.assessment.strengths.map((s, si) => (
                            <li key={si}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {m.assessment.weaknesses && m.assessment.weaknesses.length > 0 && (
                      <div>
                        <span className="font-semibold text-amber-400 flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3 h-3" /> Areas for Improvement:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-zinc-400 pl-1">
                          {m.assessment.weaknesses.map((w, wi) => (
                            <li key={wi}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {m.assessment.action && (
                      <div className="flex items-center gap-1.5 text-zinc-400 pt-1">
                        <ArrowRight className="w-3 h-3 text-cyan-400" />
                        <span>
                          Next step:{" "}
                          <strong className="text-zinc-200">
                            {m.assessment.action === "FOLLOW_UP"
                              ? "Contextual Follow-Up"
                              : "New Topic Transition"}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
