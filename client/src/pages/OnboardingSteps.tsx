import { useSpeech } from "@/contexts/SpeechContext";
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
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { useSounds } from "@/hooks/useSounds";
import { toast } from "sonner";
import {

// Re-export all step components for use in Onboarding.tsx
  Eye, Brain, BookOpen, Accessibility,
  ChevronLeft, ChevronRight, Check, Volume2
} from "lucide-react";

export const TOTAL_STEPS = 7;

export type AccessibilityProfile = "blind" | "low_vision" | "adhd" | "dyslexia" | "none" | null;

export interface OnboardingData {
  accessibilityProfile: AccessibilityProfile;
  locale: "en" | "ar" | "both";
  curriculum: string;
  yearGroup: string;
  mode: "audio_first" | "reading" | "focus" | "custom";
  fontScale: number;
  speechRate: number;
  theme: string;
  voiceEnabled: boolean;
  autoNarrate: boolean;
  dailyGoalMinutes: number;
}

const PROFILES = [
  {
    id: "blind" as AccessibilityProfile,
    icon: Eye,
    titleEn: "Blind / Screen Reader",
    titleAr: "كفيف / قارئ الشاشة",
    descEn: "Full keyboard navigation. Every element announces itself when focused. Voice commands enabled by default. Optimised for screen readers.",
    descAr: "تنقل كامل بلوحة المفاتيح. كل عنصر يُعلن عن نفسه عند التركيز. أوامر صوتية مفعّلة افتراضياً.",
    colour: "border-blue-400 bg-blue-50 dark:bg-blue-950/30",
    selectedColour: "border-blue-600 bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500",
    applies: ["Audio-first mode", "TTS on every focus", "Full keyboard nav"],
  },
  {
    id: "low_vision" as AccessibilityProfile,
    icon: Eye,
    titleEn: "Low Vision",
    titleAr: "ضعف البصر",
    descEn: "Larger text, high contrast, and zoom-friendly layout. Keyboard navigation enabled. Audio support available.",
    descAr: "نص أكبر، تباين عالٍ، وتخطيط يدعم التكبير. تنقل بلوحة المفاتيح مفعّل.",
    colour: "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30",
    selectedColour: "border-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500",
    applies: ["Large font 1.3×", "High contrast theme", "Keyboard nav"],
  },
  {
    id: "adhd" as AccessibilityProfile,
    icon: Brain,
    titleEn: "ADHD / Focus",
    titleAr: "اضطراب التركيز / فرط النشاط",
    descEn: "Simplified interface. One task at a time. No distractions. Calm colours and no animations.",
    descAr: "واجهة مبسّطة. مهمة واحدة في كل مرة. لا مشتتات. ألوان هادئة وبدون حركات.",
    colour: "border-green-400 bg-green-50 dark:bg-green-950/30",
    selectedColour: "border-green-600 bg-green-100 dark:bg-green-900/50 ring-2 ring-green-500",
    applies: ["Focus mode", "No animations", "Calm theme"],
  },
  {
    id: "dyslexia" as AccessibilityProfile,
    icon: BookOpen,
    titleEn: "Dyslexia",
    titleAr: "عسر القراءة",
    descEn: "Dyslexia-friendly font, increased letter spacing, cream background tint, and no justified text.",
    descAr: "خط مناسب لعسر القراءة، تباعد أحرف أكبر، خلفية كريمية.",
    colour: "border-amber-400 bg-amber-50 dark:bg-amber-950/30",
    selectedColour: "border-amber-600 bg-amber-100 dark:bg-amber-900/50 ring-2 ring-amber-500",
    applies: ["Lexend font", "Cream background", "Extra letter spacing"],
  },
  {
    id: "none" as AccessibilityProfile,
    icon: Accessibility,
    titleEn: "No specific need",
    titleAr: "لا حاجة محددة",
    descEn: "Standard experience with full access to all features. You can always adjust settings later.",
    descAr: "تجربة قياسية مع وصول كامل لجميع الميزات.",
    colour: "border-gray-300 bg-gray-50 dark:bg-gray-900/30",
    selectedColour: "border-gray-500 bg-gray-100 dark:bg-gray-800/50 ring-2 ring-gray-400",
    applies: ["Standard mode", "All features available"],
  },
];

