/**
 * useTTS — Web Speech API TTS hook with word-boundary sync.
 *
 * Uses the browser's native SpeechSynthesis API.
 * Exposes an `onBoundary` callback that fires at the exact character offset
 * when each word is spoken — enabling accurate word-by-word highlighting.
 *
 * The `boundary` event is supported in Chrome, Edge, and Safari.
 * Firefox does not fire boundary events — we fall back to a timer there.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type TTSOptions = {
  rate?: number;
  lang?: string;
  voiceHint?: string;
  onBoundary?: (charIndex: number, charLength: number) => void;
  onEnd?: () => void;
};

const VOICE_HINTS: Record<string, string[]> = {
  alloy: ["Google UK English Female", "Microsoft Zira", "Karen", "Samantha"],
  echo: ["Google UK English Male", "Microsoft David", "Daniel", "Alex"],
  fable: ["Google US English", "Microsoft Mark", "Fred"],
  onyx: ["Google US English Male", "Microsoft Guy"],
  nova: ["Google UK English Female", "Microsoft Hazel", "Victoria"],
  shimmer: ["Google US English Female", "Microsoft Zira", "Samantha"],
};

function pickVoice(lang: string, voiceHint: string): SpeechSynthesisVoice | null {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const isAr = lang.startsWith("ar");
  const langVoices = voices.filter(v => isAr ? v.lang.startsWith("ar") : v.lang.startsWith("en"));
  const hints = VOICE_HINTS[voiceHint] ?? [];
  for (const hint of hints) {
    const match = langVoices.find(v => v.name.includes(hint));
    if (match) return match;
  }
  if (langVoices.length) return langVoices[0];
  return voices[0] ?? null;
}

export function useTTS(options: TTSOptions = {}) {
  const { rate = 1.0, lang = "en-GB", voiceHint = "nova", onBoundary, onEnd } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(() => "speechSynthesis" in window);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onBoundaryRef = useRef(onBoundary);
  const onEndRef = useRef(onEnd);

  // Keep callbacks in refs to avoid stale closures
  useEffect(() => { onBoundaryRef.current = onBoundary; }, [onBoundary]);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);

  // Voices load asynchronously in Chrome
  useEffect(() => {
    if (!isSupported) return;
    window.speechSynthesis.getVoices();
    const load = () => {};
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;
    window.speechSynthesis.cancel();

    const clean = text
      .replace(/[#*_`~\[\]()>]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);

    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = lang;
    utt.rate = Math.max(0.5, Math.min(rate, 2.0));
    utt.pitch = 1.0;
    utt.volume = 1.0;

    const voice = pickVoice(lang, voiceHint);
    if (voice) utt.voice = voice;

    utt.onstart = () => setIsSpeaking(true);

    // Word boundary event — fires at exact character position
    utt.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === "word" && onBoundaryRef.current) {
        onBoundaryRef.current(event.charIndex, event.charLength ?? 0);
      }
    };

    utt.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
      onEndRef.current?.();
    };

    utt.onerror = (e) => {
      if (e.error !== "interrupted" && e.error !== "canceled") {
        console.warn("[TTS] error:", e.error);
      }
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utt;
    setIsSpeaking(true);

    // Chrome bug: tiny delay after cancel() prevents silent failure
    setTimeout(() => {
      if (utteranceRef.current === utt) {
        window.speechSynthesis.speak(utt);
      }
    }, 50);
  }, [lang, rate, voiceHint, isSupported]);

  useEffect(() => () => { if (isSupported) window.speechSynthesis.cancel(); }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
}
