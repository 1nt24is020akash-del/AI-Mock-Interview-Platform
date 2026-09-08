export type AIStatus =
  | "speaking"
  | "listening"
  | "evaluating"
  | "generating_followup"
  | "ready";

export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";
export type PerformanceLevel = "STRONG" | "AVERAGE" | "WEAK";

export interface AIPersona {
  id: "sophia" | "emma" | "alex" | "david";
  name: string;
  gender: "female" | "male";
  title: string;
  avatarBg: string;
  accentColor: string;
  bio: string;
  voicePreferences: string[];
}

export const AI_PERSONAS: Record<string, AIPersona> = {
  sophia: {
    id: "sophia",
    name: "Sophia Vance",
    gender: "female",
    title: "Senior Staff Engineer & Interview Lead",
    avatarBg: "from-emerald-600/20 via-teal-900/30 to-zinc-900",
    accentColor: "emerald",
    bio: "Calm, incisive, and systems-oriented. Focused on distributed architecture and scalability.",
    voicePreferences: ["Google UK English Female", "Samantha", "Victoria", "Karen", "en-US-Standard-C"],
  },
  emma: {
    id: "emma",
    name: "Emma Clarke",
    gender: "female",
    title: "Lead Frontend Architect",
    avatarBg: "from-indigo-600/20 via-purple-900/30 to-zinc-900",
    accentColor: "indigo",
    bio: "Engaging and analytical. Specializes in modern component architecture, state management, and UX performance.",
    voicePreferences: ["Google US English", "Zira", "Tessa", "Moira", "en-US-Standard-E"],
  },
  alex: {
    id: "alex",
    name: "Alex Rivera",
    gender: "male",
    title: "Principal Infrastructure Engineer",
    avatarBg: "from-cyan-600/20 via-blue-900/30 to-zinc-900",
    accentColor: "cyan",
    bio: "Methodical and pragmatic. Probes deeply into OS internals, networking, and production failure modes.",
    voicePreferences: ["Google UK English Male", "Daniel", "Oliver", "David", "en-US-Standard-D"],
  },
  david: {
    id: "david",
    name: "David Chen",
    gender: "male",
    title: "VP of Core Engineering",
    avatarBg: "from-amber-600/20 via-orange-900/30 to-zinc-900",
    accentColor: "amber",
    bio: "Strategic and rigorous. Evaluates design tradeoffs, technical judgment, and end-to-end reliability.",
    voicePreferences: ["Google US English Male", "Alex", "Fred", "George", "en-US-Standard-B"],
  },
};

export interface DeviceStatus {
  cameraActive: boolean;
  micActive: boolean;
  screenShareActive: boolean;
  cameraPermission: "granted" | "denied" | "prompt" | "unsupported";
  micPermission: "granted" | "denied" | "prompt" | "unsupported";
  screenPermission: "granted" | "denied" | "prompt" | "unsupported";
  isMuted: boolean;
  isVideoOff: boolean;
}

export interface InterviewMetrics {
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  clarityScore: number;
}
