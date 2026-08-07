/**
 * Home — Hikma landing page.
 * Design: Linear-inspired centered hero + scroll-driven app mockup
 * + alternating feature sections + CSS-only marquee + floating accent cards.
 */
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import {
  motion, useReducedMotion, useInView,
  useMotionValue, useSpring, useTransform,
  useScroll,
} from "framer-motion";
import { useRef, useEffect } from "react";
import {
  ArrowRight, Globe, Sparkles, Star,
  MessageCircle, Zap, Eye, Volume2,
  ChevronDown, Mic, GraduationCap, Headphones,
  Keyboard, Brain, CheckCircle2, BookOpen,
} from "lucide-react";

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

// ── CSS-only marquee (never drifts) ──────────────────────────────────────────
const MARQUEE_ITEMS = [
  "Voice-first learning", "IGCSE Edexcel", "Qatar MoEHE", "Dyslexia support",
  "ADHD focus mode", "Screen reader ready", "Arabic + English", "Socratic AI",
  "WCAG 2.2 AA", "Keyboard navigation", "Free to use", "Blind learner support",
];
function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden py-4 border-y border-white/8" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="text-[11px] font-bold tracking-widest uppercase text-white/30 flex items-center gap-4 px-4">
            <span className="w-1 h-1 rounded-full bg-primary/50 inline-block flex-shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Animated waveform ─────────────────────────────────────────────────────────
function Waveform({ bars = 20, colour = "rgb(var(--primary))" }: { bars?: number; colour?: string }) {
  return (
    <div className="flex items-end gap-[3px] h-16" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="wave-bar rounded-full flex-1"
          style={{
            background: colour,
            height: "100%",
            animationDelay: `${i * 0.08}s`,
            opacity: 0.7 + (i % 3) * 0.1,
          }}
        />
      ))}
    </div>
  );
}

