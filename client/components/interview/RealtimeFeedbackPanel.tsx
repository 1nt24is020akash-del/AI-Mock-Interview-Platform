"use client";

import React from "react";
import { DeviceStatus, InterviewMetrics } from "./types";
import { CheckCircle2, XCircle, ShieldCheck, Activity, Brain, MessageSquare, Gauge } from "lucide-react";

interface RealtimeFeedbackPanelProps {
  metrics: InterviewMetrics;
  deviceStatus: DeviceStatus;
  domain: string;
}

export function RealtimeFeedbackPanel({
  metrics,
  deviceStatus,
  domain,
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

      {/* Device Verification Checklist */}
      <div className="pt-2 border-t border-zinc-800/80">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Session Verification
        </p>
        <div className="grid grid-cols-3 gap-2">
          {/* Camera Checklist */}
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-[11px]">
            {deviceStatus.cameraActive && !deviceStatus.isVideoOff ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            )}
            <span className={deviceStatus.cameraActive && !deviceStatus.isVideoOff ? "text-zinc-200 font-medium" : "text-zinc-500"}>
              Webcam
            </span>
          </div>

          {/* Mic Checklist */}
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-[11px]">
            {deviceStatus.micActive && !deviceStatus.isMuted ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            )}
            <span className={deviceStatus.micActive && !deviceStatus.isMuted ? "text-zinc-200 font-medium" : "text-zinc-500"}>
              Microphone
            </span>
          </div>

          {/* Screen Share Checklist */}
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-[11px]">
            {deviceStatus.screenShareActive ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            )}
            <span className={deviceStatus.screenShareActive ? "text-zinc-200 font-medium" : "text-zinc-500"}>
              Screen
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
