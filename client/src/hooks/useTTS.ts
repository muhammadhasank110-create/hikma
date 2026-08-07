/**
 * useTTS — Text-to-speech hook.
 *
 * Priority:
 * 1. ElevenLabs — called DIRECTLY from the browser using VITE_ELEVENLABS_API_KEY
 *    This bypasses the server entirely and avoids the geo-restriction on the server IP.
 * 2. Browser Web Speech API — fallback when ElevenLabs is unavailable or key is missing.
 *
 * Why client-side?
 *   The sandbox server IP is in a geo-restricted region for ElevenLabs.
 *   Real users' browsers are not restricted, so calling directly from the browser works.
 */
import { useState, useRef, useCallback, useEffect } from "react";

// ElevenLabs voice IDs — Rachel (en) and Bella (ar) are free-tier voices
const ELEVEN_VOICE_EN = "21m00Tcm4TlvDq8ikWAM"; // Rachel — warm, clear
const ELEVEN_VOICE_AR = "AZnzlk1XvdvUeBnXmlld"; // Domi — closest Arabic-capable
const ELEVEN_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined;
const ELEVEN_MODEL = "eleven_multilingual_v2";

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
  const hasElevenLabs = !!(ELEVEN_API_KEY && ELEVEN_API_KEY.length > 10);
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

      // Call ElevenLabs DIRECTLY from the browser — bypasses server geo-restriction
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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

      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.includes("audio")) {
        console.warn("[useTTS] ElevenLabs error:", res.status, contentType, "— falling back to browser");
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
