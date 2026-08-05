import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { startLogin } from "@/const";
import {
  Eye, BookOpen, Brain, Volume2, ChevronRight, ChevronLeft,
  GraduationCap, Globe, Accessibility, Check
} from "lucide-react";
import type { LearnerMode, Locale } from "@/contexts/ProfileContext";

const STEPS = [
  "welcome", "disability", "curriculum", "mode", "language", "done"
] as const;
type Step = typeof STEPS[number];

const DISABILITY_OPTIONS = [
  { value: "blind", labelEn: "Blind / No light perception", labelAr: "كفيف / لا إدراك للضوء", icon: Eye },
  { value: "low_vision", labelEn: "Low vision", labelAr: "ضعف البصر", icon: Eye },
  { value: "dyslexia", labelEn: "Dyslexia", labelAr: "عسر القراءة", icon: BookOpen },
  { value: "adhd", labelEn: "ADHD / Attention difficulties", labelAr: "اضطراب التركيز (ADHD)", icon: Brain },
  { value: "deaf_hh", labelEn: "Deaf / Hard of hearing", labelAr: "أصم / ضعيف السمع", icon: Volume2 },
  { value: "none", labelEn: "No specific disability", labelAr: "لا إعاقة محددة", icon: Accessibility },
];

const CURRICULUM_OPTIONS = [
  { value: "igcse_edexcel", labelEn: "IGCSE Edexcel", labelAr: "IGCSE إيدكسيل" },
  { value: "qatar_moehe", labelEn: "Qatar MoEHE", labelAr: "وزارة التعليم القطرية" },
  { value: "ib_myp", labelEn: "IB MYP", labelAr: "البكالوريا الدولية MYP" },
];

const MODE_OPTIONS = [
  { value: "reading", labelEn: "Reading Mode", labelAr: "وضع القراءة", descEn: "Text-first with TTS support", descAr: "نصي مع دعم القراءة الصوتية", icon: BookOpen },
  { value: "audio_first", labelEn: "Audio-First Mode", labelAr: "وضع الصوت أولاً", descEn: "Full narration, screen-reader optimised", descAr: "سرد كامل، محسّن لقارئ الشاشة", icon: Volume2 },
  { value: "focus", labelEn: "Focus Mode", labelAr: "وضع التركيز", descEn: "One chunk at a time, ADHD-friendly", descAr: "مقطع واحد في كل مرة، مناسب لـ ADHD", icon: Brain },
];

