/**
 * useVoiceCommands — single continuous recognition loop.
 *
 * Simplified architecture:
 * - ONE SpeechRecognition instance, continuous=true, always running when enabled
 * - Listens for wake word "Hikma" in every utterance
 * - After wake word detected, the NEXT utterance (or inline command) is the command
 * - No complex state machine — just "off" | "listening" | "awake"
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export type VoiceCommandAction =
  | { type: "navigate"; path: string }
  | { type: "go_back" }
  | { type: "go_home" }
  | { type: "stop_speech" }
  | { type: "increase_font" }
  | { type: "decrease_font" }
  | { type: "focus_mode" }
  | { type: "read_aloud" }
  | { type: "next_section" }
  | { type: "prev_section" }
  | { type: "unknown"; transcript: string };

interface UseVoiceCommandsOptions {
  lang?: string;
  onAction?: (action: VoiceCommandAction) => void;
  enabled?: boolean;
}

// Wake word patterns — generous matching
const WAKE_WORDS = /\b(hikma|hekma|hekma|حكمة|يا حكمة|hey hikma|ok hikma)\b/i;

// Command patterns
const COMMANDS: Array<{ patterns: RegExp[]; action: VoiceCommandAction; label: string }> = [
  { patterns: [/\b(home|dashboard|go home|main|رئيسي|الرئيسية)\b/i], action: { type: "go_home" }, label: "Go Home" },
  { patterns: [/\b(back|go back|رجوع|السابق)\b/i], action: { type: "go_back" }, label: "Go Back" },
  { patterns: [/\b(tutor|ai tutor|open tutor|hikma ai|ask hikma|المعلم|المساعد)\b/i], action: { type: "navigate", path: "/tutor" }, label: "Open Tutor" },
  { patterns: [/\b(subjects?|lessons?|المواد|الدروس)\b/i], action: { type: "navigate", path: "/subjects/1" }, label: "Open Subjects" },
  { patterns: [/\b(math|maths|mathematics|رياضيات)\b/i], action: { type: "navigate", path: "/subjects/1" }, label: "Open Maths" },
  { patterns: [/\b(english|إنجليزي|اللغة الإنجليزية)\b/i], action: { type: "navigate", path: "/subjects/1" }, label: "Open English" },
  { patterns: [/\b(science|علوم)\b/i], action: { type: "navigate", path: "/subjects/1" }, label: "Open Science" },
  { patterns: [/\b(progress|my progress|تقدم|تقدمي)\b/i], action: { type: "navigate", path: "/progress" }, label: "Open Progress" },
  { patterns: [/\b(settings?|إعدادات)\b/i], action: { type: "navigate", path: "/settings" }, label: "Open Settings" },
  { patterns: [/\b(ecc|expanded core|المهارات الأساسية)\b/i], action: { type: "navigate", path: "/ecc" }, label: "Open ECC" },
  { patterns: [/\b(next|next section|التالي|القسم التالي)\b/i], action: { type: "next_section" }, label: "Next Section" },
  { patterns: [/\b(previous|prev|back section|السابق|القسم السابق)\b/i], action: { type: "prev_section" }, label: "Previous Section" },
  { patterns: [/\b(read|read aloud|narrate|اقرأ|اقرأ بصوت)\b/i], action: { type: "read_aloud" }, label: "Read Aloud" },
  { patterns: [/\b(stop|silence|quiet|أوقف|صمت)\b/i], action: { type: "stop_speech" }, label: "Stop Speech" },
  { patterns: [/\b(bigger|larger|increase|font up|أكبر|تكبير)\b/i], action: { type: "increase_font" }, label: "Bigger Text" },
  { patterns: [/\b(smaller|decrease|font down|أصغر|تصغير)\b/i], action: { type: "decrease_font" }, label: "Smaller Text" },
  { patterns: [/\b(focus|focus mode|وضع التركيز)\b/i], action: { type: "focus_mode" }, label: "Focus Mode" },
];

function parseCommand(text: string): VoiceCommandAction | null {
  const t = text.toLowerCase().trim();
  for (const cmd of COMMANDS) {
    if (cmd.patterns.some(p => p.test(t))) {
      return cmd.action;
    }
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognition(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useVoiceCommands({ lang = "en-GB", onAction, enabled = true }: UseVoiceCommandsOptions = {}) {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"off" | "listening" | "awake">("off");
  const modeRef = useRef<"off" | "listening" | "awake">("off");
  const recRef = useRef<any>(null);
  const awakeRef = useRef(false); // true = next utterance is a command
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);

  const handleAction = useCallback((action: VoiceCommandAction) => {
    if (onAction) { onAction(action); return; }
    switch (action.type) {
      case "navigate": navigate(action.path); break;
      case "go_back": window.history.back(); break;
      case "go_home": navigate("/dashboard"); break;
      default: break;
    }
  }, [onAction, navigate]);

  const stopRecognition = useCallback(() => {
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null; }
    try { recRef.current?.stop(); recRef.current?.abort(); } catch {}
    recRef.current = null;
  }, []);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition || modeRef.current === "off") return;

    stopRecognition();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new (SpeechRecognition as any)();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 2;

    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue;
        const transcript = (event.results[i][0]?.transcript ?? "").trim();
        if (!transcript) continue;

        const hasWakeWord = WAKE_WORDS.test(transcript);

        if (hasWakeWord) {
          // Check for inline command: "Hikma, open tutor"
          const withoutWake = transcript.replace(WAKE_WORDS, "").replace(/^[,،\s]+/, "").trim();
          if (withoutWake.length > 1) {
            const action = parseCommand(withoutWake);
            if (action) {
              toast.success(`Hikma: ${COMMANDS.find(c => c.action.type === action.type)?.label ?? "Done"}`, { id: "voice-cmd", duration: 2000 });
              handleAction(action);
              awakeRef.current = false;
              setMode("listening");
              return;
            }
          }
          // Wake word only — wait for next utterance
          awakeRef.current = true;
          setMode("awake");
          toast.success(lang.startsWith("ar") ? "حكمة تستمع… قل أمرك" : "Hikma is listening… say your command", { id: "voice-wake", duration: 3000 });
          return;
        }

        if (awakeRef.current) {
          // This utterance is the command
          awakeRef.current = false;
          setMode("listening");
          const action = parseCommand(transcript);
          if (action) {
            const label = COMMANDS.find(c => c.action.type === action.type)?.label ?? "Done";
            toast.success(`Hikma: ${label}`, { id: "voice-cmd", duration: 2000 });
            handleAction(action);
          } else {
            // Unknown — show what was heard
            toast.info(`Heard: "${transcript}" — try: "next section", "open tutor", "go home"`, { duration: 4000 });
          }
        }
      }
    };

    rec.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setMode("off");
        modeRef.current = "off";
        toast.error("Microphone access denied. Allow microphone in browser settings.");
        return;
      }
      if (event.error === "no-speech" || event.error === "aborted") {
        // Normal — will restart via onend
        return;
      }
      // Other errors — restart
    };

    rec.onend = () => {
      // Auto-restart if still enabled
      if (modeRef.current !== "off") {
        restartTimerRef.current = setTimeout(() => {
          if (modeRef.current !== "off") startRecognition();
        }, 300);
      }
    };

    recRef.current = rec;
    try { rec.start(); } catch (err) {
      // If already started, ignore
    }
  }, [lang, handleAction, stopRecognition]);

  const toggleVoice = useCallback(async () => {
    if (modeRef.current !== "off") {
      // Turn off
      stopRecognition();
      awakeRef.current = false;
      setMode("off");
      modeRef.current = "off";
      toast.info(lang.startsWith("ar") ? "الأوامر الصوتية متوقفة" : "Voice commands off", { duration: 2000 });
      return;
    }

    // Turn on — check browser support first
    const SpeechRec = getSpeechRecognition();
    if (!SpeechRec) {
      toast.error("Voice commands require Chrome or Edge. This browser does not support speech recognition.");
      return;
    }

    // Request microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Microphone access denied. Click the lock icon in the address bar and allow microphone.");
      } else {
        toast.error("Microphone unavailable: " + (err.message ?? err.name));
      }
      return;
    }

    setMode("listening");
    modeRef.current = "listening";
    toast.success(
      lang.startsWith("ar")
        ? 'الأوامر الصوتية مفعّلة — قل "حكمة" ثم أمرك'
        : 'Voice on — say "Hikma" then your command (e.g. "Hikma, open tutor")',
      { duration: 5000 }
    );
    startRecognition();
  }, [lang, startRecognition, stopRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, [stopRecognition]);

  return {
    mode,
    isListening: mode === "listening",
    isStandby: mode === "listening", // alias for compat
    isAwake: mode === "awake",
    toggleVoice,
    isSupported: getSpeechRecognition() !== null,
  };
}
