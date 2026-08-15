/**
 * Onboarding — slim orchestrator.
 * Step components live in OnboardingSteps.tsx.
 */
/**
 * Onboarding — 5-step personalisation flow.
 * Runs every session. Saves to DB on completion.
 *
 * Fixes:
 * - aria-label on every card so TTS reads the full description
 * - tabIndex=0 on ALL cards (not just selected) so arrow keys work
 * - Focus goes to selected card on mount (not always card 1)
 * - State is preserved across step navigation
 * - curriculum sent as raw enum key (igcse_edexcel, not "IGCSE Edexcel")
 */
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { HikmaLogo } from "@/components/HikmaLogo";
import { useProfile } from "@/contexts/ProfileContext";
import { useSpeech } from "@/contexts/SpeechContext";
import { useAriaLive } from "@/contexts/AriaLiveContext";
import { Button } from "@/components/ui/button";
import { useSounds } from "@/hooks/useSounds";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { AnimatedProgress } from "@/components/PageTransition";
import { useHikmaMotion } from "@/hooks/useHikmaMotion";
import {
  StepAccessibility, StepLanguage, StepCurriculum,
  StepPersonalisation, StepVoicePreferences, StepVoice, StepDailyGoal,
  type OnboardingData, TOTAL_STEPS,
} from "./OnboardingSteps";

