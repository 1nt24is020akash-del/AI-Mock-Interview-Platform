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
} from "./interview/types";
import { useMediaEngine } from "./interview/useMediaEngine";
import { useSpeechEngine } from "./interview/useSpeechEngine";
import { AIInterviewerCard } from "./interview/AIInterviewerCard";
import { CandidateVideoCard } from "./interview/CandidateVideoCard";
import { QuestionDisplayCard } from "./interview/QuestionDisplayCard";
import { RealtimeFeedbackPanel } from "./interview/RealtimeFeedbackPanel";
import { InterviewControlBar } from "./interview/InterviewControlBar";
import { LiveTranscriptDrawer } from "./interview/LiveTranscriptDrawer";

import {
  Mic,
  Send,
  Sparkles,
  Trash2,
  CornerDownRight,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
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
    toggleCamera,
    toggleMic,
    toggleScreenShare,
    startScreenShare,
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
    if (isInterviewComplete) return;
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isInterviewComplete]);

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

  // Start Interview Initiation
  const startInterview = useCallback(async () => {
    try {
      setIsLoading(true);
      setAiStatus("evaluating");

      // Auto-prompt screen share at session launch for proctoring
      setTimeout(() => {
        startScreenShare().catch(() => {});
      }, 1000);

      const { data } = await axiosInstance.post("/api/interviews/start", {
        domain,
      });

      if (data) {
        setSessionId(data.sessionId);
        setQuestionsAnswered(0);
        const startingDiff = (data.difficulty || "MEDIUM") as DifficultyLevel;
        setCurrentDifficulty(startingDiff);
        setDifficultyProgression([{ questionIndex: 1, difficulty: startingDiff }]);
        const qText = data.question || "Can you please introduce yourself and your technical background?";
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

        // Spoken Introduction by AI Interviewer
        const candidateName = user?.name ? user.name.split(" ")[0] : "there";
        const introText = `Hello ${candidateName}. I am ${persona.name.split(" ")[0]}, and I will be conducting your ${domain} technical interview today. Please think aloud and explain your reasoning clearly as we proceed. Here is your first question: ${qText}`;

        setTimeout(() => {
          speak(introText, {
            onStart: () => setAiStatus("speaking"),
            onEnd: () => {
              setAiStatus("listening");
              startListening();
            },
          });
        }, 800);
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
    } finally {
      setIsLoading(false);
    }
  }, [domain, user?.name, persona.name, speak, startListening, startScreenShare]);

  // Initial call once authenticated
  useEffect(() => {
    if (isLoggedIn) {
      startInterview();
    }
  }, [isLoggedIn, startInterview]);

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

    try {
      const { data } = await axiosInstance.post(
        "/api/interviews/submit-answer",
        {
          sessionId,
          answer: submittedAnswer,
          domain,
          questionsAnswered,
          currentQuestion: currentQuestionText,
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

        // Check if interview is completed
        if (data.isComplete || newCount >= TOTAL_QUESTIONS) {
          const finalScore = typeof data.score === "number" ? data.score : 0;
          setInterviewScore(finalScore);
          setIsInterviewComplete(true);
          setAiStatus("ready");

          const closingSpeech = `Thank you for your response. That concludes our technical interview today. I have generated your complete performance assessment.`;
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

          // Transition speech: give feedback and then ask next question
          const transitionPrefix = nextIsFollowUp
            ? "Good points. Let's dig deeper on this with a follow-up: "
            : "Understood. Moving on to our next technical topic: ";

          const spokenTurn = `${feedbackText} ${transitionPrefix} ${nextQ}`;

          speak(spokenTurn, {
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
          content: "Evaluation service connection error. Please try submitting again.",
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

  const handleEndInterview = () => router.push("/dashboard");

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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500/30">
      {/* Top Header Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: Domain & Interviewer Branding */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
              {domainEmoji[domain] || "💼"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white truncate">
                  {domain} AI Live Interview
                </h1>
                {!isInterviewComplete && (
                  <span className="flex items-center gap-1 text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Room
                  </span>
                )}
                {!isInterviewComplete && (
                  <span
                    className={`hidden sm:inline-flex items-center gap-1 text-[11px] border px-2.5 py-0.5 rounded-full font-semibold ${
                      difficultyBadgeConfig[currentDifficulty].style
                    }`}
                  >
                    <span>{difficultyBadgeConfig[currentDifficulty].icon}</span>
                    {difficultyBadgeConfig[currentDifficulty].label}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Conducted by {persona.name} • Google Meet Audio Engine
              </p>
            </div>
          </div>

          {/* Center: Question Progress */}
          {!isInterviewComplete && (
            <div className="hidden md:flex flex-col items-center gap-1.5">
              <ProgressDots current={questionsAnswered} total={TOTAL_QUESTIONS} />
              <p className="text-[11px] font-medium text-zinc-400">
                Question {Math.min(questionsAnswered + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}
              </p>
            </div>
          )}

          {/* Right: Timer & Exit Button */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {!isInterviewComplete && (
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full font-mono text-xs font-semibold text-zinc-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => (isInterviewComplete ? handleEndInterview() : setShowExitConfirm(true))}
              className="rounded-full text-xs border-zinc-700 bg-zinc-900/60 hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-400 transition-colors"
            >
              {isInterviewComplete ? "Dashboard" : "Leave Room"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col justify-between">
        {isInterviewComplete ? (
          /* Interview Complete Results Screen */
          <div className="flex-1 flex items-center justify-center p-2 sm:p-6 my-auto">
            <div className="w-full max-w-2xl space-y-5 animate-in fade-in zoom-in-95 duration-500">
              <Card className="p-6 sm:p-8 bg-zinc-900/90 border border-zinc-800 text-center shadow-2xl rounded-2xl">
                <div className="text-4xl mb-3">
                  {score >= 80 ? "🏆" : score >= 60 ? "🎯" : "📚"}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
                  Interview Completed!
                </h2>
                <p className="text-sm text-zinc-400 mb-6">
                  {persona.name} has concluded the evaluation of your {domain} session.
                </p>

                <ScoreRing score={score} />

                <p className={`text-base font-bold mt-6 ${scoreLabel.color}`}>
                  {scoreLabel.text}
                </p>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Questions Completed", value: `${questionsAnswered} / ${TOTAL_QUESTIONS}`, icon: "📝" },
                  { label: "Final Difficulty", value: currentDifficulty, icon: difficultyBadgeConfig[currentDifficulty].icon },
                  { label: "Domain", value: domain.split("/")[0], icon: domainEmoji[domain] || "💼" },
                  { label: "Total Duration", value: formatTime(elapsedSeconds), icon: "⏱️" },
                ].map((stat, i) => (
                  <Card key={i} className="p-3.5 text-center bg-zinc-900/80 border border-zinc-800 rounded-xl">
                    <div className="text-lg mb-1">{stat.icon}</div>
                    <p className="text-sm font-bold text-white">{stat.value}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{stat.label}</p>
                  </Card>
                ))}
              </div>

              {/* Performance Breakdown */}
              <Card className="p-5 sm:p-6 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  Dimension Analysis
                </h4>
                {[
                  { label: "Technical Accuracy & Core Principles", pct: metrics.technicalScore },
                  { label: "Communication & Articulation", pct: metrics.communicationScore },
                  { label: "Confidence, Structure & Trade-Offs", pct: metrics.confidenceScore },
                  { label: "Problem-Solving Depth", pct: metrics.clarityScore },
                ].map((bar, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300">{bar.label}</span>
                      <span className="font-mono font-bold text-emerald-400">{bar.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-1000"
                        style={{ width: `${bar.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </Card>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsInterviewComplete(false);
                    setInterviewScore(null);
                    setQuestionsAnswered(0);
                    setCurrentDifficulty("MEDIUM");
                    setDifficultyProgression([{ questionIndex: 1, difficulty: "MEDIUM" }]);
                    setMessages([]);
                    setElapsedSeconds(0);
                    startInterview();
                  }}
                  className="rounded-full border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Take Another Interview
                </Button>
                <Button
                  onClick={handleEndInterview}
                  className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white font-semibold shadow-lg shadow-emerald-900/20"
                >
                  Go to Dashboard ➔
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Live Video Meeting Room */
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            {/* Split Screen Video Layout: Left AI, Right Candidate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Left Panel: AI Interviewer Video Tile */}
              <AIInterviewerCard
                persona={persona}
                onSelectPersona={(p) => setPersona(p)}
                status={aiStatus}
                isSpeaking={isSpeaking}
                domain={domain}
              />

              {/* Right Panel: Candidate Webcam & Audio Visualizer Tile */}
              <CandidateVideoCard
                webcamStream={webcamStream}
                screenStream={screenStream}
                deviceStatus={deviceStatus}
                micVolume={micVolume}
                candidateName={user?.name || "Candidate"}
                onToggleCamera={toggleCamera}
                onToggleMic={toggleMic}
                onToggleScreenShare={toggleScreenShare}
              />
            </div>

            {/* Middle Section: Prominent Question Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-2 space-y-3">
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
                        {isListening ? "Listening to your answer..." : "Voice & Text Answer Input"}
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

                  {/* Input Text Area (Live Transcription or Typed) */}
                  <div className="relative">
                    <textarea
                      rows={3}
                      placeholder="Speak naturally using your microphone, or type your technical answer here..."
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
                        ? "🎙️ Mic active: Your speech is continuously transcribed above. Press Enter or click Submit when done."
                        : "⌨️ Browser speech recognition unavailable. Text mode is fully active."}
                    </span>
                    <span className="hidden sm:inline">Press Shift + Enter for new line</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Realtime Feedback & Readiness Panel */}
              <div className="space-y-4">
                <RealtimeFeedbackPanel
                  metrics={metrics}
                  deviceStatus={deviceStatus}
                  domain={domain}
                />
              </div>
            </div>

            {/* Bottom Floating Google Meet / Zoom Style Control Dock */}
            <div className="sticky bottom-2 z-30 pt-2">
              <InterviewControlBar
                deviceStatus={deviceStatus}
                isVoiceMuted={isVoiceMuted}
                transcriptCount={messages.filter((m) => m.isUser).length}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
                onToggleScreenShare={toggleScreenShare}
                onToggleVoiceMute={toggleVoiceMute}
                onToggleTranscript={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
                onEndInterview={() => setShowExitConfirm(true)}
              />
            </div>
          </div>
        )}
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
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
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
                <h2 className="text-lg font-bold text-white">Leave Interview Room?</h2>
                <p className="text-xs text-zinc-400">
                  Your current session will not be saved as completed.
                </p>
              </div>
            </div>
            <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
              Are you sure you want to exit? You can resume or start a new technical session anytime from your dashboard.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                onClick={() => setShowExitConfirm(false)}
              >
                Continue Interview
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full text-xs bg-rose-600 hover:bg-rose-700 font-semibold"
                onClick={handleEndInterview}
              >
                Exit to Dashboard
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
