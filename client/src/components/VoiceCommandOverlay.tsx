/**
 * VoiceCommandOverlay — floating mic button (bottom-left).
 *
 * States:
 *  OFF      → grey MicOff icon — click to enable voice commands
 *  STANDBY  → green Mic icon with pulse ring — waiting for "Hikma" wake word
 *  COMMAND  → red Mic icon with pulse — actively listening for a command
 *
 * Mute = OFF state. Unmute = STANDBY state.
 * The button label always describes what clicking it will DO next.
 */
import { Mic, MicOff } from "lucide-react";
import { useVoiceCommands, type VoiceCommandAction } from "@/hooks/useVoiceCommands";
import { useProfile } from "@/contexts/ProfileContext";
import { useLocation } from "wouter";
import { useTTS } from "@/hooks/useTTS";

export function VoiceCommandOverlay() {
  const { profile, locale, updateProfile } = useProfile();
  const [, navigate] = useLocation();
  const tts = useTTS({ lang: locale === "ar" ? "ar-SA" : "en-GB", rate: profile.speechRate });

  const handleAction = (action: VoiceCommandAction) => {
    const say = (msg: string) => tts.speak(msg);
    switch (action.type) {
      case "navigate":
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
      case "unknown":
        break;
      default:
        break;
    }
  };

  const { mode, isListening, isAwake, toggleVoice } = useVoiceCommands({
    lang: locale === "ar" ? "ar-SA" : "en-GB",
    onAction: handleAction,
    enabled: true,
  });

  const isOff = mode === "off";

  // Label describes what clicking will DO
  const label = isListening
    ? (locale === "ar" ? "إيقاف الاستماع" : "Mute — stop listening")
    : isAwake
    ? (locale === "ar" ? 'في وضع الانتظار — قل "حكمة"' : 'Listening — say "Hikma"')
    : (locale === "ar" ? "تفعيل الأوامر الصوتية" : "Enable voice commands");

  return (
    <div
      className="fixed bottom-6 left-6 z-[300] flex flex-col items-start gap-1"
      role="region"
      aria-label={locale === "ar" ? "الأوامر الصوتية" : "Voice commands"}
    >
      {/* Status label — only shown when active */}
      {!isOff && (
        <span
          aria-live="polite"
          className={[
            "text-xs font-semibold px-2 py-0.5 rounded-full select-none pointer-events-none",
            isListening
              ? "bg-red-500 text-white"
              : "bg-primary text-primary-foreground",
          ].join(" ")}
        >
          {isListening
            ? (locale === "ar" ? "يستمع…" : "Listening…")
            : (locale === "ar" ? 'قل "حكمة"' : 'Say "Hikma"')}
        </span>
      )}

      {/* Mic button */}
      <button
        onClick={toggleVoice}
        aria-label={label}
        aria-pressed={!isOff}
        title={label}
        className={[
          "relative w-14 h-14 rounded-full shadow-xl",
          "flex items-center justify-center",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
          isListening
            ? "bg-red-500 text-white scale-110"
            : isAwake
            ? "bg-primary text-primary-foreground"
            : "bg-muted/90 text-muted-foreground border border-border hover:bg-primary hover:text-primary-foreground hover:scale-105",
        ].join(" ")}
      >
        {isOff
          ? <MicOff className="w-6 h-6" aria-hidden="true" />
          : <Mic className="w-6 h-6" aria-hidden="true" />
        }

        {/* Pulse ring when standby or listening */}
        {(isAwake || isListening) && (
          <span
            aria-hidden="true"
            className={[
              "absolute inset-0 rounded-full border-2 animate-ping opacity-40",
              isListening ? "border-red-400" : "border-primary",
            ].join(" ")}
          />
        )}
      </button>
    </div>
  );
}