const YEAR_GROUPS = [
  { value: "9", label: "Year 9 (Age 13–14)" },
  { value: "10", label: "Year 10 (Age 14–15)" },
  { value: "11", label: "Year 11 (Age 15–16)" },
  { value: "12", label: "Year 12 / AS Level" },
  { value: "other", label: "Other / Not sure" },
];

export function profileToSettings(profile: AccessibilityProfile): Partial<OnboardingData> {
  switch (profile) {
    case "blind":      return { mode: "audio_first", theme: "dark",         fontScale: 1.1, speechRate: 0.9, autoNarrate: true, voiceEnabled: true };
    case "low_vision": return { mode: "audio_first", theme: "high_contrast", fontScale: 1.3, speechRate: 1.0, autoNarrate: true, voiceEnabled: true };
    case "adhd":       return { mode: "focus",       theme: "calm",          fontScale: 1.1, speechRate: 1.0, autoNarrate: false, voiceEnabled: false };
    case "dyslexia":   return { mode: "reading",     theme: "cream",         fontScale: 1.15, speechRate: 0.9, autoNarrate: false, voiceEnabled: false };
    default:           return { mode: "reading",     theme: "light",         fontScale: 1.0, speechRate: 1.0, autoNarrate: false, voiceEnabled: false };
  }
}

