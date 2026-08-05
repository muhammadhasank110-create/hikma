/**
 * Onboarding — Hikma adaptive learning platform
 * 
 * A fully accessible, step-by-step onboarding flow that:
 * 1. Asks the learner to choose their accessibility profile
 * 2. Collects language, curriculum, year group, and personalisation preferences
 * 3. Immediately applies the chosen profile to the app
 * 4. Saves everything to the database
 * 
 * Fully keyboard navigable — no mouse required.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Eye, Brain, BookOpen, Accessibility,
  ChevronRight, ChevronLeft, Check, Volume2,
  Globe, GraduationCap, Sliders, Mic
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type AccessibilityProfile = "blind" | "low_vision" | "adhd" | "dyslexia" | "none";

interface OnboardingData {
  accessibilityProfile: AccessibilityProfile | null;
  locale: "en" | "ar" | "both";
  curriculum: "igcse_edexcel" | "qatar_moehe";
  yearGroup: string;
  mode: "audio_first" | "reading" | "focus" | "custom";
  fontScale: number;
  speechRate: number;
  theme: string;
}

const TOTAL_STEPS = 5;

// ── Accessibility Profile Cards ────────────────────────────────────────────────
const PROFILES = [
  {
    id: "blind" as AccessibilityProfile,
    icon: Eye,
    titleEn: "Blind / Screen Reader",
    titleAr: "كفيف / قارئ الشاشة",
    descEn: "Full keyboard navigation. Every element announces itself when focused. Voice commands enabled by default. Optimised for screen readers.",
    descAr: "تنقل كامل بلوحة المفاتيح. كل عنصر يُعلن عن نفسه عند التركيز عليه. أوامر صوتية مفعّلة افتراضياً.",
    colour: "border-blue-400 bg-blue-50 dark:bg-blue-950/30",
    selectedColour: "border-blue-600 bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500",
    applies: ["Audio-first mode", "TTS on every focus", "Full keyboard nav", "Screen reader optimised"],
  },
  {
    id: "low_vision" as AccessibilityProfile,
    icon: Eye,
    titleEn: "Low Vision",
    titleAr: "ضعف البصر",
    descEn: "Larger text, high contrast, and zoom-friendly layout. Keyboard navigation enabled. Audio support available.",
    descAr: "نص أكبر، تباين عالٍ، وتخطيط يدعم التكبير. تنقل بلوحة المفاتيح مفعّل. دعم صوتي متاح.",
    colour: "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30",
    selectedColour: "border-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500",
    applies: ["Large font (1.3×)", "High contrast theme", "Keyboard nav", "Audio support"],
  },
  {
    id: "adhd" as AccessibilityProfile,
    icon: Brain,
    titleEn: "ADHD / Focus",
    titleAr: "اضطراب التركيز / فرط النشاط",
    descEn: "Simplified interface. One task at a time. No distractions. Pomodoro timer built in. Calm colours and no animations.",
    descAr: "واجهة مبسّطة. مهمة واحدة في كل مرة. لا مشتتات. مؤقت بومودورو مدمج. ألوان هادئة وبدون حركات.",
    colour: "border-green-400 bg-green-50 dark:bg-green-950/30",
    selectedColour: "border-green-600 bg-green-100 dark:bg-green-900/50 ring-2 ring-green-500",
    applies: ["Focus mode", "No animations", "Calm theme", "Pomodoro timer"],
  },
  {
    id: "dyslexia" as AccessibilityProfile,
    icon: BookOpen,
    titleEn: "Dyslexia",
    titleAr: "عسر القراءة",
    descEn: "Dyslexia-friendly font (Lexend), increased letter spacing, cream background tint, and no justified text.",
    descAr: "خط مناسب لعسر القراءة (ليكسند)، تباعد أحرف أكبر، خلفية كريمية، وبدون نص محاذى.",
    colour: "border-amber-400 bg-amber-50 dark:bg-amber-950/30",
    selectedColour: "border-amber-600 bg-amber-100 dark:bg-amber-900/50 ring-2 ring-amber-500",
    applies: ["Lexend font", "Cream background", "Extra letter spacing", "Larger line height"],
  },
  {
    id: "none" as AccessibilityProfile,
    icon: Accessibility,
    titleEn: "No specific need",
    titleAr: "لا حاجة محددة",
    descEn: "Standard experience with full access to all features. You can always adjust settings later.",
    descAr: "تجربة قياسية مع وصول كامل لجميع الميزات. يمكنك دائماً تعديل الإعدادات لاحقاً.",
    colour: "border-gray-300 bg-gray-50 dark:bg-gray-900/30",
    selectedColour: "border-gray-500 bg-gray-100 dark:bg-gray-800/50 ring-2 ring-gray-400",
    applies: ["Standard mode", "All features available", "Customisable"],
  },
];

const YEAR_GROUPS = [
  { value: "9", label: "Year 9 (Age 13-14)" },
  { value: "10", label: "Year 10 (Age 14-15)" },
  { value: "11", label: "Year 11 (Age 15-16)" },
  { value: "12", label: "Year 12 / AS Level" },
  { value: "other", label: "Other / Not sure" },
];

// ── Map profile to settings ────────────────────────────────────────────────────
function profileToSettings(profile: AccessibilityProfile): Partial<OnboardingData> {
  switch (profile) {
    case "blind":
      return { mode: "audio_first", theme: "dark", fontScale: 1.1, speechRate: 0.9 };
    case "low_vision":
      return { mode: "audio_first", theme: "high_contrast", fontScale: 1.3, speechRate: 1.0 };
    case "adhd":
      return { mode: "focus", theme: "calm", fontScale: 1.1, speechRate: 1.0 };
    case "dyslexia":
      return { mode: "reading", theme: "cream", fontScale: 1.15, speechRate: 0.9 };
    case "none":
    default:
      return { mode: "reading", theme: "light", fontScale: 1.0, speechRate: 1.0 };
  }
}

// ── Step Components ────────────────────────────────────────────────────────────
function StepAccessibility({
  data, onChange, locale
}: {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
  locale: string;
}) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-focus first card for keyboard users
    const first = containerRef.current?.querySelector('[tabindex="0"]') as HTMLElement;
    first?.focus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t("How do you learn best?", "كيف تتعلم بشكل أفضل؟")}</h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          {t(
            "Choose the option that best describes your needs. This sets up Hikma for you. You can always change this in Settings.",
            "اختر الخيار الذي يصف احتياجاتك بشكل أفضل. يمكنك دائماً تغيير هذا في الإعدادات."
          )}
        </p>
      </div>

      <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label={t("Accessibility profile", "ملف إمكانية الوصول")}>
        {PROFILES.map((profile) => {
          const Icon = profile.icon;
          const isSelected = data.accessibilityProfile === profile.id;
          return (
            <button
              key={profile.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => {
                onChange({ accessibilityProfile: profile.id, ...profileToSettings(profile.id) });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange({ accessibilityProfile: profile.id, ...profileToSettings(profile.id) });
                }
                // Arrow key navigation between cards
                if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                  e.preventDefault();
                  const cards = Array.from(containerRef.current?.querySelectorAll('[role="radio"]') ?? []) as HTMLElement[];
                  const idx = cards.indexOf(e.currentTarget as HTMLElement);
                  cards[(idx + 1) % cards.length]?.focus();
                }
                if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const cards = Array.from(containerRef.current?.querySelectorAll('[role="radio"]') ?? []) as HTMLElement[];
                  const idx = cards.indexOf(e.currentTarget as HTMLElement);
                  cards[(idx - 1 + cards.length) % cards.length]?.focus();
                }
              }}
              className={`text-left p-4 rounded-2xl border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isSelected ? profile.selectedColour : profile.colour + " hover:border-primary/50"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{t(profile.titleEn, profile.titleAr)}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t(profile.descEn, profile.descAr)}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.applies.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepLanguage({ data, onChange, locale }: { data: OnboardingData; onChange: (u: Partial<OnboardingData>) => void; locale: string }) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const options = [
    { value: "en" as const, label: "English", sublabel: "All content in English" },
    { value: "ar" as const, label: "العربية", sublabel: "كل المحتوى بالعربية" },
    { value: "both" as const, label: "Both / كلاهما", sublabel: "Switch between English and Arabic" },
  ];
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Globe className="w-10 h-10 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">{t("What language do you prefer?", "ما اللغة التي تفضلها؟")}</h2>
        <p className="text-muted-foreground text-sm">{t("Hikma works in English, Arabic, or both.", "حكمة يعمل بالإنجليزية أو العربية أو كليهما.")}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange({ locale: opt.value })}
            className={`p-4 rounded-2xl border-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${data.locale === opt.value ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-border hover:border-primary/50"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.sublabel}</p>
              </div>
              {data.locale === opt.value && <Check className="w-5 h-5 text-primary" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepCurriculum({ data, onChange, locale }: { data: OnboardingData; onChange: (u: Partial<OnboardingData>) => void; locale: string }) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <GraduationCap className="w-10 h-10 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">{t("What curriculum are you following?", "ما المنهج الذي تتبعه؟")}</h2>
        <p className="text-muted-foreground text-sm">{t("This helps Hikma align content to your exact syllabus.", "يساعد هذا حكمة على مواءمة المحتوى مع منهجك الدراسي.")}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
        {[
          { value: "igcse_edexcel" as const, label: "IGCSE Edexcel", sub: "International GCSE — Pearson Edexcel", flag: "🇬🇧" },
          { value: "qatar_moehe" as const, label: "Qatar MoEHE", sub: "وزارة التعليم والتعليم العالي", flag: "🇶🇦" },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange({ curriculum: opt.value })}
            className={`p-4 rounded-2xl border-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${data.curriculum === opt.value ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-border hover:border-primary/50"}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{opt.flag}</span>
                <div>
                  <p className="font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.sub}</p>
                </div>
              </div>
              {data.curriculum === opt.value && <Check className="w-5 h-5 text-primary" />}
            </div>
          </button>
        ))}
      </div>
      <div className="max-w-sm mx-auto space-y-2">
        <label className="text-sm font-medium block">{t("Year group / Grade", "الصف الدراسي")}</label>
        <div className="grid grid-cols-3 gap-2">
          {YEAR_GROUPS.map(yg => (
            <button
              key={yg.value}
              onClick={() => onChange({ yearGroup: yg.value })}
              className={`p-2 rounded-xl border text-xs text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${data.yearGroup === yg.value ? "border-primary bg-primary/10 font-semibold" : "border-border hover:border-primary/50"}`}
            >
              {yg.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepPersonalisation({ data, onChange, locale }: { data: OnboardingData; onChange: (u: Partial<OnboardingData>) => void; locale: string }) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Sliders className="w-10 h-10 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">{t("Fine-tune your experience", "اضبط تجربتك")}</h2>
        <p className="text-muted-foreground text-sm">{t("These are set based on your profile. Adjust if needed.", "تم ضبط هذه الإعدادات بناءً على ملفك الشخصي. عدّلها إذا لزم.")}</p>
      </div>
      <div className="max-w-sm mx-auto space-y-5">
        {/* Font size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("Text size", "حجم النص")}</label>
            <span className="text-sm text-primary font-semibold">{Math.round(data.fontScale * 100)}%</span>
          </div>
          <input
            type="range" min="80" max="160" step="5"
            value={Math.round(data.fontScale * 100)}
            onChange={e => onChange({ fontScale: parseInt(e.target.value) / 100 })}
            className="w-full accent-primary"
            aria-label={t("Text size", "حجم النص")}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>A</span><span className="text-base">A</span><span className="text-xl">A</span>
          </div>
        </div>

        {/* Speech rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              {t("Speech speed", "سرعة الكلام")}
            </label>
            <span className="text-sm text-primary font-semibold">{data.speechRate}×</span>
          </div>
          <input
            type="range" min="0.5" max="2.0" step="0.1"
            value={data.speechRate}
            onChange={e => onChange({ speechRate: parseFloat(e.target.value) })}
            className="w-full accent-primary"
            aria-label={t("Speech speed", "سرعة الكلام")}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("Slow", "بطيء")}</span><span>{t("Normal", "عادي")}</span><span>{t("Fast", "سريع")}</span>
          </div>
        </div>

        {/* Theme */}
        <div className="space-y-2">
          <label className="text-sm font-medium block">{t("Colour theme", "نظام الألوان")}</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "light", label: t("Light", "فاتح"), bg: "bg-white border-gray-200" },
              { value: "dark", label: t("Dark", "داكن"), bg: "bg-gray-900 border-gray-700" },
              { value: "cream", label: t("Cream", "كريمي"), bg: "bg-amber-50 border-amber-200" },
              { value: "calm", label: t("Calm", "هادئ"), bg: "bg-green-50 border-green-200" },
              { value: "high_contrast", label: t("High contrast", "تباين عالٍ"), bg: "bg-black border-yellow-400" },
            ].map(th => (
              <button
                key={th.value}
                onClick={() => onChange({ theme: th.value })}
                className={`p-2 rounded-xl border-2 text-xs text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${th.bg} ${data.theme === th.value ? "ring-2 ring-primary border-primary" : ""}`}
              >
                <span className={th.value === "dark" || th.value === "high_contrast" ? "text-white" : "text-gray-800"}>{th.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepVoice({ data, onChange, locale }: { data: OnboardingData; onChange: (u: Partial<OnboardingData>) => void; locale: string }) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [tested, setTested] = useState(false);

  const testVoice = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(
      locale === "ar"
        ? "مرحباً! أنا حكمة AI. سأكون مرشدك في التعلم."
        : "Hello! I'm Hikma AI. I'll be your learning guide."
    );
    utt.lang = locale === "ar" ? "ar-SA" : "en-GB";
    utt.rate = data.speechRate;
    window.speechSynthesis.speak(utt);
    setTested(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Mic className="w-10 h-10 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">{t("Voice & Audio", "الصوت والصوتيات")}</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {t(
            "Hikma can read everything aloud and respond to your voice. Say 'Hikma' at any time to give a voice command.",
            "يمكن لحكمة قراءة كل شيء بصوت عالٍ والاستجابة لصوتك. قل 'حكمة' في أي وقت لإعطاء أمر صوتي."
          )}
        </p>
      </div>
      <div className="max-w-sm mx-auto space-y-4">
        <Button
          variant="outline"
          className="w-full h-12 rounded-2xl gap-2"
          onClick={testVoice}
        >
          <Volume2 className="w-4 h-4" />
          {t("Test voice", "اختبر الصوت")}
          {tested && <Check className="w-4 h-4 text-green-500" />}
        </Button>

        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
          <p className="text-sm font-semibold">{t("Voice commands you can use:", "الأوامر الصوتية التي يمكنك استخدامها:")}</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• {t('"Hikma, go home"', '"حكمة، اذهب للرئيسية"')}</li>
            <li>• {t('"Hikma, open maths"', '"حكمة، افتح الرياضيات"')}</li>
            <li>• {t('"Hikma, read aloud"', '"حكمة، اقرأ بصوت عالٍ"')}</li>
            <li>• {t('"Hikma, next section"', '"حكمة، القسم التالي"')}</li>
            <li>• {t('"Hikma, focus mode"', '"حكمة، وضع التركيز"')}</li>
            <li>• {t('"Hikma, bigger text"', '"حكمة، نص أكبر"')}</li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {t(
            "Voice commands require microphone permission. You can also use keyboard shortcuts throughout the app.",
            "الأوامر الصوتية تتطلب إذن الميكروفون. يمكنك أيضاً استخدام اختصارات لوحة المفاتيح في جميع أنحاء التطبيق."
          )}
        </p>
      </div>
    </div>
  );
}

// ── Main Onboarding Component ──────────────────────────────────────────────────
export default function Onboarding() {
  const [, navigate] = useLocation();
  const { updateProfile, setLocale } = useProfile();
  const [step, setStep] = useState(1);
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
  });

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  // Apply theme/font preview in real time (without saving to DB)
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", data.theme);
    root.style.fontSize = `${data.fontScale * 100}%`;
  }, [data.theme, data.fontScale]);

  // Focus step container when step changes (for screen readers)
  useEffect(() => {
    stepRef.current?.focus();
  }, [step]);

  const canProceed = () => {
    if (step === 1) return data.accessibilityProfile !== null;
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Map curriculum string to DB format
      const curriculumMap: Record<string, string> = {
        igcse_edexcel: "IGCSE Edexcel",
        qatar_moehe: "Qatar MoEHE",
      };

      const effectiveLocale = (data.locale === "both" ? "en" : data.locale) as "en" | "ar";
      setLocale(effectiveLocale);

      // Save all settings to DB via updateProfile
      updateProfile({
        mode: data.mode,
        curriculum: curriculumMap[data.curriculum] ?? "IGCSE Edexcel",
        theme: data.theme as any,
        fontScale: data.fontScale,
        speechRate: data.speechRate,
        autoNarrate: data.mode === "audio_first",
        reduceMotion: data.accessibilityProfile === "adhd",
        // Dyslexia settings
        fontFamily: data.accessibilityProfile === "dyslexia" ? "atkinson" : "atkinson",
        letterSpacing: data.accessibilityProfile === "dyslexia" ? 0.05 : 0,
        lineHeight: data.accessibilityProfile === "dyslexia" ? 1.8 : 1.5,
        // Overlay for dyslexia
        overlayTint: data.accessibilityProfile === "dyslexia" ? "yellow" : "none",
      });

      toast.success(
        data.locale === "ar"
          ? "مرحباً! تم إعداد حكمة لك."
          : "Welcome! Hikma is set up for you."
      );
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Could not save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const stepTitles = [
    "Accessibility",
    "Language",
    "Curriculum",
    "Personalise",
    "Voice",
  ];

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      dir={data.locale === "ar" ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/manus-storage/hikma-app-icon-clean_e261c2b4.png"
            alt="Hikma"
            className="w-8 h-8 rounded-lg object-cover"
          />
          <span className="font-bold text-sm">Hikma حكمة</span>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {data.locale === "ar" ? "تخطي" : "Skip for now"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-4">
        <div className="max-w-lg mx-auto space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{data.locale === "ar" ? `الخطوة ${step} من ${TOTAL_STEPS}` : `Step ${step} of ${TOTAL_STEPS}`}</span>
            <span>{stepTitles[step - 1]}</span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5" />
        </div>
      </div>

      {/* Step content */}
      <div
        ref={stepRef}
        tabIndex={-1}
        className="flex-1 flex items-start justify-center px-4 py-8 outline-none"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="w-full max-w-lg">
          {step === 1 && <StepAccessibility data={data} onChange={updateData} locale={data.locale} />}
          {step === 2 && <StepLanguage data={data} onChange={updateData} locale={data.locale} />}
          {step === 3 && <StepCurriculum data={data} onChange={updateData} locale={data.locale} />}
          {step === 4 && <StepPersonalisation data={data} onChange={updateData} locale={data.locale} />}
          {step === 5 && <StepVoice data={data} onChange={updateData} locale={data.locale} />}
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
            aria-label={data.locale === "ar" ? "السابق" : "Back"}
          >
            <ChevronLeft className="w-4 h-4" />
            {data.locale === "ar" ? "السابق" : "Back"}
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className="rounded-2xl gap-1 min-w-[120px]"
            aria-label={step === TOTAL_STEPS ? (data.locale === "ar" ? "ابدأ التعلم" : "Start Learning") : (data.locale === "ar" ? "التالي" : "Next")}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {data.locale === "ar" ? "جاري الحفظ..." : "Saving..."}
              </span>
            ) : step === TOTAL_STEPS ? (
              <>
                {data.locale === "ar" ? "ابدأ التعلم" : "Start Learning"}
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                {data.locale === "ar" ? "التالي" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
