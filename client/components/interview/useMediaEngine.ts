"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { DeviceStatus } from "./types";

export interface DeviceVerificationResult {
  cameraLive: boolean;
  micLive: boolean;
  screenLive: boolean;
  allLive: boolean;
}

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
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
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

  // STEP 2: Request Camera Only
  const requestCamera = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setDeviceStatus((prev) => ({
        ...prev,
        cameraPermission: "unsupported",
      }));
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) throw new Error("No video track returned");

      const existingAudio = webcamStreamRef.current
        ? webcamStreamRef.current.getAudioTracks()
        : [];
      const combined = new MediaStream([videoTrack, ...existingAudio]);
      webcamStreamRef.current = combined;
      setWebcamStream(combined);

      setDeviceStatus((prev) => ({
        ...prev,
        cameraActive: true,
        cameraPermission: "granted",
        isVideoOff: false,
      }));
      return true;
    } catch (err: unknown) {
      console.warn("Camera getUserMedia error:", err);
      const isDenied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      setDeviceStatus((prev) => ({
        ...prev,
        cameraActive: false,
        cameraPermission: isDenied ? "denied" : "unsupported",
      }));
      return false;
    }
  }, []);

  // STEP 3: Request Microphone Only
  const requestMicrophone = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setDeviceStatus((prev) => ({
        ...prev,
        micPermission: "unsupported",
      }));
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) throw new Error("No audio track returned");

      setupAudioAnalyser(stream);

      const existingVideo = webcamStreamRef.current
        ? webcamStreamRef.current.getVideoTracks()
        : [];
      const combined = new MediaStream([...existingVideo, audioTrack]);
      webcamStreamRef.current = combined;
      setWebcamStream(combined);

      setDeviceStatus((prev) => ({
        ...prev,
        micActive: true,
        micPermission: "granted",
        isMuted: false,
      }));
      return true;
    } catch (err: unknown) {
      console.warn("Microphone getUserMedia error:", err);
      const isDenied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      setDeviceStatus((prev) => ({
        ...prev,
        micActive: false,
        micPermission: isDenied ? "denied" : "unsupported",
      }));
      return false;
    }
  }, [setupAudioAnalyser]);

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

  // STEP 4: Request Full Screen Sharing
  const requestScreenShare = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      setDeviceStatus((prev) => ({
        ...prev,
        screenPermission: "unsupported",
      }));
      return false;
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

      // Listen for browser native "Stop sharing" bar
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
      return true;
    } catch (err: unknown) {
      console.warn("Screen share error:", err);
      const isDenied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      setDeviceStatus((prev) => ({
        ...prev,
        screenShareActive: false,
        screenPermission: isDenied ? "denied" : "prompt",
      }));
      return false;
    }
  }, [stopScreenShare]);

  // Backward compatibility alias for starting both
  const startCameraAndMic = useCallback(async () => {
    const camOk = await requestCamera();
    const micOk = await requestMicrophone();
    return camOk && micOk;
  }, [requestCamera, requestMicrophone]);

  // STEP 5: Verify All Devices are Actively Live
  const verifyDevicesActive = useCallback((): DeviceVerificationResult => {
    const isCamActive = Boolean(
      webcamStreamRef.current &&
        webcamStreamRef.current
          .getVideoTracks()
          .some((t) => t.readyState === "live" && t.enabled)
    );
    const isMicActive = Boolean(
      webcamStreamRef.current &&
        webcamStreamRef.current
          .getAudioTracks()
          .some((t) => t.readyState === "live" && t.enabled)
    );
    const isScreenActive = Boolean(
      screenStreamRef.current &&
        screenStreamRef.current
          .getVideoTracks()
          .some((t) => t.readyState === "live" && t.enabled)
    );

    return {
      cameraLive: isCamActive,
      micLive: isMicActive,
      screenLive: isScreenActive,
      allLive: isCamActive && isMicActive && isScreenActive,
    };
  }, []);

  // Stop All Media Tracks (Safe Cleanup)
  const stopAllTracks = useCallback(() => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
    setWebcamStream(null);

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setDeviceStatus((prev) => ({
      ...prev,
      cameraActive: false,
      micActive: false,
      screenShareActive: false,
    }));
  }, []);

  // Toggle Camera
  const toggleCamera = useCallback(async () => {
    if (!webcamStreamRef.current) {
      await requestCamera();
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
  }, [requestCamera]);

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
      await requestScreenShare();
    }
  }, [deviceStatus.screenShareActive, requestScreenShare, stopScreenShare]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllTracks();
    };
  }, [stopAllTracks]);

  return {
    deviceStatus,
    micVolume,
    webcamStream,
    screenStream,
    requestCamera,
    requestMicrophone,
    requestScreenShare,
    verifyDevicesActive,
    stopScreenShare,
    stopAllTracks,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
    startCameraAndMic,
    startScreenShare: requestScreenShare,
  };
}
