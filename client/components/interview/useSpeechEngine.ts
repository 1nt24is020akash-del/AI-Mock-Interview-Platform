"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AIPersona } from "./types";

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function useSpeechEngine(persona: AIPersona) {
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // STT State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [finalTranscript, setFinalTranscript] = useState<string>("");
  const [isSTTSupported, setIsSTTSupported] = useState<boolean>(true);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const isVoiceMutedRef = useRef<boolean>(false);
  const shouldListenRef = useRef<boolean>(false);

  isSpeakingRef.current = isSpeaking;
  isVoiceMutedRef.current = isVoiceMuted;

  // Populate browser voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Pick best voice for the chosen persona
  const getPersonaVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (availableVoices.length === 0) return null;

    // Look for preferred voice names first
    for (const pref of persona.voicePreferences) {
      const match = availableVoices.find(
        (v) => v.name.toLowerCase().includes(pref.toLowerCase())
      );
      if (match) return match;
    }

    // Otherwise match by gender keywords and English language
    const englishVoices = availableVoices.filter((v) =>
      v.lang.toLowerCase().startsWith("en")
    );

    if (persona.gender === "female") {
      const femaleVoice = englishVoices.find((v) => {
        const n = v.name.toLowerCase();
        return (
          n.includes("female") ||
          n.includes("samantha") ||
          n.includes("victoria") ||
          n.includes("zira") ||
          n.includes("karen") ||
          n.includes("moira")
        );
      });
      if (femaleVoice) return femaleVoice;
    } else {
      const maleVoice = englishVoices.find((v) => {
        const n = v.name.toLowerCase();
        return (
          n.includes("male") ||
          n.includes("daniel") ||
          n.includes("alex") ||
          n.includes("david") ||
          n.includes("george") ||
          n.includes("oliver")
        );
      });
      if (maleVoice) return maleVoice;
    }

    return englishVoices[0] || availableVoices[0] || null;
  }, [availableVoices, persona]);

  // Text-To-Speech speak method
  const speak = useCallback(
    (
      text: string,
      options?: {
        onStart?: () => void;
        onEnd?: () => void;
        rate?: number;
        pitch?: number;
      }
    ) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        options?.onStart?.();
        options?.onEnd?.();
        return;
      }

      // If voice is muted by candidate, trigger callbacks without audio
      if (isVoiceMutedRef.current) {
        options?.onStart?.();
        setTimeout(() => {
          options?.onEnd?.();
        }, 1200);
        return;
      }

      // Cancel previous utterance
      window.speechSynthesis.cancel();

      const cleanText = text
        .replace(/[*_#`~[\]()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!cleanText) {
        options?.onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voice = getPersonaVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.rate = options?.rate || 0.98;
      utterance.pitch = options?.pitch || (persona.gender === "female" ? 1.05 : 0.95);

      let ended = false;
      const handleFinish = () => {
        if (!ended) {
          ended = true;
          setIsSpeaking(false);
          options?.onEnd?.();
        }
      };

      utterance.onstart = () => {
        setIsSpeaking(true);
        options?.onStart?.();
      };

      utterance.onend = handleFinish;
      utterance.onerror = (e) => {
        console.warn("SpeechSynthesis error:", e);
        handleFinish();
      };

      // Safety timeout in case browser hangs on utterance
      const estimatedMs = Math.max(3000, (cleanText.split(" ").length / 2.5) * 1000 + 4000);
      const timeoutId = setTimeout(() => {
        if (!ended && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          handleFinish();
        }
      }, estimatedMs);

      const originalEnd = utterance.onend;
      utterance.onend = (e) => {
        clearTimeout(timeoutId);
        if (originalEnd) originalEnd.call(utterance, e);
      };

      window.speechSynthesis.speak(utterance);
    },
    [getPersonaVoice, persona]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const toggleVoiceMute = useCallback(() => {
    setIsVoiceMuted((prev) => {
      const next = !prev;
      if (next && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return next;
    });
  }, []);

  // Initialize Speech-to-Text Recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRec =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setIsSTTSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const transcriptText = res[0]?.transcript || "";
          if (res.isFinal) {
            final += transcriptText + " ";
          } else {
            interim += transcriptText;
          }
        }

        if (final) {
          setFinalTranscript((prev) => (prev ? `${prev} ${final.trim()}` : final.trim()));
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error !== "no-speech" && event.error !== "aborted") {
          console.warn("SpeechRecognition error:", event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // If user still wants to listen and not manually stopped, restart recognition
        if (shouldListenRef.current && !isSpeakingRef.current) {
          try {
            recognition.start();
          } catch {
            // ignore if already started
          }
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn("SpeechRecognition init error:", err);
      setIsSTTSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        shouldListenRef.current = false;
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSTTSupported) return;

    // Pause AI speaking if it was active
    stopSpeaking();

    shouldListenRef.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // recognition may already be running
      setIsListening(true);
    }
  }, [isSTTSupported, stopSpeaking]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const clearTranscript = useCallback(() => {
    setFinalTranscript("");
    setInterimTranscript("");
  }, []);

  return {
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
  };
}
