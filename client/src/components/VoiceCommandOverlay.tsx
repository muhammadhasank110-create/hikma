/**
 * VoiceCommandOverlay — floating mic button + conversational chat panel.
 *
 * States:
 *  OFF      → dark MicOff icon — click to enable voice commands
 *  ON       → green Mic icon with pulse ring — actively listening
 *
 * Task 4 changes (Aug 2026):
 * - Added ask_tutor action: questions are answered via /api/tutor/stream
 *   and spoken through SpeechContext (ElevenLabs voice).
 * - Matching order inverted: only stop/next/prev/back use instant regex.
 *   Everything else goes to parseVoiceIntent to prevent false matches.
 * - VoiceChatPanel shows last 6 exchanges, has text input, aria-live log.
 * - Panel opens automatically on first ask_tutor reply.
 * - UNAUTHORIZED from parseVoiceIntent shows "Please sign in" instead of generic toast.
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { Mic, MicOff, Keyboard } from "lucide-react";
import { useVoiceCommands, type VoiceCommandAction } from "@/hooks/useVoiceCommands";
import { useProfile } from "@/contexts/ProfileContext";
import { useLocation } from "wouter";
import { useSpeech } from "@/contexts/SpeechContext";
import { playTestSound } from "@/lib/sound";
import { VoiceChatPanel } from "@/components/VoiceChatPanel";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

/** Written by Onboarding step 5. Absent = show the button (previous behaviour). */
export const VOICE_COMMANDS_KEY = "hikma:voice-commands";
function readVoicePreference(): boolean {
  try {
    return localStorage.getItem(VOICE_COMMANDS_KEY) !== "off";
  } catch {
    return true;
  }
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

export function VoiceCommandOverlay() {
  const { profile, locale, updateProfile } = useProfile();
  const [, navigate] = useLocation();
  const speech = useSpeech();
  const [voiceAllowed, setVoiceAllowed] = useState(readVoicePreference);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAskLoading, setIsAskLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  useEffect(() => {
    const onOpen = () => setMobileMenuOpen(true);
    const onClose = () => setMobileMenuOpen(false);
    window.addEventListener("hikma:mobile-menu-open", onOpen);
    window.addEventListener("hikma:mobile-menu-close", onClose);
    return () => {
      window.removeEventListener("hikma:mobile-menu-open", onOpen);
      window.removeEventListener("hikma:mobile-menu-close", onClose);
    };
  }, []);

  useEffect(() => {
    const sync = () => setVoiceAllowed(readVoicePreference());
    window.addEventListener("hikma:voice-pref-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("hikma:voice-pref-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const askTutor = useCallback(async (question: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: question,
      timestamp: Date.now(),
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatOpen(true);
    setIsAskLoading(true);

    try {
      const res = await fetch("/api/tutor/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          sessionId: "voice-chat",
          profile: {
            mode: profile.mode,
            chunkSize: profile.chunkSize,
            readingLevel: profile.readingLevel,
            locale,
            curriculum: profile.curriculum,
            tier: profile.tier,
            tashkeel: profile.tashkeel,
            numerals: profile.numerals,
          },
          conversationHistory: chatMessages.slice(-6).map(m => ({
            role: m.role,
            content: m.text,
          })),
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error(t("Please sign in to use voice commands", "يرجى تسجيل الدخول لاستخدام الأوامر الصوتية"));
          setIsAskLoading(false);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE lines
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content ?? "";
                fullText += delta;
              } catch {}
            }
          }
        }
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: fullText || t("I couldn't answer that. Try again.", "لم أتمكن من الإجابة. حاول مرة أخرى."),
        timestamp: Date.now(),
      };
      setChatMessages(prev => [...prev, assistantMsg]);
      // Speak the reply through ElevenLabs
      speech.speak(assistantMsg.text, { priority: "polite" });
    } catch (err) {
      console.error("[VoiceChat] askTutor error:", err);
      toast.error(t("Could not get an answer. Try again.", "تعذّر الحصول على إجابة. حاول مرة أخرى."));
    } finally {
      setIsAskLoading(false);
    }
  }, [profile, locale, chatMessages, speech, t]);

  const { data: availableSubjects = [] } = trpc.curriculum.availableSubjects.useQuery();

  const handleAction = useCallback((action: VoiceCommandAction, feedback: string) => {
    const say = () => speech.speak(feedback, { priority: "assertive" });
    const confirmThenNavigate = (path: string) => {
      say();
      window.setTimeout(() => navigate(path), 280);
    };
    switch (action.type) {
      case "navigate":
        if (!action.path) break;
        confirmThenNavigate(action.path);
        break;
      case "go_back":
        say();
        window.setTimeout(() => window.history.back(), 280);
        break;
      case "go_home":
        confirmThenNavigate("/dashboard");
        break;
      case "open_tutor":
        confirmThenNavigate("/tutor");
        break;
      case "stop_speech":
        speech.stop();
        break;
      case "increase_font":
        updateProfile({ fontScale: Math.min(2.5, (profile.fontScale ?? 1) + 0.1) });
        say();
        break;
      case "decrease_font":
        updateProfile({ fontScale: Math.max(1.0, (profile.fontScale ?? 1) - 0.1) });
        say();
        break;
      case "focus_mode":
        updateProfile({ mode: "focus", hideDecorative: true, reduceMotion: true, chunkSize: "micro" });
        say();
        break;
      case "read_aloud":
        window.dispatchEvent(new CustomEvent("hikma:read_aloud"));
        break;
      case "next_section":
        window.dispatchEvent(new CustomEvent("hikma:next_section"));
        break;
      case "prev_section":
        window.dispatchEvent(new CustomEvent("hikma:prev_section"));
        break;
      default:
        break;
    }
  }, [navigate, speech, updateProfile, profile, t]);

  const { mode, isListening, toggleVoice, lastTranscript, statusMessage, isSupported } = useVoiceCommands({
    lang: locale === "ar" ? "ar-SA" : "en-GB",
    locale,
    onAction: handleAction,
    onAskTutor: askTutor,
    enabled: true,
    subjects: availableSubjects,
  });

  const label = isListening ? t("Stop listening", "إيقاف الاستماع") : t("Speak a command", "تحدث بأمر");

  const handleToggle = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) { const c = new AudioCtx(); c.resume().catch(() => {}); }
    } catch {}
    playTestSound();
    toggleVoice();
  };

  if (!voiceAllowed || mobileMenuOpen) return null;

  return (
    <>
      {/* Voice Chat Panel */}
      <VoiceChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        isListening={isListening}
        messages={chatMessages}
        onSendText={askTutor}
        isLoading={isAskLoading}
      />

      {/* Mic button */}
      <div
        className={[
          "fixed z-40",
          "bottom-[calc(1.5rem+env(safe-area-inset-bottom))]",
          "ltr:right-6 rtl:left-6",
        ].join(" ")}
        role="region"
        aria-label={t("Voice commands", "الأوامر الصوتية")}
      >
        <div className="relative flex items-center justify-center w-14 h-14 max-md:w-12 max-md:h-12" onMouseEnter={() => setShowHint(true)} onMouseLeave={() => setShowHint(false)}>
          {isListening && (
            <span
              aria-hidden="true"
              className="absolute inset-[-4px] rounded-full border-2 border-green-400 mic-ring pointer-events-none"
            />
          )}
          <button
            type="button"
            onClick={handleToggle}
            aria-label={label}
            aria-pressed={isListening}
            title={label}
            className={[
              "w-14 h-14 max-md:w-12 max-md:h-12 rounded-full shadow-xl overflow-hidden",
              "flex items-center justify-center",
              "transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
              isListening
                ? "bg-green-600 text-foreground"
                : "bg-[rgb(var(--nav-bg))] text-foreground/80 border border-border/60 hover:bg-primary hover:text-foreground",
            ].join(" ")}
          >
            {isListening
              ? <Mic className="w-6 h-6" aria-hidden="true" />
              : <MicOff className="w-6 h-6" aria-hidden="true" />
            }
          </button>
        </div>
        {mode !== "off" && statusMessage && (
          <p
            role="status"
            aria-live="polite"
            className="mt-1.5 max-w-[220px] text-center text-[10px] font-semibold text-foreground bg-card/95 border border-border px-2 py-1 rounded-full select-none"
          >
            {statusMessage}
          </p>
        )}
        {lastTranscript && mode !== "off" && (
          <div
            aria-live="polite"
            className="mt-1 max-w-[180px] text-center text-[10px] text-foreground/60 bg-black/40 backdrop-blur-sm border border-border px-2 py-1 rounded-xl truncate select-none"
            title={lastTranscript}
          >
            {t("You said:", "قلت:")} &ldquo;{lastTranscript}&rdquo;
          </div>
        )}
        {!isSupported || mode === "error" ? <button type="button" onClick={() => setChatOpen(true)} className="mt-1 inline-flex min-h-8 items-center gap-1 rounded-full bg-card px-2 text-[10px] font-semibold text-foreground shadow-sm ring-1 ring-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><Keyboard className="size-3" aria-hidden="true" />{t("Type instead", "اكتب بدلاً من ذلك")}</button> : null}
        {/* Commands tooltip — shown on hover of the mic button, anchored above it */}
        {showHint && (
          <div
            className="absolute bottom-full mb-3 ltr:right-0 rtl:left-0 w-56 bg-white dark:bg-[#1a2e1c] border border-[#d0d0c8] dark:border-white/20 rounded-2xl p-3 shadow-2xl z-50"
            role="tooltip"
          >
            <p className="text-[10px] font-bold text-[#111411] dark:text-white/90 mb-2 uppercase tracking-widest">{t("Try saying:", "جرّب قول:")}</p>
            <ul className="space-y-1.5">
              {[
                t('"next section"', '"القسم التالي"'),
                t('"read aloud"', '"اقرأ بصوت"'),
                t('"focus mode"', '"وضع التركيز"'),
                t('"what is photosynthesis?"', '"ما هو التمثيل الضوئي؟"'),
                t('"go home"', '"اذهب للرئيسية"'),
                t('"open tutor"', '"افتح المعلم"'),
              ].map((cmd, i) => (
                <li key={i} className="text-[10px] text-[#111411]/80 dark:text-white/75 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#1E4620] dark:bg-green-400 flex-shrink-0" />
                  {cmd}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
