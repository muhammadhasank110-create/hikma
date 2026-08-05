/**
 * VoiceCommandOverlay — floating mic badge with three states:
 *  OFF      → grey mic-off icon (click to enable)
 *  STANDBY  → green pulsing mic icon (waiting for "Hikma" wake word)
 *  COMMAND  → red pulsing mic icon (actively listening for command)
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
        // Handled inside the hook with a toast
        break;
      default:
        break;
    }
  };

  const { mode, isListening, isStandby, toggleVoice } = useVoiceCommands({
    lang: locale === "ar" ? "ar-SA" : "en-GB",
    onAction: handleAction,
    enabled: true,
  });

  const isOff = mode === "off";

  const ariaLabel = isListening
    ? (locale === "ar" ? "إيقاف الاستماع" : "Stop listening")
    : isStandby
    ? (locale === "ar" ? 'في وضع الانتظار — قل "حكمة"' : 'Standby — say "Hikma" to command')
    : (locale === "ar" ? "تفعيل الأوامر الصوتية" : "Enable voice commands");

  return (
    <button
      onClick={toggleVoice}
      aria-label={ariaLabel}
      aria-pressed={!isOff}
      title={ariaLabel}
      className={[
        "fixed bottom-6 right-6 z-[300] w-12 h-12 rounded-full shadow-lg",
        "flex items-center justify-center transition-all duration-200 relative",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isListening
          ? "bg-red-500 text-white animate-pulse scale-110"
          : isStandby
          ? "bg-primary text-primary-foreground scale-100"
          : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:scale-105",
      ].join(" ")}
    >
      {isOff ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className={`w-5 h-5 ${isStandby ? "opacity-80" : ""}`} />
      )}
      {/* Standby pulse ring */}
      {isStandby && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-30"
        />
      )}
      {isListening && (
        <span className="sr-only">{locale === "ar" ? "يستمع للأوامر…" : "Listening for commands…"}</span>
      )}
    </button>
  );
}
