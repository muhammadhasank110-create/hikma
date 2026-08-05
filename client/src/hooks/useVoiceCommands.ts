/**
 * useVoiceCommands — wake-word triggered voice navigation for Hikma.
 *
 * Architecture:
 *  1. OFF: mic is fully off. Button shows grey mic-off icon.
 *  2. STANDBY: mic runs continuously, listening ONLY for the wake word "Hikma".
 *     Button shows green pulsing mic icon.
 *  3. COMMAND: triggered by wake word or button click. Listens for one utterance,
 *     parses it, shows "Did you mean X?" confirmation for fuzzy matches.
 *     Returns to STANDBY after command or timeout.
 *
 * Button click:
 *  - OFF → STANDBY (enable, request mic permission)
 *  - STANDBY → OFF (disable)
 *  - COMMAND → STANDBY (cancel current command session)
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export type VoiceMode = "off" | "standby" | "command";

export type VoiceCommandAction =
  | { type: "navigate"; path: string }
  | { type: "stop_speech" }
  | { type: "next_section" }
  | { type: "prev_section" }
  | { type: "read_aloud" }
  | { type: "focus_mode" }
  | { type: "increase_font" }
  | { type: "decrease_font" }
  | { type: "go_back" }
  | { type: "go_home" }
  | { type: "unknown"; transcript: string };

const EN_COMMANDS: Array<{ patterns: RegExp[]; action: VoiceCommandAction; label: string }> = [
  { patterns: [/\b(go home|home page|dashboard|home)\b/i], action: { type: "go_home" }, label: "Go home" },
  { patterns: [/\b(go back|back|previous page)\b/i], action: { type: "go_back" }, label: "Go back" },
  { patterns: [/\b(subjects?|my subjects?)\b/i], action: { type: "navigate", path: "/subjects" }, label: "Open Subjects" },
  { patterns: [/\b(tutor|ai tutor|open tutor|hikma ai|ask hikma)\b/i], action: { type: "navigate", path: "/tutor" }, label: "Open Tutor" },
  { patterns: [/\b(progress|my progress|achievements)\b/i], action: { type: "navigate", path: "/progress" }, label: "Open Progress" },
  { patterns: [/\b(ecc|expanded core)\b/i], action: { type: "navigate", path: "/ecc" }, label: "Open ECC" },
  { patterns: [/\b(settings?|preferences?)\b/i], action: { type: "navigate", path: "/settings" }, label: "Open Settings" },
  { patterns: [/\b(read|read aloud|narrate|speak|play)\b/i], action: { type: "read_aloud" }, label: "Read aloud" },
  { patterns: [/\b(stop|stop reading|stop speaking|silence|quiet|cancel)\b/i], action: { type: "stop_speech" }, label: "Stop speech" },
  { patterns: [/\b(next|next section|continue|forward)\b/i], action: { type: "next_section" }, label: "Next section" },
  { patterns: [/\b(previous|prev|back section)\b/i], action: { type: "prev_section" }, label: "Previous section" },
  { patterns: [/\b(bigger text|increase font|larger|zoom in)\b/i], action: { type: "increase_font" }, label: "Bigger text" },
  { patterns: [/\b(smaller text|decrease font|smaller|zoom out)\b/i], action: { type: "decrease_font" }, label: "Smaller text" },
  { patterns: [/\b(focus|focus mode|concentrate)\b/i], action: { type: "focus_mode" }, label: "Focus mode" },
];

const AR_COMMANDS: Array<{ patterns: RegExp[]; action: VoiceCommandAction; label: string }> = [
  { patterns: [/الرئيسية|الصفحة الرئيسية|لوحة التحكم/], action: { type: "go_home" }, label: "الصفحة الرئيسية" },
  { patterns: [/رجوع|عودة|السابق/], action: { type: "go_back" }, label: "رجوع" },
  { patterns: [/المواد|المواد الدراسية/], action: { type: "navigate", path: "/subjects" }, label: "المواد" },
  { patterns: [/المعلم|المساعد|حكمة/], action: { type: "navigate", path: "/tutor" }, label: "المعلم الذكي" },
  { patterns: [/التقدم|تقدمي|الإنجازات/], action: { type: "navigate", path: "/progress" }, label: "التقدم" },
  { patterns: [/الإعدادات/], action: { type: "navigate", path: "/settings" }, label: "الإعدادات" },
  { patterns: [/اقرأ|اقرأ بصوت عالٍ|ابدأ القراءة/], action: { type: "read_aloud" }, label: "اقرأ بصوت عالٍ" },
  { patterns: [/توقف|صمت|أوقف/], action: { type: "stop_speech" }, label: "توقف" },
  { patterns: [/التالي|القسم التالي/], action: { type: "next_section" }, label: "التالي" },
  { patterns: [/السابق|القسم السابق/], action: { type: "prev_section" }, label: "السابق" },
  { patterns: [/تكبير|نص أكبر/], action: { type: "increase_font" }, label: "تكبير النص" },
  { patterns: [/تصغير|نص أصغر/], action: { type: "decrease_font" }, label: "تصغير النص" },
  { patterns: [/وضع التركيز|تركيز/], action: { type: "focus_mode" }, label: "وضع التركيز" },
];

const WAKE_WORD_EN = /\b(hikma|hekma|hikma ai|hey hikma)\b/i;
const WAKE_WORD_AR = /حكمة|يا حكمة/;

function getSpeechRecognition(): any | null {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

function fuzzyScore(transcript: string, label: string): number {
  const tWords = transcript.toLowerCase().split(/\s+/);
  const lWords = label.toLowerCase().split(/\s+/);
  return tWords.filter(w => lWords.some(l => l.includes(w) || w.includes(l))).length;
}

function parseCommand(
  transcript: string,
  lang: string
): { action: VoiceCommandAction; label: string; confidence: "exact" | "fuzzy" | "none" } {
  const commands = lang.startsWith("ar") ? AR_COMMANDS : EN_COMMANDS;

  // Exact match
  for (const cmd of commands) {
    if (cmd.patterns.some(p => p.test(transcript))) {
      return { action: cmd.action, label: cmd.label, confidence: "exact" };
    }
  }

  // Fuzzy match
  let best: (typeof commands)[0] | null = null;
  let bestScore = 0;
  for (const cmd of commands) {
    const score = fuzzyScore(transcript, cmd.label);
    if (score > bestScore) { bestScore = score; best = cmd; }
  }

  if (best && bestScore >= 1) {
    return { action: best.action, label: best.label, confidence: "fuzzy" };
  }

  return { action: { type: "unknown", transcript }, label: "", confidence: "none" };
}

export type VoiceCommandsOptions = {
  lang?: string;
  onAction?: (action: VoiceCommandAction) => void;
  enabled?: boolean;
};

export function useVoiceCommands(options: VoiceCommandsOptions = {}) {
  const { lang = "en-GB", onAction, enabled = true } = options;
  const [mode, setMode] = useState<VoiceMode>("off");
  const [lastTranscript, setLastTranscript] = useState("");
  const standbyRef = useRef<any>(null);
  const commandRef = useRef<any>(null);
  const modeRef = useRef<VoiceMode>("off");
  const [, navigate] = useLocation();

  // Keep modeRef in sync with mode state
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const isListening = mode === "command";
  const isStandby = mode === "standby";

  const handleAction = useCallback((action: VoiceCommandAction) => {
    if (onAction) { onAction(action); return; }
    switch (action.type) {
      case "navigate": navigate(action.path); break;
      case "go_back": window.history.back(); break;
      case "go_home": navigate("/dashboard"); break;
      default: break;
    }
  }, [onAction, navigate]);

  // Forward declaration for mutual recursion
  const startStandbyRef = useRef<() => void>(() => {});

  const startCommandSession = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;
    try { commandRef.current?.stop(); } catch {}

    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 3;

    rec.onstart = () => {
      setMode("command");
      toast.info(lang.startsWith("ar") ? "أستمع… قل أمرك" : "Listening… say your command", { duration: 3000, id: "voice-cmd" });
    };

    rec.onresult = (event: any) => {
      const result = event.results[0];
      let parsed: ReturnType<typeof parseCommand> | null = null;
      for (let i = 0; i < (result?.length ?? 0); i++) {
        const t = result[i]?.transcript ?? "";
        setLastTranscript(t);
        const p = parseCommand(t, lang);
        if (p.confidence === "exact") { parsed = p; break; }
        if (!parsed || p.confidence === "fuzzy") parsed = p;
      }
      if (!parsed) return;

      if (parsed.confidence === "fuzzy") {
        const msg = lang.startsWith("ar")
          ? `هل تقصد: "${parsed.label}"؟`
          : `Did you mean: "${parsed.label}"?`;
        const capturedParsed = parsed;
        toast(msg, {
          id: "voice-confirm",
          duration: 6000,
          action: {
            label: lang.startsWith("ar") ? "نعم" : "Yes",
            onClick: () => handleAction(capturedParsed.action),
          },
          cancel: {
            label: lang.startsWith("ar") ? "لا" : "No",
            onClick: () => {},
          },
        });
      } else if (parsed.confidence === "exact") {
        handleAction(parsed.action);
      } else {
        const unknown = parsed.action as { type: "unknown"; transcript: string };
        toast.info(
          lang.startsWith("ar")
            ? `لم أفهم: "${unknown.transcript}" — قل "حكمة" ثم أمرك`
            : `Not understood: "${unknown.transcript}" — say "Hikma" then your command`,
          { duration: 3000 }
        );
      }
    };

    rec.onerror = (event: any) => {
      if (event.error === "no-speech") {
        toast.info(lang.startsWith("ar") ? "لم أسمع شيئاً" : "No speech detected", { duration: 2000 });
      } else if (event.error !== "aborted" && event.error !== "not-allowed") {
        toast.error("Voice error: " + event.error);
      }
    };

    rec.onend = () => {
      if (modeRef.current === "command") {
        setMode("standby");
        setTimeout(() => startStandbyRef.current(), 500);
      }
    };

    commandRef.current = rec;
    try { rec.start(); } catch {}
  }, [lang, handleAction]);

  const startStandby = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;
    try { standbyRef.current?.stop(); } catch {}

    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setMode("standby");

    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = (event.results[i][0]?.transcript ?? "").trim();
        if (WAKE_WORD_EN.test(t) || WAKE_WORD_AR.test(t)) {
          try { rec.stop(); } catch {}
          toast.success(
            lang.startsWith("ar") ? "حكمة تستمع…" : "Hikma is listening…",
            { duration: 2000, id: "wake" }
          );
          setTimeout(() => startCommandSession(), 400);
          return;
        }
      }
    };

    rec.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setMode("off");
        toast.error("Microphone access denied.");
      }
      // no-speech / aborted in standby — will restart via onend
    };

    rec.onend = () => {
      // Auto-restart standby if still in standby mode
      if (modeRef.current === "standby") {
        setTimeout(() => startStandbyRef.current(), 300);
      }
    };

    standbyRef.current = rec;
    try { rec.start(); } catch {}
  }, [lang, startCommandSession]);

  // Keep forward ref in sync
  useEffect(() => { startStandbyRef.current = startStandby; }, [startStandby]);

  const toggleVoice = useCallback(async () => {
    if (mode !== "off") {
      // Turn off
      try { standbyRef.current?.stop(); } catch {}
      try { commandRef.current?.stop(); } catch {}
      setMode("off");
      toast.info(lang.startsWith("ar") ? "الأوامر الصوتية متوقفة" : "Voice commands off", { duration: 2000 });
      return;
    }

    // Turn on — request mic permission first
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      toast.error("Voice commands require Chrome or Edge browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Microphone access denied. Allow microphone in browser settings.");
      } else {
        toast.error("Microphone unavailable: " + (err.message ?? err.name));
      }
      return;
    }

    toast.success(
      lang.startsWith("ar")
        ? 'الأوامر الصوتية مفعّلة — قل "حكمة" لبدء الأمر'
        : 'Voice on — say "Hikma" to give a command',
      { duration: 4000 }
    );
    startStandby();
  }, [mode, lang, startStandby]);

  // V key shortcut — triggers command session directly (skips wake word)
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "v" && !e.ctrlKey && !e.metaKey && !e.altKey
        && !(e.target instanceof HTMLInputElement)
        && !(e.target instanceof HTMLTextAreaElement)
        && modeRef.current === "standby") {
        startCommandSession();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, startCommandSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { standbyRef.current?.stop(); } catch {}
      try { commandRef.current?.stop(); } catch {}
    };
  }, []);

  return {
    mode,
    isListening,
    isStandby,
    lastTranscript,
    toggleVoice,
    startCommandSession,
    isSupported: true,
    // Legacy compat
    startListening: toggleVoice,
    stopListening: toggleVoice,
  };
}
