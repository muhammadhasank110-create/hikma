/**
 * Home — Hikma landing page.
 * Premium design: full-screen hero with animated gradient orbs,
 * massive typography, visible particle field, dramatic scroll reveals.
 */
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import {
  motion, useReducedMotion, useInView,
  useMotionValue, useSpring, useTransform,
  useScroll, AnimatePresence,
} from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import {
  ArrowRight, Globe, Sparkles,
  Volume2, ChevronDown, Mic,
  CheckCircle2, Headphones, Brain, Keyboard,
} from "lucide-react";
import { playSound } from "@/lib/sound";

const ICON_URL = "/img/hikma-icon-dark.png";
const WORDMARK_URL = "/img/hikma-wordmark.png";
const FALCON_URL = "/img/hikma-icon-light.png";

// ── Animated gradient background ─────────────────────────────────────────────
function GradientBackground() {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Base */}
      <div className="absolute inset-0 bg-[#0d1f10]" />
      {/* Animated orbs */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            className="absolute w-[900px] h-[900px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(45,100,55,0.35) 0%, transparent 70%)",
              top: "-20%", left: "50%", translateX: "-50%",
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(136,90,68,0.2) 0%, transparent 70%)",
              bottom: "10%", right: "-10%",
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(28,70,32,0.4) 0%, transparent 70%)",
              top: "40%", left: "-5%",
            }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          />
        </>
      )}
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />
    </div>
  );
}

// ── Particle canvas ───────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number; hue: number }[] = [];
    const COUNT = 120;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.15,
        hue: Math.random() > 0.7 ? 30 : 130, // mix clay and green
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      for (const p of particles) {
        const dx = p.x - mx, dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          p.vx += (dx / dist) * force * 0.06;
          p.vy += (dy / dist) * force * 0.06;
        }
        p.vx *= 0.97; p.vy *= 0.97;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.hue === 130
          ? `rgba(134,239,172,${p.alpha})`
          : `rgba(201,153,126,${p.alpha})`;
        ctx.fill();
      }
      // Connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(134,239,172,${0.12 * (1 - d / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener("mousemove", onMove);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); canvas.removeEventListener("mousemove", onMove); };
  }, [prefersReducedMotion]);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" style={{ pointerEvents: "none" }} />
  );
}

// ── Mouse glow ────────────────────────────────────────────────────────────────
function GlowOrb() {
  const x = useMotionValue(-400), y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 60, damping: 20 });
  const sy = useSpring(y, { stiffness: 60, damping: 20 });
  const prefersReducedMotion = useReducedMotion();
  useEffect(() => {
    if (prefersReducedMotion) return;
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [prefersReducedMotion, x, y]);
  if (prefersReducedMotion) return null;
  return (
    <motion.div
      className="pointer-events-none fixed z-0 w-[700px] h-[700px] rounded-full"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%",
        background: "radial-gradient(circle, rgba(45,100,55,0.08) 0%, transparent 65%)" }}
      aria-hidden="true"
    />
  );
}

