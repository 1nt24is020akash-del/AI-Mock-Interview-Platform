"use client";

import React, { useState } from "react";
import { AIPersona, AIStatus, AI_PERSONAS } from "./types";
import { Bot, Volume2, Sparkles, UserCheck, ChevronDown } from "lucide-react";

interface AIInterviewerCardProps {
  persona: AIPersona;
  onSelectPersona: (p: AIPersona) => void;
  status: AIStatus;
  isSpeaking: boolean;
  domain: string;
}

export function AIInterviewerCard({
  persona,
  onSelectPersona,
  status,
  isSpeaking,
  domain,
}: AIInterviewerCardProps) {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  // Soundwave equalizer bars configuration
  const equalizerBars = [14, 28, 42, 35, 48, 26, 38, 50, 32, 20, 44, 30];

  const getStatusBadge = () => {
    switch (status) {
      case "speaking":
        return {
          label: "Speaking...",
          bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          pulse: "bg-emerald-400",
        };
      case "listening":
        return {
          label: "Listening to you...",
          bg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
          pulse: "bg-cyan-400",
        };
      case "evaluating":
        return {
          label: "Evaluating response...",
          bg: "bg-purple-500/20 text-purple-400 border-purple-500/30",
          pulse: "bg-purple-400",
        };
      case "generating_followup":
        return {
          label: "Formulating follow-up...",
          bg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
          pulse: "bg-amber-400",
        };
      default:
        return {
          label: "Ready",
          bg: "bg-zinc-800/80 text-zinc-300 border-zinc-700/50",
          pulse: "bg-zinc-400",
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div
      className={`relative w-full h-[320px] sm:h-[380px] md:h-[420px] rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border transition-all duration-500 flex flex-col justify-between p-4 sm:p-5 ${
        isSpeaking
          ? "border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.18)] ring-2 ring-emerald-500/30"
          : "border-zinc-800 shadow-xl"
      }`}
    >
      {/* Background Ambient Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${persona.avatarBg} opacity-40 blur-3xl pointer-events-none transition-all duration-700`}
      />

      {/* Top Bar inside Video Card */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {/* Interviewer Persona Tag */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 hover:border-zinc-500 text-xs font-medium text-zinc-200 transition-all group"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span>{persona.name}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-zinc-200 transition-transform" />
          </button>

          {/* Persona Switcher Dropdown */}
          {showPersonaMenu && (
            <div className="absolute left-0 top-full mt-2 w-64 p-2 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 shadow-2xl z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Select AI Interviewer
              </div>
              {Object.values(AI_PERSONAS).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPersona(p);
                    setShowPersonaMenu(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors ${
                    p.id === persona.id
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-white"
                      : "hover:bg-zinc-800 text-zinc-300"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full bg-gradient-to-br ${p.avatarBg} border border-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
                  >
                    {p.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{p.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{p.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md transition-all duration-300 ${statusBadge.bg}`}
        >
          <span className={`w-2 h-2 rounded-full ${statusBadge.pulse} animate-pulse`} />
          <span>{statusBadge.label}</span>
        </div>
      </div>

      {/* Center Avatar Visualization */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-2">
        <div className="relative">
          {/* Pulsing Aura rings when AI is speaking */}
          {isSpeaking && (
            <>
              <div className="absolute -inset-4 rounded-full bg-emerald-500/20 blur-md animate-ping pointer-events-none" />
              <div className="absolute -inset-2 rounded-full border-2 border-emerald-500/40 animate-pulse pointer-events-none" />
            </>
          )}

          {/* Avatar Container */}
          <div
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1.5 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 border-2 transition-all duration-500 shadow-2xl flex items-center justify-center overflow-hidden ${
              isSpeaking ? "border-emerald-400 scale-105" : "border-zinc-700"
            }`}
          >
            {/* Persona Visual Representation */}
            <div className="w-full h-full rounded-full bg-gradient-to-b from-zinc-800 to-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Silhouette / Portrait Styling */}
              <div className="absolute -bottom-2 w-20 h-16 rounded-t-full bg-zinc-700/60 border border-zinc-600/40 flex items-center justify-center" />
              <div className="w-11 h-11 rounded-full bg-zinc-600/80 border border-zinc-500/50 mb-4 flex items-center justify-center text-zinc-200 font-bold text-lg shadow-inner">
                {persona.name.split(" ")[0][0]}
                {persona.name.split(" ")[1]?.[0] || ""}
              </div>

              {/* Speaking Voice Waves Overlay */}
              {isSpeaking && (
                <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] flex items-center justify-center">
                  <Volume2 className="w-8 h-8 text-emerald-400 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Persona Details */}
        <div className="text-center mt-3 space-y-0.5">
          <div className="flex items-center justify-center gap-1.5">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
              {persona.name}
            </h3>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
              <Sparkles className="w-3 h-3" />
              AI
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium max-w-[280px] mx-auto truncate">
            {persona.title}
          </p>
        </div>

        {/* Animated Equalizer Soundwave Bars */}
        <div className="h-8 flex items-center justify-center gap-1 mt-2">
          {equalizerBars.map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${
                isSpeaking
                  ? "bg-gradient-to-t from-emerald-500 to-teal-300 animate-pulse"
                  : "bg-zinc-700/50 h-1.5"
              }`}
              style={{
                height: isSpeaking ? `${Math.max(4, (height * (1 + Math.sin(i * 0.8 + Date.now() / 200))) % 28)}px` : "4px",
                animationDelay: `${i * 70}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom Bar inside Video Card */}
      <div className="relative z-10 flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-zinc-300">Google Meet Audio • HD</span>
        </div>
        <div className="flex items-center gap-1 bg-zinc-800/60 px-2.5 py-0.5 rounded-full border border-zinc-700/50 text-[11px] text-zinc-300 font-mono">
          <span>{domain}</span>
        </div>
      </div>
    </div>
  );
}
