/**
 * useTTS — Text-to-speech hook.
 *
 * Priority:
 * 1. ElevenLabs — exclusively via server proxy (/api/tts/speak).
 *    The API key NEVER leaves the server. The browser never holds it.
 * 2. Browser Web Speech API — final fallback.
 *
 * Voice IDs: MUST use free-tier default voices only.
 *   Premium/library voices return 402 on the free plan.
 */
import { useState, useRef, useCallback, useEffect } from "react";

// ElevenLabs voice IDs — FREE TIER ONLY (library/premium voices return 402)
// These are the default voices available on all plans including free.
const ELEVEN_VOICE_EN = "EXAVITQu4vr4xnSDxMaL"; // Sarah/Bella — warm female, free tier
const ELEVEN_VOICE_AR = "onwK4e9ZLuTAKqWW03F9"; // Daniel — deep broadcaster, best Arabic on free tier
const ELEVEN_MODEL = "eleven_multilingual_v2";
// Module-level flag: set for the current browser session when the proxy reports
// invalid credentials or an exhausted quota. Reset on page reload.
let elevenLabsFailedThisSession = false;
// Server proxy URL — returns audio plus provider timing, while the API key stays server-side.
const TTS_ALIGNED_PROXY_URL = "/api/tts/speak-with-timestamps";
// Config endpoint — tells us if the server has ELEVENLABS_API_KEY set.
const TTS_CONFIG_URL = "/api/tts/config";

/** Probe the server once per session to find out if ElevenLabs is available. */
let serverConfigPromise: Promise<boolean> | null = null;
function fetchServerHasElevenLabs(): Promise<boolean> {
  if (serverConfigPromise) return serverConfigPromise;
  serverConfigPromise = fetch(TTS_CONFIG_URL)
    .then(r => r.json())
    .then((d: any) => {
      const has = !!d?.hasElevenLabs;
      console.log("[useTTS] /api/tts/config →", d, "→ hasElevenLabs:", has);
      return has;
    })
    .catch(err => {
      console.warn("[useTTS] Could not reach /api/tts/config:", err);
      // Retry once after 2 s, then give up
      return new Promise<boolean>(resolve =>
        setTimeout(() =>
          fetch(TTS_CONFIG_URL)
            .then(r => r.json())
            .then((d: any) => resolve(!!d?.hasElevenLabs))
            .catch(() => resolve(false)),
          2000
        )
      );
    });
  return serverConfigPromise;
}

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

type CharacterAlignment = {
  characters: string[];
  character_start_times_seconds: number[];
};

export function buildWordStartTimes(text: string, alignment: CharacterAlignment): number[] | null {
  const { offsets } = buildWordOffsets(text);
  if (!offsets.length || alignment.characters.length !== alignment.character_start_times_seconds.length) return null;
  const starts = offsets.map((offset) => alignment.character_start_times_seconds[offset]);
  return starts.every((time) => Number.isFinite(time)) ? starts : null;
}

export function getAlignedWordIndex(wordStartTimes: number[], currentTime: number) {
  if (!wordStartTimes.length) return -1;
  let index = 0;
  while (index + 1 < wordStartTimes.length && wordStartTimes[index + 1] <= currentTime) index += 1;
  return index;
}

