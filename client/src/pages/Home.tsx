/**
 * Home — Hikma landing page.
 * Professional, animated, educational design.
 * Built for blind, dyslexic, and ADHD learners.
 */
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, Globe, BookOpen, Brain,
  Keyboard, Layers, Sparkles, Star,
  MessageCircle, Zap, Eye, Volume2,
  ChevronDown, Mic, GraduationCap
} from "lucide-react";

const WORDMARK_URL = "/manus-storage/hikma-wordmark-clean_292f98b9.png";

const HOW_IT_WORKS = [
  {
    step: "01", icon: Brain,
    titleEn: "Tell Hikma how you learn",
    titleAr: "أخبر حكمة كيف تتعلم",
    descEn: "Audio-first? Need bigger text? Prefer Arabic? Hikma adapts to you in 2 minutes.",
    descAr: "الصوت أولاً؟ نص أكبر؟ تفضل العربية؟ تتكيف حكمة معك في دقيقتين.",
  },
  {
    step: "02", icon: Mic,
    titleEn: "Navigate with your voice",
    titleAr: "تنقّل بصوتك",
    descEn: "Say \"Hikma\" to navigate, read aloud, or ask a question. No mouse needed.",
    descAr: "قل \"حكمة\" للتنقل أو القراءة أو طرح سؤال. لا حاجة للفأرة.",
  },
  {
    step: "03", icon: MessageCircle,
    titleEn: "Ask Hikma AI anything",
    titleAr: "اسأل حكمة AI أي شيء",
    descEn: "Hikma AI guides you like a teacher — asks questions, never just gives answers.",
    descAr: "حكمة AI يرشدك كالمعلم — يطرح أسئلة، ولا يعطي الإجابات مباشرة.",
  },
  {
    step: "04", icon: Star,
    titleEn: "Test yourself after every topic",
    titleAr: "اختبر نفسك بعد كل موضوع",
    descEn: "Personalised questions after each unit. See what you know and what to revisit.",
    descAr: "أسئلة مخصصة بعد كل وحدة. اعرف ما تعرفه وما تحتاج مراجعته.",
  },
];

