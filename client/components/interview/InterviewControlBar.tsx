"use client";

import React from "react";
import { DeviceStatus } from "./types";
import {
  Mic,
  Video,
  ScreenShare,
  Volume2,
  VolumeX,
  MessageSquare,
  PhoneOff,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface InterviewControlBarProps {
  deviceStatus: DeviceStatus;
  isVoiceMuted: boolean;
  transcriptCount: number;
  onToggleScreenShare: () => void;
  onToggleVoiceMute: () => void;
  onToggleTranscript: () => void;
  onEndInterview: () => void;
}

export function InterviewControlBar({
  deviceStatus,
  isVoiceMuted,
  transcriptCount,
  onToggleScreenShare,
  onToggleVoiceMute,
  onToggleTranscript,
  onEndInterview,
}: InterviewControlBarProps) {
  return (
    <div className="flex items-center justify-center p-2 sm:p-3">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 py-2.5 rounded-full bg-zinc-900/95 border border-zinc-700/80 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
        {/* Permanent Camera Status Indicator */}
        <div
          title="Camera is permanently active for this interview session"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border select-none ${
            deviceStatus.cameraActive && !deviceStatus.isVideoOff
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/15 border-rose-500/40 text-rose-400 animate-pulse"
          }`}
        >
          {deviceStatus.cameraActive && !deviceStatus.isVideoOff ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Camera Active</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Camera Required</span>
            </>
          )}
        </div>

        {/* Permanent Microphone Status Indicator */}
        <div
          title="Microphone is permanently active for this interview session"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border select-none ${
            deviceStatus.micActive && !deviceStatus.isMuted
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/15 border-rose-500/40 text-rose-400 animate-pulse"
          }`}
        >
          {deviceStatus.micActive && !deviceStatus.isMuted ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mic Active</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Mic Required</span>
            </>
          )}
        </div>

        {/* Screen Share Status / Action Button */}
        <button
          onClick={onToggleScreenShare}
          title={deviceStatus.screenShareActive ? "Screen is being shared" : "Share entire screen"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            deviceStatus.screenShareActive
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
              : "bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 animate-pulse"
          }`}
        >
          <ScreenShare className="w-3.5 h-3.5" />
          <span>{deviceStatus.screenShareActive ? "Screen Shared" : "Share Screen"}</span>
        </button>

        {/* Vertical Divider */}
        <div className="h-6 w-[1px] bg-zinc-700/60 mx-1 hidden sm:block" />

        {/* AI Voice Mute/Unmute Toggle */}
        <button
          onClick={onToggleVoiceMute}
          title={isVoiceMuted ? "Unmute AI Voice" : "Mute AI Voice"}
          className={`p-2.5 sm:p-3 rounded-full transition-all duration-200 flex items-center justify-center ${
            !isVoiceMuted
              ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              : "bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30"
          }`}
        >
          {!isVoiceMuted ? (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        {/* Transcript Drawer Toggle Button */}
        <button
          onClick={onToggleTranscript}
          title="View Interview Transcript"
          className="relative p-2.5 sm:p-3 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all duration-200 flex items-center justify-center"
        >
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          {transcriptCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[10px] font-bold text-black flex items-center justify-center">
              {transcriptCount}
            </span>
          )}
        </button>

        {/* Vertical Divider */}
        <div className="h-6 w-[1px] bg-zinc-700/60 mx-1" />

        {/* End Interview Button */}
        <button
          onClick={onEndInterview}
          title="Exit and complete interview session"
          className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-900/40 transition-all hover:scale-105 active:scale-95"
        >
          <PhoneOff className="w-4 h-4" />
          <span>End Session</span>
        </button>
      </div>
    </div>
  );
}
