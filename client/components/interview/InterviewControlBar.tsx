"use client";

import React from "react";
import { DeviceStatus } from "./types";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Volume2,
  VolumeX,
  MessageSquare,
  PhoneOff,
} from "lucide-react";

interface InterviewControlBarProps {
  deviceStatus: DeviceStatus;
  isVoiceMuted: boolean;
  transcriptCount: number;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleVoiceMute: () => void;
  onToggleTranscript: () => void;
  onEndInterview: () => void;
}

export function InterviewControlBar({
  deviceStatus,
  isVoiceMuted,
  transcriptCount,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleVoiceMute,
  onToggleTranscript,
  onEndInterview,
}: InterviewControlBarProps) {
  return (
    <div className="flex items-center justify-center p-3">
      <div className="flex items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
        {/* Microphone Toggle Button */}
        <button
          onClick={onToggleMic}
          title={deviceStatus.isMuted ? "Unmute Microphone" : "Mute Microphone"}
          className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center ${
            !deviceStatus.isMuted && deviceStatus.micActive
              ? "bg-zinc-800 text-emerald-400 hover:bg-zinc-700 ring-1 ring-emerald-500/30"
              : "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
          }`}
        >
          {!deviceStatus.isMuted && deviceStatus.micActive ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
        </button>

        {/* Camera Toggle Button */}
        <button
          onClick={onToggleCamera}
          title={deviceStatus.isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
          className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center ${
            !deviceStatus.isVideoOff && deviceStatus.cameraActive
              ? "bg-zinc-800 text-emerald-400 hover:bg-zinc-700 ring-1 ring-emerald-500/30"
              : "bg-zinc-800/80 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
          }`}
        >
          {!deviceStatus.isVideoOff && deviceStatus.cameraActive ? (
            <Video className="w-5 h-5" />
          ) : (
            <VideoOff className="w-5 h-5" />
          )}
        </button>

        {/* Screen Share Button */}
        <button
          onClick={onToggleScreenShare}
          title={deviceStatus.screenShareActive ? "Stop Sharing Screen" : "Share Entire Screen"}
          className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center ${
            deviceStatus.screenShareActive
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          <ScreenShare className="w-5 h-5" />
        </button>

        {/* Vertical Divider */}
        <div className="h-6 w-[1px] bg-zinc-700/60 mx-1 hidden sm:block" />

        {/* AI Voice Toggle Button */}
        <button
          onClick={onToggleVoiceMute}
          title={isVoiceMuted ? "Unmute AI Voice" : "Mute AI Voice"}
          className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center ${
            !isVoiceMuted
              ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              : "bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30"
          }`}
        >
          {!isVoiceMuted ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>

        {/* Transcript Drawer Toggle Button */}
        <button
          onClick={onToggleTranscript}
          title="Toggle Interview Transcript"
          className="relative p-3 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all duration-200 flex items-center justify-center"
        >
          <MessageSquare className="w-5 h-5" />
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
          title="Exit / End Interview"
          className="px-4 sm:px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-900/30 transition-all hover:scale-105 active:scale-95"
        >
          <PhoneOff className="w-4 h-4" />
          <span>End Session</span>
        </button>
      </div>
    </div>
  );
}
