/**
 * SpeechContext — single app-level speech service.
 *
 * Wraps useTTS and exposes speak(text, { priority }) and stop().
 * Mount once in App.tsx so all components share one audio instance.
 *
 * Priority queue:
 *   "assertive" — cancels whatever is playing immediately (focus announcements, errors).
 *   "polite"    — queues behind the current utterance (lesson narration, tutor replies).
 *
 * ALL speech routes through ElevenLabs (via useTTS → /api/tts/speak proxy).
 * Browser speech is only used as a final fallback inside useTTS itself.
 */
import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from "react";
import { useTTS } from "@/hooks/useTTS";
import { useProfile } from "./ProfileContext";

interface SpeakOptions {
  priority?: "assertive" | "polite";
  lang?: string;
}

interface SpeechContextValue {
  speak: (text: string, opts?: SpeakOptions) => void;
  stop: () => void;
  isSpeaking: boolean;
}

const SpeechContext = createContext<SpeechContextValue>({
  speak: () => {},
  stop: () => {},
  isSpeaking: false,
});

export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const { profile, locale } = useProfile();
  const tts = useTTS({
    rate: profile.speechRate ?? 1,
    lang: locale === "ar" ? "ar-SA" : "en-GB",
  });

  // Queue for polite utterances
  const queueRef = useRef<Array<{ text: string; lang?: string }>>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakNext = useCallback(() => {
    if (tts.isSpeaking) return;
    const next = queueRef.current.shift();
    if (!next) { setIsSpeaking(false); return; }
    setIsSpeaking(true);
    tts.speak(next.text);
  }, [tts]);

  const speak = useCallback((text: string, opts: SpeakOptions = {}) => {
    const { priority = "polite" } = opts;

    if (priority === "assertive") {
      // Cancel everything, speak immediately via ElevenLabs
      tts.stop();
      queueRef.current = [];
      setIsSpeaking(true);
      tts.speak(text);
    } else {
      // Polite: queue behind current
      if (!tts.isSpeaking && queueRef.current.length === 0) {
        setIsSpeaking(true);
        tts.speak(text);
      } else {
        queueRef.current.push({ text });
      }
    }
  }, [tts]);

  // Drain the polite queue whenever TTS finishes speaking
  useEffect(() => {
    if (!tts.isSpeaking && queueRef.current.length > 0) {
      speakNext();
    } else if (!tts.isSpeaking) {
      setIsSpeaking(false);
    }
  }, [tts.isSpeaking, speakNext]);

  const stop = useCallback(() => {
    tts.stop();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    queueRef.current = [];
    setIsSpeaking(false);
  }, [tts]);

  return (
    <SpeechContext.Provider value={{ speak, stop, isSpeaking }}>
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeech() {
  return useContext(SpeechContext);
}
