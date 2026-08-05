/**
 * useVoiceCommands — Web Speech API voice command hook.
 *
 * Key fixes:
 * - isSupported checked lazily (not at module init) to avoid false negatives
 * - Requests microphone permission via getUserMedia before starting recognition
 * - Shows clear toast feedback for permission denied / no speech / errors
 * - Tries multiple recognition alternatives for best command match
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export type VoiceCommandAction =
  | { type: "navigate"; path: string }
  | { type: "speak"; text: string }
  | { type: "stop_speech" }
  | { type: "next_section" }
  | { type: "prev_section" }
  | { type: "read_aloud" }
  | { type: "focus_mode" }
  | { type: "increase_font" }
  | { type: "decrease_font" }
  | { type: "open_tutor" }
  | { type: "go_back" }
  | { type: "go_home" }
  | { type: "unknown"; transcript: string };

const EN_COMMANDS: Array<{ patterns: RegExp[]; action: VoiceCommandAction }> = [
  { patterns: [/\b(go home|home page|dashboard|home)\b/i], action: { type: "navigate", path: "/dashboard" } },
  { patterns: [/\b(open tutor|ask tutor|ai tutor|tutor)\b/i], action: { type: "navigate", path: "/tutor" } },
  { patterns: [/\b(ecc|expanded core|ecc page)\b/i], action: { type: "navigate", path: "/ecc" } },
  { patterns: [/\b(settings|open settings|preferences)\b/i], action: { type: "navigate", path: "/settings" } },
  { patterns: [/\b(my progress|progress|achievements)\b/i], action: { type: "navigate", path: "/progress" } },
  { patterns: [/\b(go back|back|previous page)\b/i], action: { type: "go_back" } },
  { patterns: [/\b(next|next section|continue|forward)\b/i], action: { type: "next_section" } },
  { patterns: [/\b(previous|previous section|back section|go back section)\b/i], action: { type: "prev_section" } },
  { patterns: [/\b(read|read aloud|narrate|speak|play)\b/i], action: { type: "read_aloud" } },
  { patterns: [/\b(stop|stop reading|stop speaking|silence|quiet|cancel)\b/i], action: { type: "stop_speech" } },
  { patterns: [/\b(focus mode|focus|concentrate)\b/i], action: { type: "focus_mode" } },
  { patterns: [/\b(bigger text|increase font|larger text|zoom in|bigger)\b/i], action: { type: "increase_font" } },
  { patterns: [/\b(smaller text|decrease font|smaller|zoom out)\b/i], action: { type: "decrease_font" } },
];

const AR_COMMANDS: Array<{ patterns: RegExp[]; action: VoiceCommandAction }> = [
  { patterns: [/الرئيسية|الصفحة الرئيسية|لوحة التحكم/], action: { type: "navigate", path: "/dashboard" } },
  { patterns: [/المعلم|افتح المعلم|اسأل المعلم/], action: { type: "navigate", path: "/tutor" } },
  { patterns: [/رجوع|العودة|الصفحة السابقة/], action: { type: "go_back" } },
  { patterns: [/التالي|القسم التالي|استمر/], action: { type: "next_section" } },
  { patterns: [/السابق|القسم السابق/], action: { type: "prev_section" } },
  { patterns: [/اقرأ|اقرأ بصوت عالٍ|تشغيل/], action: { type: "read_aloud" } },
  { patterns: [/توقف|أوقف القراءة|صمت/], action: { type: "stop_speech" } },
  { patterns: [/وضع التركيز|تركيز/], action: { type: "focus_mode" } },
  { patterns: [/تكبير الخط|نص أكبر/], action: { type: "increase_font" } },
  { patterns: [/تصغير الخط|نص أصغر/], action: { type: "decrease_font" } },
  { patterns: [/الإعدادات/], action: { type: "navigate", path: "/settings" } },
  { patterns: [/تقدمي|الإنجازات/], action: { type: "navigate", path: "/progress" } },
];

function parseCommand(transcript: string, lang: string): VoiceCommandAction {
  const commands = lang.startsWith("ar") ? AR_COMMANDS : EN_COMMANDS;
  for (const cmd of commands) {
    if (cmd.patterns.some(p => p.test(transcript))) return cmd.action;
  }
  return { type: "unknown", transcript };
}

/** Lazily get SpeechRecognition constructor — avoids false negatives at module init */
function getSpeechRecognition(): any | null {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export type VoiceCommandsOptions = {
  lang?: string;
  onAction?: (action: VoiceCommandAction) => void;
  enabled?: boolean;
};

export function useVoiceCommands(options: VoiceCommandsOptions = {}) {
  const { lang = "en-GB", onAction, enabled = true } = options;
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const [, navigate] = useLocation();

  // Always true — we check lazily on click
  const isSupported = true;

  const handleAction = useCallback((action: VoiceCommandAction) => {
    if (onAction) { onAction(action); return; }
    switch (action.type) {
      case "navigate": navigate(action.path); break;
      case "go_back": window.history.back(); break;
      case "go_home": navigate("/dashboard"); break;
      default: break;
    }
  }, [onAction, navigate]);

  const startListening = useCallback(async () => {
    if (!enabled) return;

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      toast.error("Voice commands require Chrome or Edge browser.");
      return;
    }

    // Request microphone permission explicitly — this triggers the browser permission dialog
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // release immediately
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Microphone access denied. Allow microphone in your browser settings and try again.");
      } else {
        toast.error("Microphone unavailable: " + (err.message ?? err.name));
      }
      return;
    }

    // Stop any existing session
    try { recognitionRef.current?.stop(); } catch {}

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info(lang.startsWith("ar") ? "أستمع… تحدث الآن" : "Listening… speak a command", { duration: 3000 });
    };

    recognition.onresult = (event: any) => {
      let bestAction: VoiceCommandAction | null = null;
      const result = event.results[0];
      for (let i = 0; i < (result?.length ?? 0); i++) {
        const transcript = result[i]?.transcript ?? "";
        setLastTranscript(transcript);
        const action = parseCommand(transcript, lang);
        if (action.type !== "unknown") { bestAction = action; break; }
        if (!bestAction) bestAction = action;
      }
      if (bestAction) handleAction(bestAction);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied.");
      } else if (event.error === "no-speech") {
        toast.info(lang.startsWith("ar") ? "لم أسمع شيئاً، حاول مرة أخرى" : "No speech detected. Try again.", { duration: 2500 });
      } else if (event.error !== "aborted") {
        toast.error("Voice error: " + event.error);
      }
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e: any) {
      setIsListening(false);
      toast.error("Could not start voice recognition: " + e.message);
    }
  }, [enabled, lang, handleAction]);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    setIsListening(false);
  }, []);

  // V key to start listening
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "v" && !e.ctrlKey && !e.metaKey && !e.altKey
        && !(e.target instanceof HTMLInputElement)
        && !(e.target instanceof HTMLTextAreaElement)
        && !isListening) {
        startListening();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, isListening, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { try { recognitionRef.current?.stop(); } catch {} };
  }, []);

  return { isListening, lastTranscript, startListening, stopListening, isSupported };
}
