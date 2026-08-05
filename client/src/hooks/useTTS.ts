/**
 * useTTS — Web Speech API based TTS hook.
 *
 * The Forge API does not expose a /v1/audio/speech endpoint, so we use the
 * browser's native SpeechSynthesis API as the primary engine.  This gives
 * real audio on all modern browsers (Chrome, Edge, Firefox, Safari) without
 * any server round-trip.
 *
 * Features:
 *  - Speaks text in the user's locale (ar / en)
 *  - Respects profile.speechRate and profile.voice (mapped to browser voices)
 *  - Cancels previous utterance before starting a new one
 *  - Exposes isSpeaking, speak(), stop(), and isSupported
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type TTSOptions = {
  rate?: number;
  lang?: string;
  voiceHint?: string; // partial name match, e.g. "Google UK English Female"
};

// Map Hikma voice names to browser voice name fragments
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

  // Try hint fragments first
  const hints = VOICE_HINTS[voiceHint] ?? [];
  for (const hint of hints) {
    const match = langVoices.find(v => v.name.includes(hint));
    if (match) return match;
  }

  // Fall back to any voice for the language
  if (langVoices.length) return langVoices[0];

  // Last resort: first available voice
  return voices[0] ?? null;
}

export function useTTS(options: TTSOptions = {}) {
  const { rate = 1.0, lang = "en-GB", voiceHint = "nova" } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(() => "speechSynthesis" in window);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pendingTextRef = useRef<string | null>(null);
  const voicesLoadedRef = useRef(false);

  // Voices load asynchronously in Chrome — wait for them
  useEffect(() => {
    if (!isSupported) return;
    const load = () => { voicesLoadedRef.current = true; };
    window.speechSynthesis.getVoices(); // trigger load
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

    // Cancel any ongoing speech
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
    utt.onend = () => { setIsSpeaking(false); utteranceRef.current = null; };
    utt.onerror = (e) => {
      // "interrupted" is normal when stop() is called — not a real error
      if (e.error !== "interrupted" && e.error !== "canceled") {
        console.warn("[TTS] error:", e.error);
      }
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utt;
    setIsSpeaking(true);

    // Chrome bug: speech synthesis silently fails if called immediately after cancel()
    // A tiny setTimeout fixes this reliably.
    setTimeout(() => {
      if (utteranceRef.current === utt) {
        window.speechSynthesis.speak(utt);
      }
    }, 50);
  }, [lang, rate, voiceHint, isSupported]);

  // Clean up on unmount
  useEffect(() => () => { if (isSupported) window.speechSynthesis.cancel(); }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
}