// ── Morphing headline ─────────────────────────────────────────────────────────
const PHRASES = ["meets you", "adapts to you", "listens to you", "grows with you"];
function MorphingWord() {
  const [idx, setIdx] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => setIdx(i => (i + 1) % PHRASES.length), 3000);
    return () => clearInterval(id);
  }, [prefersReducedMotion]);
  return (
    <span className="relative inline-block overflow-hidden" style={{ color: "rgb(201,153,126)" }}>
      <AnimatePresence mode="wait">
        <motion.span key={idx} className="block"
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-110%", opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] as any }}>
          {PHRASES[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ── Scroll progress ───────────────────────────────────────────────────────────
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div className="fixed top-0 left-0 right-0 h-[3px] z-[100] origin-left"
      style={{ scaleX, background: "linear-gradient(90deg, rgb(45,100,55), rgb(201,153,126))" }}
      aria-hidden="true" />
  );
}

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 50, damping: 15 });
  const display = useTransform(spring, v => `${Math.round(v)}${suffix}`);
  useEffect(() => { if (inView) mv.set(to); }, [inView, to, mv]);
  return <motion.span ref={ref}>{display}</motion.span>;
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, gradient, delay }: {
  icon: React.ReactNode; title: string; desc: string; gradient: string; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref as any, { once: true, margin: "-60px" });
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div ref={ref}
      className={`relative overflow-hidden rounded-3xl p-6 border border-white/8 ${gradient} group cursor-default`}
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 32, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] as any }}
      whileHover={prefersReducedMotion ? {} : { y: -4, scale: 1.01 }}
    >
      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/55 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ── CSS marquee ───────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  "Voice-first learning", "IGCSE Edexcel", "Qatar MoEHE", "Dyslexia support",
  "ADHD focus mode", "Screen reader ready", "Arabic + English", "Socratic AI",
  "WCAG 2.2 AA", "Keyboard navigation", "Free to use", "Blind learner support",
];
function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden py-5 border-y border-white/8 bg-white/[0.02]" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 flex items-center gap-5 px-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgb(45,100,55)] inline-block flex-shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const prefersReducedMotion = useReducedMotion();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { locale, setLocale } = useProfile();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const dir = locale === "ar" ? "rtl" : "ltr";

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const falconY = useTransform(scrollYProgress, [0, 1], ["0px", "80px"]);
  const falconOpacity = useTransform(scrollYProgress, [0, 0.6], [0.15, 0]);

  return (
    <div className="min-h-screen text-white overflow-x-hidden" dir={dir} style={{ background: "#0d1f10" }}>
      <GlowOrb />
      <ScrollProgress />

      {/* ── Sticky nav ─────────────────────────────────────────────────── */}
      <nav className="w-full flex items-center justify-between px-5 sm:px-8 py-4 sticky top-0 z-50 border-b border-white/[0.06]"
        style={{ background: "rgba(13,31,16,0.85)", backdropFilter: "blur(20px)" }}>
        <motion.a href="/" className="flex items-center gap-3 group"
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <img src={ICON_URL} alt="" className="w-8 h-8 object-contain transition-transform group-hover:scale-105" aria-hidden="true" />
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-black text-base text-white tracking-tight">Hikma</span>
            <span className="text-[10px] text-white/40 font-light tracking-widest">حكمة</span>
          </div>
        </motion.a>
        <motion.div className="flex items-center gap-2 sm:gap-3"
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <button onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-white/8"
            aria-label={t("Switch to Arabic", "التبديل إلى الإنجليزية")}>
            <Globe className="w-3.5 h-3.5" />
            <span>{locale === "ar" ? "EN" : "عربي"}</span>
          </button>
          {!isAuthenticated && (
            <>
              <button onClick={() => navigate("/signin")}
                className="text-xs font-semibold text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/8">
                {t("Sign In", "دخول")}
              </button>
              <button onClick={() => { playSound("tap"); navigate("/signup"); }}
                className="text-xs font-bold px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg, rgb(45,100,55), rgb(28,70,32))", boxShadow: "0 0 20px rgba(45,100,55,0.4)" }}>
                {t("Get Started", "ابدأ الآن")}
              </button>
            </>
          )}
          {isAuthenticated && (
            <button onClick={() => { playSound("tap"); navigate("/dashboard"); }}
              className="text-xs font-bold px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, rgb(45,100,55), rgb(28,70,32))", boxShadow: "0 0 20px rgba(45,100,55,0.4)" }}>
              {t("Dashboard →", "لوحة التحكم ←")}
            </button>
          )}
        </motion.div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden"
        aria-label={t("Hikma — adaptive learning platform", "حكمة — منصة التعلم التكيفي")}>
        <GradientBackground />
        <ParticleCanvas />

        {/* Falcon watermark */}
        <motion.img src={FALCON_URL} alt="" aria-hidden="true"
          className="absolute right-0 bottom-0 w-[55vw] max-w-[700px] object-contain select-none pointer-events-none"
          style={{ opacity: falconOpacity, y: falconY, filter: "brightness(0.4) saturate(0.5)" }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />

        {/* Content */}
        <div className="container max-w-5xl relative z-10 text-center px-4 py-24 space-y-8">
          {/* Eyebrow badge */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase px-4 py-2 rounded-full border"
              style={{ color: "rgb(134,239,172)", background: "rgba(45,100,55,0.15)", borderColor: "rgba(45,100,55,0.4)" }}>
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              {t("AI-powered · IGCSE Edexcel + Qatar MoEHE", "مدعوم بالذكاء الاصطناعي · إيدكسيل + وزارة التعليم القطرية")}
            </span>
          </motion.div>

          {/* Headline — MASSIVE */}
          <div className="space-y-2">
            {[
              { text: t("Learning that", "تعلّم"), delay: 0.1, class: "text-white" },
              { text: null, delay: 0.2, class: "" }, // morphing word
              { text: t("where you are.", "أينما كنت."), delay: 0.3, class: "text-white/40" },
            ].map((line, i) => (
              <motion.div key={i}
                className="overflow-hidden"
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: line.delay, ease: [0.23, 1, 0.32, 1] as any }}>
                <span className={`block text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[1.0] tracking-tight ${line.class}`}>
                  {line.text ?? <MorphingWord />}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Subheadline */}
          <motion.p className="text-white/50 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }}>
            {t(
              "The adaptive companion built for blind, dyslexic, and ADHD learners. Voice-first. Keyboard-first. Curiosity-first.",
              "رفيق التعلم التكيفي للمكفوفين وذوي عسر القراءة واضطراب ADHD. الصوت أولاً. لوحة المفاتيح أولاً. الفضول أولاً."
            )}
          </motion.p>

          {/* CTA buttons */}
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.8 }}>
            <button
              onClick={() => { playSound("tap"); navigate(isAuthenticated ? "/onboarding" : "/signup"); }}
              className="group inline-flex items-center gap-3 font-bold text-lg px-10 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl"
              style={{ background: "linear-gradient(135deg, rgb(45,100,55) 0%, rgb(28,70,32) 100%)", boxShadow: "0 0 40px rgba(45,100,55,0.5), 0 20px 40px rgba(0,0,0,0.3)" }}
              aria-label={t("Create free account", "إنشاء حساب مجاني")}>
              {t(isAuthenticated ? "Go to Dashboard" : "Start Learning Free", isAuthenticated ? "لوحة التحكم" : "ابدأ التعلم مجاناً")}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </button>
            {!isAuthenticated && (
              <button onClick={() => navigate("/signin")}
                className="inline-flex items-center gap-2 font-medium text-base px-8 py-4 rounded-2xl border border-white/15 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all">
                {t("Sign In", "تسجيل الدخول")}
              </button>
            )}
          </motion.div>

          {/* Trust line */}
          <motion.p className="text-white/20 text-xs tracking-wide"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            {t("Built to MADA Qatar & WCAG 2.2 AA · Free forever · No credit card", "مبني وفق معايير مادا قطر و WCAG 2.2 AA · مجاني للأبد")}
          </motion.p>
        </div>

        {/* Scroll cue */}
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={prefersReducedMotion ? {} : { y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} aria-hidden="true">
          <ChevronDown className="w-6 h-6 text-white/25" />
        </motion.div>
      </section>

      {/* ── Marquee ─────────────────────────────────────────────────────── */}
      <Marquee />

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-white/8">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: 9, suffix: "", label: t("ECC skill areas", "مجالات مهارية") },
              { value: 100, suffix: "%", label: t("Free to use", "مجاني تماماً") },
              { value: 5, suffix: "", label: t("Accessibility profiles", "ملفات إمكانية الوصول") },
              { value: 2, suffix: "", label: t("Supported curricula", "المناهج المدعومة") },
            ].map((s, i) => (
              <motion.div key={s.label} className="space-y-2"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}>
                <p className="text-5xl font-black text-white tabular-nums" style={{ textShadow: "0 0 40px rgba(45,100,55,0.6)" }}>
                  <Counter to={s.value} suffix={s.suffix} />
                </p>
                <p className="text-sm text-white/40 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature grid ────────────────────────────────────────────────── */}
      <section className="py-24 border-b border-white/8">
        <div className="container max-w-5xl">
          <motion.div className="text-center mb-16"
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="text-[11px] font-bold tracking-[0.25em] uppercase mb-4" style={{ color: "rgb(134,239,172)" }}>Built different</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Every learner, every need</h2>
            <p className="text-white/40 mt-4 text-lg max-w-xl mx-auto">Not a one-size-fits-all platform. Hikma adapts to how your brain works.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Volume2 className="w-6 h-6 text-emerald-300" />,
                title: t("Voice-first narration", "السرد الصوتي"),
                desc: t("Every lesson read aloud with word-by-word highlighting. No reading required.", "كل درس يُقرأ بصوت مع تمييز كلمة بكلمة."),
                gradient: "bg-gradient-to-br from-emerald-500/15 to-emerald-500/5",
                delay: 0,
              },
              {
                icon: <Keyboard className="w-6 h-6 text-blue-300" />,
                title: t("Full keyboard navigation", "التنقل بلوحة المفاتيح"),
                desc: t("WASD + arrow keys. Navigate every part of Hikma without a mouse.", "WASD + مفاتيح الأسهم. تنقّل في كل شيء بدون ماوس."),
                gradient: "bg-gradient-to-br from-blue-500/15 to-blue-500/5",
                delay: 0.1,
              },
              {
                icon: <Brain className="w-6 h-6 text-purple-300" />,
                title: t("Socratic AI tutor", "المعلم الذكي السقراطي"),
                desc: t("Hikma AI never just gives the answer. It asks questions and guides your thinking.", "حكمة AI لا يعطيك الإجابة مباشرة — يرشد تفكيرك."),
                gradient: "bg-gradient-to-br from-purple-500/15 to-purple-500/5",
                delay: 0.2,
              },
              {
                icon: <Mic className="w-6 h-6 text-rose-300" />,
                title: t("Voice commands", "الأوامر الصوتية"),
                desc: t("Say 'next section', 'focus mode', or ask any question. Hikma listens.", "قل 'القسم التالي' أو اطرح أي سؤال. حكمة تستمع."),
                gradient: "bg-gradient-to-br from-rose-500/15 to-rose-500/5",
                delay: 0.3,
              },
              {
                icon: <Headphones className="w-6 h-6 text-amber-300" />,
                title: t("5 accessibility profiles", "5 ملفات إمكانية الوصول"),
                desc: t("Blind, dyslexia, ADHD, low vision, standard. Personalised in 2 minutes.", "مكفوف، عسر قراءة، ADHD، ضعف بصر، عادي."),
                gradient: "bg-gradient-to-br from-amber-500/15 to-amber-500/5",
                delay: 0.4,
              },
              {
                icon: <CheckCircle2 className="w-6 h-6 text-teal-300" />,
                title: t("Adaptive quizzes", "الاختبارات التكيفية"),
                desc: t("5 questions per topic, AI-graded, with instant feedback and explanations.", "5 أسئلة لكل موضوع، مُقيَّمة بالذكاء الاصطناعي."),
                gradient: "bg-gradient-to-br from-teal-500/15 to-teal-500/5",
                delay: 0.5,
              },
            ].map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="py-24 border-b border-white/8">
        <div className="container max-w-4xl">
          <motion.div className="text-center mb-16"
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="text-[11px] font-bold tracking-[0.25em] uppercase mb-4" style={{ color: "rgb(201,153,126)" }}>How it works</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Four steps to your best learning</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { n: "01", title: t("Tell Hikma how you learn", "أخبر حكمة كيف تتعلم"), desc: t("Blind? Dyslexic? Prefer Arabic? Hikma adapts to you in 2 minutes.", "مكفوف؟ عسر قراءة؟ تفضّل العربية؟ حكمة يتكيف معك."), color: "rgb(45,100,55)" },
              { n: "02", title: t("Navigate with your voice", "تنقّل بصوتك"), desc: t("Say 'next section' to navigate, 'read aloud' to listen, or ask a question.", "قل 'القسم التالي' للتنقل أو 'اقرأ بصوت' للاستماع."), color: "rgb(136,90,68)" },
              { n: "03", title: t("Ask Hikma AI anything", "اسأل حكمة AI أي شيء"), desc: t("Hikma AI guides you like a teacher — asks questions, never just gives answers.", "حكمة AI يرشدك كمعلم — يسأل ولا يعطي الإجابة مباشرة."), color: "rgb(80,140,85)" },
              { n: "04", title: t("Test yourself after every topic", "اختبر نفسك بعد كل موضوع"), desc: t("Personalised questions after each unit. See what you know and what to revisit.", "أسئلة مخصصة بعد كل وحدة. اعرف ما تعرفه وما تحتاج مراجعته."), color: "rgb(160,55,75)" },
            ].map((step, i) => (
              <motion.div key={i}
                className="flex gap-5 p-6 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}>
                <span className="text-4xl font-black flex-shrink-0 tabular-nums" style={{ color: step.color, opacity: 0.6 }}>{step.n}</span>
                <div>
                  <h3 className="font-bold text-white text-lg mb-1">{step.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(45,100,55,0.2) 0%, transparent 70%)" }} />
        </div>
        <div className="container max-w-3xl text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight mb-6">
              {t("Ready to learn", "مستعد للتعلم")}<br />
              <span style={{ color: "rgb(134,239,172)" }}>{t("your way?", "بطريقتك؟")}</span>
            </h2>
            <p className="text-white/40 text-lg mb-10">{t("Free. Accessible. Built for Qatar.", "مجاني. متاح للجميع. مبني لقطر.")}</p>
            <button
              onClick={() => { playSound("tap"); navigate(isAuthenticated ? "/dashboard" : "/signup"); }}
              className="inline-flex items-center gap-3 font-bold text-xl px-12 py-5 rounded-2xl transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, rgb(45,100,55), rgb(28,70,32))", boxShadow: "0 0 60px rgba(45,100,55,0.5)" }}>
              {t(isAuthenticated ? "Go to Dashboard →" : "Start Learning Free →", isAuthenticated ? "لوحة التحكم ←" : "ابدأ التعلم مجاناً ←")}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="py-8 border-t border-white/8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <img src={ICON_URL} alt="" className="w-6 h-6 rounded-lg object-contain" aria-hidden="true" />
          <span className="font-bold text-white/60 text-sm">Hikma — حكمة</span>
        </div>
        <p className="text-white/25 text-xs">{t("Built to MADA Qatar & WCAG 2.2 AA accessibility standards", "مبني وفق معايير مادا قطر و WCAG 2.2 AA")}</p>
      </footer>
    </div>
  );
}
