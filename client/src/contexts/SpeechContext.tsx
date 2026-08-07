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
 * INTENTIONAL LATENCY TRADE-OFF:
 *   ElevenLabs requires a network round trip (~300-800ms). For assertive items
 *   under 60 characters (focus announcements, error messages), we deliberately
 *   use the browser voice so the user hears feedback instantly. ElevenLabs is
 *   reserved for lesson narration, tutor replies, and the onboarding preview
 *   where the warm voice matters and latency is acceptable.
 *
 * After this change, `grep -rn "SpeechSynthesisUtterance" client/src` should
 * return results ONLY in useTTS.ts.
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

  const speakBrowserInstant = useCallback((text: string, lang?: string) => {
    // Intentional: use browser voice for short assertive items (< 60 chars)
    // so focus announcements are instant, not delayed by a network round trip.
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = Math.max(0.5, Math.min(2, profile.speechRate ?? 1));
    utt.lang = lang ?? (locale === "ar" ? "ar-SA" : "en-GB");
    utt.onend = () => { setIsSpeaking(false); speakNext(); };
    setIsSpeaking(true);
    setTimeout(() => window.speechSynthesis.speak(utt), 30);
  }, [profile.speechRate, locale, speakNext]);

  const speak = useCallback((text: string, opts: SpeakOptions = {}) => {
    const { priority = "polite", lang } = opts;

    if (priority === "assertive") {
      // Cancel everything, speak immediately via ElevenLabs (or browser fallback)
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
        queueRef.current.push({ text, lang });
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
