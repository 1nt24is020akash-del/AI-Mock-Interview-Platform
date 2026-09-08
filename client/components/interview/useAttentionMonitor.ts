"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { IntegrityEvent, IntegrityEventType, IntegrityReport, IntegrityWarning } from "./types";

interface UseAttentionMonitorProps {
  isActive: boolean;
  webcamStream: MediaStream | null;
  screenStream: MediaStream | null;
  onSpeakWarning?: (warningMessage: string) => void;
}

export const MAX_ATTENTION_VIOLATIONS = 3;

export function useAttentionMonitor({
  isActive,
  webcamStream,
  screenStream,
  onSpeakWarning,
}: UseAttentionMonitorProps) {
  const [tabSwitches, setTabSwitches] = useState<number>(0);
  const [fullscreenExits, setFullscreenExits] = useState<number>(0);
  const [faceNotDetectedCount, setFaceNotDetectedCount] = useState<number>(0);
  const [multipleFacesCount, setMultipleFacesCount] = useState<number>(0);
  const [attentionWarnings, setAttentionWarnings] = useState<number>(0);
  const [screenShareInterruptions, setScreenShareInterruptions] = useState<number>(0);
  const [activeWarning, setActiveWarning] = useState<IntegrityWarning | null>(null);
  const [events, setEvents] = useState<IntegrityEvent[]>([]);

  // Live real-time checklist states
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(true);
  const [isSinglePerson, setIsSinglePerson] = useState<boolean>(true);
  const [isLookingAtScreen, setIsLookingAtScreen] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const lastSpokenWarningTimeRef = useRef<number>(0);
  const videoElemRef = useRef<HTMLVideoElement | null>(null);
  const canvasElemRef = useRef<HTMLCanvasElement | null>(null);
  const consecutiveNoFaceRef = useRef<number>(0);
  const consecutiveMultiFaceRef = useRef<number>(0);
  const consecutiveLookAwayRef = useRef<number>(0);

  // Helper to trigger warning banner and throttled AI speech
  const triggerWarning = useCallback(
    (type: IntegrityEventType, title: string, message: string, spokenText: string, severity: "LOW" | "MEDIUM" | "HIGH") => {
      const now = Date.now();
      const newEvent: IntegrityEvent = {
        id: `${type}-${now}`,
        type,
        timestamp: new Date(),
        severity,
        message,
      };

      setEvents((prev) => [...prev.slice(-30), newEvent]);
      setActiveWarning({
        type,
        title,
        message,
        timestamp: now,
      });

      // Throttle AI spoken alert (at least 9 seconds between spoken warnings)
      if (now - lastSpokenWarningTimeRef.current > 9000 && onSpeakWarning) {
        lastSpokenWarningTimeRef.current = now;
        onSpeakWarning(spokenText);
      }
    },
    [onSpeakWarning]
  );

  // 1. Tab Switch & Visibility Change Monitoring
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setTabSwitches((c) => c + 1);
        setAttentionWarnings((w) => w + 1);
        triggerWarning(
          "TAB_SWITCH",
          "Tab Switch Detected",
          "Please return to the interview window. Leaving the interview is not permitted.",
          "Please return to the interview window. Your active attention is required to continue.",
          "HIGH"
        );
      }
    };

    const handleWindowBlur = () => {
      if (document.visibilityState === "visible") {
        setAttentionWarnings((w) => w + 1);
        triggerWarning(
          "WINDOW_BLUR",
          "Focus Lost",
          "Interview window lost focus. Please click back into the interview.",
          "Please refocus on the interview window.",
          "MEDIUM"
        );
      }
    };

    const handleFullscreenChange = () => {
      const currentlyFullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(currentlyFullscreen);

      if (!currentlyFullscreen && isActive) {
        setFullscreenExits((c) => c + 1);
        setAttentionWarnings((w) => w + 1);
        triggerWarning(
          "FULLSCREEN_EXIT",
          "Fullscreen Mode Exited",
          "Please re-enter fullscreen mode to maintain session integrity.",
          "Fullscreen mode was exited. Please remain in fullscreen during the interview.",
          "MEDIUM"
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Initial fullscreen state
    setIsFullscreen(Boolean(document.fullscreenElement));

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isActive, triggerWarning]);

  // 2. Screen Share Interruption Monitor
  useEffect(() => {
    if (!isActive || !screenStream) return;

    const track = screenStream.getVideoTracks()[0];
    if (!track) return;

    const handleTrackEnded = () => {
      setScreenShareInterruptions((c) => c + 1);
      setAttentionWarnings((w) => w + 1);
      triggerWarning(
        "SCREEN_SHARE_STOPPED",
        "Screen Sharing Stopped",
        "Screen sharing was interrupted. Please restore screen sharing to continue the interview.",
        "Screen sharing was interrupted. Please share your screen again.",
        "HIGH"
      );
    };

    track.addEventListener("ended", handleTrackEnded);

    return () => {
      track.removeEventListener("ended", handleTrackEnded);
    };
  }, [isActive, screenStream, triggerWarning]);

  // 3. Camera-based Face & Attention Visual Analyzer
  useEffect(() => {
    if (!isActive || !webcamStream) return;

    // Create offscreen video and canvas elements if not existing
    if (!videoElemRef.current) {
      const v = document.createElement("video");
      v.autoplay = true;
      v.muted = true;
      v.playsInline = true;
      videoElemRef.current = v;
    }
    if (!canvasElemRef.current) {
      const c = document.createElement("canvas");
      c.width = 120;
      c.height = 90;
      canvasElemRef.current = c;
    }

    const video = videoElemRef.current;
    const canvas = canvasElemRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    video.srcObject = webcamStream;

    let intervalId: NodeJS.Timeout | null = null;

    // Shape Detection API type definition
    interface FaceDetectionResult {
      boundingBox: DOMRectReadOnly;
    }
    interface WindowWithFaceDetector extends Window {
      FaceDetector?: new (options?: { maxDetectedFaces?: number; fastMode?: boolean }) => {
        detect: (image: HTMLVideoElement) => Promise<FaceDetectionResult[]>;
      };
    }

    const winWithFD = typeof window !== "undefined" ? (window as unknown as WindowWithFaceDetector) : null;
    const hasNativeFaceDetector = Boolean(winWithFD?.FaceDetector);
    let nativeDetector: { detect: (image: HTMLVideoElement) => Promise<FaceDetectionResult[]> } | null = null;
    if (hasNativeFaceDetector && winWithFD?.FaceDetector) {
      try {
        nativeDetector = new winWithFD.FaceDetector({ maxDetectedFaces: 4, fastMode: true });
      } catch {
        nativeDetector = null;
      }
    }

    const analyzeFrame = async () => {
      if (!isActive || !video || video.readyState < 2 || !ctx) return;

      try {
        // Method A: Native Chrome FaceDetector API
        if (nativeDetector) {
          const faces = await nativeDetector.detect(video);
          if (faces.length === 0) {
            consecutiveNoFaceRef.current += 1;
            consecutiveMultiFaceRef.current = 0;
            setIsFaceDetected(false);

            if (consecutiveNoFaceRef.current >= 6) { // ~5 seconds
              setFaceNotDetectedCount((c) => c + 1);
              setAttentionWarnings((w) => w + 1);
              triggerWarning(
                "FACE_NOT_DETECTED",
                "Candidate Not Detected",
                "Please ensure your face is clearly visible in the camera frame.",
                "I cannot detect you in the camera frame. Please remain visible to continue.",
                "HIGH"
              );
              consecutiveNoFaceRef.current = 0;
            }
          } else if (faces.length > 1) {
            consecutiveMultiFaceRef.current += 1;
            consecutiveNoFaceRef.current = 0;
            setIsSinglePerson(false);

            if (consecutiveMultiFaceRef.current >= 4) { // ~3 seconds
              setMultipleFacesCount((c) => c + 1);
              setAttentionWarnings((w) => w + 1);
              triggerWarning(
                "MULTIPLE_FACES",
                "Multiple People Detected",
                "Multiple people detected in frame. Please ensure you are alone for this interview.",
                "I detected another person in the camera frame. Please make sure you are the only person participating.",
                "HIGH"
              );
              consecutiveMultiFaceRef.current = 0;
            }
          } else {
            // Exactly 1 face
            consecutiveNoFaceRef.current = 0;
            consecutiveMultiFaceRef.current = 0;
            setIsFaceDetected(true);
            setIsSinglePerson(true);

            // Check head position / gaze deviation
            const faceBox = faces[0].boundingBox;
            const videoWidth = video.videoWidth || 640;
            const faceCenterX = faceBox.x + faceBox.width / 2;
            const relativeOffset = Math.abs(faceCenterX - videoWidth / 2) / (videoWidth / 2);

            if (relativeOffset > 0.48) { // Turn away
              consecutiveLookAwayRef.current += 1;
              setIsLookingAtScreen(false);
              if (consecutiveLookAwayRef.current >= 6) {
                setAttentionWarnings((w) => w + 1);
                triggerWarning(
                  "LOOKING_AWAY",
                  "Attention Warning",
                  "Please keep your focus centered on the interview window.",
                  "Please keep your attention on the interview and continue when you are ready.",
                  "MEDIUM"
                );
                consecutiveLookAwayRef.current = 0;
              }
            } else {
              consecutiveLookAwayRef.current = 0;
              setIsLookingAtScreen(true);
            }
          }
          return;
        }

        // Method B: High-performance Canvas Pixel Analysis Fallback
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        let skinPixelCount = 0;
        let sumX = 0;
        let leftSideCount = 0;
        let rightSideCount = 0;
        const midX = canvas.width / 2;

        for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const pixelIndex = i / 4;
          const x = pixelIndex % canvas.width;

          // Standard RGB skin-chroma filter (works across lighting & human skin tones)
          const isSkin =
            r > 60 &&
            g > 40 &&
            b > 20 &&
            r > g &&
            r > b &&
            Math.abs(r - g) > 12 &&
            r - b > 15;

          if (isSkin) {
            skinPixelCount++;
            sumX += x;
            if (x < midX - 10) leftSideCount++;
            else if (x > midX + 10) rightSideCount++;
          }
        }

        const totalSampled = data.length / 16;
        const skinRatio = skinPixelCount / totalSampled;

        if (skinRatio < 0.04) {
          // Camera covered or candidate walked away
          consecutiveNoFaceRef.current += 1;
          setIsFaceDetected(false);

          if (consecutiveNoFaceRef.current >= 6) {
            setFaceNotDetectedCount((c) => c + 1);
            setAttentionWarnings((w) => w + 1);
            triggerWarning(
              "FACE_NOT_DETECTED",
              "Candidate Not Detected",
              "Please ensure you are visible in the camera frame.",
              "I cannot detect you in the camera frame. Please remain visible to continue.",
              "HIGH"
            );
            consecutiveNoFaceRef.current = 0;
          }
        } else {
          consecutiveNoFaceRef.current = 0;
          setIsFaceDetected(true);

          // Multiple people check: high simultaneous skin clusters on extreme left and right
          if (leftSideCount > totalSampled * 0.12 && rightSideCount > totalSampled * 0.12) {
            consecutiveMultiFaceRef.current += 1;
            setIsSinglePerson(false);
            if (consecutiveMultiFaceRef.current >= 5) {
              setMultipleFacesCount((c) => c + 1);
              setAttentionWarnings((w) => w + 1);
              triggerWarning(
                "MULTIPLE_FACES",
                "Multiple People Detected",
                "Multiple people detected in frame. Please ensure you are alone for this interview.",
                "I detected another person in the camera frame. Please make sure you are the only person participating.",
                "HIGH"
              );
              consecutiveMultiFaceRef.current = 0;
            }
          } else {
            consecutiveMultiFaceRef.current = 0;
            setIsSinglePerson(true);
          }

          // Centroid position (looking away or leaning out of screen)
          const avgX = skinPixelCount > 0 ? sumX / skinPixelCount : midX;
          const offsetRatio = Math.abs(avgX - midX) / midX;

          if (offsetRatio > 0.45) {
            consecutiveLookAwayRef.current += 1;
            setIsLookingAtScreen(false);
            if (consecutiveLookAwayRef.current >= 6) {
              setAttentionWarnings((w) => w + 1);
              triggerWarning(
                "LOOKING_AWAY",
                "Attention Warning",
                "Please keep your focus centered on the interview window.",
                "Please keep your attention on the interview and continue when you are ready.",
                "MEDIUM"
              );
              consecutiveLookAwayRef.current = 0;
            }
          } else {
            consecutiveLookAwayRef.current = 0;
            setIsLookingAtScreen(true);
          }
        }
      } catch {
        // Non-blocking catch on canvas read errors
      }
    };

    intervalId = setInterval(analyzeFrame, 800);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, webcamStream, triggerWarning]);

  // Dismiss active warning after 6 seconds
  useEffect(() => {
    if (!activeWarning) return;
    const timer = setTimeout(() => {
      setActiveWarning(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeWarning]);

  // Compile final integrity report
  const getIntegrityReport = useCallback((): IntegrityReport => {
    const totalViolations =
      tabSwitches +
      fullscreenExits +
      faceNotDetectedCount +
      multipleFacesCount +
      screenShareInterruptions;

    const integrityStatus =
      totalViolations > MAX_ATTENTION_VIOLATIONS ? "REVIEW_RECOMMENDED" : "VERIFIED";

    return {
      tabSwitches,
      fullscreenExits,
      faceNotDetectedCount,
      multipleFacesCount,
      attentionWarnings,
      screenShareInterruptions,
      integrityStatus,
      events,
    };
  }, [
    tabSwitches,
    fullscreenExits,
    faceNotDetectedCount,
    multipleFacesCount,
    attentionWarnings,
    screenShareInterruptions,
    events,
  ]);

  const clearActiveWarning = () => setActiveWarning(null);

  return {
    tabSwitches,
    fullscreenExits,
    faceNotDetectedCount,
    multipleFacesCount,
    attentionWarnings,
    screenShareInterruptions,
    activeWarning,
    events,
    isFaceDetected,
    isSinglePerson,
    isLookingAtScreen,
    isFullscreen,
    getIntegrityReport,
    clearActiveWarning,
  };
}
