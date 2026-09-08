"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { DeviceStatus } from "./types";

export function useMediaEngine() {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    cameraActive: false,
    micActive: false,
    screenShareActive: false,
    cameraPermission: "prompt",
    micPermission: "prompt",
    screenPermission: "prompt",
    isMuted: false,
    isVideoOff: false,
  });

  const [micVolume, setMicVolume] = useState<number>(0);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Setup Web Audio Analyser on an audio stream
  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const source = ctx.createMediaStreamSource(new MediaStream([audioTrack]));
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(normalized);
        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn("AudioContext analyzer setup failed:", err);
    }
  }, []);

  // Initialize Camera & Microphone
  const startCameraAndMic = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setDeviceStatus((prev) => ({
        ...prev,
        cameraPermission: "unsupported",
        micPermission: "unsupported",
      }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      webcamStreamRef.current = stream;
      setWebcamStream(stream);
      setupAudioAnalyser(stream);

      setDeviceStatus((prev) => ({
        ...prev,
        cameraActive: true,
        micActive: true,
        cameraPermission: "granted",
        micPermission: "granted",
        isVideoOff: false,
        isMuted: false,
      }));
    } catch (err: unknown) {
      console.warn("Camera/Mic getUserMedia error:", err);
      const isDenied = err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      setDeviceStatus((prev) => ({
        ...prev,
        cameraActive: false,
        micActive: false,
        cameraPermission: isDenied ? "denied" : "unsupported",
        micPermission: isDenied ? "denied" : "unsupported",
      }));
    }
  }, [setupAudioAnalyser]);

  // Request Full Screen Sharing
  const startScreenShare = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      setDeviceStatus((prev) => ({
        ...prev,
        screenPermission: "unsupported",
      }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor", // Prompts for entire screen
        },
        audio: false,
      });

      screenStreamRef.current = stream;
      setScreenStream(stream);

      // Listen for browser's native "Stop sharing" bar
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }

      setDeviceStatus((prev) => ({
        ...prev,
        screenShareActive: true,
        screenPermission: "granted",
      }));
    } catch (err: unknown) {
      console.warn("Screen share error:", err);
      const isDenied = err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      setDeviceStatus((prev) => ({
        ...prev,
        screenShareActive: false,
        screenPermission: isDenied ? "denied" : "prompt",
      }));
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setDeviceStatus((prev) => ({
      ...prev,
      screenShareActive: false,
    }));
  }, []);

  // Toggle Camera
  const toggleCamera = useCallback(async () => {
    if (!webcamStreamRef.current) {
      await startCameraAndMic();
      return;
    }

    const videoTrack = webcamStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setDeviceStatus((prev) => ({
        ...prev,
        isVideoOff: !videoTrack.enabled,
        cameraActive: videoTrack.enabled,
      }));
    }
  }, [startCameraAndMic]);

  // Toggle Microphone
  const toggleMic = useCallback(() => {
    if (!webcamStreamRef.current) return;

    const audioTrack = webcamStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setDeviceStatus((prev) => ({
        ...prev,
        isMuted: !audioTrack.enabled,
        micActive: audioTrack.enabled,
      }));
      if (!audioTrack.enabled) {
        setMicVolume(0);
      }
    }
  }, []);

  // Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (deviceStatus.screenShareActive) {
      stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [deviceStatus.screenShareActive, startScreenShare, stopScreenShare]);

  // Initial media request on mount
  useEffect(() => {
    startCameraAndMic();

    return () => {
      // Cleanup all media tracks on unmount
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [startCameraAndMic]);

  return {
    deviceStatus,
    micVolume,
    webcamStream,
    screenStream,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
    startScreenShare,
    startCameraAndMic,
  };
}
