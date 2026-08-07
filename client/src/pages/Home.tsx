/**
 * Home — Hikma landing page.
 * Bold, non-generic design inspired by Linear, Vercel, and Duolingo.
 * Layout: full-bleed dark hero → bento feature grid → animated stats bar
 * → how-it-works timeline → accessibility strip → CTA → footer
 */
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { motion, useReducedMotion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useEffect } from "react";
import {
  ArrowRight, Globe, BookOpen, Brain,
  Keyboard, Layers, Sparkles, Star,
  MessageCircle, Zap, Eye, Volume2,
  ChevronDown, Mic, GraduationCap, Headphones,
  MousePointer2, CheckCircle2
} from "lucide-react";

const WORDMARK_URL = "/manus-storage/hikma-wordmark_ad0589af.png";
const ICON_URL = "/manus-storage/hikma-app-icon_2d2d3fef.png";

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, v => `${Math.round(v)}${suffix}`);
  useEffect(() => { if (inView) motionVal.set(to); }, [inView, to, motionVal]);
  return <motion.span ref={ref}>{display}</motion.span>;
}

// ── Marquee strip ─────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  "Voice-first learning", "IGCSE Edexcel", "Qatar MoEHE", "Dyslexia support",
  "ADHD focus mode", "Screen reader ready", "Arabic + English", "Socratic AI",
  "WCAG 2.2 AA", "Keyboard navigation", "Free to use", "Blind learner support",
];

function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden py-4 bg-primary/5 border-y border-primary/10" aria-hidden="true">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="text-xs font-semibold tracking-widest uppercase text-primary/60 flex items-center gap-3">
            <span className="w-1 h-1 rounded-full bg-primary/40 inline-block" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Floating card (bento) ─────────────────────────────────────────────────────
