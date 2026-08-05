/**
 * Home — Hikma landing page.
 * Educational, curiosity-driven design. Not a business site.
 * Prominent login CTA, Hikma AI branding, student-first language.
 */
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useProfile } from "@/contexts/ProfileContext";
import {
  ArrowRight, Globe, BookOpen, Brain, Keyboard,
  Layers, Sparkles, Star, ChevronRight, Accessibility,
  MessageCircle, Zap, Eye, Volume2
} from "lucide-react";

const SUBJECTS = [
  { emoji: "🧮", en: "Mathematics", ar: "الرياضيات", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { emoji: "⚗️", en: "Sciences", ar: "العلوم", color: "bg-green-50 border-green-200 text-green-800" },
  { emoji: "📖", en: "English Language", ar: "اللغة الإنجليزية", color: "bg-yellow-50 border-yellow-200 text-yellow-800" },
  { emoji: "🌍", en: "Geography", ar: "الجغرافيا", color: "bg-orange-50 border-orange-200 text-orange-800" },
  { emoji: "📜", en: "History", ar: "التاريخ", color: "bg-red-50 border-red-200 text-red-800" },
  { emoji: "💻", en: "ICT", ar: "تقنية المعلومات", color: "bg-purple-50 border-purple-200 text-purple-800" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Brain,
    titleEn: "Tell Hikma how you learn",
    titleAr: "أخبر حكمة كيف تتعلم",
    descEn: "Audio-first? Need bigger text? Prefer Arabic? Hikma adapts to you in 2 minutes.",
    descAr: "الصوت أولاً؟ نص أكبر؟ تفضل العربية؟ تتكيف حكمة معك في دقيقتين.",
  },
  {
    step: "02",
    icon: BookOpen,
    titleEn: "Study with your voice",
    titleAr: "ادرس بصوتك",
    descEn: "Say \"Hikma\" to navigate, read aloud, or ask a question. No mouse needed.",
    descAr: "قل \"حكمة\" للتنقل أو القراءة أو طرح سؤال. لا حاجة للفأرة.",
  },
  {
    step: "03",
    icon: MessageCircle,
    titleEn: "Ask Hikma AI anything",
    titleAr: "اسأل حكمة AI أي شيء",
    descEn: "Hikma AI guides you like a teacher — asks questions, never just gives answers.",
    descAr: "حكمة AI يرشدك كالمعلم — يطرح أسئلة، ولا يعطي الإجابات مباشرة.",
  },
  {
    step: "04",
    icon: Star,
    titleEn: "Test yourself after every topic",
    titleAr: "اختبر نفسك بعد كل موضوع",
    descEn: "Personalized questions after each unit. See what you know and what to revisit.",
    descAr: "أسئلة مخصصة بعد كل وحدة. اعرف ما تعرفه وما تحتاج مراجعته.",
  },
];

const ACCESSIBILITY_FEATURES = [
  { icon: Volume2, en: "Audio-first narration", ar: "سرد صوتي أولاً" },
  { icon: Eye, en: "High-contrast & dyslexia fonts", ar: "تباين عالٍ وخطوط لعسر القراءة" },
  { icon: Keyboard, en: "Full keyboard navigation", ar: "تنقل كامل بلوحة المفاتيح" },
  { icon: Zap, en: "ADHD focus mode", ar: "وضع تركيز لاضطراب ADHD" },
  { icon: Layers, en: "ECC for blind learners", ar: "المنهج الأساسي الموسّع للمكفوفين" },
  { icon: Sparkles, en: "Arabic & English bilingual", ar: "ثنائي اللغة عربي وإنجليزي" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { locale, setLocale } = useProfile();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  return (
    <div className="min-h-screen bg-background text-foreground" dir={locale === "ar" ? "rtl" : "ltr"}>

      {/* ── Top accessibility bar ── */}
      <div className="w-full bg-[rgb(var(--nav-bg))] text-white text-xs flex items-center justify-between px-4 py-1.5">
        <span className="opacity-60 hidden sm:block">{t("Wisdom · Accessibility · Growth", "الحكمة · إمكانية الوصول · النمو")}</span>
        <button
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          className="flex items-center gap-1 hover:text-yellow-300 transition-colors ml-auto"
          aria-label={t("Switch to Arabic", "Switch to English")}
        >
          <Globe className="w-3 h-3" />{locale === "ar" ? "EN" : "عربي"}
        </button>
      </div>

      {/* ── Hero ── */}
      <section className="bg-[rgb(var(--forest-deep))] text-white relative overflow-hidden min-h-[92vh] flex items-center">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        <div className="container relative z-10 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <div className="space-y-8 animate-arrive">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wide text-white/80">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              {t("AI-powered · IGCSE Edexcel + Qatar MoEHE", "بالذكاء الاصطناعي · إيدكسيل + وزارة التعليم القطرية")}
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
              {t("Learning that ", "تعلّم ")}
              <span className="block text-[rgb(var(--clay-light))]">
                {t("meets you", "يلتقي بك")}
              </span>
              {t("where you are.", "حيث أنت.")}
            </h1>

            <p className="text-white/70 text-xl leading-relaxed max-w-lg">
              {t(
                "Hikma is the adaptive learning companion built for blind, dyslexic, and ADHD learners. Voice-first. Keyboard-first. Curiosity-first.",
                "حكمة هو الرفيق التعليمي التكيفي المصمم للمكفوفين وذوي عسر القراءة واضطراب التركيز. الصوت أولاً. لوحة المفاتيح أولاً. الفضول أولاً."
              )}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-[rgb(var(--forest-deep))] hover:bg-white/90 font-bold text-base px-8 h-14 rounded-2xl shadow-xl">
                    {t("Continue Learning", "تابع التعلم")}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="bg-white text-[rgb(var(--forest-deep))] hover:bg-white/90 font-bold text-base px-8 h-14 rounded-2xl shadow-xl"
                    onClick={() => startLogin()}
                  >
                    {t("Sign in & Start Learning", "سجّل دخولك وابدأ التعلم")}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Link href="/onboarding">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 text-base px-6 h-14 rounded-2xl"
                    >
                      {t("Explore first", "استكشف أولاً")}
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Social proof */}
            <p className="text-xs text-white/40 flex items-center gap-2">
              <Accessibility className="w-3 h-3" />
              {t("Built to MADA Qatar & WCAG 2.2 AA · Free to use", "متوافق مع مدى قطر و WCAG 2.2 AA · مجاني")}
            </p>
          </div>

          {/* Right: logo + subject pills */}
          <div className="hidden lg:flex flex-col items-center gap-8 animate-arrive" style={{ animationDelay: "120ms" }}>
            <img
              src="/manus-storage/hikma-wordmark-transparent_fdf6160f.png"
              alt="Hikma — حكمة"
              className="w-80 object-contain"
              style={{ filter: "brightness(0) invert(1)", opacity: 0.88 }}
            />
            {/* Subject pills floating */}
            <div className="flex flex-wrap gap-2 justify-center max-w-xs">
              {SUBJECTS.map(s => (
                <span key={s.en} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm text-white/80 flex items-center gap-1.5">
                  <span>{s.emoji}</span>
                  <span>{t(s.en, s.ar)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 text-xs animate-bounce">
          <ChevronRight className="w-4 h-4 rotate-90" />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 bg-background">
        <div className="container space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold tracking-widest uppercase text-primary">{t("How it works", "كيف يعمل")}</span>
            <h2 className="text-4xl font-bold">{t("Four steps to confident learning", "أربع خطوات نحو تعلم واثق")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative group" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-lg transition-all space-y-4 h-full">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-4xl font-black text-muted-foreground/20">{step.step}</span>
                    </div>
                    <h3 className="font-bold text-lg leading-snug">{t(step.titleEn, step.titleAr)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t(step.descEn, step.descAr)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Hikma AI spotlight ── */}
      <section className="py-20 bg-[rgb(var(--sage))]">
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold tracking-widest uppercase text-primary">{t("Meet Hikma AI", "تعرّف على حكمة AI")}</span>
            <h2 className="text-4xl font-bold leading-tight">
              {t("A teacher, not a search engine", "معلم، لا محرك بحث")}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {t(
                "Hikma AI never just gives you the answer. It asks you questions, guides your thinking, and helps you discover the answer yourself — the way a great teacher does.",
                "حكمة AI لا يعطيك الإجابة مباشرة. يطرح عليك أسئلة، يوجّه تفكيرك، ويساعدك على اكتشاف الإجابة بنفسك — كما يفعل المعلم الجيد."
              )}
            </p>
            <div className="space-y-3">
              {[
                t("Asks guiding questions instead of giving answers", "يطرح أسئلة توجيهية بدلاً من إعطاء الإجابات"),
                t("Adapts to your pace and learning style", "يتكيف مع وتيرتك وأسلوب تعلمك"),
                t("Speaks Arabic and English fluently", "يتحدث العربية والإنجليزية بطلاقة"),
                t("Available 24/7 — no waiting for a teacher", "متاح على مدار الساعة — لا انتظار"),
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Link href={isAuthenticated ? "/tutor" : "/onboarding"}>
              <Button className="rounded-2xl font-bold px-6 h-12">
                {t("Try Hikma AI", "جرّب حكمة AI")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Chat preview mockup */}
          <div className="bg-card rounded-3xl border border-border shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <img src="/manus-storage/hikma-app-icon-clean_e261c2b4.png" alt="Hikma AI" className="w-9 h-9 rounded-xl object-cover" />
              <div>
                <p className="font-bold text-sm">Hikma AI</p>
                <p className="text-xs text-muted-foreground">{t("Your learning guide", "مرشدك التعليمي")}</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <img src="/manus-storage/hikma-app-icon-clean_e261c2b4.png" alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0 mt-0.5" />
                <div className="bg-primary/10 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                  <p className="text-foreground">{t("Before I explain photosynthesis — what do you think plants need to make their own food?", "قبل أن أشرح البناء الضوئي — ماذا تظن أن النباتات تحتاج لصنع غذائها؟")}</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="bg-primary rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                  <p className="text-primary-foreground">{t("Sunlight and water?", "ضوء الشمس والماء؟")}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <img src="/manus-storage/hikma-app-icon-clean_e261c2b4.png" alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0 mt-0.5" />
                <div className="bg-primary/10 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                  <p className="text-foreground">{t("Good start! You have two of the three. What gas do you think might also be involved?", "بداية جيدة! لديك اثنتان من الثلاثة. ما الغاز الذي تظن أنه قد يكون متضمناً أيضاً؟")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Accessibility features ── */}
      <section className="py-20 bg-background">
        <div className="container space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold tracking-widest uppercase text-primary">{t("Built for everyone", "مبني للجميع")}</span>
            <h2 className="text-4xl font-bold">{t("Accessibility is the architecture", "إمكانية الوصول هي البنية الأساسية")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("Not an add-on. Every feature was designed from day one for blind, dyslexic, and ADHD learners.", "ليست إضافة. كل ميزة صُممت من اليوم الأول للمكفوفين وذوي عسر القراءة واضطراب التركيز.")}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ACCESSIBILITY_FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.en} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{t(f.en, f.ar)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 bg-[rgb(var(--forest-deep))] text-white">
        <div className="container text-center space-y-8 max-w-3xl mx-auto">
          <img
            src="/manus-storage/hikma-app-icon-clean_e261c2b4.png"
            alt="Hikma"
            className="w-20 h-20 rounded-3xl object-cover mx-auto shadow-2xl"
          />
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            {t("Ready to learn at your own pace?", "مستعد للتعلم بوتيرتك الخاصة؟")}
          </h2>
          <p className="text-white/70 text-lg">
            {t("Join learners across Qatar and beyond. Free, accessible, and built with care.", "انضم إلى المتعلمين في قطر وخارجها. مجاني، سهل الوصول، ومبني باهتمام.")}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-[rgb(var(--forest-deep))] hover:bg-white/90 font-bold text-base px-10 h-14 rounded-2xl shadow-xl">
                  {t("Go to Dashboard", "الذهاب إلى لوحة التحكم")}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  size="lg"
                  className="bg-white text-[rgb(var(--forest-deep))] hover:bg-white/90 font-bold text-base px-10 h-14 rounded-2xl shadow-xl"
                  onClick={() => startLogin()}
                >
                  {t("Sign in with Manus", "سجّل الدخول")}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Link href="/onboarding">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-base px-8 h-14 rounded-2xl">
                    {t("Explore without account", "استكشف بدون حساب")}
                  </Button>
                </Link>
              </>
            )}
          </div>
          <p className="text-xs text-white/40 flex items-center justify-center gap-2">
            <Accessibility className="w-3 h-3" />
            {t("MADA Qatar & WCAG 2.2 AA · Arabic & English · IGCSE Edexcel + Qatar MoEHE", "مدى قطر و WCAG 2.2 AA · عربي وإنجليزي · إيدكسيل + وزارة التعليم القطرية")}
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container flex items-center justify-between flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/manus-storage/hikma-app-icon-clean_e261c2b4.png" alt="Hikma" className="w-6 h-6 rounded-lg object-cover" />
            <span className="font-semibold">Hikma — حكمة</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/onboarding" className="hover:text-foreground transition-colors">{t("Onboarding", "التأهيل")}</Link>
            <Link href="/shortcuts" className="hover:text-foreground transition-colors">{t("Shortcuts", "الاختصارات")}</Link>
            <Link href="/ecc" className="hover:text-foreground transition-colors">{t("ECC", "المنهج الأساسي")}</Link>
          </div>
          <div className="flex items-center gap-1">
            <Accessibility className="w-3 h-3" />
            <span>{t("MADA & WCAG AA compliant", "متوافق مع مدى و WCAG AA")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