// ── Step 1: Accessibility Profile ─────────────────────────────────────────────
export function StepAccessibility({ data, onChange, locale }: {
  data: OnboardingData;
  onChange: (u: Partial<OnboardingData>) => void;
  locale: string;
}) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus the selected card (or first card) when step mounts
  useEffect(() => {
    const cards = Array.from(containerRef.current?.querySelectorAll('[role="radio"]') ?? []) as HTMLElement[];
    const selectedIdx = PROFILES.findIndex(p => p.id === data.accessibilityProfile);
    const target = selectedIdx >= 0 ? cards[selectedIdx] : cards[0];
    target?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t("How do you learn best?", "كيف تتعلم بشكل أفضل؟")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("Choose the option that best describes your needs. You can always change this in Settings.", "اختر الخيار الذي يصف احتياجاتك. يمكنك تغيير هذا في الإعدادات.")}
        </p>
      </div>
      <div
        ref={containerRef}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        role="radiogroup"
        aria-label={t("Accessibility profile", "ملف إمكانية الوصول")}
      >
        {PROFILES.map((profile, idx) => {
          const Icon = profile.icon;
          const isSelected = data.accessibilityProfile === profile.id;
          const ariaLabel = `${t(profile.titleEn, profile.titleAr)}: ${t(profile.descEn, profile.descAr)}. ${profile.applies.join(", ")}.${isSelected ? " " + t("Selected", "محدد") : ""}`;
          return (
            <button
              key={profile.id}
              role="radio"
              aria-checked={isSelected}
              aria-label={ariaLabel}
              tabIndex={0}
              onClick={() => onChange({ accessibilityProfile: profile.id, ...profileToSettings(profile.id) })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange({ accessibilityProfile: profile.id, ...profileToSettings(profile.id) });
                }
                if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                  e.preventDefault();
                  const cards = Array.from(containerRef.current?.querySelectorAll('[role="radio"]') ?? []) as HTMLElement[];
                  cards[(idx + 1) % cards.length]?.focus();
                }
                if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const cards = Array.from(containerRef.current?.querySelectorAll('[role="radio"]') ?? []) as HTMLElement[];
                  cards[(idx - 1 + cards.length) % cards.length]?.focus();
                }
              }}
              className={`text-left p-4 rounded-2xl border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isSelected ? profile.selectedColour : profile.colour + " hover:border-primary/50"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{t(profile.titleEn, profile.titleAr)}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t(profile.descEn, profile.descAr)}</p>
                  <div className="flex flex-wrap gap-1 mt-2" aria-hidden="true">
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

// ── Step 2: Language ───────────────────────────────────────────────────────────
export function StepLanguage({ data, onChange, locale }: { data: OnboardingData; onChange: (u: Partial<OnboardingData>) => void; locale: string }) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const opts = [
    { value: "en", labelEn: "English", labelAr: "الإنجليزية", descEn: "All content in English", descAr: "كل المحتوى بالإنجليزية" },
    { value: "ar", labelEn: "Arabic", labelAr: "العربية", descEn: "All content in Arabic", descAr: "كل المحتوى بالعربية" },
    { value: "both", labelEn: "Both", labelAr: "كلاهما", descEn: "Switch between Arabic and English freely", descAr: "التنقل بين العربية والإنجليزية بحرية" },
  ];
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t("What language do you prefer?", "ما اللغة التي تفضلها؟")}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-label={t("Language preference", "تفضيل اللغة")}>
        {opts.map(opt => {
          const isSelected = data.locale === opt.value;
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${t(opt.labelEn, opt.labelAr)}: ${t(opt.descEn, opt.descAr)}${isSelected ? ". " + t("Selected", "محدد") : ""}`}
              tabIndex={0}
              onClick={() => onChange({ locale: opt.value as any })}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange({ locale: opt.value as any }); }}}
              className={`text-left p-4 rounded-2xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isSelected ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-border hover:border-primary/50"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{t(opt.labelEn, opt.labelAr)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(opt.descEn, opt.descAr)}</p>
                </div>
                {isSelected && <Check className="w-5 h-5 text-primary" aria-hidden="true" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 3: Curriculum ─────────────────────────────────────────────────────────
export function StepCurriculum({ data, onChange, locale }: { data: OnboardingData; onChange: (u: Partial<OnboardingData>) => void; locale: string }) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const opts = [
    { value: "igcse_edexcel", labelEn: "IGCSE Edexcel", labelAr: "إيدكسيل", descEn: "Pearson Edexcel IGCSE — used internationally", descAr: "إيدكسيل للمرحلة الثانوية — دولي" },
    { value: "qatar_moehe", labelEn: "Qatar MoEHE", labelAr: "وزارة التعليم القطرية", descEn: "Qatar Ministry of Education curriculum", descAr: "منهج وزارة التعليم والتعليم العالي القطرية" },
    { value: "igcse_caie", labelEn: "IGCSE Cambridge (CAIE)", labelAr: "كامبريدج", descEn: "Cambridge Assessment International Education", descAr: "تقييم كامبريدج الدولي" },
    { value: "gcse", labelEn: "GCSE (UK)", labelAr: "GCSE بريطاني", descEn: "UK General Certificate of Secondary Education", descAr: "شهادة التعليم الثانوي البريطانية" },
    { value: "ib", labelEn: "IB (International Baccalaureate)", labelAr: "البكالوريا الدولية", descEn: "International Baccalaureate MYP/DP", descAr: "البكالوريا الدولية" },
  ];
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t("What curriculum are you following?", "ما المنهج الذي تتبعه؟")}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-label={t("Curriculum", "المنهج")}>
        {opts.map(opt => {
          const isSelected = data.curriculum === opt.value;
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${t(opt.labelEn, opt.labelAr)}: ${t(opt.descEn, opt.descAr)}${isSelected ? ". " + t("Selected", "محدد") : ""}`}
              tabIndex={0}
              onClick={() => onChange({ curriculum: opt.value })}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange({ curriculum: opt.value }); }}}
              className={`text-left p-4 rounded-2xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isSelected ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-border hover:border-primary/50"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{t(opt.labelEn, opt.labelAr)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(opt.descEn, opt.descAr)}</p>
                </div>
                {isSelected && <Check className="w-5 h-5 text-primary flex-shrink-0" aria-hidden="true" />}
              </div>
            </button>
          );
        })}
      </div>
      {/* Year group */}
      <div>
        <p className="text-sm font-semibold mb-2">{t("Year group", "المرحلة الدراسية")}</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("Year group", "المرحلة الدراسية")}>
          {YEAR_GROUPS.map(yg => (
            <button
              key={yg.value}
              role="radio"
              aria-checked={data.yearGroup === yg.value}
              aria-label={`${yg.label}${data.yearGroup === yg.value ? ". " + t("Selected", "محدد") : ""}`}
              tabIndex={0}
              onClick={() => onChange({ yearGroup: yg.value })}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange({ yearGroup: yg.value }); }}}
              className={`px-3 py-2 rounded-xl border text-xs text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${data.yearGroup === yg.value ? "border-primary bg-primary/10 font-semibold" : "border-border hover:border-primary/50"}`}
            >
              {yg.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Personalisation ────────────────────────────────────────────────────
export function StepPersonalisation({ data, onChange, locale }: { data: OnboardingData; onChange: (u: Partial<OnboardingData>) => void; locale: string }) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const themes = [
    { value: "light",         label: "Light",         bg: "bg-white border-gray-200",       textClass: "text-gray-800" },
    { value: "dark",          label: "Dark",          bg: "bg-gray-900 border-gray-700",    textClass: "text-white" },
    { value: "cream",         label: "Cream",         bg: "bg-amber-50 border-amber-200",   textClass: "text-amber-900" },
    { value: "calm",          label: "Calm",          bg: "bg-teal-50 border-teal-200",     textClass: "text-teal-900" },
    { value: "high_contrast", label: "High Contrast", bg: "bg-black border-yellow-400",     textClass: "text-yellow-300" },
  ];
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t("Fine-tune your experience", "اضبط تجربتك")}</h2>
      </div>
      {/* Font size */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <label htmlFor="font-scale" className="font-semibold">{t("Text size", "حجم النص")}</label>
          <span className="text-primary font-semibold" aria-live="polite">{Math.round(data.fontScale * 100)}%</span>
        </div>
        <input
          id="font-scale"
          type="range" min="80" max="160" step="5"
          value={Math.round(data.fontScale * 100)}
          onChange={e => onChange({ fontScale: parseInt(e.target.value) / 100 })}
          className="w-full accent-primary"
          aria-label={t(`Text size: ${Math.round(data.fontScale * 100)}%`, `حجم النص: ${Math.round(data.fontScale * 100)}%`)}
        />
        <div className="flex justify-between text-xs text-muted-foreground"><span>A</span><span className="text-xl font-bold">A</span></div>
      </div>
      {/* Speech rate */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <label htmlFor="speech-rate" className="font-semibold">{t("Speech speed", "سرعة الكلام")}</label>
          <span className="text-primary font-semibold" aria-live="polite">{data.speechRate}×</span>
        </div>
        <input
          id="speech-rate"
          type="range" min="0.5" max="2.0" step="0.1"
          value={data.speechRate}
          onChange={e => onChange({ speechRate: parseFloat(e.target.value) })}
          className="w-full accent-primary"
          aria-label={t(`Speech speed: ${data.speechRate}×`, `سرعة الكلام: ${data.speechRate}×`)}
        />
        <div className="flex justify-between text-xs text-muted-foreground"><span>{t("Slow", "بطيء")}</span><span>{t("Fast", "سريع")}</span></div>
      </div>
      {/* Theme */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">{t("Colour theme", "نظام الألوان")}</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("Colour theme", "نظام الألوان")}>
          {themes.map(th => (
            <button
              key={th.value}
              role="radio"
              aria-checked={data.theme === th.value}
              aria-label={`${th.label} theme${data.theme === th.value ? ". Selected" : ""}`}
              tabIndex={0}
              onClick={() => onChange({ theme: th.value })}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange({ theme: th.value }); }}}
              className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${th.bg} ${th.textClass} ${data.theme === th.value ? "ring-2 ring-primary border-primary" : ""}`}
            >
              {th.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


// ── Step 5: Voice & Audio Preferences ─────────────────────────────────────────
export function StepVoicePreferences({ data, onChange, locale }: { data: OnboardingData; onChange: (u: Partial<OnboardingData>) => void; locale: string }) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t("Voice & Audio", "الصوت والصوتيات")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("Set up how Hikma speaks and listens for you.", "اضبط كيف تتحدث حكمة وتستمع إليك.")}
        </p>
      </div>
      {/* Voice commands */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">{t("Voice commands", "الأوامر الصوتية")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('Unmute the mic and speak your command. Works in Chrome and Edge.', 'افتح الميكروفون وتكلّم بأمرك مباشرة. يعمل في Chrome و Edge.')}
            </p>
          </div>
          <button
            role="switch"
            aria-checked={data.voiceEnabled}
            aria-label={t("Enable voice commands", "تفعيل الأوامر الصوتية")}
            tabIndex={0}
            onClick={() => onChange({ voiceEnabled: !data.voiceEnabled })}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange({ voiceEnabled: !data.voiceEnabled }); }}}
            data-no-min-h className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0 ${data.voiceEnabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
          >
            <span className={`absolute top-0.5 start-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${data.voiceEnabled ? "ltr:translate-x-6 rtl:-translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>
        {data.voiceEnabled && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
            <p>• {t('"Open tutor" — opens Hikma AI', '"افتح المعلم" — يفتح حكمة AI')}</p>
            <p>• {t('"Next section" — moves forward', '"القسم التالي" — ينتقل للأمام')}</p>
            <p>• {t('"Read aloud" — reads the page', '"اقرأ بصوت" — يقرأ الصفحة')}</p>
            <p>• {t('"Go home" — goes to dashboard', '"الرئيسية" — يذهب للوحة التحكم')}</p>
          </div>
        )}
      </div>
      {/* Auto-narrate */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">{t("Auto-read lessons aloud", "قراءة الدروس تلقائياً")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("Hikma will automatically read each lesson section when it loads.", "ستقرأ حكمة كل قسم من الدرس تلقائياً عند تحميله.")}
            </p>
          </div>
          <button
            role="switch"
            aria-checked={data.autoNarrate}
            aria-label={t("Auto-read lessons aloud", "قراءة الدروس تلقائياً")}
            tabIndex={0}
            onClick={() => onChange({ autoNarrate: !data.autoNarrate })}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange({ autoNarrate: !data.autoNarrate }); }}}
            data-no-min-h className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0 ${data.autoNarrate ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
          >
            <span className={`absolute top-0.5 start-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${data.autoNarrate ? "ltr:translate-x-6 rtl:-translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>
      </div>
      {/* Note for blind users */}
      {(data.accessibilityProfile === "blind" || data.accessibilityProfile === "low_vision") && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-sm">
          <p className="font-semibold text-blue-800 dark:text-blue-200">{t("Recommended for you", "موصى به لك")}</p>
          <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
            {t("Both voice commands and auto-read are recommended for your accessibility profile.", "يُوصى بتفعيل الأوامر الصوتية والقراءة التلقائية لملف إمكانية الوصول الخاص بك.")}
          </p>
          <button
            tabIndex={0}
            onClick={() => onChange({ voiceEnabled: true, autoNarrate: true })}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange({ voiceEnabled: true, autoNarrate: true }); }}}
            className="mt-2 text-xs font-semibold text-blue-700 dark:text-blue-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t("Enable both voice commands and auto-read", "تفعيل الأوامر الصوتية والقراءة التلقائية")}
          >
            {t("Enable both →", "تفعيل كليهما →")}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Step 6: Voice preview ──────────────────────────────────────────────────────
export function StepVoice({ data, locale }: { data: OnboardingData; locale: string }) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [tested, setTested] = useState(false);
  const speech = useSpeech();

  // ── Task 1: Stop audio when the user leaves this step (unmount or step change) ──
  useEffect(() => {
    return () => {
      speech.stop();
    };
  }, [speech]);

  const testVoice = () => {
    const text = locale === "ar"
      ? "مرحباً! أنا حكمة. سأساعدك على التعلم بطريقتك الخاصة."
      : "Hello! I'm Hikma. I'll help you learn in the way that works best for you.";
    setTested(true);
    // Use the shared speech service — routes through ElevenLabs for the warm Daniel/Bella voice
    speech.speak(text, { priority: "polite", lang: locale === "ar" ? "ar-SA" : "en-GB" });
  };
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t("Test your voice settings", "اختبر إعدادات الصوت")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("Hear how Hikma will sound when reading lessons aloud.", "استمع إلى كيفية قراءة حكمة للدروس بصوت عالٍ.")}
        </p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Volume2 className="w-6 h-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold">{t("Hikma AI Voice", "صوت حكمة AI")}</p>
            <p className="text-xs text-muted-foreground">{t(`Speed: ${data.speechRate}×`, `السرعة: ${data.speechRate}×`)}</p>
          </div>
        </div>
        <Button
          onClick={testVoice}
          className="w-full rounded-2xl gap-2"
          aria-label={t("Play voice sample — hear how Hikma will sound", "تشغيل عينة الصوت — استمع إلى صوت حكمة")}
        >
          <Volume2 className="w-4 h-4" aria-hidden="true" />
          {tested ? t("Play again", "تشغيل مرة أخرى") : t("Play voice sample", "تشغيل عينة الصوت")}
        </Button>
        {tested && (
          <p className="text-xs text-center text-muted-foreground" role="status">
            {t("✓ Voice ready. Click Start Learning to begin.", "✓ الصوت جاهز. انقر على ابدأ التعلم للبدء.")}
          </p>
        )}
      </div>
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
        <p className="text-sm font-semibold text-primary">{t("Voice commands", "الأوامر الصوتية")}</p>
        <p className="text-xs text-muted-foreground">
          {t(
            'Say "Hikma" at any time to activate voice commands. Then say what you want: "next section", "read aloud", "open tutor", "go home".',
            'قل "حكمة" في أي وقت لتفعيل الأوامر الصوتية. ثم قل ما تريد: "القسم التالي"، "اقرأ بصوت عالٍ"، "افتح المعلم".'
          )}
        </p>
      </div>
    </div>
  );
}