// ── Main Onboarding component ──────────────────────────────────────────────────
export default function Onboarding() {
  const [, navigate] = useLocation();
  const { updateProfileAsync, setLocale } = useProfile();
  const [step, setStep] = useState(1);
  const [stepDir, setStepDir] = useState<1 | -1>(1);
  const motionConfig = useHikmaMotion();
  const prefersReducedMotion = motionConfig.reduceMotion;
  const { announce } = useAriaLive();
  const sounds = useSounds();
  const speech = useSpeech();
  const [saving, setSaving] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<OnboardingData>({
    accessibilityProfile: null,
    locale: "en",
    curriculum: "igcse_edexcel",
    yearGroup: "10",
    mode: "reading",
    fontScale: 1.0,
    speechRate: 1.0,
    theme: "light",
    voiceEnabled: false,
    autoNarrate: false,
    dailyGoalMinutes: 20,
    subjectInterests: [],
    learningMethods: [],
  });

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev: OnboardingData) => ({ ...prev, ...updates }));
  }, []);

  // Apply theme/font preview in real time (without saving to DB)
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", data.theme);
    root.style.fontSize = `${data.fontScale * 100}%`;
  }, [data.theme, data.fontScale]);

  // Focus step container heading when step changes
  useEffect(() => {
    stepRef.current?.focus();
  }, [step]);
  // Global Enter key: advance to next step (skip if focus is on a text input)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const target = e.target as HTMLElement;
      // Let the focused control handle its own Enter. Without this the window
      // listener calls preventDefault() and swallows the activation, so the
      // step-5 toggles flip AND jump to step 6, and Back/Skip go forwards.
      if (target.closest("button, a, input, select, textarea, [role='switch'], [role='radio']")) return;
      if (!canProceed()) return;
      e.preventDefault();
      handleNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const canProceed = () => {
    if (step === 1) return data.accessibilityProfile !== null;
    return true;
  };

  const handleNext = () => {
    setStepDir(1);
    sounds.navigate();
    if (step < TOTAL_STEPS) setStep(s => s + 1);
    else handleFinish();
  };

  const handleBack = () => {
    setStepDir(-1);
    if (step > 1) setStep(s => s - 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    // Persist the step-5 voice-commands choice. There is no DB column for it,
    // so it lives in localStorage; VoiceCommandOverlay reads the same key.
    try {
      localStorage.setItem("hikma:voice-commands", data.voiceEnabled ? "on" : "off");
      window.dispatchEvent(new CustomEvent("hikma:voice-pref-changed"));
    } catch { /* private mode */ }
    const profilePayload = {
      mode: data.mode,
      curriculum: data.curriculum,
      theme: data.theme as any,
      fontScale: data.fontScale,
      speechRate: data.speechRate,
      autoNarrate: data.autoNarrate || data.mode === "audio_first",
      reduceMotion: data.accessibilityProfile === "adhd",
      fontFamily: (data.accessibilityProfile === "dyslexia" ? "opendyslexic" : "atkinson") as "atkinson" | "plex" | "opendyslexic" | "naskh",
      letterSpacing: data.accessibilityProfile === "dyslexia" ? 0.05 : 0,
      lineHeight: data.accessibilityProfile === "dyslexia" ? 1.8 : 1.5,
      overlayTint: (data.accessibilityProfile === "dyslexia" ? "yellow" : "none") as "none" | "blue" | "yellow" | "peach" | "green" | "grey",
      dailyGoalMinutes: data.dailyGoalMinutes,
      subjectInterests: data.subjectInterests,
      learningMethods: data.learningMethods,
    };
    try {
      const effectiveLocale = (data.locale === "both" ? "en" : data.locale) as "en" | "ar";
      setLocale(effectiveLocale);
      try {
        await updateProfileAsync(profilePayload);
      } catch (firstErr: any) {
        // If the server returned HTML (e.g. restarting), retry once after 1.5s
        const isTransient =
          firstErr?.message?.includes("<!doctype") ||
          firstErr?.message?.includes("is not valid JSON") ||
          firstErr?.message?.includes("Failed to fetch") ||
          firstErr?.message?.includes("NetworkError");
        if (isTransient) {
          toast.info(data.locale === "ar" ? "جارٍ إعادة المحاولة…" : "Retrying save…", { duration: 2000 });
          await new Promise(r => setTimeout(r, 1500));
          await updateProfileAsync(profilePayload);
        } else {
          throw firstErr;
        }
      }
      toast.success(data.locale === "ar" ? "مرحباً! تم إعداد حكمة لك." : "Welcome! Hikma is set up for you.");
      speech.stop();
      navigate("/dashboard");
      announce("Profile saved. Welcome to Hikma!", "polite");
    } catch (err) {
      console.error(err);
      toast.error(data.locale === "ar" ? "تعذّر حفظ الإعدادات. حاول مرة أخرى." : "Could not save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const stepTitles = ["Accessibility", "Language", "Curriculum", "Personalise", "Voice & Audio", "Daily Goal", "Preview"];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={data.locale === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HikmaLogo surface="light" variant="wordmark" width={120} alt="Hikma" />
          <span className="font-bold text-sm">Hikma حكمة</span>
        </div>
        <button
          onClick={() => { speech.stop(); navigate("/dashboard"); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label={data.locale === "ar" ? "تخطي الإعداد والذهاب إلى لوحة التحكم" : "Skip setup and go to dashboard"}
        >
          {data.locale === "ar" ? "تخطي" : "Skip for now"}
        </button>
      </div>

      {/* Progress bar */}
      <AnimatedProgress
        value={(step / TOTAL_STEPS) * 100}
        className="h-1 rounded-none"
        aria-label={`Step ${step} of ${TOTAL_STEPS}: ${stepTitles[step - 1]}`}
      />

      {/* Step indicator */}
      <div className="px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
        <span aria-hidden="true">{stepTitles[step - 1]}</span>
        <span aria-hidden="true">{step} / {TOTAL_STEPS}</span>
      </div>

      {/* Step content */}
      <div
        ref={stepRef}
        tabIndex={-1}
        className="flex-1 overflow-y-auto px-4 py-6 flex justify-center focus:outline-none"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={stepDir}>
            <motion.div
              key={step}
              custom={stepDir}
              variants={{
                enter: (dir: number) => (prefersReducedMotion ? { opacity: 0 } : { x: dir * 20, opacity: 0, scale: 0.98 }),
                center: { x: 0, opacity: 1, scale: 1 },
                exit: (dir: number) => (prefersReducedMotion ? { opacity: 0 } : { x: dir * -20, opacity: 0, scale: 0.98 }),
              }}
              initial={prefersReducedMotion ? false : "enter"}
              animate="center"
              exit="exit"
              transition={motionConfig.transition}
            >
              {step === 1 && <StepAccessibility data={data} onChange={updateData} locale={data.locale} />}
              {step === 2 && <StepLanguage data={data} onChange={updateData} locale={data.locale} />}
              {step === 3 && <StepCurriculum data={data} onChange={updateData} locale={data.locale} />}
              {step === 4 && <StepPersonalisation data={data} onChange={updateData} locale={data.locale} />}
              {step === 5 && <StepVoicePreferences data={data} onChange={updateData} locale={data.locale} />}
              {step === 6 && <StepDailyGoal data={data} onChange={updateData} locale={data.locale} />}
              {step === 7 && <StepVoice data={data} locale={data.locale} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t border-border bg-card px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="rounded-2xl gap-1"
            aria-label={data.locale === "ar" ? "العودة للخطوة السابقة" : "Go back to previous step"}
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            {data.locale === "ar" ? "السابق" : "Back"}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className="rounded-2xl gap-1 min-w-[140px]"
            aria-label={step === TOTAL_STEPS
              ? (data.locale === "ar" ? "حفظ الإعدادات وبدء التعلم" : "Save settings and start learning")
              : (data.locale === "ar" ? "الانتقال للخطوة التالية" : "Go to next step")}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                {data.locale === "ar" ? "جاري الحفظ..." : "Saving..."}
              </span>
            ) : step === TOTAL_STEPS ? (
              <>{data.locale === "ar" ? "ابدأ التعلم" : "Start Learning"}<Check className="w-4 h-4" aria-hidden="true" /></>
            ) : (
              <>{data.locale === "ar" ? "التالي" : "Next"}<ChevronRight className="w-4 h-4" aria-hidden="true" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