const FEATURES = [
  { icon: Volume2, en: "Audio-first narration", ar: "سرد صوتي أولاً", colour: "text-emerald-400" },
  { icon: Eye, en: "High-contrast & dyslexia fonts", ar: "تباين عالٍ وخطوط لعسر القراءة", colour: "text-blue-400" },
  { icon: Keyboard, en: "Full keyboard + WASD nav", ar: "تنقل كامل بلوحة المفاتيح", colour: "text-purple-400" },
  { icon: Zap, en: "ADHD focus mode", ar: "وضع تركيز لاضطراب ADHD", colour: "text-yellow-400" },
  { icon: Layers, en: "ECC for blind learners", ar: "المنهج الأساسي الموسّع للمكفوفين", colour: "text-pink-400" },
  { icon: Sparkles, en: "Arabic & English bilingual", ar: "ثنائي اللغة عربي وإنجليزي", colour: "text-orange-400" },
  { icon: GraduationCap, en: "IGCSE Edexcel + Qatar MoEHE", ar: "إيدكسيل + وزارة التعليم القطرية", colour: "text-cyan-400" },
  { icon: Brain, en: "Socratic AI — never gives answers", ar: "AI سقراطي — لا يعطي الإجابات", colour: "text-rose-400" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as any } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export default function Home() {
  const prefersReducedMotion = useReducedMotion();
  // When reduced motion is preferred, disable all animations
  const motionProps = (variants: any) => prefersReducedMotion ? {} : { initial: "hidden", animate: "visible", variants };
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { locale, setLocale } = useProfile();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir={locale === "ar" ? "rtl" : "ltr"}>

      {/* ── Accessibility bar ──────────────────────────────────────────── */}
      <div className="w-full bg-[rgb(var(--nav-bg))] text-white/80 text-xs flex items-center justify-between px-6 py-2">
        <span className="hidden sm:block tracking-widest uppercase text-[10px] font-medium opacity-50">
          {t("Wisdom · Accessibility · Growth", "الحكمة · إمكانية الوصول · النمو")}
        </span>
        <button
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          className="flex items-center gap-1.5 ml-auto hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400 rounded px-2 py-0.5"
          aria-label={t("Switch to Arabic", "التبديل إلى الإنجليزية")}
        >
          <Globe className="w-3 h-3" />
          <span className="font-semibold">{locale === "ar" ? "EN" : "عربي"}</span>
        </button>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[92vh] flex items-center bg-[rgb(var(--nav-bg))] overflow-hidden"
        aria-label={t("Hikma — adaptive learning platform", "حكمة — منصة التعلم التكيفي")}
      >
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden="true"
        />
        {/* Radial glow */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

        <div className="container max-w-6xl relative z-10 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: copy */}
            <motion.div
              className="space-y-8"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary/80 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  <span className="text-white/90 font-medium">{t("AI-powered · IGCSE Edexcel + Qatar MoEHE", "مدعوم بالذكاء الاصطناعي · إيدكسيل + وزارة التعليم القطرية")}</span>
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
               
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight"
              >
                {t("Learning that", "تعلّم يلتقي")}{" "}
                <span className="text-[rgb(var(--clay))]">{t("meets you", "بك")}</span>
                <br />
                {t("where you are.", "أينما كنت.")}
              </motion.h1>

              <motion.p
                variants={fadeUp}
               
                className="text-white/70 text-lg leading-relaxed max-w-lg"
              >
                {t(
                  "Hikma is the adaptive learning companion built for blind, dyslexic, and ADHD learners. Voice-first. Keyboard-first. Curiosity-first.",
                  "حكمة هو رفيق التعلم التكيفي المصمم للمكفوفين وذوي عسر القراءة واضطراب ADHD. الصوت أولاً. لوحة المفاتيح أولاً. الفضول أولاً."
                )}
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <Link href="/onboarding" asChild>
                    <Button
                      size="lg"
                      className="bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-8 h-14 rounded-2xl shadow-xl"
                      aria-label={t("Personalise and start learning", "تخصيص وبدء التعلم")}
                    >
                      {t("Personalise & Start", "تخصيص وبدء")}
                      <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                    </Button>
                  </Link>
                ) : (
                  <>
                  <Button
                    size="lg"
                    onClick={() => navigate("/signup")}
                    className="bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-8 h-14 rounded-2xl shadow-xl"
                    aria-label={t("Create a free account and start learning", "أنشئ حساباً مجانياً وابدأ التعلم")}
                  >
                    {t("Create Free Account", "إنشاء حساب مجاني")}
                    <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/signin")}
                    className="border-white/40 text-white hover:bg-white/10 font-medium text-base px-8 h-14 rounded-2xl"
                    aria-label={t("Sign in to your existing account", "سجّل الدخول إلى حسابك")}
                  >
                    {t("Sign In", "تسجيل الدخول")}
                  </Button>
                  </>
                )}
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium h-14 px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded-xl"
                  aria-label={t("Learn how Hikma works", "تعرّف على كيفية عمل حكمة")}
                >
                  {t("How it works", "كيف يعمل")}
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                </a>
              </motion.div>

              <motion.p variants={fadeUp} className="text-white/70 text-xs flex items-center gap-2">
                <Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
                {t("Built to MADA Qatar & WCAG 2.2 AA · Free to use", "مبني وفق معايير مادا قطر و WCAG 2.2 AA · مجاني")}
              </motion.p>
            </motion.div>

            {/* Right: logo + feature pills */}
            <motion.div
              className="flex flex-col items-center gap-8"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-110" aria-hidden="true" />
                <img
                  src={WORDMARK_URL}
                  alt="Hikma حكمة — Educational App"
                  className="relative w-72 sm:w-80 object-contain"
                  style={{ filter: "brightness(0) invert(1)", opacity: 0.92 }}
                />
              </div>
              {/* Floating feature pills */}
              <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                {["Voice commands", "Keyboard nav", "ADHD mode", "Dyslexia font", "Screen reader", "Arabic + English"].map((tag, i) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.06, duration: 0.4 }}
                    className="text-[11px] font-medium px-3 py-1 rounded-full bg-white/10 text-white/70 border border-white/10 backdrop-blur-sm"
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            </motion.div>

          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        >
          <ChevronDown className="w-6 h-6 text-white/30" />
        </motion.div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-background" aria-label={t("How Hikma works", "كيف تعمل حكمة")}>
        <div className="container max-w-5xl">
          <motion.div
            className="text-center mb-16 space-y-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-xs font-bold tracking-widest uppercase text-primary">
              {t("How it works", "كيف يعمل")}
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t("Four steps to your best learning", "أربع خطوات لأفضل تعلم")}
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  variants={fadeUp}
                  className="group relative bg-card border border-border rounded-3xl p-8 overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300"
                >
                  <div className="absolute top-6 right-6 text-5xl font-black text-muted/10 select-none" aria-hidden="true">
                    {step.step}
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{t(step.titleEn, step.titleAr)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t(step.descEn, step.descAr)}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Accessibility features grid ───────────────────────────────── */}
      <section className="py-24 bg-card border-y border-border" aria-label={t("Accessibility features", "ميزات إمكانية الوصول")}>
        <div className="container max-w-5xl">
          <motion.div
            className="text-center mb-14 space-y-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-xs font-bold tracking-widest uppercase text-primary">
              {t("Built for everyone", "مبني للجميع")}
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t("Every learner deserves the right tools", "كل متعلم يستحق الأدوات المناسبة")}
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.en}
                  variants={fadeUp}
                  className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl bg-background border border-border hover:border-primary/30 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center ${f.colour}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-semibold leading-snug">{t(f.en, f.ar)}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-[rgb(var(--nav-bg))]" aria-label={t("Get started", "ابدأ الآن")}>
        <div className="container max-w-3xl text-center">
          <motion.div
            className="space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t("Ready to learn your way?", "هل أنت مستعد للتعلم بطريقتك؟")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/80 text-lg">
              {t("Free. Accessible. Built for Qatar.", "مجاني. متاح للجميع. مبني لقطر.")}
            </motion.p>
            <motion.div variants={fadeUp} className="flex justify-center">
              {isAuthenticated ? (
                <Link href="/onboarding" asChild>
                  <Button
                    size="lg"
                    className="bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-10 h-14 rounded-2xl shadow-xl"
                    aria-label={t("Personalise and start learning", "تخصيص وبدء التعلم")}
                  >
                    {t("Personalise & Start", "تخصيص وبدء")}
                    <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    size="lg"
                    onClick={() => navigate("/signup")}
                    className="bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-10 h-14 rounded-2xl shadow-xl"
                    aria-label={t("Create a free account and start learning", "أنشئ حساباً مجانياً وابدأ التعلم")}
                  >
                    {t("Create Free Account", "إنشاء حساب مجاني")}
                    <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/signin")}
                    className="border-white/40 text-white hover:bg-white/10 font-medium text-base px-8 h-14 rounded-2xl"
                    aria-label={t("Sign in to your existing account", "سجّل الدخول إلى حسابك")}
                  >
                    {t("Sign In", "تسجيل الدخول")}
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-[rgb(var(--nav-bg))] border-t border-white/10 py-8">
        <div className="container max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-white/70 text-xs">
          <div className="flex items-center gap-2">
            <img
              src="/manus-storage/hikma-app-icon-clean_e261c2b4.png"
              alt=""
              className="w-6 h-6 rounded-lg"
              aria-hidden="true"
            />
            <span className="font-semibold text-white/90">Hikma — حكمة</span>
          </div>
          <p>{t("Built to MADA Qatar & WCAG 2.2 AA standards", "مبني وفق معايير مادا قطر و WCAG 2.2 AA")}</p>
        </div>
      </footer>

    </div>
  );
}