export default function Onboarding() {
  const { isAuthenticated } = useAuth();
  const { profile, updateProfile, locale, setLocale } = useProfile();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("welcome");
  const [selections, setSelections] = useState({
    disability: "none" as string,
    curriculum: profile.curriculum,
    mode: profile.mode,
    locale: locale as Locale,
  });

  const saveProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success(locale === "ar" ? "تم حفظ ملفك الشخصي!" : "Profile saved!");
      navigate("/dashboard");
    },
    onError: () => navigate("/dashboard"),
  });

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex / (STEPS.length - 1)) * 100;
  const t = (en: string, ar: string) => selections.locale === "ar" ? ar : en;

  const next = () => {
    const nextStep = STEPS[stepIndex + 1];
    if (nextStep) setStep(nextStep);
  };
  const back = () => {
    const prevStep = STEPS[stepIndex - 1];
    if (prevStep) setStep(prevStep);
  };

  const finish = () => {
    updateProfile({
      curriculum: selections.curriculum as any,
      mode: selections.mode as any,
    });
    setLocale(selections.locale as "ar" | "en");
    if (isAuthenticated) {
      saveProfile.mutate({
        curriculum: selections.curriculum as any,
        mode: selections.mode as any,
      });
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Growth ring logo */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-2 rounded-full border-2 border-primary/40" />
          <div className="absolute inset-4 rounded-full border-2 border-primary/60" />
          <div className="absolute inset-6 rounded-full bg-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Hikma <span className="font-arabic text-muted-foreground">حكمة</span></h1>
        <p className="text-sm text-muted-foreground">{t("Your adaptive AI learning companion", "رفيقك التعليمي الذكي")}</p>
      </div>

      <div className="w-full max-w-lg space-y-6">
        <Progress value={progress} className="h-1.5" />

        {/* WELCOME */}
        {step === "welcome" && (
          <Card className="animate-arrive">
            <CardContent className="p-8 text-center space-y-4">
              <h2 className="text-xl font-bold">{t("Welcome to Hikma", "أهلاً بك في حكمة")}</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                {t(
                  "Let's set up your learning profile in 4 quick steps. Everything can be changed later in Settings.",
                  "دعنا نضبط ملفك التعليمي في 4 خطوات سريعة. يمكن تغيير كل شيء لاحقاً في الإعدادات."
                )}
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                {["Accessible-first", "Calm & unhurried", "Growth-toned"].map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              <Button onClick={next} className="w-full mt-2">
                {t("Let's begin", "لنبدأ")} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelections(s => ({ ...s, locale: s.locale === "ar" ? "en" : "ar" }))}>
                <Globe className="w-3.5 h-3.5 mr-1" />
                {t("العربية", "English")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* DISABILITY */}
        {step === "disability" && (
          <Card className="animate-arrive">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold">{t("How do you learn best?", "كيف تتعلم بشكل أفضل؟")}</h2>
              <p className="text-sm text-muted-foreground">{t("This helps us adapt the experience for you.", "هذا يساعدنا على تكييف التجربة لك.")}</p>
              <div className="grid grid-cols-2 gap-2">
                {DISABILITY_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const selected = selections.disability === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelections(s => ({ ...s, disability: opt.value }))}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm text-left transition-all ${
                        selected ? "border-primary bg-primary/10 font-semibold" : "border-border hover:border-primary/50"
                      }`}
                      aria-pressed={selected}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0 text-primary" />
                      <span>{t(opt.labelEn, opt.labelAr)}</span>
                      {selected && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" onClick={back} className="flex-1"><ChevronLeft className="w-4 h-4 mr-1" />{t("Back", "رجوع")}</Button>
                <Button onClick={next} className="flex-1">{t("Next", "التالي")} <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CURRICULUM */}
        {step === "curriculum" && (
          <Card className="animate-arrive">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold">{t("Which curriculum do you follow?", "ما المنهج الذي تتبعه؟")}</h2>
              <div className="space-y-2">
                {CURRICULUM_OPTIONS.map(opt => {
                  const selected = selections.curriculum === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelections(s => ({ ...s, curriculum: opt.value }))}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border text-sm transition-all ${
                        selected ? "border-primary bg-primary/10 font-semibold" : "border-border hover:border-primary/50"
                      }`}
                      aria-pressed={selected}
                    >
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        {t(opt.labelEn, opt.labelAr)}
                      </div>
                      {selected && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={back} className="flex-1"><ChevronLeft className="w-4 h-4 mr-1" />{t("Back", "رجوع")}</Button>
                <Button onClick={next} className="flex-1">{t("Next", "التالي")} <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* MODE */}
        {step === "mode" && (
          <Card className="animate-arrive">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold">{t("Choose your learning mode", "اختر وضع التعلم")}</h2>
              <div className="space-y-2">
                {MODE_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const selected = selections.mode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelections(s => ({ ...s, mode: opt.value as LearnerMode }))}
                      className={`w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                        selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                      }`}
                      aria-pressed={selected}
                    >
                      <div className="p-1.5 rounded-md bg-primary/10 flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className={`text-sm ${selected ? "font-semibold" : ""}`}>{t(opt.labelEn, opt.labelAr)}</p>
                        <p className="text-xs text-muted-foreground">{t(opt.descEn, opt.descAr)}</p>
                      </div>
                      {selected && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={back} className="flex-1"><ChevronLeft className="w-4 h-4 mr-1" />{t("Back", "رجوع")}</Button>
                <Button onClick={next} className="flex-1">{t("Next", "التالي")} <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* LANGUAGE */}
        {step === "language" && (
          <Card className="animate-arrive">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold">{t("Preferred interface language", "لغة الواجهة المفضلة")}</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "en", label: "English", sublabel: "Left to right" },
                  { value: "ar", label: "العربية", sublabel: "من اليمين إلى اليسار" },
                ].map(opt => {
                  const selected = selections.locale === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelections(s => ({ ...s, locale: opt.value as Locale }))}
                      className={`p-4 rounded-lg border text-center transition-all ${
                        selected ? "border-primary bg-primary/10 font-semibold" : "border-border hover:border-primary/50"
                      }`}
                      aria-pressed={selected}
                    >
                      <p className="text-base font-bold">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.sublabel}</p>
                      {selected && <Check className="w-4 h-4 text-primary mx-auto mt-1" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={back} className="flex-1"><ChevronLeft className="w-4 h-4 mr-1" />{t("Back", "رجوع")}</Button>
                <Button onClick={next} className="flex-1">{t("Next", "التالي")} <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* DONE */}
        {step === "done" && (
          <Card className="animate-arrive">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">{t("You're all set!", "أنت جاهز!")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("Your learning profile is ready. You can always adjust it in Settings.", "ملفك التعليمي جاهز. يمكنك دائماً تعديله في الإعدادات.")}
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={finish} className="w-full" disabled={saveProfile.isPending}>
                  {saveProfile.isPending ? t("Saving…", "جارٍ الحفظ…") : t("Start Learning", "ابدأ التعلم")}
                </Button>
                {!isAuthenticated && (
                  <Button variant="outline" onClick={() => startLogin()} className="w-full">
                    {t("Sign in to save progress", "سجّل الدخول لحفظ تقدمك")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
