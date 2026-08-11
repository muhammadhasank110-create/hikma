/**
 * SpeechContext — single app-level speech service.
 *
 * Wraps useTTS and exposes speak(text, { priority }) and stop().
 * Mount once in App.tsx so all components share one audio instance.
 */
import React, { createContext, useContext, useRef, useCallback, useState, useEffect, useMemo } from "react";
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
  const { speak: ttsSpeak, stop: ttsStop, isSpeaking: ttsIsSpeaking } = useTTS({
    rate: profile.speechRate ?? 1,
    lang: locale === "ar" ? "ar-SA" : "en-GB",
  });
  const queueRef = useRef<Array<{ text: string; lang?: string }>>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakNext = useCallback(() => {
    if (ttsIsSpeaking) return;
    const next = queueRef.current.shift();
    if (!next) {
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    ttsSpeak(next.text);
  }, [ttsIsSpeaking, ttsSpeak]);

  const speak = useCallback((rawText: string, opts: SpeakOptions = {}) => {
    const text = rawText.trim();
    if (!text) return;
    const { priority = "polite" } = opts;
    if (priority === "assertive") {
      ttsStop();
      queueRef.current = [];
      setIsSpeaking(true);
      ttsSpeak(text);
      return;
    }
    if (!ttsIsSpeaking && queueRef.current.length === 0) {
      setIsSpeaking(true);
      ttsSpeak(text);
    } else {
      queueRef.current.push({ text });
    }
  }, [ttsIsSpeaking, ttsSpeak, ttsStop]);

  useEffect(() => {
    if (!ttsIsSpeaking && queueRef.current.length > 0) {
      speakNext();
    } else if (!ttsIsSpeaking) {
      setIsSpeaking(false);
    }
  }, [ttsIsSpeaking, speakNext]);

  const stop = useCallback(() => {
    ttsStop();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    queueRef.current = [];
    setIsSpeaking(false);
  }, [ttsStop]);

  const contextValue = useMemo(() => ({ speak, stop, isSpeaking }), [speak, stop, isSpeaking]);

  return <SpeechContext.Provider value={contextValue}>{children}</SpeechContext.Provider>;
}

export function useSpeech() {
  return useContext(SpeechContext);
}
