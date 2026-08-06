/**
 * useVoiceCommands — simple, direct voice commands.
 *
 * Architecture:
 * - Unmute → mic is live → speak any command directly
 * - No wake word required
 * - Fast pattern matching first, LLM fallback for anything unrecognised
 * - Context-aware: knows which page the user is on
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

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
  | { type: "open_tutor" }
  | { type: "answer_question" }
  | { type: "unknown"; transcript: string };

interface UseVoiceCommandsOptions {
  lang?: string;
  locale?: string;
  onAction?: (action: VoiceCommandAction) => void;
  enabled?: boolean;
  context?: string;
}

// Fast pattern matching for common commands (no LLM needed)
const COMMANDS: Array<{ patterns: RegExp[]; action: VoiceCommandAction; label: string }> = [
  { patterns: [/\b(home|dashboard|go home|main|رئيسي|الرئيسية)\b/i], action: { type: "go_home" }, label: "Going home" },
  { patterns: [/\b(back|go back|رجوع|السابق)\b/i], action: { type: "go_back" }, label: "Going back" },
  { patterns: [/\b(tutor|ai tutor|open tutor|hikma ai|ask hikma|المعلم|المساعد|افتح المعلم)\b/i], action: { type: "open_tutor" }, label: "Opening Hikma AI" },
  { patterns: [/\b(subjects?|lessons?|المواد|الدروس)\b/i], action: { type: "navigate", path: "/subjects/1" }, label: "Opening Subjects" },
  { patterns: [/\b(math|maths|mathematics|رياضيات)\b/i], action: { type: "navigate", path: "/subjects/1" }, label: "Opening Maths" },
  { patterns: [/\b(english|إنجليزي|اللغة الإنجليزية)\b/i], action: { type: "navigate", path: "/subjects/1" }, label: "Opening English" },
  { patterns: [/\b(science|علوم)\b/i], action: { type: "navigate", path: "/subjects/1" }, label: "Opening Science" },
  { patterns: [/\b(progress|my progress|تقدم|تقدمي)\b/i], action: { type: "navigate", path: "/progress" }, label: "Opening Progress" },
  { patterns: [/\b(settings?|إعدادات)\b/i], action: { type: "navigate", path: "/settings" }, label: "Opening Settings" },
  { patterns: [/\b(ecc|expanded core|المهارات الأساسية)\b/i], action: { type: "navigate", path: "/ecc" }, label: "Opening ECC" },
  { patterns: [/\b(next|next section|التالي|القسم التالي|continue|استمر)\b/i], action: { type: "next_section" }, label: "Next section" },
  { patterns: [/\b(previous|prev|back section|السابق|القسم السابق)\b/i], action: { type: "prev_section" }, label: "Previous section" },
  { patterns: [/\b(read|read (this|aloud|it)|start reading|narrate|اقرأ|اقرأ بصوت|ابدأ القراءة)\b/i], action: { type: "read_aloud" }, label: "Reading now" },
  { patterns: [/\b(stop|silence|quiet|pause|أوقف|صمت|توقف)\b/i], action: { type: "stop_speech" }, label: "Stopped" },
  { patterns: [/\b(bigger|larger|increase|font up|أكبر|تكبير)\b/i], action: { type: "increase_font" }, label: "Text bigger" },
  { patterns: [/\b(smaller|decrease|font down|أصغر|تصغير)\b/i], action: { type: "decrease_font" }, label: "Text smaller" },
  { patterns: [/\b(focus|focus mode|وضع التركيز|ركّز)\b/i], action: { type: "focus_mode" }, label: "Focus mode" },
  { patterns: [/\b(answer|submit|my answer|أجب|إجابتي|أرسل)\b/i], action: { type: "answer_question" }, label: "Answering" },
];

function parseCommand(text: string): VoiceCommandAction | null {
  const t = text.toLowerCase().trim();
  for (const cmd of COMMANDS) {
    if (cmd.patterns.some(p => p.test(t))) return cmd.action;
  }
  return null;
}

function getLabelForAction(action: VoiceCommandAction): string {
  if (action.type === "unknown") return "";
  const cmd = COMMANDS.find(c => c.action.type === action.type);
  return cmd?.label ?? action.type;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognition(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function useVoiceCommands({
  lang = "en-GB",
  locale = "en",
  onAction,
  enabled = true,
  context = "app",
}: UseVoiceCommandsOptions = {}) {
  const [, navigate] = useLocation();
  const [isOn, setIsOn] = useState(false);
  const isOnRef = useRef(false);
  const recRef = useRef<any>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextRef = useRef(context);
  useEffect(() => { contextRef.current = context; }, [context]);

  // LLM fallback mutation
  const parseIntent = trpc.tutor.parseVoiceIntent.useMutation();

  const handleAction = useCallback((action: VoiceCommandAction, replyText?: string) => {
    // Speak the confirmation
    if (replyText && "speechSynthesis" in window) {
      const utt = new SpeechSynthesisUtterance(replyText);
      utt.lang = lang;
      utt.rate = 1.1;
      utt.volume = 0.7;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    }
    if (onAction) { onAction(action); return; }
    switch (action.type) {
      case "navigate": navigate(action.path); break;
      case "go_back": window.history.back(); break;
      case "go_home": navigate("/dashboard"); break;
      case "open_tutor": navigate("/tutor"); break;
      default: break;
    }
  }, [onAction, navigate, lang]);

  const stopRecognition = useCallback(() => {
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null; }
    try { recRef.current?.stop(); recRef.current?.abort(); } catch {}
    recRef.current = null;
  }, []);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition || !isOnRef.current) return;
    stopRecognition();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new (SpeechRecognition as any)();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 3;

    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue;
        const transcripts = Array.from({ length: event.results[i].length }, (_, j) =>
          (event.results[i][j]?.transcript ?? "").trim()
        ).filter(Boolean);
        const transcript = transcripts[0] ?? "";
        if (!transcript) continue;

        // Direct command matching — no wake word needed
        const action = parseCommand(transcript);
        if (action) {
          const label = getLabelForAction(action);
          toast.success(`✓ ${label}`, { id: "voice-cmd", duration: 2000 });
          handleAction(action, label);
          return;
        }

        // Unknown — use LLM fallback
        parseIntent.mutate(
          { transcript, context: contextRef.current, locale: locale === "ar" ? "ar" : "en" },
          {
            onSuccess: (result) => {
              if (result.action !== "unknown" && result.confidence > 0.5) {
                toast.success(`✓ ${result.reply || result.action}`, { id: "voice-cmd", duration: 2000 });
                handleAction({ type: result.action as any, path: result.path } as VoiceCommandAction, result.reply);
              } else {
                // Show what was heard so user knows mic is working
                toast.info(`Heard: "${transcript}"`, { duration: 3000 });
              }
            },
            onError: () => {
              toast.info(`Heard: "${transcript}"`, { duration: 3000 });
            },
          }
        );
      }
    };

    rec.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setIsOn(false); isOnRef.current = false;
        toast.error("Microphone access denied. Allow microphone in browser settings.");
        return;
      }
      // Other errors: just restart
    };

    rec.onend = () => {
      if (isOnRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (isOnRef.current) startRecognition();
        }, 300);
      }
    };

    recRef.current = rec;
    try { rec.start(); } catch {}
  }, [lang, locale, handleAction, stopRecognition, parseIntent]);

  const toggleVoice = useCallback(async () => {
    if (isOnRef.current) {
      stopRecognition();
      setIsOn(false); isOnRef.current = false;
      toast.info(locale === "ar" ? "الأوامر الصوتية متوقفة" : "Voice commands off", { duration: 2000 });
      return;
    }

    const SpeechRec = getSpeechRecognition();
    if (!SpeechRec) {
      toast.error("Voice commands require Chrome or Edge.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch {
      toast.error("Microphone access denied. Allow it in browser settings.");
      return;
    }

    setIsOn(true); isOnRef.current = true;
    const onMsg = locale === "ar"
      ? "الأوامر الصوتية مفعّلة — تكلّم الآن"
      : "Voice on — speak your command";
    toast.success(onMsg, { duration: 3000 });
    startRecognition();
  }, [locale, startRecognition, stopRecognition]);

  useEffect(() => () => { stopRecognition(); }, [stopRecognition]);

  return {
    mode: isOn ? "listening" : "off" as "off" | "listening",
    isListening: isOn,
    isAwake: false,
    toggleVoice,
    isSupported: getSpeechRecognition() !== null,
  };
}