// ── Animated keyboard ─────────────────────────────────────────────────────────
const KB_KEYS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M"],
];
function AnimatedKeyboard() {
  const HIGHLIGHT = ["W","A","S","D","↑","↓","←","→"];
  return (
    <div className="flex flex-col gap-1.5 items-center" aria-hidden="true">
      {KB_KEYS.map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {row.map((k, ki) => {
            const isHL = HIGHLIGHT.includes(k);
            return (
              <motion.div
                key={k}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold border ${
                  isHL
                    ? "bg-primary/30 border-primary/60 text-primary"
                    : "bg-white/5 border-white/10 text-white/40"
                }`}
                animate={isHL ? { scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] } : {}}
                transition={isHL ? { duration: 1.8, repeat: Infinity, delay: ki * 0.2 } : {}}
              >
                {k}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Animated chat bubbles ─────────────────────────────────────────────────────
const CHAT_MSGS = [
  { role: "user", text: "I don't understand photosynthesis", delay: 0 },
  { role: "ai",   text: "What do plants need to make food?", delay: 0.6 },
  { role: "user", text: "Sunlight, water, and CO₂?", delay: 1.2 },
  { role: "ai",   text: "Exactly! That's the core of it ✓", delay: 1.8 },
];
function ChatBubbles() {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs" aria-hidden="true">
      {CHAT_MSGS.map((m, i) => (
        <motion.div
          key={i}
          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: m.delay, duration: 0.4 }}
        >
          <div className={`px-4 py-2.5 rounded-2xl text-xs font-medium max-w-[85%] leading-relaxed ${
            m.role === "user"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-white/8 text-white/80 border border-white/10"
          }`}>
            {m.role === "ai" && <span className="text-primary font-bold mr-1">Hikma</span>}
            {m.text}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── App mockup ────────────────────────────────────────────────────────────────
function AppMockup() {
  return (
    <div className="w-full max-w-3xl mx-auto" aria-hidden="true">
      {/* Browser chrome */}
      <div className="bg-[#1a1a1a] rounded-t-2xl border border-white/10 px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 mx-4 bg-white/5 rounded-md h-6 flex items-center px-3">
          <span className="text-[10px] text-white/30 font-mono">hikmalearn.app/dashboard</span>
        </div>
      </div>
      {/* App content preview */}
      <div className="bg-[#111] border-x border-b border-white/10 rounded-b-2xl overflow-hidden">
        {/* Nav bar */}
        <div className="bg-[#0d1a0d] border-b border-white/8 px-6 py-3 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img src={ICON_URL} alt="" className="w-5 h-5 rounded-md"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <span className="text-xs font-bold text-white/80">Hikma</span>
          </div>
          {["Home","Subjects","Hikma AI","Progress","ECC"].map(n => (
            <span key={n} className="text-[10px] text-white/30 font-medium">{n}</span>
          ))}
        </div>
        {/* Dashboard content */}
        <div className="p-6 grid grid-cols-3 gap-4">
          {/* Welcome card */}
          <div className="col-span-3 bg-white/4 rounded-xl p-4 border border-white/8">
            <p className="text-[10px] text-white/40 mb-1">Welcome back</p>
            <p className="text-sm font-bold text-white">Good morning, Mustafa 👋</p>
            <div className="mt-3 flex gap-2">
              <div className="flex-1 bg-primary/20 rounded-lg p-2 border border-primary/20">
                <p className="text-[9px] text-primary font-bold">Continue learning</p>
                <p className="text-[10px] text-white/60 mt-0.5">Biology · Cell Division</p>
              </div>
              <div className="flex-1 bg-white/4 rounded-lg p-2 border border-white/8">
                <p className="text-[9px] text-white/40 font-bold">Daily goal</p>
                <p className="text-[10px] text-white/60 mt-0.5">20 min · 8 min done</p>
              </div>
            </div>
          </div>
          {/* Stat cards */}
          {[
            { label: "Streak", value: "7 days", colour: "text-amber-400" },
            { label: "Topics done", value: "12", colour: "text-emerald-400" },
            { label: "Quiz score", value: "84%", colour: "text-blue-400" },
          ].map(s => (
            <div key={s.label} className="bg-white/4 rounded-xl p-3 border border-white/8">
              <p className="text-[9px] text-white/40 font-medium">{s.label}</p>
              <p className={`text-base font-black mt-1 ${s.colour}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Feature section ───────────────────────────────────────────────────────────
function FeatureSection({
  visual, title, subtitle, points, reverse, delay = 0
}: {
  visual: React.ReactNode;
  title: string;
  subtitle: string;
  points: string[];
  reverse?: boolean;
  delay?: number;
}) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${reverse ? "lg:flex-row-reverse" : ""}`}>
      <motion.div
        className={reverse ? "lg:order-2" : ""}
        initial={{ opacity: 0, x: reverse ? 40 : -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="bg-white/4 border border-white/8 rounded-3xl p-10 flex items-center justify-center min-h-[280px]">
          {visual}
        </div>
      </motion.div>
      <motion.div
        className={`space-y-5 ${reverse ? "lg:order-1" : ""}`}
        initial={{ opacity: 0, x: reverse ? -40 : 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay: delay + 0.1, ease: [0.23, 1, 0.32, 1] }}
      >
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h3>
        <p className="text-white/55 text-base leading-relaxed">{subtitle}</p>
        <ul className="space-y-2.5">
          {points.map((p, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-white/70">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Home() {
  const prefersReducedMotion = useReducedMotion();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { locale, setLocale } = useProfile();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const dir = locale === "ar" ? "rtl" : "ltr";

  // Scroll-driven mockup parallax
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const mockupY = useTransform(scrollYProgress, [0, 1], ["60px", "-40px"]);
  const mockupOpacity = useTransform(scrollYProgress, [0, 0.3, 0.8], [0.4, 1, 0.6]);

  // Word-by-word headline stagger
  const headline1 = t("Learning that", "تعلّم يلتقي").split(" ");
  const headline2 = t("meets you", "بك أينما").split(" ");
  const headline3 = t("where you are.", "كنت.").split(" ");

  const wordVariants = {
  hidden: { opacity: 0, y: 30, rotateX: -20 },
  visible: (i: number) => ({
    opacity: 1, y: 0, rotateX: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] as any }
  }),
};

  return (
    <div className="min-h-screen bg-[rgb(var(--nav-bg))] text-white overflow-x-hidden" dir={dir}>

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <nav className="w-full border-b border-white/8 flex items-center justify-between px-6 py-3 sticky top-0 z-50 bg-[rgb(var(--nav-bg))]/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <img src={ICON_URL} alt="" className="w-7 h-7 rounded-xl"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <span className="font-bold text-sm text-white/90 tracking-tight">Hikma — حكمة</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400 rounded px-2 py-1"
            aria-label={t("Switch to Arabic", "التبديل إلى الإنجليزية")}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{locale === "ar" ? "EN" : "عربي"}</span>
          </button>
          {!isAuthenticated && (
            <>
              <button onClick={() => navigate("/signin")}
                className="text-xs font-semibold text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/8">
                {t("Sign In", "تسجيل الدخول")}
              </button>
              <button onClick={() => navigate("/signup")}
                className="text-xs font-bold bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 transition-colors px-4 py-1.5 rounded-lg">
                {t("Sign Up", "إنشاء حساب")}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden pt-16 pb-0"
        aria-label={t("Hikma — adaptive learning platform", "حكمة — منصة التعلم التكيفي")}
      >
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[900px] bg-primary/12 rounded-full blur-[160px]" />
          <div className="absolute bottom-[10%] left-[10%] w-[40vw] h-[40vw] bg-[rgb(var(--clay))]/8 rounded-full blur-[120px]" />
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
        </div>

        {/* Centered content */}
        <div className="container max-w-4xl relative z-10 text-center space-y-8">

          {/* Eyebrow */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-primary/80 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              {t("AI-powered · IGCSE Edexcel + Qatar MoEHE", "مدعوم بالذكاء الاصطناعي · إيدكسيل + وزارة التعليم القطرية")}
            </span>
          </motion.div>

          {/* Headline — word-by-word stagger with perspective */}
          <div className="perspective-[800px]">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.0] tracking-tight">
              <motion.span className="block" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
                {headline1.map((w, i) => (
                  <motion.span key={i} custom={i} variants={wordVariants} className="inline-block mr-[0.25em]">{w}</motion.span>
                ))}
              </motion.span>
              <motion.span className="block" style={{ color: "rgb(var(--clay))" }} initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}>
                {headline2.map((w, i) => (
                  <motion.span key={i} custom={i} variants={wordVariants} className="inline-block mr-[0.25em]">{w}</motion.span>
                ))}
              </motion.span>
              <motion.span className="block text-white/60" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } } }}>
                {headline3.map((w, i) => (
                  <motion.span key={i} custom={i} variants={wordVariants} className="inline-block mr-[0.25em]">{w}</motion.span>
                ))}
              </motion.span>
            </h1>
          </div>

          {/* Sub */}
          <motion.p
            className="text-white/55 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            {t(
              "The adaptive companion built for blind, dyslexic, and ADHD learners. Voice-first. Keyboard-first. Curiosity-first.",
              "رفيق التعلم التكيفي للمكفوفين وذوي عسر القراءة واضطراب ADHD. الصوت أولاً. لوحة المفاتيح أولاً. الفضول أولاً."
            )}
          </motion.p>

          {/* CTA */}
          <motion.div
            className="flex flex-wrap gap-3 justify-center"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.85 }}
          >
            {isAuthenticated ? (
              <Link href="/onboarding" asChild>
                <Button size="lg"
                  className="bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-10 h-14 rounded-2xl shadow-2xl shadow-white/10"
                  aria-label={t("Personalise and start learning", "تخصيص وبدء التعلم")}>
                  {t("Personalise & Start", "تخصيص وبدء")}
                  <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                </Button>
              </Link>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate("/signup")}
                  className="bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-10 h-14 rounded-2xl shadow-2xl shadow-white/10"
                  aria-label={t("Create a free account", "إنشاء حساب مجاني")}>
                  {t("Create Free Account", "إنشاء حساب مجاني")}
                  <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/signin")}
                  className="border-white/20 text-white hover:bg-white/8 font-medium text-base px-8 h-14 rounded-2xl"
                  aria-label={t("Sign in", "تسجيل الدخول")}>
                  {t("Sign In", "تسجيل الدخول")}
                </Button>
              </>
            )}
          </motion.div>

          {/* Trust line */}
          <motion.p
            className="text-white/30 text-xs"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            {t("Built to MADA Qatar & WCAG 2.2 AA · Free to use", "مبني وفق معايير مادا قطر و WCAG 2.2 AA · مجاني")}
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={prefersReducedMotion ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        >
          <ChevronDown className="w-5 h-5 text-white/20" />
        </motion.div>
      </section>

      {/* ── App mockup — scroll-driven parallax ───────────────────────── */}
      <section className="relative py-16 overflow-hidden" aria-hidden="true">
        {/* Glow behind mockup */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vw] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Floating accent cards */}
        <div className="absolute top-[15%] left-[8%] float-a z-10 hidden lg:block">
          <div className="bg-white/8 border border-white/15 rounded-2xl px-4 py-3 backdrop-blur-sm flex items-center gap-2.5 shadow-xl">
            <Headphones className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-white/80">Reading aloud</p>
              <p className="text-[9px] text-white/40">Section 2 of 5</p>
            </div>
          </div>
        </div>
        <div className="absolute top-[30%] right-[6%] float-b z-10 hidden lg:block">
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl px-4 py-3 backdrop-blur-sm flex items-center gap-2.5 shadow-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-emerald-300">Correct!</p>
              <p className="text-[9px] text-emerald-400/60">+10 points</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-[20%] left-[12%] float-c z-10 hidden lg:block">
          <div className="bg-primary/15 border border-primary/30 rounded-2xl px-4 py-3 backdrop-blur-sm shadow-xl">
            <p className="text-[10px] font-bold text-primary">Focus mode ON</p>
            <p className="text-[9px] text-primary/60">25 min timer</p>
          </div>
        </div>

        <motion.div
          className="container max-w-4xl relative z-[5]"
          style={prefersReducedMotion ? {} : { y: mockupY, opacity: mockupOpacity }}
        >
          <AppMockup />
        </motion.div>
      </section>

      {/* ── Marquee ───────────────────────────────────────────────────── */}
      <Marquee />

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <section className="py-16 border-b border-white/8" aria-label={t("Platform statistics", "إحصائيات المنصة")}>
        <div className="container max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: 9, suffix: "", label: t("ECC skill areas", "مجالات مهارية") },
              { value: 100, suffix: "%", label: t("Free to use", "مجاني تماماً") },
              { value: 5, suffix: "", label: t("Accessibility profiles", "ملفات إمكانية الوصول") },
              { value: 2, suffix: "", label: t("Supported curricula", "المناهج المدعومة") },
            ].map((s, i) => (
              <motion.div key={s.label} className="space-y-1"
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}>
                <p className="text-4xl font-black text-white tabular-nums">
                  <AnimatedCounter to={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs text-white/40 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature sections — alternating ────────────────────────────── */}
      <section className="py-24" aria-label={t("Features", "الميزات")}>
        <div className="container max-w-5xl space-y-28">

          <FeatureSection
            visual={<Waveform bars={24} />}
            title={t("Voice-first narration", "السرد الصوتي أولاً")}
            subtitle={t(
              "Every lesson is read aloud with word-by-word highlighting. No reading required — just listen and learn.",
              "كل درس يُقرأ بصوت عالٍ مع تمييز كلمة بكلمة. لا حاجة للقراءة — فقط استمع وتعلم."
            )}
            points={[
              t("ElevenLabs AI voice — warm and natural", "صوت ElevenLabs AI — دافئ وطبيعي"),
              t("Word-by-word highlight follows the audio", "تمييز كلمة بكلمة يتبع الصوت"),
              t("Adjustable speed: 0.5× to 2×", "سرعة قابلة للضبط: 0.5× إلى 2×"),
            ]}
            delay={0}
          />

          <FeatureSection
            visual={<AnimatedKeyboard />}
            title={t("Full keyboard navigation", "التنقل الكامل بلوحة المفاتيح")}
            subtitle={t(
              "Navigate every part of Hikma without a mouse. WASD or arrow keys move between sections. Say commands with your voice.",
              "تنقل في كل جزء من حكمة بدون فأرة. WASD أو مفاتيح الأسهم للتنقل بين الأقسام. قل الأوامر بصوتك."
            )}
            points={[
              t("WASD + arrow keys for spatial navigation", "WASD + مفاتيح الأسهم للتنقل المكاني"),
              t("Voice commands: 'next section', 'focus mode'", "أوامر صوتية: 'القسم التالي'، 'وضع التركيز'"),
              t("Full screen reader support (NVDA, JAWS, VoiceOver)", "دعم كامل لقارئ الشاشة"),
            ]}
            reverse
            delay={0.1}
          />

          <FeatureSection
            visual={<ChatBubbles />}
            title={t("Socratic AI tutor", "المعلم الذكاء الاصطناعي السقراطي")}
            subtitle={t(
              "Hikma AI never just gives you the answer. It asks questions, guides your thinking, and helps you discover the answer yourself.",
              "حكمة AI لا يعطيك الإجابة مباشرة. يطرح أسئلة، يوجه تفكيرك، ويساعدك على اكتشاف الإجابة بنفسك."
            )}
            points={[
              t("Asks guiding questions, never lectures", "يطرح أسئلة توجيهية، لا يلقي محاضرات"),
              t("Stays on topic — no jailbreaks", "يبقى في الموضوع — لا اختراقات"),
              t("Available in Arabic and English", "متاح بالعربية والإنجليزية"),
            ]}
            delay={0.1}
          />

        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 border-t border-white/8" aria-label={t("How Hikma works", "كيف تعمل حكمة")}>
        <div className="container max-w-5xl">
          <motion.div className="text-center mb-16 space-y-3"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}>
            <p className="text-[11px] font-bold tracking-widest uppercase text-primary/60">
              {t("How it works", "كيف يعمل")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t("Four steps to your best learning", "أربع خطوات لأفضل تعلم")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { step: "01", icon: Brain, colour: "bg-emerald-500/15 text-emerald-400", titleEn: "Tell Hikma how you learn", titleAr: "أخبر حكمة كيف تتعلم", descEn: "Audio-first? Need bigger text? Prefer Arabic? Hikma adapts to you in 2 minutes.", descAr: "الصوت أولاً؟ نص أكبر؟ تفضل العربية؟ تتكيف حكمة معك في دقيقتين." },
              { step: "02", icon: Mic, colour: "bg-blue-500/15 text-blue-400", titleEn: "Navigate with your voice", titleAr: "تنقّل بصوتك", descEn: "Say \"Hikma\" to navigate, read aloud, or ask a question. No mouse needed.", descAr: "قل \"حكمة\" للتنقل أو القراءة أو طرح سؤال. لا حاجة للفأرة." },
              { step: "03", icon: MessageCircle, colour: "bg-purple-500/15 text-purple-400", titleEn: "Ask Hikma AI anything", titleAr: "اسأل حكمة AI أي شيء", descEn: "Hikma AI guides you like a teacher — asks questions, never just gives answers.", descAr: "حكمة AI يرشدك كالمعلم — يطرح أسئلة، ولا يعطي الإجابات مباشرة." },
              { step: "04", icon: Star, colour: "bg-amber-500/15 text-amber-400", titleEn: "Test yourself after every topic", titleAr: "اختبر نفسك بعد كل موضوع", descEn: "Personalised questions after each unit. See what you know and what to revisit.", descAr: "أسئلة مخصصة بعد كل وحدة. اعرف ما تعرفه وما تحتاج مراجعته." },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.step}
                  className="relative bg-white/4 border border-white/8 rounded-3xl p-8 overflow-hidden hover:border-primary/30 hover:bg-white/6 transition-all duration-300"
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}>
                  <div className="absolute top-4 right-6 text-6xl font-black text-white/4 select-none" aria-hidden="true">{step.step}</div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${step.colour}`}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">{t(step.titleEn, step.titleAr)}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{t(step.descEn, step.descAr)}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Social proof ──────────────────────────────────────────────── */}
      <section className="py-16 border-t border-white/8">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: CheckCircle2, colour: "text-emerald-400", titleEn: "WCAG 2.2 AA", titleAr: "WCAG 2.2 AA", descEn: "Meets international accessibility standards", descAr: "يستوفي معايير إمكانية الوصول الدولية" },
              { icon: CheckCircle2, colour: "text-blue-400", titleEn: "MADA Qatar", titleAr: "مادا قطر", descEn: "Aligned with Qatar's assistive technology framework", descAr: "متوافق مع إطار التكنولوجيا المساعدة في قطر" },
              { icon: CheckCircle2, colour: "text-purple-400", titleEn: "Free forever", titleAr: "مجاني للأبد", descEn: "No subscription. No paywall. No ads.", descAr: "لا اشتراك. لا حاجز مدفوع. لا إعلانات." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.titleEn}
                  className="flex items-start gap-3 p-5 bg-white/4 rounded-2xl border border-white/8"
                  initial={prefersReducedMotion ? {} : { opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}>
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${item.colour}`} aria-hidden="true" />
                  <div>
                    <p className="font-bold text-sm text-white">{t(item.titleEn, item.titleAr)}</p>
                    <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{t(item.descEn, item.descAr)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden border-t border-white/8" aria-label={t("Get started", "ابدأ الآن")}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] bg-primary/12 rounded-full blur-[140px]" />
        </div>
        <div className="container max-w-3xl text-center relative z-10">
          <motion.div className="space-y-8"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}>
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
                {t("Ready to learn your way?", "هل أنت مستعد للتعلم بطريقتك؟")}
              </h2>
              <p className="text-white/50 text-lg">
                {t("Free. Accessible. Built for Qatar.", "مجاني. متاح للجميع. مبني لقطر.")}
              </p>
            </div>
            <div className="flex justify-center flex-wrap gap-3">
              {isAuthenticated ? (
                <Link href="/onboarding" asChild>
                  <Button size="lg"
                    className="bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-14 h-14 rounded-2xl shadow-2xl shadow-white/10"
                    aria-label={t("Personalise and start learning", "تخصيص وبدء التعلم")}>
                    {t("Personalise & Start", "تخصيص وبدء")}
                    <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Button size="lg" onClick={() => navigate("/signup")}
                    className="bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-14 h-14 rounded-2xl shadow-2xl shadow-white/10"
                    aria-label={t("Create a free account", "إنشاء حساب مجاني")}>
                    {t("Create Free Account", "إنشاء حساب مجاني")}
                    <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("/signin")}
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
        <div className="container max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-white/30 text-xs">
          <div className="flex items-center gap-2">
            <img src={ICON_URL} alt="" className="w-5 h-5 rounded-lg" aria-hidden="true"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <span className="font-semibold text-white/50">Hikma — حكمة</span>
          </div>
          <p>{t("Built to MADA Qatar & WCAG 2.2 AA standards", "مبني وفق معايير مادا قطر و WCAG 2.2 AA")}</p>
        </div>
      </footer>

    </div>
  );
}
