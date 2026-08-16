import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
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
  | { type: "open_tutor" };

export type VoiceMode = "off" | "requesting_permission" | "listening" | "processing" | "executing" | "error";

export interface VoiceSubject {
  id: number;
  curriculumId: number;
  code: string | null;
  titleEn: string;
  titleAr: string;
}

interface UseVoiceCommandsOptions {
  lang?: string;
  locale?: "en" | "ar";
  onAction?: (action: VoiceCommandAction, feedback: string) => void;
  onAskTutor?: (transcript: string) => void;
  enabled?: boolean;
  subjects?: VoiceSubject[];
  subjectsReady?: boolean;
  context?: string;
}

export interface VoiceInterpretation {
  kind: "action" | "ask_tutor" | "unsupported";
  action?: VoiceCommandAction;
  feedback: string;
}

const SPEAK_MUTE_MS = 2500;

type CommandDefinition = {
  patterns: RegExp[];
  action: VoiceCommandAction;
  feedbackEn: string;
  feedbackAr: string;
};

// This list includes only actions that exist in the application today.
const COMMANDS: CommandDefinition[] = [
  { patterns: [/stop|silence|quiet|pause|أوقف|صمت|توقف/i], action: { type: "stop_speech" }, feedbackEn: "Stopping narration", feedbackAr: "جارٍ إيقاف القراءة" },
  { patterns: [/go home|home|dashboard|main|اذهب للرئيسية|افتح الرئيسية|الرئيسية/i], action: { type: "go_home" }, feedbackEn: "Opening Home", feedbackAr: "جارٍ فتح الرئيسية" },
  { patterns: [/go back|back|رجوع|ارجع/i], action: { type: "go_back" }, feedbackEn: "Going back", feedbackAr: "جارٍ الرجوع" },
  { patterns: [/ai tutor|open tutor|hikma ai|ask hikma|tutor|افتح المعلم|المعلم الذكي|المعلم/i], action: { type: "open_tutor" }, feedbackEn: "Opening AI Tutor", feedbackAr: "جارٍ فتح المعلّم الذكي" },
  { patterns: [/open practice|practice|exam skills|افتح التدريب|التدريب/i], action: { type: "navigate", path: "/exam-skills" }, feedbackEn: "Opening Practice", feedbackAr: "جارٍ فتح التدريب" },
  { patterns: [/show my progress|how am i doing|open progress|progress|افتح تقدمي|كيف أتقدم|تقدمي|التقدم/i], action: { type: "navigate", path: "/progress" }, feedbackEn: "Opening Progress", feedbackAr: "جارٍ فتح التقدّم" },
  { patterns: [/open profile|open settings|profile|settings|افتح الملف الشخصي|افتح الإعدادات|الإعدادات/i], action: { type: "navigate", path: "/settings" }, feedbackEn: "Opening Profile and Settings", feedbackAr: "جارٍ فتح الملف الشخصي والإعدادات" },
  { patterns: [/open learn|open subjects|subjects|lessons|learn|افتح التعلّم|افتح المواد|المواد|الدروس/i], action: { type: "navigate", path: "/subjects/1" }, feedbackEn: "Opening Learn", feedbackAr: "جارٍ فتح التعلّم" },
  { patterns: [/open ecc|expanded core|افتح المنهج الموسع|المنهج الموسع/i], action: { type: "navigate", path: "/ecc" }, feedbackEn: "Opening ECC", feedbackAr: "جارٍ فتح المنهج الموسّع" },
  { patterns: [/previous section|previous|prev|back section|القسم السابق|السابق/i], action: { type: "prev_section" }, feedbackEn: "Previous section", feedbackAr: "القسم السابق" },
  { patterns: [/next section|next|continue|القسم التالي|التالي|استمر/i], action: { type: "next_section" }, feedbackEn: "Next section", feedbackAr: "القسم التالي" },
  { patterns: [/read aloud|start reading|narrate|read this|اقرأ بصوت|ابدأ القراءة|اقرأ/i], action: { type: "read_aloud" }, feedbackEn: "Starting narration", feedbackAr: "جارٍ بدء القراءة" },
  { patterns: [/bigger|larger|increase font|font up|تكبير الخط|أكبر/i], action: { type: "increase_font" }, feedbackEn: "Increasing text size", feedbackAr: "جارٍ تكبير الخط" },
  { patterns: [/smaller|decrease font|font down|تصغير الخط|أصغر/i], action: { type: "decrease_font" }, feedbackEn: "Decreasing text size", feedbackAr: "جارٍ تصغير الخط" },
  { patterns: [/focus mode|focus|وضع التركيز|ركّز/i], action: { type: "focus_mode" }, feedbackEn: "Turning on Focus mode", feedbackAr: "جارٍ تفعيل وضع التركيز" },
];

