"use client";

import React from "react";
import { DeviceStatus, InterviewMetrics, IntegrityWarning } from "./types";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Activity,
  Brain,
  MessageSquare,
  Gauge,
  AlertTriangle,
  Eye,
  Maximize2,
  Users,
} from "lucide-react";

interface RealtimeFeedbackPanelProps {
  metrics: InterviewMetrics;
  deviceStatus: DeviceStatus;
  domain: string;
  isFaceDetected?: boolean;
  isSinglePerson?: boolean;
  isLookingAtScreen?: boolean;
  isFullscreen?: boolean;
  attentionWarnings?: number;
  activeWarning?: IntegrityWarning | null;
}

export function RealtimeFeedbackPanel({
  metrics,
  deviceStatus,
  domain,
  isFaceDetected = true,
  isSinglePerson = true,
  isLookingAtScreen = true,
  isFullscreen = false,
  attentionWarnings = 0,
  activeWarning,
}: RealtimeFeedbackPanelProps) {
  const metricBars = [
    {
      label: "Technical Depth",
      value: metrics.technicalScore,
      icon: Brain,
      color: "from-blue-500 to-cyan-400",
      textColor: "text-cyan-400",
    },
    {
      label: "Communication Clarity",
      value: metrics.communicationScore,
      icon: MessageSquare,
      color: "from-emerald-500 to-teal-400",
      textColor: "text-emerald-400",
    },
    {
      label: "Confidence & Fluency",
      value: metrics.confidenceScore,
      icon: Gauge,
      color: "from-purple-500 to-indigo-400",
      textColor: "text-purple-400",
    },
    {
      label: "Explanation Quality",
      value: metrics.clarityScore,
      icon: Activity,
      color: "from-amber-500 to-orange-400",
      textColor: "text-amber-400",
    },
  ];

  return (
    <div className="w-full rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl p-4 sm:p-5 space-y-4 shadow-xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            Live Interview Health
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
          Real-Time
        </span>
      </div>

      {/* Metrics Sliders */}
      <div className="space-y-3">
        {metricBars.map((m, i) => {
          const IconComponent = m.icon;
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <IconComponent className="w-3.5 h-3.5 text-zinc-500" />
                  {m.label}
                </span>
                <span className={`font-mono font-bold ${m.textColor}`}>
                  {m.value}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${m.color} rounded-full transition-all duration-700`}
                  style={{ width: `${Math.max(5, Math.min(100, m.value))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Warning Banner (if triggered) */}
      {activeWarning && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 animate-in fade-in zoom-in-95 duration-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-bold text-amber-200">{activeWarning.title}</p>
            <p className="text-[11px] text-amber-300/90 leading-tight mt-0.5">
              {activeWarning.message}
            </p>
          </div>
        </div>
      )}

      {/* Interview Integrity Section */}
      <div className="pt-2 border-t border-zinc-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Interview Integrity
          </p>
          {attentionWarnings > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {attentionWarnings} alert{attentionWarnings > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {/* Camera Active */}
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
            {deviceStatus.cameraActive && !deviceStatus.isVideoOff ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            )}
            <span className={deviceStatus.cameraActive ? "text-zinc-200" : "text-rose-400 font-semibold"}>
              Camera Active
            </span>
          </div>

          {/* Microphone Active */}
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
            {deviceStatus.micActive && !deviceStatus.isMuted ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            )}
            <span className={deviceStatus.micActive ? "text-zinc-200" : "text-rose-400 font-semibold"}>
              Mic Active
            </span>
          </div>

          {/* Screen Shared */}
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
            {deviceStatus.screenShareActive ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            )}
            <span className={deviceStatus.screenShareActive ? "text-zinc-200" : "text-amber-400"}>
              {deviceStatus.screenShareActive ? "Screen Shared" : "Screen Stopped"}
            </span>
          </div>

          {/* Fullscreen Mode */}
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
            {isFullscreen ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            )}
            <span className={isFullscreen ? "text-zinc-200" : "text-amber-400"}>
              {isFullscreen ? "Fullscreen On" : "Fullscreen Off"}
            </span>
          </div>

          {/* Candidate Detected */}
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
            {isFaceDetected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            )}
            <span className={isFaceDetected ? "text-zinc-200" : "text-rose-400"}>
              {isFaceDetected ? "Face Visible" : "Face Not Visible"}
            </span>
          </div>

          {/* Single Person Detected */}
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
            {isSinglePerson ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <Users className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            )}
            <span className={isSinglePerson ? "text-zinc-200" : "text-rose-400"}>
              {isSinglePerson ? "Single Person" : "Multiple People"}
            </span>
          </div>
        </div>
      </div>

      {/* Domain Context & Pro Tip */}
      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-zinc-300 leading-relaxed">
        <span className="font-semibold text-emerald-400">💡 Interviewer Tip:</span> Think aloud as you formulate your response. Clear architectural reasoning and naming trade-offs improves your technical clarity score.
      </div>
    </div>
  );
}
