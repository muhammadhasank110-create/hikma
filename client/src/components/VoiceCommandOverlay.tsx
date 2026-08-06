/**
 * VoiceCommandOverlay — floating mic button (bottom-left).
 *
 * States:
 *  OFF      → dark MicOff icon — click to enable voice commands
 *  ON       → green Mic icon with pulse ring — actively listening
 *
 * The pulse ring is a SIBLING element (not a child of the button)
 * so it never visually escapes the button boundary.
 *
 * Fixes (Aug 2026):
 * - "open tutor" had no case in the switch, so the most-advertised command
 *   silently did nothing. Added, along with answer_question.
 * - The overlay now honours the voice-commands choice made during onboarding.
 */
import { useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useVoiceCommands, type VoiceCommandAction } from "@/hooks/useVoiceCommands";
import { useProfile } from "@/contexts/ProfileContext";
import { useLocation } from "wouter";
import { useTTS } from "@/hooks/useTTS";
import { playTestSound } from "@/lib/sound";

/** Written by Onboarding step 5. Absent = show the button (previous behaviour). */
export const VOICE_COMMANDS_KEY = "hikma:voice-commands";

function readVoicePreference(): boolean {
  try {
    return localStorage.getItem(VOICE_COMMANDS_KEY) !== "off";
  } catch {
    return true;
  }
}

export function VoiceCommandOverlay() {
  const { profile, locale, updateProfile } = useProfile();
  const [, navigate] = useLocation();
  const tts = useTTS({ lang: locale === "ar" ? "ar-SA" : "en-GB", rate: profile.speechRate });
  const [voiceAllowed, setVoiceAllowed] = useState(readVoicePreference);

  // Pick up the choice when onboarding finishes without a full page reload.
  useEffect(() => {
    const sync = () => setVoiceAllowed(readVoicePreference());
    window.addEventListener("hikma:voice-pref-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("hikma:voice-pref-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handleAction = (action: VoiceCommandAction) => {
    const say = (msg: string) => tts.speak(msg);
    switch (action.type) {
      case "navigate":
        if (!action.path) break;
        navigate(action.path);
        say(locale === "ar" ? "جارٍ الانتقال" : "Navigating");
        break;
      case "go_back":
        window.history.back();
        say(locale === "ar" ? "رجوع" : "Going back");
        break;
      case "go_home":
        navigate("/dashboard");
        say(locale === "ar" ? "الصفحة الرئيسية" : "Going home");
        break;
      case "open_tutor":
        navigate("/tutor");
        say(locale === "ar" ? "جارٍ فتح المعلم" : "Opening the tutor");
        break;
      case "stop_speech":
        tts.stop();
        window.speechSynthesis?.cancel();
        break;
      case "increase_font":
        updateProfile({ fontScale: Math.min(2.5, (profile.fontScale ?? 1) + 0.1) });
        say(locale === "ar" ? "تكبير الخط" : "Font increased");
        break;
      case "decrease_font":
        updateProfile({ fontScale: Math.max(1.0, (profile.fontScale ?? 1) - 0.1) });
        say(locale === "ar" ? "تصغير الخط" : "Font decreased");
        break;
      case "focus_mode":
        updateProfile({ mode: "focus", hideDecorative: true, reduceMotion: true, chunkSize: "micro" });
        say(locale === "ar" ? "وضع التركيز مفعّل" : "Focus mode on");
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
      case "answer_question":
        window.dispatchEvent(new CustomEvent("hikma:answer_question"));
        break;
      default:
        break;
    }
  };

  const { isListening, toggleVoice } = useVoiceCommands({
    lang: locale === "ar" ? "ar-SA" : "en-GB",
    locale,
    onAction: handleAction,
    enabled: true,
  });

  const label = isListening
    ? (locale === "ar" ? "إيقاف الأوامر الصوتية" : "Turn off voice commands")
    : (locale === "ar" ? "تفعيل الأوامر الصوتية" : "Turn on voice commands");

  const handleToggle = () => {
    // Unlock Web Audio on user gesture so sounds work after this click
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) { const c = new AudioCtx(); c.resume().catch(() => {}); }
    } catch {}
    playTestSound();
    toggleVoice();
  };

  // Hooks above always run; the early return below is safe.
  if (!voiceAllowed) return null;

  return (
    <div
      className="fixed bottom-6 left-6 z-[300]"
      role="region"
      aria-label={locale === "ar" ? "الأوامر الصوتية" : "Voice commands"}
    >
      {/* Wrapper: relative so pulse ring can surround the button without clipping */}
      <div className="relative flex items-center justify-center w-14 h-14">
        {/* Pulse ring — positioned as sibling, outside button overflow */}
        {isListening && (
          <span
            aria-hidden="true"
            className="absolute inset-[-4px] rounded-full border-2 border-green-400 mic-ring pointer-events-none"
          />
        )}
        {/* Mic button */}
        <button
          type="button"
          onClick={handleToggle}
          aria-label={label}
          aria-pressed={isListening}
          title={label}
          className={[
            "w-14 h-14 rounded-full shadow-xl overflow-hidden",
            "flex items-center justify-center",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
            isListening
              ? "bg-green-600 text-white"
              : "bg-[rgb(var(--nav-bg))] text-white/80 border border-white/20 hover:bg-primary hover:text-white",
          ].join(" ")}
        >
          {isListening
            ? <Mic className="w-6 h-6" aria-hidden="true" />
            : <MicOff className="w-6 h-6" aria-hidden="true" />
          }
        </button>
      </div>
      {/* Status label below the button */}
      {isListening && (
        <p
          aria-live="polite"
          className="mt-1.5 text-center text-[10px] font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full select-none"
        >
          {locale === "ar" ? "يستمع" : "Listening"}
        </p>
      )}
    </div>
  );
}
