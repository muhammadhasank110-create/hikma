/**
 * useVoiceCommands — continuous voice command recognition for Hikma.
 *
 * Uses the Web Speech API (SpeechRecognition) for continuous listening.
 * Supports English and Arabic commands for navigation, TTS control,
 * font scaling, and accessibility toggles.
 *
 * Activation: hold the V key, or call startListening() programmatically.
 * A floating badge shows listening state.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

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
  { patterns: [/\b(go home|home page|dashboard)\b/i], action: { type: "navigate", path: "/dashboard" } },
  { patterns: [/\b(open tutor|ask tutor|ai tutor|tutor)\b/i], action: { type: "navigate", path: "/tutor" } },
  { patterns: [/\b(go back|back|previous page)\b/i], action: { type: "go_back" } },
  { patterns: [/\b(next|next section|continue|forward)\b/i], action: { type: "next_section" } },
  { patterns: [/\b(previous|previous section|back section|go back section)\b/i], action: { type: "prev_section" } },
  { patterns: [/\b(read|read aloud|narrate|speak|play)\b/i], action: { type: "read_aloud" } },
  { patterns: [/\b(stop|stop reading|stop speaking|silence|quiet)\b/i], action: { type: "stop_speech" } },
  { patterns: [/\b(focus mode|focus|concentrate)\b/i], action: { type: "focus_mode" } },
  { patterns: [/\b(bigger text|increase font|larger text|zoom in)\b/i], action: { type: "increase_font" } },
  { patterns: [/\b(smaller text|decrease font|smaller|zoom out)\b/i], action: { type: "decrease_font" } },
  { patterns: [/\b(settings|open settings)\b/i], action: { type: "navigate", path: "/settings" } },
  { patterns: [/\b(my progress|progress|achievements)\b/i], action: { type: "navigate", path: "/progress" } },
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

export type VoiceCommandsOptions = {
  lang?: string;
  onAction?: (action: VoiceCommandAction) => void;
  enabled?: boolean;
};

export function useVoiceCommands(options: VoiceCommandsOptions = {}) {
  const { lang = "en-GB", onAction, enabled = true } = options;
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [isSupported] = useState(
    () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window
  );
  const recognitionRef = useRef<any>(null);
  const [, navigate] = useLocation();

  const handleAction = useCallback((action: VoiceCommandAction) => {
    if (onAction) { onAction(action); return; }
    // Default handlers
    switch (action.type) {
      case "navigate": navigate(action.path); break;
      case "go_back": window.history.back(); break;
      case "go_home": navigate("/dashboard"); break;
      default: break;
    }
  }, [onAction, navigate]);

  const startListening = useCallback(() => {
    if (!isSupported || !enabled) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setLastTranscript(transcript);
      const action = parseCommand(transcript, lang);
      handleAction(action);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isSupported, enabled, lang, handleAction]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // V key hold-to-listen
  useEffect(() => {
    if (!enabled || !isSupported) return;
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
  }, [enabled, isSupported, isListening, startListening]);

  return { isListening, lastTranscript, startListening, stopListening, isSupported };
}