function BentoCard({
  children, className = "", delay = 0, href
}: { children: React.ReactNode; className?: string; delay?: number; href?: string }) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm hover:border-primary/40 hover:bg-white/8 transition-colors ${className}`}
    >
      {children}
    </motion.div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}

const HOW_IT_WORKS = [
  {
    step: "01", icon: Brain, colour: "bg-emerald-500/20 text-emerald-400",
    titleEn: "Tell Hikma how you learn",
    titleAr: "أخبر حكمة كيف تتعلم",
    descEn: "Audio-first? Need bigger text? Prefer Arabic? Hikma adapts to you in 2 minutes.",
    descAr: "الصوت أولاً؟ نص أكبر؟ تفضل العربية؟ تتكيف حكمة معك في دقيقتين.",
  },
  {
    step: "02", icon: Mic, colour: "bg-blue-500/20 text-blue-400",
    titleEn: "Navigate with your voice",
    titleAr: "تنقّل بصوتك",
    descEn: "Say \"Hikma\" to navigate, read aloud, or ask a question. No mouse needed.",
    descAr: "قل \"حكمة\" للتنقل أو القراءة أو طرح سؤال. لا حاجة للفأرة.",
  },
  {
    step: "03", icon: MessageCircle, colour: "bg-purple-500/20 text-purple-400",
    titleEn: "Ask Hikma AI anything",
    titleAr: "اسأل حكمة AI أي شيء",
    descEn: "Hikma AI guides you like a teacher — asks questions, never just gives answers.",
    descAr: "حكمة AI يرشدك كالمعلم — يطرح أسئلة، ولا يعطي الإجابات مباشرة.",
  },
  {
    step: "04", icon: Star, colour: "bg-amber-500/20 text-amber-400",
    titleEn: "Test yourself after every topic",
    titleAr: "اختبر نفسك بعد كل موضوع",
    descEn: "Personalised questions after each unit. See what you know and what to revisit.",
    descAr: "أسئلة مخصصة بعد كل وحدة. اعرف ما تعرفه وما تحتاج مراجعته.",
  },
];

const STATS = [
  { value: 9, suffix: "", label: "ECC skill areas", labelAr: "مجالات مهارية" },
  { value: 100, suffix: "%", label: "Free to use", labelAr: "مجاني تماماً" },
  { value: 5, suffix: " profiles", label: "Accessibility profiles", labelAr: "ملفات إمكانية الوصول" },
  { value: 2, suffix: " curricula", label: "Supported curricula", labelAr: "المناهج المدعومة" },
];

const FEATURES = [
  { icon: Volume2, en: "Audio-first narration", ar: "سرد صوتي أولاً", colour: "text-emerald-400 bg-emerald-400/10" },
  { icon: Eye, en: "High-contrast & dyslexia fonts", ar: "تباين عالٍ وخطوط لعسر القراءة", colour: "text-blue-400 bg-blue-400/10" },
  { icon: Keyboard, en: "Full keyboard + WASD nav", ar: "تنقل كامل بلوحة المفاتيح", colour: "text-purple-400 bg-purple-400/10" },
  { icon: Zap, en: "ADHD focus mode", ar: "وضع تركيز لاضطراب ADHD", colour: "text-yellow-400 bg-yellow-400/10" },
  { icon: Layers, en: "ECC for blind learners", ar: "المنهج الأساسي الموسّع للمكفوفين", colour: "text-pink-400 bg-pink-400/10" },
  { icon: Sparkles, en: "Arabic & English bilingual", ar: "ثنائي اللغة عربي وإنجليزي", colour: "text-orange-400 bg-orange-400/10" },
  { icon: GraduationCap, en: "IGCSE Edexcel + Qatar MoEHE", ar: "إيدكسيل + وزارة التعليم القطرية", colour: "text-cyan-400 bg-cyan-400/10" },
  { icon: Brain, en: "Socratic AI — never gives answers", ar: "AI سقراطي — لا يعطي الإجابات", colour: "text-rose-400 bg-rose-400/10" },
];

export default function Home() {
  const prefersReducedMotion = useReducedMotion();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { locale, setLocale } = useProfile();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const dir = locale === "ar" ? "rtl" : "ltr";

  const fadeUp = prefersReducedMotion ? {} : {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: [0.23, 1, 0.32, 1] as any },
  };
  const fadeUpInView = prefersReducedMotion ? {} : {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.55, ease: [0.23, 1, 0.32, 1] as any },
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--nav-bg))] text-white overflow-x-hidden" dir={dir}>

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <div className="w-full border-b border-white/8 flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2.5">
          <img src={ICON_URL} alt="" className="w-7 h-7 rounded-xl" aria-hidden="true"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <span className="font-bold text-sm text-white/90 tracking-tight">Hikma — حكمة</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400 rounded px-2 py-1"
            aria-label={t("Switch to Arabic", "التبديل إلى الإنجليزية")}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{locale === "ar" ? "EN" : "عربي"}</span>
          </button>
          {!isAuthenticated && (
            <button
              onClick={() => navigate("/signin")}
              className="text-xs font-semibold text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/8"
            >
              {t("Sign In", "تسجيل الدخول")}
            </button>
          )}
        </div>
      </div>

      {/* ── HERO — full-bleed bento layout ────────────────────────────── */}
      <section
        className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden"
        aria-label={t("Hikma — adaptive learning platform", "حكمة — منصة التعلم التكيفي")}
      >
        {/* Background: radial gradient + noise texture */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-primary/15 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-[rgb(var(--clay))]/10 rounded-full blur-[120px]" />
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.035]"
            style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        </div>

        <div className="container max-w-6xl relative z-10 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-center">

            {/* ── Left: headline + CTA ── */}
            <div className="space-y-8">
              {/* Eyebrow */}
              <motion.div {...(prefersReducedMotion ? {} : { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5 } })}>
                <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-primary/80 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  {t("AI-powered · IGCSE Edexcel + Qatar MoEHE", "مدعوم بالذكاء الاصطناعي · إيدكسيل + وزارة التعليم القطرية")}
                </span>
              </motion.div>

              {/* Headline — large, staggered */}
              <div className="space-y-1">
                <motion.h1
                  className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.0] tracking-tight"
                  {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] } })}
                >
                  {t("Learning that", "تعلّم")}
                </motion.h1>
                <motion.h1
                  className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.0] tracking-tight"
                  style={{ color: "rgb(var(--clay))" }}
                  {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.18, ease: [0.23, 1, 0.32, 1] } })}
                >
                  {t("meets you", "يلتقي بك")}
                </motion.h1>
                <motion.h1
                  className="text-5xl sm:text-6xl lg:text-7xl font-black text-white/80 leading-[1.0] tracking-tight"
                  {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.26, ease: [0.23, 1, 0.32, 1] } })}
                >
                  {t("where you are.", "أينما كنت.")}
                </motion.h1>
              </div>

              {/* Sub */}
              <motion.p
                className="text-white/60 text-lg leading-relaxed max-w-lg"
                {...(prefersReducedMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5, delay: 0.4 } })}
              >
                {t(
                  "The adaptive companion built for blind, dyslexic, and ADHD learners. Voice-first. Keyboard-first. Curiosity-first.",
                  "رفيق التعلم التكيفي للمكفوفين وذوي عسر القراءة واضطراب ADHD. الصوت أولاً. لوحة المفاتيح أولاً. الفضول أولاً."
                )}
              </motion.p>

              {/* CTA row */}
              <motion.div
                className="flex flex-wrap gap-3"
                {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.5 } })}
              >
                {isAuthenticated ? (
                  <Link href="/onboarding" asChild>
                    <Button size="lg"
                      className="bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-8 h-14 rounded-2xl shadow-2xl shadow-white/10"
                      aria-label={t("Personalise and start learning", "تخصيص وبدء التعلم")}>
                      {t("Personalise & Start", "تخصيص وبدء")}
                      <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button size="lg"
                      onClick={() => navigate("/signup")}
                      className="bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-8 h-14 rounded-2xl shadow-2xl shadow-white/10"
                      aria-label={t("Create a free account", "إنشاء حساب مجاني")}>
                      {t("Create Free Account", "إنشاء حساب مجاني")}
                      <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                    </Button>
                    <Button size="lg" variant="outline"
                      onClick={() => navigate("/signin")}
                      className="border-white/20 text-white hover:bg-white/8 font-medium text-base px-8 h-14 rounded-2xl"
                      aria-label={t("Sign in", "تسجيل الدخول")}>
                      {t("Sign In", "تسجيل الدخول")}
                    </Button>
                  </>
                )}
                <a href="#how-it-works"
                  className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm font-medium h-14 px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded-xl"
                  aria-label={t("See how Hikma works", "كيف يعمل حكمة")}>
                  {t("How it works", "كيف يعمل")}
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                </a>
              </motion.div>

              {/* Trust line */}
              <motion.p
                className="text-white/40 text-xs flex items-center gap-2"
                {...(prefersReducedMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.7 } })}
              >
                <Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
                {t("Built to MADA Qatar & WCAG 2.2 AA · Free to use", "مبني وفق معايير مادا قطر و WCAG 2.2 AA · مجاني")}
              </motion.p>
            </div>

            {/* ── Right: bento mini-cards ── */}
            <div className="hidden lg:grid grid-cols-2 gap-3">
              {[
                { icon: Headphones, label: t("Voice narration", "سرد صوتي"), sub: t("ElevenLabs AI voice", "صوت AI"), colour: "text-emerald-400" },
                { icon: Keyboard, label: t("Keyboard nav", "تنقل بلوحة المفاتيح"), sub: t("WASD + arrows", "WASD + أسهم"), colour: "text-blue-400" },
                { icon: Eye, label: t("Dyslexia mode", "وضع عسر القراءة"), sub: t("OpenDyslexic font", "خط OpenDyslexic"), colour: "text-purple-400" },
                { icon: Zap, label: t("ADHD focus", "تركيز ADHD"), sub: t("One task at a time", "مهمة واحدة في كل مرة"), colour: "text-yellow-400" },
                { icon: MousePointer2, label: t("Screen reader", "قارئ الشاشة"), sub: t("Full ARIA support", "دعم ARIA كامل"), colour: "text-pink-400" },
                { icon: BookOpen, label: t("Socratic AI", "AI سقراطي"), sub: t("Asks, never tells", "يسأل، لا يُخبر"), colour: "text-orange-400" },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    className="bg-white/5 border border-white/8 rounded-2xl p-4 space-y-2 hover:border-primary/30 hover:bg-white/8 transition-all"
                    {...(prefersReducedMotion ? {} : {
                      initial: { opacity: 0, scale: 0.9 },
                      animate: { opacity: 1, scale: 1 },
                      transition: { duration: 0.4, delay: 0.3 + i * 0.07, ease: [0.23, 1, 0.32, 1] }
                    })}
                  >
                    <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center ${card.colour}`}>
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <p className="text-xs font-semibold text-white/90 leading-snug">{card.label}</p>
                    <p className="text-[10px] text-white/40">{card.sub}</p>
                  </motion.div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={prefersReducedMotion ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        >
          <ChevronDown className="w-5 h-5 text-white/20" />
        </motion.div>
      </section>

      {/* ── Marquee strip ─────────────────────────────────────────────── */}
      {!prefersReducedMotion && <Marquee />}

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-white/3 border-b border-white/8" aria-label={t("Platform statistics", "إحصائيات المنصة")}>
        <div className="container max-w-5xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                className="space-y-1"
                {...(prefersReducedMotion ? {} : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.4, delay: i * 0.08 }
                })}
              >
                <p className="text-4xl font-black text-white tabular-nums">
                  <AnimatedCounter to={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs text-white/50 font-medium">{t(s.label, s.labelAr)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works — vertical timeline ──────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-[rgb(var(--nav-bg))]" aria-label={t("How Hikma works", "كيف تعمل حكمة")}>
        <div className="container max-w-5xl">
          <motion.div className="text-center mb-16 space-y-3" {...fadeUpInView}>
            <p className="text-[11px] font-bold tracking-widest uppercase text-primary/70">
              {t("How it works", "كيف يعمل")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t("Four steps to your best learning", "أربع خطوات لأفضل تعلم")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  className="group relative bg-white/4 border border-white/8 rounded-3xl p-8 overflow-hidden hover:border-primary/30 hover:bg-white/6 transition-all duration-300"
                  {...(prefersReducedMotion ? {} : {
                    initial: { opacity: 0, y: 24 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, margin: "-40px" },
                    transition: { duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }
                  })}
                >
                  {/* Large step number watermark */}
                  <div className="absolute top-4 right-6 text-6xl font-black text-white/4 select-none" aria-hidden="true">
                    {step.step}
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${step.colour}`}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">{t(step.titleEn, step.titleAr)}</h3>
                  <p className="text-white/55 text-sm leading-relaxed">{t(step.descEn, step.descAr)}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Accessibility features — alternating layout ────────────────── */}
      <section className="py-24 bg-white/2 border-y border-white/8" aria-label={t("Accessibility features", "ميزات إمكانية الوصول")}>
        <div className="container max-w-5xl">
          <motion.div className="text-center mb-14 space-y-3" {...fadeUpInView}>
            <p className="text-[11px] font-bold tracking-widest uppercase text-primary/70">
              {t("Built for everyone", "مبني للجميع")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t("Every learner deserves the right tools", "كل متعلم يستحق الأدوات المناسبة")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.en}
                  className={`flex flex-col items-center text-center gap-3 p-5 rounded-2xl border border-white/8 hover:border-primary/30 transition-colors ${f.colour.split(" ")[1]}`}
                  {...(prefersReducedMotion ? {} : {
                    initial: { opacity: 0, scale: 0.92 },
                    whileInView: { opacity: 1, scale: 1 },
                    viewport: { once: true },
                    transition: { duration: 0.35, delay: i * 0.05 }
                  })}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.colour}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-semibold leading-snug text-white/80">{t(f.en, f.ar)}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Social proof strip ────────────────────────────────────────── */}
      <section className="py-16 bg-[rgb(var(--nav-bg))]">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: CheckCircle2, colour: "text-emerald-400", titleEn: "WCAG 2.2 AA", titleAr: "WCAG 2.2 AA", descEn: "Meets international accessibility standards", descAr: "يستوفي معايير إمكانية الوصول الدولية" },
              { icon: CheckCircle2, colour: "text-blue-400", titleEn: "MADA Qatar", titleAr: "مادا قطر", descEn: "Aligned with Qatar's assistive technology framework", descAr: "متوافق مع إطار التكنولوجيا المساعدة في قطر" },
              { icon: CheckCircle2, colour: "text-purple-400", titleEn: "Free forever", titleAr: "مجاني للأبد", descEn: "No subscription. No paywall. No ads.", descAr: "لا اشتراك. لا حاجز مدفوع. لا إعلانات." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.titleEn}
                  className="flex items-start gap-3 p-5 bg-white/4 rounded-2xl border border-white/8"
                  {...(prefersReducedMotion ? {} : {
                    initial: { opacity: 0, x: -16 },
                    whileInView: { opacity: 1, x: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.4, delay: i * 0.1 }
                  })}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${item.colour}`} aria-hidden="true" />
                  <div>
                    <p className="font-bold text-sm text-white">{t(item.titleEn, item.titleAr)}</p>
                    <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{t(item.descEn, item.descAr)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden" aria-label={t("Get started", "ابدأ الآن")}>
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-primary/15 rounded-full blur-[120px]" />
        </div>
        <div className="container max-w-3xl text-center relative z-10">
          <motion.div className="space-y-8" {...fadeUpInView}>
            <div className="space-y-3">
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {t("Ready to learn your way?", "هل أنت مستعد للتعلم بطريقتك؟")}
              </h2>
              <p className="text-white/60 text-lg">
                {t("Free. Accessible. Built for Qatar.", "مجاني. متاح للجميع. مبني لقطر.")}
              </p>
            </div>
            <div className="flex justify-center flex-wrap gap-3">
              {isAuthenticated ? (
                <Link href="/onboarding" asChild>
                  <Button size="lg"
                    className="bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-12 h-14 rounded-2xl shadow-2xl shadow-white/10"
                    aria-label={t("Personalise and start learning", "تخصيص وبدء التعلم")}>
                    {t("Personalise & Start", "تخصيص وبدء")}
                    <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Button size="lg"
                    onClick={() => navigate("/signup")}
                    className="bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-12 h-14 rounded-2xl shadow-2xl shadow-white/10"
                    aria-label={t("Create a free account", "إنشاء حساب مجاني")}>
                    {t("Create Free Account", "إنشاء حساب مجاني")}
                    <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                  </Button>
                  <Button size="lg" variant="outline"
                    onClick={() => navigate("/signin")}
                    className="border-white/20 text-white hover:bg-white/8 font-medium text-base px-8 h-14 rounded-2xl"
                    aria-label={t("Sign in", "تسجيل الدخول")}>
                    {t("Sign In", "تسجيل الدخول")}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/8 py-8">
        <div className="container max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-white/40 text-xs">
          <div className="flex items-center gap-2">
            <img src={ICON_URL} alt="" className="w-5 h-5 rounded-lg" aria-hidden="true"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <span className="font-semibold text-white/60">Hikma — حكمة</span>
          </div>
          <p>{t("Built to MADA Qatar & WCAG 2.2 AA standards", "مبني وفق معايير مادا قطر و WCAG 2.2 AA")}</p>
        </div>
      </footer>

    </div>
  );
}