function base64ToBlob(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: "audio/mpeg" });
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
  // hasElevenLabs is driven by the server config endpoint — never by a client-side key
  const [hasElevenLabs, setHasElevenLabs] = useState(false);
  useEffect(() => {
    if (elevenLabsFailedThisSession) return;
    fetchServerHasElevenLabs().then(has => setHasElevenLabs(has && !elevenLabsFailedThisSession));
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cleanedTextRef = useRef<string>("");
  const rafRef = useRef<number | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const onBoundaryRef = useRef(onBoundary);
  // AbortController to cancel in-flight ElevenLabs fetch when speak() is called again
  const abortRef = useRef<AbortController | null>(null);
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
    // Cancel any in-flight fetch immediately
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
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
  const stopRef = useRef(stop);
  useEffect(() => { stopRef.current = stop; }, [stop]);

  const speakWithBrowser = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    stopBrowser();
    const { offsets } = buildWordOffsets(text);
    const reportWord = (wordIndex: number) => {
      if (!offsets.length || wordIndex < 0 || wordIndex >= offsets.length) return;
      onBoundaryRef.current?.(offsets[wordIndex], cleanedTextRef.current);
    };
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = Math.max(0.5, Math.min(2, rate));
    utt.lang = lang;
    const voice = pickVoice(lang, voiceHint);
    if (voice) utt.voice = voice;
    utt.onstart = () => {
      setIsSpeaking(true);
      // Begin at the first word. Subsequent positions are updated exclusively
      // by browser-provided boundaries, never by estimated timing.
      reportWord(0);
    };
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    utt.onboundary = (event) => {
      if (event.name === "word" && onBoundaryRef.current) {
        let wordIndex = 0;
        while (wordIndex + 1 < offsets.length && offsets[wordIndex + 1] <= event.charIndex) wordIndex += 1;
        reportWord(wordIndex);
      }
    };
    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, [rate, lang, voiceHint, stopBrowser]);

  const speakWithElevenLabs = useCallback(async (text: string) => {
    stopElevenLabs();
    setIsSpeaking(true);
    // Create a new AbortController for this request
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const isArabic = lang.startsWith("ar");
      const voiceId = isArabic ? ELEVEN_VOICE_AR : ELEVEN_VOICE_EN;

      // Server proxy returns generated audio together with provider timestamps.
      // Both remain server-side until this safe response reaches the learner.
      const res = await fetch(TTS_ALIGNED_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, locale: isArabic ? "ar" : "en", voiceId }),
        signal: controller.signal,
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.includes("application/json")) {
        const errorText = await res.text().catch(() => "");
        const quotaExceeded = /quota_exceeded|quota of|credits remaining/i.test(errorText);
        console.warn("[useTTS] ElevenLabs proxy unavailable — falling back to browser", { status: res.status, quotaExceeded });
        if (res.status === 401 || res.status === 403 || quotaExceeded) {
          elevenLabsFailedThisSession = true;
          setHasElevenLabs(false);
        }
        speakWithBrowser(text);
        return;
      }

      const payload = await res.json() as { audioBase64?: string; alignment?: CharacterAlignment };
      const wordStartTimes = payload.audioBase64 && payload.alignment ? buildWordStartTimes(text, payload.alignment) : null;
      if (!payload.audioBase64 || !wordStartTimes) {
        console.warn("[useTTS] Timed audio alignment unavailable — falling back to browser speech boundaries");
        speakWithBrowser(text);
        return;
      }
      const blob = base64ToBlob(payload.audioBase64);
      // Check if this request was aborted while we were downloading
      if (controller.signal.aborted) { setIsSpeaking(false); return; }
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;

      const { offsets } = buildWordOffsets(text);
      let lastIdx = -1;

      const tick = () => {
        const a = audioRef.current;
        if (!a || a.paused || a.ended) { rafRef.current = null; return; }
        const dur = a.duration;
        if (dur && isFinite(dur) && wordStartTimes.length && onBoundaryRef.current) {
          const idx = getAlignedWordIndex(wordStartTimes, a.currentTime);
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
      if ((err as any)?.name === "AbortError") {
        setIsSpeaking(false); // Cancelled intentionally — no fallback
      } else {
        console.warn("[useTTS] ElevenLabs fetch failed:", err);
        speakWithBrowser(text);
      }
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
    if (hasElevenLabs && !elevenLabsFailedThisSession) {
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

  // All active TTS instances respond to app-wide route changes. This includes
  // page-local narration (for example, LessonPage) as well as shared speech.
  useEffect(() => {
    const stopForNavigation = () => stopRef.current();
    window.addEventListener("hikma:stop-speech", stopForNavigation);
    return () => {
      window.removeEventListener("hikma:stop-speech", stopForNavigation);
      stopRef.current();
    };
  }, []);

  return { speak, stop, isSpeaking, getCleanedText, hasElevenLabs };
}
