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
 * - getCleanedText(raw): the exact string charIndex values refer to
 * - onBoundary: callback for word-by-word highlight sync (both engines)
 *
 * Fixes (Aug 2026):
 * - ElevenLabs highlighting is driven off audio.currentTime via rAF instead of
 *   a fixed setInterval, so it cannot drift out of sync with playback.
 * - The highlight timer is torn down on stop(); it used to keep running and
 *   stack a second timer on the next section.
 * - Word char offsets are computed against the cleaned string instead of
 *   join(" ").length, which pointed at the space *before* each word.
 * - cleanText is exported so callers highlight the same tokens we speak.
 */
import { useState, useRef, useCallback, useEffect } from "react";

interface UseTTSOptions {
  rate?: number;
  lang?: string;
  voiceHint?: string;
  onBoundary?: (charIndex: number, text: string) => void;
}

/**
 * The canonical cleaner. Anything that maps charIndex back to a word MUST use
 * this exact function, or the indices refer to a different string.
 */
export function cleanText(raw: string): string {
  return raw
    .replace(/[#*_`~\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Start offset of each word within `cleaned`. */
export function buildWordOffsets(cleaned: string): { words: string[]; offsets: number[] } {
  const words = cleaned.split(" ").filter(Boolean);
  const offsets: number[] = [];
  let cursor = 0;
  for (const w of words) {
    const idx = cleaned.indexOf(w, cursor);
    offsets.push(idx < 0 ? cursor : idx);
    cursor = (idx < 0 ? cursor : idx) + w.length;
  }
  return { words, offsets };
}

function pickVoice(lang: string, hint?: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const langBase = lang.split("-")[0].toLowerCase();
  // Prefer high-quality voices by name (Chrome/Edge/Safari premium voices)
  const premiumNames = ["Daniel", "Samantha", "Karen", "Moira", "Fiona", "Alex",
    "Google UK English Male", "Google UK English Female", "Microsoft David",
    "Microsoft Zira", "Microsoft Mark", "Microsoft George", "Microsoft Hazel"];
  if (hint) {
    const hinted = voices.find(v => v.name.toLowerCase().includes(hint.toLowerCase()));
    if (hinted) return hinted;
  }
  // Try premium voices for the right language first
  for (const name of premiumNames) {
    const v = voices.find(vv => vv.name.includes(name) && vv.lang.toLowerCase().startsWith(langBase));
    if (v) return v;
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
  const rafRef = useRef<number | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const onBoundaryRef = useRef(onBoundary);
  useEffect(() => { onBoundaryRef.current = onBoundary; }, [onBoundary]);

  // Check if ElevenLabs is configured — retry once after 2s on failure
  useEffect(() => {
    let retried = false;
    const doFetch = () =>
      fetch("/api/tts/config")
        .then(r => r.json())
        .then(d => {
          // Log the result so a missing ELEVENLABS_API_KEY is visible in DevTools
          console.log("[useTTS] /api/tts/config →", d);
          setHasElevenLabs(!!d.hasElevenLabs);
        })
        .catch(err => {
          console.warn("[useTTS] /api/tts/config failed:", err);
          if (!retried) {
            retried = true;
            setTimeout(doFetch, 2000);
          } else {
            setHasElevenLabs(false);
          }
        });
    doFetch();
  }, []);

  const stopHighlightLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stopBrowser = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    utteranceRef.current = null;
  }, []);

  const stopElevenLabs = useCallback(() => {
    stopHighlightLoop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.onplay = null;
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, [stopHighlightLoop]);

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
      // Check for failure: non-OK status, HTML response (403 proxy block), or JSON error
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || contentType.includes("json") || contentType.includes("html") || contentType.includes("text")) {
        // ElevenLabs failed (403 proxy block, 402 quota, or other error) — fall back to browser
        console.warn("[useTTS] ElevenLabs unavailable (status:", res.status, ") — using browser speech");
        setHasElevenLabs(false);
        speakWithBrowser(text);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;

      const { words, offsets } = buildWordOffsets(text);
      let lastIdx = -1;

      // Highlight is read off the real playback clock every frame, so it
      // self-corrects instead of accumulating drift.
      const tick = () => {
        const a = audioRef.current;
        if (!a || a.paused || a.ended) { rafRef.current = null; return; }
        const dur = a.duration;
        if (dur && isFinite(dur) && words.length && onBoundaryRef.current) {
          const ratio = Math.min(1, Math.max(0, a.currentTime / dur));
          const idx = Math.min(words.length - 1, Math.floor(ratio * words.length));
          if (idx !== lastIdx) {
            lastIdx = idx;
            onBoundaryRef.current(offsets[idx], text);
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      const finish = () => {
        stopHighlightLoop();
        setIsSpeaking(false);
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
      };

      audio.onplay = () => {
        stopHighlightLoop();
        rafRef.current = requestAnimationFrame(tick);
      };
      audio.onended = finish;
      audio.onerror = finish;

      await audio.play();
    } catch {
      setHasElevenLabs(false);
      speakWithBrowser(text);
    }
  }, [lang, stopElevenLabs, stopHighlightLoop, speakWithBrowser]);

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

  // Tear down on unmount
  useEffect(() => () => { stopHighlightLoop(); }, [stopHighlightLoop]);

  return { speak, stop, isSpeaking, getCleanedText, hasElevenLabs };
}
