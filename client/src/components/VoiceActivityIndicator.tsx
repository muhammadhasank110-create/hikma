import { useHikmaMotion } from "@/hooks/useHikmaMotion";

export function getVoiceActivityLabel(state: "idle" | "listening" | "speaking", locale: "en" | "ar" = "en") {
  if (locale === "ar") return state === "listening" ? "حكمة تستمع" : state === "speaking" ? "حكمة تتحدث" : "الصوت غير نشط";
  return state === "listening" ? "Hikma is listening" : state === "speaking" ? "Hikma is speaking" : "Voice is idle";
}

export function VoiceActivityIndicator({ state, locale = "en" }: { state: "idle" | "listening" | "speaking"; locale?: "en" | "ar" }) {
  const { reduceMotion } = useHikmaMotion();
  const label = getVoiceActivityLabel(state, locale);
  const active = state !== "idle";
  return <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-muted/40 px-3 text-xs font-medium text-muted-foreground" role="status" aria-live="polite" aria-label={label}>
    <span className="flex h-4 items-center gap-0.5" aria-hidden="true">{[0, 1, 2, 3].map(index => <span key={index} className={active && !reduceMotion ? "voice-wave-bar" : "h-1.5 w-0.5 rounded-full bg-current/70"} style={active && !reduceMotion ? { animationDelay: `${index * 90}ms` } : undefined} />)}</span>
    <span>{state === "listening" ? (locale === "ar" ? "يستمع" : "Listening") : state === "speaking" ? (locale === "ar" ? "يتحدث" : "Speaking") : (locale === "ar" ? "الصوت" : "Voice")}</span>
  </div>;
}
