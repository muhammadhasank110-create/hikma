/**
 * useTTS — Text-to-speech hook.
 *
 * Priority:
 * 1. ElevenLabs — via server proxy (/api/tts/speak) which handles auth and geo-routing.
 *    Falls back to direct browser call if proxy fails.
 * 2. Browser Web Speech API — final fallback.
 *
 * Voice IDs: MUST use free-tier default voices only.
 *   Premium/library voices return 402 on the free plan.
 */
import { useState, useRef, useCallback, useEffect } from "react";

// ElevenLabs voice IDs — FREE TIER ONLY (library/premium voices return 402)
// These are the default voices available on all plans including free.
const ELEVEN_VOICE_EN = "EXAVITQu4vr4xnSDxMaL"; // Bella — warm female, free tier
const ELEVEN_VOICE_AR = "EXAVITQu4vr4xnSDxMaL"; // Bella — multilingual, handles Arabic
const ELEVEN_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined;
const ELEVEN_MODEL = "eleven_multilingual_v2";
// Module-level flag: only set permanently on auth errors (401/403), NOT on 402/429
// which are quota/plan errors that may resolve. Reset on page reload.
let elevenLabsFailedThisSession = false;
// Server proxy URL for ElevenLabs (avoids CORS issues on some browsers)
const TTS_PROXY_URL = "/api/tts/speak";

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
  const premiumNames = ["Daniel", "Samantha", "Karen", "Moira", "Fiona", "Alex",
    "Google UK English Male", "Google UK English Female", "Microsoft David",
    "Microsoft Zira", "Microsoft Mark", "Microsoft George", "Microsoft Hazel"];
  if (hint) {
    const hinted = voices.find(v => v.name.toLowerCase().includes(hint.toLowerCase()));
    if (hinted) return hinted;
  }
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
  // hasElevenLabs is true if the VITE key is present — we don't need a server probe
  const hasElevenLabs = !!(ELEVEN_API_KEY && ELEVEN_API_KEY.length > 10) && !elevenLabsFailedThisSession;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cleanedTextRef = useRef<string>("");
  const rafRef = useRef<number | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const onBoundaryRef = useRef(onBoundary);
  useEffect(() => { onBoundaryRef.current = onBoundary; }, [onBoundary]);

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
    if (!ELEVEN_API_KEY) { speakWithBrowser(text); return; }
    stopElevenLabs();
    setIsSpeaking(true);
    try {
      const isArabic = lang.startsWith("ar");
      const voiceId = isArabic ? ELEVEN_VOICE_AR : ELEVEN_VOICE_EN;

      // Try server proxy first (handles auth, avoids CORS, works everywhere)
      let res: Response;
      try {
        res = await fetch(TTS_PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, locale: isArabic ? "ar" : "en", voiceId }),
        });
        // If proxy says ElevenLabs not configured, fall back to direct call
        if (res.status === 503) {
          throw new Error("proxy-not-configured");
        }
      } catch (proxyErr: any) {
        // Proxy failed or not configured — try direct browser call
        res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: {
            "xi-api-key": ELEVEN_API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: ELEVEN_MODEL,
            voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true },
          }),
        });
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.includes("audio")) {
        console.warn("[useTTS] ElevenLabs error:", res.status, contentType, "— falling back to browser");
        if (res.status === 401 || res.status === 403) {
          // Only permanently disable on auth errors — not on 402 (plan) or 429 (quota)
          elevenLabsFailedThisSession = true;
        }
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
      audio.onerror = () => { console.warn("[useTTS] Audio playback error"); finish(); speakWithBrowser(text); };

      await audio.play();
    } catch (err) {
      console.warn("[useTTS] ElevenLabs fetch failed:", err);
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

  const getCleanedText = useCallback((raw: string) => cleanText(raw), []);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const handler = () => {};
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", handler);
  }, []);

  useEffect(() => () => { stopHighlightLoop(); }, [stopHighlightLoop]);

  return { speak, stop, isSpeaking, getCleanedText, hasElevenLabs };
}
