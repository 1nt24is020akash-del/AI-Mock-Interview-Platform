"use client";

import React, { useEffect, useRef, useState } from "react";
import { DeviceStatus } from "./types";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  ScreenShare,
  Maximize2,
  Minimize2,
  AlertCircle,
  Wifi,
  User,
} from "lucide-react";

interface CandidateVideoCardProps {
  webcamStream: MediaStream | null;
  screenStream: MediaStream | null;
  deviceStatus: DeviceStatus;
  micVolume: number;
  candidateName?: string;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleScreenShare: () => void;
}

export function CandidateVideoCard({
  webcamStream,
  screenStream,
  deviceStatus,
  micVolume,
  candidateName = "Candidate",
  onToggleCamera,
  onToggleMic,
  onToggleScreenShare,
}: CandidateVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isScreenExpanded, setIsScreenExpanded] = useState(false);

  // Attach webcam stream to video element
  useEffect(() => {
    if (videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  // Attach screen share stream to screen video element
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  return (
    <div className="relative w-full h-[320px] sm:h-[380px] md:h-[420px] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xl flex flex-col justify-between p-4 sm:p-5 group">
      {/* Live Webcam Stream Video Element */}
      {deviceStatus.cameraActive && !deviceStatus.isVideoOff && webcamStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover -scale-x-100 transition-transform duration-300"
        />
      ) : (
        /* Camera Off Fallback Placeholder */
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-zinc-900 to-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
              <User className="w-10 h-10 text-zinc-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400">
              <VideoOff className="w-3.5 h-3.5" />
            </div>
          </div>
          <h4 className="text-sm font-bold text-zinc-200">{candidateName}</h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-[220px]">
            {deviceStatus.cameraPermission === "denied"
              ? "Camera permission blocked. You can still speak or type."
              : "Camera is currently turned off."}
          </p>
          <button
            onClick={onToggleCamera}
            className="mt-3 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-300 transition-colors flex items-center gap-1.5"
          >
            <Video className="w-3.5 h-3.5" />
            Enable Camera
          </button>
        </div>
      )}

      {/* Screen Sharing Picture-in-Picture Tile (if active) */}
      {deviceStatus.screenShareActive && screenStream && (
        <div
          className={`absolute z-20 transition-all duration-300 rounded-xl overflow-hidden border border-zinc-700/80 bg-zinc-900 shadow-2xl ${
            isScreenExpanded
              ? "inset-2 sm:inset-4"
              : "right-3 bottom-14 w-36 sm:w-44 h-24 sm:h-28"
          }`}
        >
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
            <ScreenShare className="w-2.5 h-2.5" />
            <span>Screen Live</span>
          </div>
          <button
            onClick={() => setIsScreenExpanded(!isScreenExpanded)}
            className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 hover:bg-black/90 text-zinc-300 transition-colors"
          >
            {isScreenExpanded ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </button>
        </div>
      )}

      {/* Top Bar inside Video Tile */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {/* Candidate Identifier Badge with Audio Visualizer Ring */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            {micVolume > 5 && !deviceStatus.isMuted && (
              <span
                className="absolute w-5 h-5 rounded-full bg-emerald-500/40 animate-ping"
                style={{ transform: `scale(${1 + micVolume / 50})` }}
              />
            )}
          </div>
          <span className="truncate max-w-[130px]">{candidateName} (You)</span>
        </div>

        {/* Network & Proctored Connection Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-zinc-300">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span>HD 1080p</span>
        </div>
      </div>

      {/* Bottom Bar: Live Device Verification Status Pills */}
      <div className="relative z-10 flex items-center justify-between text-xs pt-2 border-t border-white/10 bg-gradient-to-t from-black/80 via-black/40 to-transparent -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 sm:px-4">
        {/* Device Status Checklist Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Camera Status */}
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
              deviceStatus.cameraActive && !deviceStatus.isVideoOff
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-zinc-800/80 border-zinc-700 text-zinc-400"
            }`}
          >
            {deviceStatus.cameraActive && !deviceStatus.isVideoOff ? (
              <Video className="w-3 h-3" />
            ) : (
              <VideoOff className="w-3 h-3 text-rose-400" />
            )}
            <span className="hidden sm:inline">Cam</span>
          </span>

          {/* Mic Status with Live Meter */}
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
              deviceStatus.micActive && !deviceStatus.isMuted
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/15 border-rose-500/30 text-rose-400"
            }`}
          >
            {deviceStatus.micActive && !deviceStatus.isMuted ? (
              <>
                <Mic className="w-3 h-3" />
                <span className="hidden sm:inline">Mic</span>
                {micVolume > 5 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </>
            ) : (
              <>
                <MicOff className="w-3 h-3" />
                <span className="hidden sm:inline">Muted</span>
              </>
            )}
          </span>

          {/* Screen Share Status */}
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
              deviceStatus.screenShareActive
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-zinc-800/80 border-zinc-700 text-zinc-400"
            }`}
          >
            <ScreenShare className="w-3 h-3" />
            <span className="hidden sm:inline">
              {deviceStatus.screenShareActive ? "Screen On" : "No Screen"}
            </span>
          </span>
        </div>

        {/* Live Mic Activity Visualizer bar */}
        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/5">
          <div className="w-12 sm:w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                micVolume > 50
                  ? "bg-emerald-400"
                  : micVolume > 15
                    ? "bg-teal-400"
                    : "bg-zinc-600"
              }`}
              style={{ width: `${deviceStatus.isMuted ? 0 : Math.min(100, micVolume * 1.5)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
