"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DifficultyLevel,
  Message,
  PerformanceLevel,
} from "@/components/ChatContainer";

import {
  AIPersona,
  AIStatus,
  AI_PERSONAS,
  InterviewMetrics,
  IntegrityReport,
} from "./interview/types";
import { useMediaEngine } from "./interview/useMediaEngine";
import { useSpeechEngine } from "./interview/useSpeechEngine";
import { useAttentionMonitor } from "./interview/useAttentionMonitor";
import { AIInterviewerCard } from "./interview/AIInterviewerCard";
import { CandidateVideoCard } from "./interview/CandidateVideoCard";
import { QuestionDisplayCard } from "./interview/QuestionDisplayCard";
import { RealtimeFeedbackPanel } from "./interview/RealtimeFeedbackPanel";
import { InterviewControlBar } from "./interview/InterviewControlBar";
import { LiveTranscriptDrawer } from "./interview/LiveTranscriptDrawer";

import {
  Mic,
  Send,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Maximize2,
  Video,
  ScreenShare,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sun,
  UserCheck,
  XCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

const TOTAL_QUESTIONS = 3;

const domainEmoji: Record<string, string> = {
  JavaScript: "⚡",
  "JavaScript/Node.js": "⚡",
  React: "⚛️",
  Python: "🐍",
  "Data Science": "📊",
  DevOps: "🚀",
  "System Design": "🏗️",
  "Database Design": "🗄️",
  General: "💼",
};

const difficultyBadgeConfig: Record<
  DifficultyLevel,
  { label: string; icon: string; style: string }
> = {
  EASY: {
    label: "Easy",
    icon: "🟢",
    style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  MEDIUM: {
    label: "Medium",
    icon: "🟡",
    style: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  HARD: {
    label: "Hard",
    icon: "🔴",
    style: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  },
};

export default function InterviewContent() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain") || "General";

  // Pre-Interview Setup & Fullscreen State
  const [hasStartedSession, setHasStartedSession] = useState<boolean>(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState<boolean>(false);

  // AI Interviewer State
  const [persona, setPersona] = useState<AIPersona>(AI_PERSONAS.sophia);
  const [aiStatus, setAiStatus] = useState<AIStatus>("ready");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionText, setCurrentQuestionText] = useState<string>("");
  const [isFollowUp, setIsFollowUp] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>("MEDIUM");
  const [difficultyProgression, setDifficultyProgression] = useState<
    { questionIndex: number; difficulty: DifficultyLevel; performance?: PerformanceLevel }[]
  >([{ questionIndex: 1, difficulty: "MEDIUM" }]);

  // Answer Input State (Voice + Text Hybrid)
  const [textInput, setTextInput] = useState<string>("");

  // Modals & Drawers
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [interviewScore, setInterviewScore] = useState<number | null>(null);
  const [finalIntegrityReport, setFinalIntegrityReport] = useState<IntegrityReport | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live Interview Metrics
  const [metrics, setMetrics] = useState<InterviewMetrics>({
    technicalScore: 75,
    communicationScore: 80,
    confidenceScore: 82,
    clarityScore: 78,
  });

  // Media Engine (Webcam, Mic, Screen Share)
  const {
    deviceStatus,
    micVolume,
    webcamStream,
    screenStream,
    requestCamera,
    requestMicrophone,
    requestScreenShare,
    verifyDevicesActive,
    stopAllTracks,
    toggleScreenShare,
  } = useMediaEngine();

  // Speech Engine (Text-to-Speech & Speech Recognition)
  const {
    isSpeaking,
    isVoiceMuted,
    isListening,
    interimTranscript,
    finalTranscript,
    isSTTSupported,
    speak,
    stopSpeaking,
    toggleVoiceMute,
    startListening,
    stopListening,
    clearTranscript,
    setFinalTranscript,
  } = useSpeechEngine(persona);

  // Attention & Integrity Monitor
  const {
    tabSwitches,
    fullscreenExits,
    faceNotDetectedCount,
    multipleFacesCount,
    attentionWarnings,
    screenShareInterruptions,
    activeWarning,
    isFaceDetected,
    isSinglePerson,
    isLookingAtScreen,
    isFullscreen,
    cameraBrightness,
    isLightingAdequate,
    getIntegrityReport,
  } = useAttentionMonitor({
    isActive: hasStartedSession && !isInterviewComplete,
    webcamStream,
    screenStream,
    onSpeakWarning: (warningMessage) => {
      speak(warningMessage);
    },
  });

  // Pre-Interview Setup Wizard State
  const [setupStage, setSetupStage] = useState<
    "idle" | "requesting_cam" | "requesting_mic" | "requesting_screen" | "verifying" | "ready" | "failed"
  >("idle");
  const [setupError, setSetupError] = useState<string>("");
  const setupVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (setupVideoRef.current && webcamStream) {
      setupVideoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  // Run sequential device checks (Steps 2-5)
  const runDeviceSetup = async () => {
    setSetupError("");

    // STEP 2: Request Camera
    setSetupStage("requesting_cam");
    const camOk = await requestCamera();
    if (!camOk) {
      setSetupStage("failed");
      setSetupError(
        "Camera access was denied or is unavailable. Please grant camera permissions in your browser and click Try Again."
      );
      return;
    }

    // STEP 3: Request Microphone
    setSetupStage("requesting_mic");
    const micOk = await requestMicrophone();
    if (!micOk) {
      setSetupStage("failed");
      setSetupError(
        "Microphone access was denied or is unavailable. Please grant microphone permissions in your browser and click Try Again."
      );
      return;
    }

    // STEP 4: Request Entire Screen Sharing
    setSetupStage("requesting_screen");
    const screenOk = await requestScreenShare();
    if (!screenOk) {
      setSetupStage("failed");
      setSetupError(
        "Screen sharing was cancelled or denied. Entire screen sharing is mandatory to conduct this proctored technical interview."
      );
      return;
    }

    // STEP 5: Verify all three are actively live
    setSetupStage("verifying");
    const verification = verifyDevicesActive();
    if (!verification.allLive) {
      setSetupStage("failed");
      setSetupError(
        "Device verification failed. Please ensure camera, microphone, and entire screen share are actively transmitting."
      );
      return;
    }

    // All hardware checks passed; now continuous vision and lighting validate
    setSetupStage("ready");
  };

  const isCamLive = deviceStatus.cameraActive && deviceStatus.cameraPermission === "granted";
  const isMicLive = deviceStatus.micActive && deviceStatus.micPermission === "granted";
  const isScreenLive = deviceStatus.screenShareActive && deviceStatus.screenPermission === "granted";
  const allDevicesLive = isCamLive && isMicLive && isScreenLive;

  const canBeginInterview =
    setupStage === "ready" &&
    allDevicesLive &&
    isFaceDetected &&
    isLightingAdequate;

  // 10-Second Answer Inactivity Watchdog State
  const [inactivityStrikes, setInactivityStrikes] = useState<number>(0);
  const [inactivityWarning, setInactivityWarning] = useState<string | null>(null);
  const [terminationReason, setTerminationReason] = useState<string | null>(null);
  const lastActivityTimestampRef = useRef<number>(Date.now());
  const strikesRef = useRef<number>(0);
  strikesRef.current = inactivityStrikes;

  // Candidate activity tracking (typing, voice recognition, or sound)
  useEffect(() => {
    if (textInput.trim().length > 0 || interimTranscript.trim().length > 0 || micVolume > 15) {
      lastActivityTimestampRef.current = Date.now();
      if (inactivityWarning) {
        setInactivityWarning(null);
      }
    }
  }, [textInput, interimTranscript, micVolume, inactivityWarning]);

  // Strike 3 Inactivity Termination Handler
  const handleTimeoutTermination = useCallback(async () => {
    stopSpeaking();
    stopListening();
    setAiStatus("ready");

    const reason = "Interview ended because no answer was provided after multiple attempts.";

    // AI speaks termination notice
    speak("I haven't received an answer after several attempts, so I'll end the interview now.");

    // Exit fullscreen
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    // Stop media streams
    stopAllTracks();

    const currentIntegrityReport = getIntegrityReport();
    try {
      if (sessionId) {
        await axiosInstance.post("/api/interviews/terminate", {
          sessionId,
          reason,
          integrityReport: currentIntegrityReport,
        });
      }
    } catch (err) {
      console.warn("Backend terminate error:", err);
    }

    setInterviewScore(0);
    setFinalIntegrityReport(currentIntegrityReport);
    setTerminationReason(reason);
    setIsInterviewComplete(true);
  }, [stopSpeaking, stopListening, stopAllTracks, getIntegrityReport, sessionId, speak]);

  // 10-Second Inactivity Watchdog
  useEffect(() => {
    if (!hasStartedSession || isInterviewComplete || aiStatus !== "listening" || isLoading) {
      return;
    }

    lastActivityTimestampRef.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = (Date.now() - lastActivityTimestampRef.current) / 1000;

      if (elapsed >= 10) {
        const currentStrike = strikesRef.current;
        lastActivityTimestampRef.current = Date.now();

        if (currentStrike === 0) {
          // STRIKE 1
          setInactivityStrikes(1);
          setInactivityWarning("Please answer the question. (Attempt 1/3)");
          speak("Please answer the question I just asked.", {
            onStart: () => setAiStatus("speaking"),
            onEnd: () => {
              setAiStatus("listening");
              lastActivityTimestampRef.current = Date.now();
            },
          });
        } else if (currentStrike === 1) {
          // STRIKE 2
          setInactivityStrikes(2);
          setInactivityWarning("Please answer the question. (Attempt 2/3)");
          speak("Please answer the question. Take your time, but I need a response before we continue.", {
            onStart: () => setAiStatus("speaking"),
            onEnd: () => {
              setAiStatus("listening");
              lastActivityTimestampRef.current = Date.now();
            },
          });
        } else if (currentStrike >= 2) {
          // STRIKE 3 - TERMINATION
          setInactivityStrikes(3);
          clearInterval(interval);
          handleTimeoutTermination();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStartedSession, isInterviewComplete, aiStatus, isLoading, speak, handleTimeoutTermination]);

  // Synchronize speech transcript into textInput
  useEffect(() => {
    if (finalTranscript || interimTranscript) {
      const combined = `${finalTranscript} ${interimTranscript}`.trim();
      setTextInput(combined);
    }
  }, [finalTranscript, interimTranscript]);

  // Auth Protection
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  // Interview Timer
  useEffect(() => {
    if (!hasStartedSession || isInterviewComplete) return;
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [hasStartedSession, isInterviewComplete]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFS = () => {
      setIsFullscreenActive(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFS);
    return () => document.removeEventListener("fullscreenchange", handleFS);
  }, []);

  // AI Speaking status sync
  useEffect(() => {
    if (isSpeaking) {
      setAiStatus("speaking");
    } else if (isLoading) {
      setAiStatus("evaluating");
    } else if (isListening) {
      setAiStatus("listening");
    } else {
      setAiStatus("ready");
    }
  }, [isSpeaking, isLoading, isListening]);

  // STEP 9, 10, 11: Start Interview Session, AI Introduction, and Question 1
  const startInterview = useCallback(async () => {
    try {
      setIsLoading(true);
      setAiStatus("evaluating");

      const { data } = await axiosInstance.post("/api/interviews/start", {
        domain,
      });

      if (data) {
        setSessionId(data.sessionId);
        setQuestionsAnswered(0);
        const startingDiff = (data.difficulty || "MEDIUM") as DifficultyLevel;
        setCurrentDifficulty(startingDiff);
        setDifficultyProgression([{ questionIndex: 1, difficulty: startingDiff }]);
        const qText = data.question || "Can you please explain your technical background and experience?";
        setCurrentQuestionText(qText);
        setIsFollowUp(false);

        setMessages([
          {
            id: "1",
            content: qText,
            isUser: false,
            timestamp: new Date(),
            difficulty: startingDiff,
            isQuestion: true,
          },
        ]);

        // STEP 10: AI Introduction Spoken Aloud
        const candidateName = user?.name ? user.name.split(" ")[0] : "there";
        const personaFirstName = persona.name.split(" ")[0];
        const introText = `Hello ${candidateName}, welcome to your ${domain} technical interview. I'm ${personaFirstName}, your AI interviewer today. Please answer clearly and explain your thinking. Let's begin.`;

        setTimeout(() => {
          speak(introText, {
            onStart: () => setAiStatus("speaking"),
            onEnd: () => {
              // STEP 11: Ask Question 1 Aloud
              speak(qText, {
                onStart: () => setAiStatus("speaking"),
                onEnd: () => {
                  setAiStatus("listening");
                  startListening();
                  lastActivityTimestampRef.current = Date.now();
                },
              });
            },
          });
        }, 500);
      }
    } catch (error) {
      console.error("Start interview error:", error);
      const fallbackMsg = "Connection error. Please check your network and refresh.";
      setCurrentQuestionText(fallbackMsg);
      setMessages([
        {
          id: "1",
          content: fallbackMsg,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      setAiStatus("ready");
    } finally {
      setIsLoading(false);
    }
  }, [domain, user?.name, persona.name, speak, startListening]);

  // STEP 8: Handler to Enter Fullscreen and Begin Session
  const handleBeginFullscreenInterview = async () => {
    if (!canBeginInterview) return;

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (err) {
      console.warn("Fullscreen request error:", err);
    }

    setHasStartedSession(true);
    startInterview();
  };

  // Safe Exit and Stream Cleanup
  const handleCleanExit = useCallback(() => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    stopAllTracks();
    stopSpeaking();
    stopListening();

    const rep = getIntegrityReport();
    setFinalIntegrityReport(rep);
    setIsInterviewComplete(true);
    setShowExitConfirm(false);
  }, [stopAllTracks, stopSpeaking, stopListening, getIntegrityReport]);

  // Submit Candidate Answer
  const handleAnswerSubmit = async () => {
    const submittedAnswer = textInput.trim();
    if (!submittedAnswer || !sessionId || isLoading) return;

    // Stop speaking & listening during submission
    stopSpeaking();
    stopListening();
    setIsLoading(true);
    setAiStatus("evaluating");

    // Add candidate response to transcript history
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: submittedAnswer,
        isUser: true,
        timestamp: new Date(),
      },
    ]);

    // Clear input box
    setTextInput("");
    clearTranscript();

    const currentIntegrityReport = getIntegrityReport();

    try {
      const { data } = await axiosInstance.post(
        "/api/interviews/submit-answer",
        {
          sessionId,
          answer: submittedAnswer,
          domain,
          questionsAnswered,
          currentQuestion: currentQuestionText,
          integrityReport: currentIntegrityReport,
        },
      );

      if (data) {
        const newCount = questionsAnswered + 1;
        setQuestionsAnswered(newCount);
        const newDiff = (data.currentDifficulty || currentDifficulty) as DifficultyLevel;
        const perf = data.performance as PerformanceLevel;
        setCurrentDifficulty(newDiff);

        setDifficultyProgression((prev) => [
          ...prev,
          { questionIndex: newCount + 1, difficulty: newDiff, performance: perf },
        ]);

        const nextIsFollowUp = Boolean(data.isFollowUp || data.action === "FOLLOW_UP");
        setIsFollowUp(nextIsFollowUp);

        // Update real-time interview health scores
        if (typeof data.score === "number") {
          setMetrics({
            technicalScore: data.score,
            communicationScore: Math.min(100, Math.max(30, Math.round(data.score * 0.95 + 8))),
            confidenceScore: Math.min(100, Math.max(35, Math.round(data.score * 0.9 + 10))),
            clarityScore: Math.min(100, Math.max(40, Math.round(data.score * 0.92 + 5))),
          });
        }

        const assessment = {
          score: typeof data.score === "number" ? data.score : undefined,
          strengths: Array.isArray(data.strengths) ? data.strengths : [],
          weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
          reasoning: data.reasoning || "",
          action: data.action,
          actionReason: data.actionReason,
        };

        // Append feedback message to history
        const feedbackText = data.feedback || "Your response has been evaluated.";
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content: feedbackText,
            isUser: false,
            timestamp: new Date(),
            performance: perf,
            isQuestion: false,
            assessment,
          },
        ]);

        // Natural AI Verbal Reaction based on score
        const scoreVal = typeof data.score === "number" ? data.score : 70;
        let naturalReaction = "";
        if (scoreVal >= 80) {
          naturalReaction = "Good. You clearly understand the core mechanism. I'd like to push this a little further.";
        } else if (scoreVal >= 50) {
          naturalReaction = "You're on the right track. Can you explain what happens internally when we scale this?";
        } else {
          naturalReaction = "I think there's a gap in that explanation. Let's look at this from a simpler angle.";
        }

        // Check if interview is completed
        if (data.isComplete || newCount >= TOTAL_QUESTIONS) {
          const finalScore = typeof data.score === "number" ? data.score : 0;
          setInterviewScore(finalScore);
          setFinalIntegrityReport(currentIntegrityReport);
          setAiStatus("ready");

          // Clean exit sequence
          handleCleanExit();

          const closingSpeech = `That completes your technical interview. I am generating your full technical performance and session integrity report now.`;
          speak(closingSpeech);
        } else if (data.nextQuestion) {
          const nextQ = data.nextQuestion;
          setCurrentQuestionText(nextQ);

          // Append next question to messages
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 2).toString(),
              content: nextQ,
              isUser: false,
              timestamp: new Date(),
              difficulty: newDiff,
              isQuestion: true,
              isFollowUp: nextIsFollowUp,
            },
          ]);

          const transitionSpeech = `${naturalReaction} ${nextIsFollowUp ? "Here is a follow-up: " : "Next question: "} ${nextQ}`;

          speak(transitionSpeech, {
            onStart: () => setAiStatus("speaking"),
            onEnd: () => {
              setAiStatus("listening");
              startListening();
            },
          });
        }
      }
    } catch (error) {
      console.error("Submit answer error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "Evaluation connection error. Please try submitting again.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      setAiStatus("ready");
    } finally {
      setIsLoading(false);
    }
  };

  // Replay Question Audio
  const handleReplayVoice = () => {
    if (!currentQuestionText) return;
    speak(currentQuestionText, {
      onStart: () => setAiStatus("speaking"),
      onEnd: () => {
        setAiStatus("listening");
        startListening();
      },
    });
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleReturnToDashboard = () => {
    router.push("/dashboard");
  };

  if (authLoading) return null;
  if (!isLoggedIn) return null;

  const score = interviewScore ?? 0;
  const scoreLabel =
    score >= 80
      ? {
          text: "Outstanding Performance! You're interview-ready 🚀",
          color: "text-emerald-400",
        }
      : score >= 60
        ? {
            text: "Solid effort! Good technical foundation with room for refinement 💪",
            color: "text-blue-400",
          }
        : score >= 40
          ? {
              text: "Developing skills. Focus on edge cases and system internals 📚",
              color: "text-amber-400",
            }
          : {
              text: "Needs significant practice. Review core architectural concepts and retry 🔄",
              color: "text-rose-400",
            };

  const activeIntegrity = finalIntegrityReport || getIntegrityReport();

  // ----------------------------------------------------
  // ----------------------------------------------------
  // VIEW 1: PRE-INTERVIEW SETUP & INTEGRITY NOTICE MODAL
  // ----------------------------------------------------
  if (!hasStartedSession && !isInterviewComplete) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/30">
        <div className="w-full max-w-xl space-y-5">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Proctored Technical Session
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {domain} Technical Interview
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              Conducted by {persona.name} ({persona.title.split("&")[0]}). Follow the sequential device check below before entering.
            </p>
          </div>

          {/* Setup Incomplete / Error Modal */}
          {setupStage === "failed" && (
            <Card className="p-5 bg-rose-950/40 border border-rose-500/40 shadow-2xl rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Interview Setup Incomplete</h3>
                  <p className="text-xs text-rose-300">Mandatory hardware permissions were not granted.</p>
                </div>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                {setupError}
              </p>
              <p className="text-[11px] text-zinc-400">
                Camera, microphone, and entire screen sharing permissions are strictly required for proctoring and cannot be bypassed. Click below to try again.
              </p>
              <Button
                onClick={runDeviceSetup}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs py-2.5 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </Card>
          )}

          {/* Sequential Device & Identity Verification Card */}
          {setupStage !== "failed" && (
            <Card className="p-5 sm:p-6 bg-zinc-900/90 border border-zinc-800 shadow-2xl rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Pre-Interview Device & Identity Verification
                </h3>
                <span className="text-[11px] font-mono text-zinc-400">
                  {setupStage === "ready" ? (
                    <span className="text-emerald-400 font-semibold">Ready to Begin</span>
                  ) : setupStage === "idle" ? (
                    "Setup Required"
                  ) : (
                    "Verifying..."
                  )}
                </span>
              </div>

              {/* Checklist Items */}
              <div className="space-y-3 text-xs sm:text-sm">
                {/* 1. Camera Check */}
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${isCamLive ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-200">1. Camera Verification</p>
                        <p className="text-[11px] text-zinc-400">Continuous webcam active throughout session</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      isCamLive
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : setupStage === "requesting_cam"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-zinc-800/80 text-zinc-500 border-zinc-700"
                    }`}>
                      {isCamLive ? "✓ Live Stream" : setupStage === "requesting_cam" ? "Requesting..." : "Pending"}
                    </span>
                  </div>

                  {/* Live Video Preview Box */}
                  {webcamStream && isCamLive && (
                    <div className="pt-1">
                      <video
                        ref={setupVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-36 sm:h-40 object-cover rounded-lg border border-zinc-700 bg-black"
                      />
                    </div>
                  )}
                </div>

                {/* 2. Microphone Check */}
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${isMicLive ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-200">2. Microphone Verification</p>
                        <p className="text-[11px] text-zinc-400">Natural voice answering transcribed in real-time</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      isMicLive
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : setupStage === "requesting_mic"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-zinc-800/80 text-zinc-500 border-zinc-700"
                    }`}>
                      {isMicLive ? "✓ Mic Active" : setupStage === "requesting_mic" ? "Requesting..." : "Pending"}
                    </span>
                  </div>

                  {/* Live Audio Meter */}
                  {isMicLive && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-400">Audio Input Level (Speak to test)</span>
                        <span className="font-mono text-emerald-400 font-bold">{micVolume}%</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-75"
                          style={{ width: `${Math.min(100, Math.max(micVolume, 4))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Entire Screen Share Check */}
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${isScreenLive ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                      <ScreenShare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-200">3. Entire Screen Share</p>
                      <p className="text-[11px] text-zinc-400">Full monitor share required for session integrity</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    isScreenLive
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : setupStage === "requesting_screen"
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : "bg-zinc-800/80 text-zinc-500 border-zinc-700"
                  }`}>
                    {isScreenLive ? "✓ Screen Shared" : setupStage === "requesting_screen" ? "Requesting..." : "Pending"}
                  </span>
                </div>

                {/* 4. Person & Lighting Quality Check */}
                {isCamLive && (
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2 animate-in fade-in duration-200">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      4. Environment & Person Verification
                    </p>

                    {/* Face presence */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <UserCheck className={`w-4 h-4 ${isFaceDetected ? "text-emerald-400" : "text-amber-400"}`} />
                        <span className={isFaceDetected ? "text-zinc-200" : "text-amber-400 font-semibold"}>
                          {isFaceDetected ? "Candidate detected in camera frame" : "No person detected. Position yourself in front of camera."}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isFaceDetected ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      }`}>
                        {isFaceDetected ? "✓ Verified" : "⚠️ Adjust Position"}
                      </span>
                    </div>

                    {/* Lighting adequacy */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Sun className={`w-4 h-4 ${isLightingAdequate ? "text-emerald-400" : "text-amber-400"}`} />
                        <span className={isLightingAdequate ? "text-zinc-200" : "text-amber-400 font-semibold"}>
                          {isLightingAdequate
                            ? "Camera & Lighting: Optimal"
                            : `Lighting is too low (${cameraBrightness}/255). Please move to a brighter space.`}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isLightingAdequate ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      }`}>
                        {isLightingAdequate ? "✓ Optimal" : "⚠️ Low Lighting"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Privacy Notice */}
              <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-300">Privacy Notice:</strong> Streams are processed locally in your browser to verify presence. No continuous video recordings are stored.
                </span>
              </div>
            </Card>
          )}

          {/* Sequential Action Button */}
          {setupStage === "idle" && (
            <Button
              onClick={runDeviceSetup}
              size="lg"
              className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-sm sm:text-base py-6 shadow-xl shadow-emerald-950/50 transition-all hover:scale-[1.01]"
            >
              <Video className="w-4 h-4 mr-2" />
              Start Pre-Check
            </Button>
          )}

          {(setupStage === "requesting_cam" ||
            setupStage === "requesting_mic" ||
            setupStage === "requesting_screen" ||
            setupStage === "verifying") && (
            <Button
              disabled
              size="lg"
              className="w-full rounded-2xl bg-zinc-800 text-zinc-300 font-extrabold text-sm sm:text-base py-6 opacity-90 cursor-wait"
            >
              <RefreshCw className="w-4 h-4 mr-2 animate-spin text-emerald-400" />
              {setupStage === "requesting_cam" && "Step 2: Requesting Camera Access..."}
              {setupStage === "requesting_mic" && "Step 3: Requesting Microphone Access..."}
              {setupStage === "requesting_screen" && "Step 4: Requesting Entire Screen Share..."}
              {setupStage === "verifying" && "Step 5: Verifying Device Streams..."}
            </Button>
          )}

          {setupStage === "ready" && (
            <div className="space-y-2">
              <Button
                onClick={handleBeginFullscreenInterview}
                disabled={!canBeginInterview}
                size="lg"
                className={`w-full rounded-2xl font-extrabold text-sm sm:text-base py-6 shadow-xl transition-all ${
                  canBeginInterview
                    ? "bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-950/50 hover:scale-[1.01]"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                }`}
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                {canBeginInterview
                  ? "Begin Fullscreen Interview"
                  : !isFaceDetected
                    ? "Position Face in Camera to Begin"
                    : !isLightingAdequate
                      ? "Increase Room Lighting to Begin"
                      : "Complete Checks to Begin"}
              </Button>
              {!canBeginInterview && (
                <p className="text-center text-[11px] text-amber-400">
                  {!isFaceDetected
                    ? "⚠️ Please ensure you are clearly visible in the camera before starting."
                    : !isLightingAdequate
                      ? "⚠️ Camera lighting is too low. Turn on lights to enable interview."
                      : "⚠️ Please complete all device verifications."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 2: FINAL COMPREHENSIVE PERFORMANCE & INTEGRITY REPORT
  // ----------------------------------------------------
  if (isInterviewComplete) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-3 sm:p-6 selection:bg-emerald-500/30">
        <div className="w-full max-w-3xl space-y-5 animate-in fade-in zoom-in-95 duration-500">
          {/* Main Score & Persona Header */}
          <Card className="p-6 sm:p-8 bg-zinc-900/90 border border-zinc-800 text-center shadow-2xl rounded-2xl">
            <div className="text-4xl mb-2">
              {score >= 80 ? "🏆" : score >= 60 ? "🎯" : "📚"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
              Interview Completed
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mb-4">
              {persona.name} has concluded the assessment for this {domain} session.
            </p>

            {/* Termination Reason Alert Banner */}
            {terminationReason && (
              <div className="mb-5 p-3 sm:p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 max-w-lg mx-auto">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <span>{terminationReason}</span>
              </div>
            )}

            <ScoreRing score={score} />

            <p className={`text-base font-bold mt-5 ${scoreLabel.color}`}>
              {scoreLabel.text}
            </p>
          </Card>

          {/* Dual Column: Technical Performance & Integrity Audit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technical Performance Card */}
            <Card className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Technical Evaluation
                </h4>
                <span className="text-[11px] font-mono font-bold text-zinc-200">
                  Level: {currentDifficulty}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { label: "Technical Accuracy", pct: metrics.technicalScore },
                  { label: "Communication Clarity", pct: metrics.communicationScore },
                  { label: "Confidence & Fluency", pct: metrics.confidenceScore },
                  { label: "Explanation Quality", pct: metrics.clarityScore },
                ].map((b, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">{b.label}</span>
                      <span className="font-mono font-bold text-emerald-400">{b.pct}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-[11px] text-zinc-400 flex justify-between border-t border-zinc-800">
                <span>Questions: {questionsAnswered} / {TOTAL_QUESTIONS}</span>
                <span>Duration: {formatTime(elapsedSeconds)}</span>
              </div>
            </Card>

            {/* Interview Integrity Audit Card */}
            <Card className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Integrity Audit
                </h4>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    activeIntegrity.integrityStatus === "VERIFIED"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {activeIntegrity.integrityStatus === "VERIFIED" ? "Verified High" : "Review Recommended"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Tab / Window Switches</span>
                  <span className={`font-mono font-bold ${activeIntegrity.tabSwitches > 0 ? "text-amber-400" : "text-zinc-300"}`}>
                    {activeIntegrity.tabSwitches}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Fullscreen Exits</span>
                  <span className={`font-mono font-bold ${activeIntegrity.fullscreenExits > 0 ? "text-amber-400" : "text-zinc-300"}`}>
                    {activeIntegrity.fullscreenExits}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Face Not Detected Signals</span>
                  <span className={`font-mono font-bold ${activeIntegrity.faceNotDetectedCount > 0 ? "text-amber-400" : "text-zinc-300"}`}>
                    {activeIntegrity.faceNotDetectedCount}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Multiple Persons Signals</span>
                  <span className={`font-mono font-bold ${activeIntegrity.multipleFacesCount > 0 ? "text-rose-400" : "text-zinc-300"}`}>
                    {activeIntegrity.multipleFacesCount}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Screen Share Interruptions</span>
                  <span className={`font-mono font-bold ${activeIntegrity.screenShareInterruptions > 0 ? "text-amber-400" : "text-zinc-300"}`}>
                    {activeIntegrity.screenShareInterruptions}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Return to Dashboard Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              onClick={handleReturnToDashboard}
              size="lg"
              className="w-full sm:w-auto rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white font-extrabold px-8 shadow-xl shadow-emerald-950/40"
            >
              Back to Dashboard ➔
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 3: LIVE ACTIVE FULLSCREEN INTERVIEW ROOM
  // ----------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-zinc-100 flex flex-col justify-between overflow-y-auto selection:bg-emerald-500/30">
      {/* Active Warning Banner (Tab switch, multiple people, looking away) */}
      {activeWarning && (
        <div className="bg-amber-500 text-black px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-between gap-2 shadow-lg animate-in slide-in-from-top duration-200 z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>⚠️ {activeWarning.message}</span>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded">
            Integrity Alert
          </span>
        </div>
      )}

      {/* Persistent Fullscreen Exited Warning Banner */}
      {!isFullscreenActive && (
        <div className="bg-amber-500 text-black px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-between gap-2 shadow-lg z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Fullscreen mode was exited. Please return to fullscreen to maintain session integrity.</span>
          </div>
          <Button
            size="sm"
            onClick={() => {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
              }
            }}
            className="bg-black text-white hover:bg-zinc-800 text-xs font-bold px-3 py-1 rounded-lg"
          >
            Return to Fullscreen
          </Button>
        </div>
      )}

      {/* Screen Share Interrupted Pause Overlay */}
      {!deviceStatus.screenShareActive && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 bg-zinc-900 border border-amber-500/40 shadow-2xl rounded-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-2xl">
              <ScreenShare className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Screen Sharing Interrupted</h3>
              <p className="text-xs text-amber-400 font-semibold mt-0.5">Interview Paused</p>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Your screen sharing has stopped. Please resume screen sharing to continue the interview.
            </p>
            <Button
              onClick={requestScreenShare}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-extrabold rounded-xl py-3 text-xs sm:text-sm"
            >
              Resume Screen Share
            </Button>
          </Card>
        </div>
      )}

      {/* Top Header Bar inside Interview Room */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Domain & Interview Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-lg flex-shrink-0">
              {domainEmoji[domain] || "💼"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white truncate">
                  {domain} Interview Room
                </h1>
                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Proctored
                </span>
                <span
                  className={`hidden sm:inline-flex items-center gap-1 text-[10px] border px-2 py-0.5 rounded-full font-semibold ${
                    difficultyBadgeConfig[currentDifficulty].style
                  }`}
                >
                  <span>{difficultyBadgeConfig[currentDifficulty].icon}</span>
                  {difficultyBadgeConfig[currentDifficulty].label}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate">
                Conducted by {persona.name} ({persona.title.split("&")[0]})
              </p>
            </div>
          </div>

          {/* Center: Question Progress */}
          <div className="hidden md:flex flex-col items-center gap-1">
            <ProgressDots current={questionsAnswered} total={TOTAL_QUESTIONS} />
            <p className="text-[10px] font-medium text-zinc-400">
              Question {Math.min(questionsAnswered + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}
            </p>
          </div>

          {/* Right: Timer & End Interview Button */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full font-mono text-xs font-semibold text-zinc-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowExitConfirm(true)}
              className="rounded-full text-xs bg-rose-600 hover:bg-rose-700 font-bold px-3 py-1"
            >
              End Interview
            </Button>
          </div>
        </div>
      </header>

      {/* Main Video & Interaction Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col justify-between space-y-4">
        {/* Split Screen Video Grid: Left AI, Right Candidate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <AIInterviewerCard
            persona={persona}
            onSelectPersona={(p) => setPersona(p)}
            status={aiStatus}
            isSpeaking={isSpeaking}
            domain={domain}
          />

          <CandidateVideoCard
            webcamStream={webcamStream}
            screenStream={screenStream}
            deviceStatus={deviceStatus}
            micVolume={micVolume}
            candidateName={user?.name || "Candidate"}
            onToggleCamera={() => {}} // Disabled candidate toggle
            onToggleMic={() => {}} // Disabled candidate toggle
            onToggleScreenShare={toggleScreenShare}
          />
        </div>

        {/* Question Card & Speech/Text Input Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 space-y-3">
            {/* Protected Question Display Card */}
            <QuestionDisplayCard
              questionText={currentQuestionText}
              difficulty={currentDifficulty}
              isFollowUp={isFollowUp}
              questionNumber={Math.min(questionsAnswered + 1, TOTAL_QUESTIONS)}
              totalQuestions={TOTAL_QUESTIONS}
              isSpeaking={isSpeaking}
              interviewerName={persona.name.split(" ")[0]}
              onReplayVoice={handleReplayVoice}
            />

            {/* Candidate Conversational Input Area */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Mic className={`w-3.5 h-3.5 ${isListening ? "text-emerald-400 animate-pulse" : "text-zinc-500"}`} />
                    {isListening ? "Listening to your response..." : "Voice & Text Answer Input"}
                  </span>
                  {interimTranscript && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse">
                      Transcribing live
                    </span>
                  )}
                </div>
                {textInput && (
                  <button
                    onClick={() => {
                      setTextInput("");
                      clearTranscript();
                    }}
                    className="text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1 text-[11px]"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>

              {/* Inactivity Warning Banner */}
              {inactivityWarning && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{inactivityWarning}</span>
                </div>
              )}

              {/* Input Text Area (Live Transcription or Typed) */}
              <div className="relative">
                <textarea
                  rows={3}
                  placeholder="Speak naturally using your microphone, or type your answer here..."
                  value={textInput}
                  onChange={(e) => {
                    setTextInput(e.target.value);
                    setFinalTranscript(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAnswerSubmit();
                    }
                  }}
                  disabled={isLoading}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 resize-none transition-all"
                />

                {/* Submit Button Inside Textarea */}
                <div className="absolute right-2.5 bottom-3.5 flex items-center gap-2">
                  <Button
                    onClick={handleAnswerSubmit}
                    disabled={isLoading || !textInput.trim()}
                    size="sm"
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs px-3.5 py-1.5 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-40"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                        Evaluating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span>Submit Answer</span>
                        <Send className="w-3 h-3" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Input Mode Helper Note */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                <span>
                  {isSTTSupported
                    ? "🎙️ Mic active: Your speech is continuously transcribed above. Click Submit or press Enter when done."
                    : "⌨️ Browser speech recognition unavailable. Text mode is fully active."}
                </span>
                <span className="hidden sm:inline">Press Shift + Enter for new line</span>
              </div>
            </div>
          </div>

          {/* Right Side: Realtime Feedback & Integrity Panel */}
          <div className="space-y-4">
            <RealtimeFeedbackPanel
              metrics={metrics}
              deviceStatus={deviceStatus}
              domain={domain}
              isFaceDetected={isFaceDetected}
              isSinglePerson={isSinglePerson}
              isLookingAtScreen={isLookingAtScreen}
              isFullscreen={isFullscreen || isFullscreenActive}
              attentionWarnings={attentionWarnings}
              activeWarning={activeWarning}
            />
          </div>
        </div>

        {/* Floating Google Meet Style Control Dock */}
        <div className="sticky bottom-2 z-30 pt-2">
          <InterviewControlBar
            deviceStatus={deviceStatus}
            isVoiceMuted={isVoiceMuted}
            transcriptCount={messages.filter((m) => m.isUser).length}
            onToggleScreenShare={toggleScreenShare}
            onToggleVoiceMute={toggleVoiceMute}
            onToggleTranscript={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
            onEndInterview={() => setShowExitConfirm(true)}
          />
        </div>
      </main>

      {/* Slide-over Transcript Drawer */}
      <LiveTranscriptDrawer
        isOpen={showTranscriptDrawer}
        onClose={() => setShowTranscriptDrawer(false)}
        messages={messages}
        interviewerName={persona.name}
      />

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowExitConfirm(false);
          }}
        >
          <Card className="w-full max-w-md p-6 bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center text-xl flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">End Interview Session?</h2>
                <p className="text-xs text-zinc-400">
                  Exiting will generate your final report with current questions.
                </p>
              </div>
            </div>
            <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
              Are you sure you want to end this interview? Your media streams will be closed and your technical and integrity evaluation report will be compiled.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                onClick={() => setShowExitConfirm(false)}
              >
                Resume Interview
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full text-xs bg-rose-600 hover:bg-rose-700 font-semibold"
                onClick={handleCleanExit}
              >
                Confirm End Interview
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80
      ? "#10b981"
      : score >= 60
        ? "#3b82f6"
        : score >= 40
          ? "#f59e0b"
          : "#ef4444";

  return (
    <div className="relative w-36 h-36 sm:w-40 sm:h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-zinc-800"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-white">{score}</span>
        <span className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">
          Score
        </span>
      </div>
    </div>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-500 ${
            i < current
              ? "bg-gradient-to-r from-emerald-400 to-teal-500 w-6"
              : i === current
                ? "bg-emerald-400/50 w-4 animate-pulse"
                : "bg-zinc-700 w-2"
          }`}
        />
      ))}
    </div>
  );
}
