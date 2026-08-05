/**
 * VoiceCommandOverlay — floating mic badge that shows voice command state.
 * Wired into App.tsx so it's available on every page.
 */
import { Mic, MicOff } from "lucide-react";
import { useVoiceCommands, type VoiceCommandAction } from "@/hooks/useVoiceCommands";
import { useProfile } from "@/contexts/ProfileContext";
import { useLocation } from "wouter";
import { toast } from "sonner";
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
        // Dispatch a custom event that LessonPage listens to
        window.dispatchEvent(new CustomEvent("hikma:read_aloud"));
        break;
      case "next_section":
        window.dispatchEvent(new CustomEvent("hikma:next_section"));
        break;
      case "prev_section":
        window.dispatchEvent(new CustomEvent("hikma:prev_section"));
        break;
      case "unknown":
        toast.info(
          locale === "ar"
            ? `لم أفهم: "${action.transcript}"`
            : `Not understood: "${action.transcript}"`,
          { duration: 2500 }
        );
        break;
      default:
        break;
    }
  };

  const { isListening, startListening, stopListening, isSupported } = useVoiceCommands({
    lang: locale === "ar" ? "ar-SA" : "en-GB",
    onAction: handleAction,
    enabled: true,
  });

  if (!isSupported) return null;

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      aria-label={isListening
        ? (locale === "ar" ? "إيقاف الأوامر الصوتية" : "Stop voice commands")
        : (locale === "ar" ? "تشغيل الأوامر الصوتية (أو اضغط V)" : "Start voice commands (or press V)")}
      aria-pressed={isListening}
      className={`fixed bottom-6 right-6 z-[300] w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        isListening
          ? "bg-red-500 text-white animate-pulse scale-110"
          : "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
      }`}
    >
      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      {isListening && (
        <span className="sr-only">{locale === "ar" ? "يستمع للأوامر…" : "Listening for commands…"}</span>
      )}
    </button>
  );
}