// ── Step: Daily Study Goal ─────────────────────────────────────────────────────
const GOAL_OPTIONS = [
  { minutes: 10, labelEn: "10 min",  descEn: "A quick daily check-in",           labelAr: "١٠ دقائق", descAr: "مراجعة يومية سريعة" },
  { minutes: 20, labelEn: "20 min",  descEn: "A focused short session",           labelAr: "٢٠ دقيقة", descAr: "جلسة قصيرة مركّزة" },
  { minutes: 30, labelEn: "30 min",  descEn: "A solid daily habit",               labelAr: "٣٠ دقيقة", descAr: "عادة يومية متينة" },
  { minutes: 45, labelEn: "45 min",  descEn: "Deep learning sessions",            labelAr: "٤٥ دقيقة", descAr: "جلسات تعلّم عميق" },
  { minutes: 60, labelEn: "1 hour",  descEn: "Intensive study",                   labelAr: "ساعة واحدة", descAr: "دراسة مكثّفة" },
  { minutes: 90, labelEn: "1.5 hrs", descEn: "Exam preparation mode",             labelAr: "١.٥ ساعة", descAr: "وضع التحضير للامتحانات" },
];

export function StepDailyGoal({ data, onChange, locale }: { data: OnboardingData; onChange: (u: Partial<OnboardingData>) => void; locale: string }) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const selected = data.dailyGoalMinutes ?? 20;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">{t("How long do you want to study each day?", "كم دقيقة تريد أن تدرس كل يوم؟")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("We'll remind you and track your streak. You can change this any time in Settings.", "سنذكّرك ونتابع سلسلة دراستك. يمكنك تغيير هذا في الإعدادات في أي وقت.")}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="radiogroup" aria-label={t("Daily study goal options", "خيارات الهدف اليومي")}>
        {GOAL_OPTIONS.map((opt) => {
          const isSelected = selected === opt.minutes;
          return (
            <button
              key={opt.minutes}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange({ dailyGoalMinutes: opt.minutes })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange({ dailyGoalMinutes: opt.minutes }); }
              }}
              className={[
                "flex flex-col items-center justify-center gap-1 p-4 rounded-xl border-2 text-center transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border hover:border-primary/40 hover:bg-muted",
              ].join(" ")}
              aria-label={`${locale === "ar" ? opt.labelAr : opt.labelEn} — ${locale === "ar" ? opt.descAr : opt.descEn}`}
            >
              <span className={`text-2xl font-bold font-display ${isSelected ? "text-primary" : "text-foreground"}`}>
                {locale === "ar" ? opt.labelAr : opt.labelEn}
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                {locale === "ar" ? opt.descAr : opt.descEn}
              </span>
              {isSelected && (
                <span className="mt-1 text-[10px] font-semibold text-primary uppercase tracking-wide">
                  {t("Selected", "محدد")}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {t(
          `Your goal: ${selected} minutes per day. That's about ${Math.round(selected * 7 / 60 * 10) / 10} hours per week.`,
          `هدفك: ${selected} دقيقة يومياً. هذا حوالي ${Math.round(selected * 7 / 60 * 10) / 10} ساعات أسبوعياً.`
        )}
      </p>
    </div>
  );
}