function normalize(text: string) {
  return text.toLocaleLowerCase().replace(/[\u064B-\u065Fـ]/g, "").replace(/[،؟!.,]/g, " ").replace(/\s+/g, " ").trim();
}

function isFeatureRequest(text: string) {
  return /\b(open|go|show|take me|start)\b|افتح|اذهب|اعرض|أرني|خذني/i.test(text);
}

function matchesSubject(text: string, subject: VoiceSubject) {
  const normalized = normalize(text);
  const values = [subject.titleEn, subject.titleAr, subject.code ?? ""].map(normalize).filter(Boolean);
  if (values.some(value => normalized.includes(value))) return true;
  const code = (subject.code ?? "").toLowerCase();
  if (/math/.test(code)) return /\bmaths?\b|mathematics|رياضيات/i.test(normalized);
  if (/eng/.test(code)) return /\benglish\b|إنجليزي|اللغة الإنجليزية/i.test(normalized);
  if (/sci/.test(code)) return /\bscience\b|علوم/i.test(normalized);
  return false;
}

export function interpretVoiceCommand(text: string, subjects: VoiceSubject[], locale: "en" | "ar" = "en"): VoiceInterpretation {
  const normalized = normalize(text);
  const command = COMMANDS.find(candidate => candidate.patterns.some(pattern => pattern.test(normalized)));
  if (command) return { kind: "action", action: command.action, feedback: locale === "ar" ? command.feedbackAr : command.feedbackEn };

  const subject = subjects.find(candidate => matchesSubject(normalized, candidate));
  if (subject) {
    const label = locale === "ar" ? subject.titleAr : subject.titleEn;
    return {
      kind: "action",
      action: { type: "navigate", path: `/subjects/${subject.curriculumId}/topics/${subject.id}` },
      feedback: locale === "ar" ? `جارٍ فتح ${label}` : `Opening ${label}`,
    };
  }

  if (isFeatureRequest(normalized)) {
    return {
      kind: "unsupported",
      feedback: locale === "ar"
        ? "هذه الميزة غير متاحة حالياً. جرّب فتح التعلّم أو التقدّم أو المعلّم الذكي."
        : "That feature is not available yet. Try opening Learn, Progress, or AI Tutor.",
    };
  }

  return { kind: "ask_tutor", feedback: locale === "ar" ? "جارٍ إرسال سؤالك إلى حكمة" : "Asking Hikma" };
}

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
  subjects = [],
  subjectsReady = true,
}: UseVoiceCommandsOptions = {}) {
  const [, navigate] = useLocation();
  const speech = useSpeech();
  const [mode, setMode] = useState<VoiceMode>("off");
  const [statusMessage, setStatusMessage] = useState("");
  const [lastTranscript, setLastTranscript] = useState("");
  const isOnRef = useRef(false);
  const recRef = useRef<any>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const muteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakingRef = useRef(false);
  const startRecognitionRef = useRef<(() => void) | null>(null);
  const subjectsRef = useRef(subjects);

  useEffect(() => { subjectsRef.current = subjects; }, [subjects]);

  const stopRecognition = useCallback(() => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (muteTimerRef.current) clearTimeout(muteTimerRef.current);
    restartTimerRef.current = null;
    muteTimerRef.current = null;
    speakingRef.current = false;
    try { recRef.current?.stop(); recRef.current?.abort(); } catch { /* already stopped */ }
    recRef.current = null;
  }, []);

  const muteMicWhileSpeaking = useCallback(() => {
    speakingRef.current = true;
    try { recRef.current?.stop(); } catch { /* already stopped */ }
    if (muteTimerRef.current) clearTimeout(muteTimerRef.current);
    muteTimerRef.current = setTimeout(() => {
      speakingRef.current = false;
      if (isOnRef.current) startRecognitionRef.current?.();
    }, SPEAK_MUTE_MS);
  }, []);

  const runAction = useCallback((action: VoiceCommandAction, feedback: string) => {
    muteMicWhileSpeaking();
    if (onAction) {
      onAction(action, feedback);
      return;
    }
    speech.speak(feedback, { priority: "assertive" });
    if (action.type === "navigate") navigate(action.path);
    if (action.type === "go_home") navigate("/dashboard");
    if (action.type === "go_back") window.history.back();
    if (action.type === "open_tutor") navigate("/tutor");
  }, [muteMicWhileSpeaking, navigate, onAction, speech]);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition || !isOnRef.current || !enabled) return;
    try { recRef.current?.stop(); recRef.current?.abort(); } catch { /* already stopped */ }
    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.onstart = () => {
      setMode("listening");
      setStatusMessage(locale === "ar" ? "يستمع…" : "Listening…");
    };
    rec.onresult = (event: any) => {
      if (speakingRef.current) return;
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (!event.results[index].isFinal) continue;
        const transcript = String(event.results[index][0]?.transcript ?? "").trim();
        if (!transcript) continue;
        setLastTranscript(transcript);
        setMode("processing");
        setStatusMessage(locale === "ar" ? "جارٍ الفهم…" : "Understanding…");
        const interpretation = interpretVoiceCommand(transcript, subjectsRef.current, locale);
        if (interpretation.kind === "action" && interpretation.action) {
          setMode("executing");
          setStatusMessage(interpretation.feedback);
          runAction(interpretation.action, interpretation.feedback);
          return;
        }
        if (interpretation.kind === "unsupported") {
          setMode("error");
          setStatusMessage(interpretation.feedback);
          speech.speak(interpretation.feedback, { priority: "assertive" });
          return;
        }
        setStatusMessage(interpretation.feedback);
        onAskTutor?.(transcript);
      }
    };
    rec.onerror = (event: any) => {
      const denied = event.error === "not-allowed" || event.error === "service-not-allowed";
      const message = denied
        ? (locale === "ar" ? "تم رفض إذن الميكروفون. اسمح به من إعدادات المتصفح، أو اكتب بدلاً من ذلك." : "Microphone access was denied. Allow it in browser settings, or type instead.")
        : (locale === "ar" ? "تعذّر استخدام الصوت الآن. جرّب الكتابة بدلاً من ذلك." : "Voice is unavailable right now. Try typing instead.");
      setMode("error");
      setStatusMessage(message);
      if (denied) isOnRef.current = false;
    };
    rec.onend = () => {
      if (isOnRef.current && !speakingRef.current) {
        restartTimerRef.current = setTimeout(() => startRecognitionRef.current?.(), 300);
      }
    };
    recRef.current = rec;
    try { rec.start(); } catch {
      setMode("error");
      setStatusMessage(locale === "ar" ? "تعذّر بدء الاستماع. جرّب مرة أخرى أو اكتب بدلاً من ذلك." : "Could not start listening. Try again or type instead.");
    }
  }, [enabled, lang, locale, onAskTutor, runAction, speech]);

  useEffect(() => { startRecognitionRef.current = startRecognition; }, [startRecognition]);
  useEffect(() => () => stopRecognition(), [stopRecognition]);

  const toggleVoice = useCallback(async () => {
    if (isOnRef.current) {
      isOnRef.current = false;
      stopRecognition();
      setMode("off");
      setStatusMessage(locale === "ar" ? "الأوامر الصوتية متوقفة" : "Voice commands are off");
      return;
    }
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition || !navigator.mediaDevices?.getUserMedia) {
      setMode("error");
      setStatusMessage(locale === "ar" ? "الأوامر الصوتية غير مدعومة في هذا المتصفح. اكتب بدلاً من ذلك." : "Voice commands are not supported in this browser. Type instead.");
      return;
    }
    setMode("requesting_permission");
    setStatusMessage(locale === "ar" ? "جارٍ طلب إذن الميكروفون…" : "Requesting microphone access…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      isOnRef.current = true;
      startRecognition();
    } catch (error: any) {
      const denied = error?.name === "NotAllowedError" || error?.name === "SecurityError";
      setMode("error");
      setStatusMessage(denied
        ? (locale === "ar" ? "تم رفض إذن الميكروفون. اسمح به من إعدادات المتصفح، أو اكتب بدلاً من ذلك." : "Microphone access was denied. Allow it in browser settings, or type instead.")
        : (locale === "ar" ? "الميكروفون غير متاح. اكتب بدلاً من ذلك." : "Microphone access is unavailable. Type instead."));
    }
  }, [locale, startRecognition, stopRecognition]);

  return {
    mode,
    isListening: mode === "listening",
    toggleVoice,
    isSupported: getSpeechRecognition() !== null && Boolean(navigator.mediaDevices?.getUserMedia),
    lastTranscript,
    statusMessage,
  };
}
