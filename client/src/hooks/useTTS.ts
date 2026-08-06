/**
 * useTTS — Text-to-speech hook.
 *
 * Priority:
 * 1. ElevenLabs (via /api/tts/speak proxy) — natural, warm voice
 * 2. Browser Web Speech API — fallback when ElevenLabs is unavailable
 *
 * Exposes:
 * - speak(text): start speaking
 * - stop(): stop speaking
 * - isSpeaking: boolean
 * - getCleanedText(raw): returns the cleaned text used for charIndex math
 * - onBoundary: callback for word-by-word highlight sync (browser only)
 */
import { useState, useRef, useCallback, useEffect } from "react";

interface UseTTSOptions {
  rate?: number;
  lang?: string;
  voiceHint?: string;
  onBoundary?: (charIndex: number, text: string) => void;
}

function cleanText(raw: string): string {
  return raw
    .replace(/[#*_`~\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickVoice(lang: string, hint?: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const langBase = lang.split("-")[0].toLowerCase();
  if (hint) {
    const hinted = voices.find(v => v.name.toLowerCase().includes(hint.toLowerCase()));
    if (hinted) return hinted;
  }
  const exact = voices.find(v => v.lang.toLowerCase() === lang.toLowerCase());
  if (exact) return exact;
  const base = voices.find(v => v.lang.toLowerCase().startsWith(langBase));
  return base ?? voices[0] ?? null;
}

export function useTTS({ rate = 1, lang = "en-GB", voiceHint, onBoundary }: UseTTSOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasElevenLabs, setHasElevenLabs] = useState<boolean | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cleanedTextRef = useRef<string>("");
  const onBoundaryRef = useRef(onBoundary);
  useEffect(() => { onBoundaryRef.current = onBoundary; }, [onBoundary]);

  // Check if ElevenLabs is configured
  useEffect(() => {
    fetch("/api/tts/config")
      .then(r => r.json())
      .then(d => setHasElevenLabs(!!d.hasElevenLabs))
      .catch(() => setHasElevenLabs(false));
  }, []);

  const stopBrowser = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    utteranceRef.current = null;
  }, []);

  const stopElevenLabs = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    stopBrowser();
    stopElevenLabs();
    setIsSpeaking(false);
  }, [stopBrowser, stopElevenLabs]);

  const speakWithBrowser = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    stopBrowser();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = Math.max(0.5, Math.min(2, rate));
    utt.lang = lang;
    const voice = pickVoice(lang, voiceHint);
    if (voice) utt.voice = voice;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    utt.onboundary = (event) => {
      if (event.name === "word" && onBoundaryRef.current) {
        onBoundaryRef.current(event.charIndex, cleanedTextRef.current);
      }
    };
    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, [rate, lang, voiceHint, stopBrowser]);

  const speakWithElevenLabs = useCallback(async (text: string) => {
    stopElevenLabs();
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/tts/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, locale: lang.startsWith("ar") ? "ar" : "en" }),
      });
      if (!res.ok || res.headers.get("content-type")?.includes("json")) {
        // ElevenLabs failed — fall back to browser
        setHasElevenLabs(false);
        speakWithBrowser(text);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      await audio.play();
    } catch {
      setHasElevenLabs(false);
      speakWithBrowser(text);
    }
  }, [lang, stopElevenLabs, speakWithBrowser]);

  const speak = useCallback((rawText: string) => {
    const text = cleanText(rawText);
    if (!text) return;
    cleanedTextRef.current = text;
    stop();
    // Unlock audio context on first user-triggered speak (Chrome autoplay policy)
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) { const ctx = new AudioContext(); ctx.resume().catch(() => {}); }
    } catch {}
    if (hasElevenLabs) {
      speakWithElevenLabs(text);
    } else {
      speakWithBrowser(text);
    }
  }, [hasElevenLabs, stop, speakWithElevenLabs, speakWithBrowser]);

  // Expose getCleanedText for word-index math in LessonPage
  const getCleanedText = useCallback((raw: string) => cleanText(raw), []);

  // Reload voices when they become available
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const handler = () => {}; // just trigger re-render
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", handler);
  }, []);

  return { speak, stop, isSpeaking, getCleanedText };
}
