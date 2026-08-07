/**
 * useVoiceCommands — simple, direct voice commands.
 *
 * Architecture:
 * - Unmute → mic is live → speak any command directly
 * - No wake word required
 * - Fast pattern matching first, LLM fallback for anything unrecognised
 * - Context-aware: knows which page the user is on
 *
 * Fixes (Aug 2026):
 * - Mic is muted for a short window after every recognised command, so spoken
 *   confirmations ("Going back") are not re-heard as new commands.
 * - The hook no longer speaks its own confirmation when the caller supplies
 *   `onAction` — the caller already speaks, and both firing caused overlap.
 * - "stop" is matched before "read", so "stop reading" stops instead of starting.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useSpeech } from "@/contexts/SpeechContext";

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
  | { type: "ask_tutor" }
  | { type: "unknown"; transcript: string };

interface UseVoiceCommandsOptions {
  lang?: string;
  locale?: string;
  onAction?: (action: VoiceCommandAction) => void;
  /** Called when the LLM returns ask_tutor — receives the raw transcript */
  onAskTutor?: (transcript: string) => void;
  enabled?: boolean;
  context?: string;
}

/** How long the mic stays muted after a command, while we speak the reply. */
const SPEAK_MUTE_MS = 2500;

// Fast pattern matching for common commands (no LLM needed).
// ORDER MATTERS — the first match wins. "stop" must precede "read".
const COMMANDS: Array<{ patterns: RegExp[]; action: VoiceCommandAction; label: string }> = [
  { patterns: [/\b(stop|silence|quiet|pause|أوقف|صمت|توقف)\b/i], action: { type: "stop_speech" }, label: "Stopped" },
  { patterns: [/\b(home|dashboard|go home|main|رئيسي|الرئيسية)\b/i], action: { type: "go_home" }, label: "Going home" },
  { patterns: [/\b(back|go back|رجوع)\b/i], action: { type: "go_back" }, label: "Going back" },
  { patterns: [/\b(tutor|ai tutor|open tutor|hikma ai|ask hikma|المعلم|المساعد|افتح المعلم)\b/i], action: { type: "open_tutor" }, label: "Opening Hikma AI" },
  { patterns: [/\b(subjects?|lessons?|المواد|الدروس)\b/i], action: { type: "navigate", path: "/subjects/1" }, label: "Opening Subjects" },
  { patterns: [/\b(math|maths|mathematics|رياضيات)\b/i], action: { type: "navigate", path: "/subjects/1" }, label: "Opening Maths" },
  { patterns: [/\b(english|إنجليزي|اللغة الإنجليزية)\b/i], action: { type: "navigate", path: "/subjects/1" }, label: "Opening English" },
  { patterns: [/\b(science|علوم)\b/i], action: { type: "navigate", path: "/subjects/1" }, label: "Opening Science" },
  { patterns: [/\b(progress|my progress|تقدم|تقدمي)\b/i], action: { type: "navigate", path: "/progress" }, label: "Opening Progress" },
  { patterns: [/\b(settings?|إعدادات)\b/i], action: { type: "navigate", path: "/settings" }, label: "Opening Settings" },
  { patterns: [/\b(ecc|expanded core|المهارات الأساسية)\b/i], action: { type: "navigate", path: "/ecc" }, label: "Opening ECC" },
  { patterns: [/\b(previous|prev|back section|القسم السابق|السابق)\b/i], action: { type: "prev_section" }, label: "Previous section" },
  { patterns: [/\b(next|next section|التالي|القسم التالي|continue|استمر)\b/i], action: { type: "next_section" }, label: "Next section" },
  { patterns: [/\b(read|read (this|aloud|it)|start reading|narrate|اقرأ|اقرأ بصوت|ابدأ القراءة)\b/i], action: { type: "read_aloud" }, label: "Reading now" },
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
  onAskTutor,
  enabled = true,
  context = "app",
}: UseVoiceCommandsOptions = {}) {
  const [, navigate] = useLocation();
  const speech = useSpeech();
  const [isOn, setIsOn] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const isOnRef = useRef(false);
  const recRef = useRef<any>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextRef = useRef(context);
  useEffect(() => { contextRef.current = context; }, [context]);

  // True while we are speaking a reply — the mic is stopped during this window.
  const speakingRef = useRef(false);
  const muteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Lets handleAction restart recognition without depending on startRecognition
  // (which is defined further down).
  const startRecognitionRef = useRef<(() => void) | null>(null);

  // LLM fallback mutation
  const parseIntent = trpc.tutor.parseVoiceIntent.useMutation();

  /**
   * Stop listening while a confirmation is spoken, then resume.
   * Without this the reply is picked up by the mic and matched as a new
   * command — "Going back" contains "back", which loops history.back().
   */
  const muteMicWhileSpeaking = useCallback((ms: number = SPEAK_MUTE_MS) => {
    speakingRef.current = true;
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null; }
    try { recRef.current?.stop(); } catch { /* already stopped */ }
    if (muteTimerRef.current) clearTimeout(muteTimerRef.current);
    muteTimerRef.current = setTimeout(() => {
      speakingRef.current = false;
      if (isOnRef.current) startRecognitionRef.current?.();
    }, ms);
  }, []);

  const handleAction = useCallback((action: VoiceCommandAction, replyText?: string) => {
    muteMicWhileSpeaking();

    // The caller handles the action AND speaks its own reply — don't double up.
    if (onAction) { onAction(action); return; }

    if (replyText) {
      // Use the shared speech service so voice commands use ElevenLabs voice
      speech.speak(replyText, { priority: "assertive" });
    }
    switch (action.type) {
      case "navigate": navigate(action.path); break;
      case "go_back": window.history.back(); break;
      case "go_home": navigate("/dashboard"); break;
      case "open_tutor": navigate("/tutor"); break;
      default: break;
    }
  }, [onAction, navigate, lang, muteMicWhileSpeaking]);

  const stopRecognition = useCallback(() => {
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null; }
    if (muteTimerRef.current) { clearTimeout(muteTimerRef.current); muteTimerRef.current = null; }
    speakingRef.current = false;
    try { recRef.current?.stop(); recRef.current?.abort(); } catch { /* already stopped */ }
    recRef.current = null;
  }, []);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition || !isOnRef.current) return;

    // Tear down the previous instance without wiping the mute state.
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null; }
    try { recRef.current?.stop(); recRef.current?.abort(); } catch { /* already stopped */ }
    recRef.current = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new (SpeechRecognition as any)();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 3;

    rec.onresult = (event: any) => {
      // Ignore anything captured while we were talking.
      if (speakingRef.current) return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue;
        const transcripts = Array.from({ length: event.results[i].length }, (_, j) =>
          (event.results[i][j]?.transcript ?? "").trim()
        ).filter(Boolean);
        const transcript = transcripts[0] ?? "";
        if (!transcript) continue;
        setLastTranscript(transcript);

        // INVERTED MATCHING ORDER (Task 4):
        // Only stop/next/prev/back use instant regex — they need to be instant
        // and misfire harmlessly. Everything else goes to parseVoiceIntent to
        // prevent false matches (e.g. "I don't understand this science bit" navigating away).
        const INSTANT_COMMANDS = /\b(stop|silence|quiet|pause|أوقف|صمت|توقف|next|التالي|previous|prev|السابق|back|رجوع|go back)\b/i;
        if (INSTANT_COMMANDS.test(transcript)) {
          const action = parseCommand(transcript);
          if (action) {
            const label = getLabelForAction(action);
            toast.success(`✓ ${label}`, { id: "voice-cmd", duration: 2000 });
            handleAction(action, label);
            return;
          }
        }

        // Unknown — use LLM fallback
        parseIntent.mutate(
          { transcript, context: contextRef.current, locale: locale === "ar" ? "ar" : "en" },
          {
            onSuccess: (result) => {
              if (result.action === "ask_tutor") {
                // Route to the voice chat panel — do not navigate anywhere
                if (onAskTutor) {
                  onAskTutor(transcript);
                } else {
                  toast.info(`Heard: "${transcript}"`, { duration: 3000 });
                }
                return;
              }
              if (result.action !== "unknown" && result.confidence > 0.5) {
                if (result.action === "navigate" && !result.path) {
                  toast.info(`Heard: "${transcript}"`, { duration: 3000 });
                  return;
                }
                toast.success(`✓ ${result.reply || result.action}`, { id: "voice-cmd", duration: 2000 });
                handleAction({ type: result.action as any, path: result.path } as VoiceCommandAction, result.reply);
              } else {
                toast.info(`Heard: "${transcript}"`, { duration: 3000 });
              }
            },
            onError: (err: any) => {
              if (err?.data?.code === "UNAUTHORIZED" || err?.message?.includes("UNAUTHORIZED")) {
                toast.error(locale === "ar"
                  ? "يرجى تسجيل الدخول لاستخدام الأوامر الصوتية"
                  : "Please sign in to use voice commands");
              } else {
                toast.info(`Heard: "${transcript}"`, { duration: 3000 });
              }
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
      // Don't fight the mute window — it restarts us when the reply finishes.
      if (isOnRef.current && !speakingRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (isOnRef.current && !speakingRef.current) startRecognition();
        }, 300);
      }
    };

    recRef.current = rec;
    try { rec.start(); } catch { /* start() throws if already running */ }
  }, [lang, locale, handleAction, parseIntent]);

  // Keep the ref pointing at the current startRecognition.
  useEffect(() => { startRecognitionRef.current = startRecognition; }, [startRecognition]);

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
    lastTranscript,
  };
}
