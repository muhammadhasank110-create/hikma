/**
 * Home — Hikma landing page.
 * Rich interactive animations: particle canvas, mouse-tracking glow,
 * magnetic CTA, morphing headline, scroll-scrubbed reveals,
 * SVG path draw-on, kinetic typography.
 */
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import {
  motion, useReducedMotion, useInView,
  useMotionValue, useSpring, useTransform,
  useScroll, AnimatePresence,
} from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import {
  ArrowRight, Globe, Sparkles, Star,
  MessageCircle, Zap, Eye, Volume2,
  ChevronDown, Mic, GraduationCap, Headphones,
  Keyboard, Brain, CheckCircle2,
} from "lucide-react";

const ICON_URL = "/manus-storage/hikma-app-icon_2d2d3fef.png";

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
    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    const COUNT = 80;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Seed particles
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const p of particles) {
        // Gentle mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          p.vx += (dx / dist) * force * 0.04;
          p.vy += (dy / dist) * force * 0.04;
        }
        // Dampen
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        // Wrap
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(134,239,172,${p.alpha})`;
        ctx.fill();
      }

      // Draw connection lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(134,239,172,${0.08 * (1 - d / 100)})`;
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

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, [prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    />
  );
}

// ── Mouse-tracking glow orb ───────────────────────────────────────────────────
function GlowOrb() {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const springX = useSpring(x, { stiffness: 80, damping: 25 });
  const springY = useSpring(y, { stiffness: 80, damping: 25 });
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
      className="pointer-events-none fixed z-0 w-[500px] h-[500px] rounded-full"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        background: "radial-gradient(circle, rgba(134,239,172,0.06) 0%, transparent 70%)",
      }}
      aria-hidden="true"
    />
  );
}

// ── Magnetic button ───────────────────────────────────────────────────────────
function MagneticButton({ children, className, onClick, "aria-label": ariaLabel }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  "aria-label"?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });
  const prefersReducedMotion = useReducedMotion();

  const onMove = useCallback((e: React.MouseEvent) => {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.3);
    y.set((e.clientY - cy) * 0.3);
  }, [prefersReducedMotion, x, y]);

  const onLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  return (
    <motion.button
      ref={ref}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </motion.button>
  );
}

// ── Morphing headline ─────────────────────────────────────────────────────────
const MORPH_PHRASES = [
  "meets you",
  "adapts to you",
  "listens to you",
  "grows with you",
];

function MorphingWord() {
  const [idx, setIdx] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => setIdx(i => (i + 1) % MORPH_PHRASES.length), 2800);
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  return (
    <span className="relative inline-block overflow-hidden" style={{ color: "rgb(var(--clay))" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          className="block"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] as any }}
        >
          {MORPH_PHRASES[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ── Animated waveform (SVG path draw-on) ─────────────────────────────────────
function AnimatedWaveform() {
  const ref = useRef<SVGPathElement>(null);
  const inView = useInView(ref as any, { once: true });

  // Sine wave path
  const W = 320, H = 80, BARS = 28;
  const bars = Array.from({ length: BARS }, (_, i) => {
    const h = 20 + Math.abs(Math.sin(i * 0.7)) * 50;
    const x = (i / (BARS - 1)) * W;
    return { x, h };
  });

  return (
    <div className="flex flex-col items-center gap-6">
      <svg width={W} height={H + 10} viewBox={`0 0 ${W} ${H + 10}`} aria-hidden="true">
        {bars.map((b, i) => (
          <motion.rect
            key={i}
            x={b.x - 4}
            y={(H - b.h) / 2}
            width={8}
            height={b.h}
            rx={4}
            fill="rgb(var(--primary))"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={inView ? { scaleY: 1, opacity: 0.7 + (i % 3) * 0.1 } : {}}
            transition={{ duration: 0.4, delay: i * 0.03, ease: "backOut" }}
            style={{ transformOrigin: `${b.x}px ${H / 2}px` }}
          />
        ))}
        {/* Invisible ref anchor */}
        <path ref={ref} d="M0,0" fill="none" />
      </svg>
      {/* Animated equalizer label */}
      <motion.div
        className="flex items-center gap-2 text-sm text-white/60 font-medium"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
      >
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Reading aloud — word by word
      </motion.div>
    </div>
  );
}

// ── Animated keyboard ─────────────────────────────────────────────────────────
const KB_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M"],
];
const HIGHLIGHT_KEYS = new Set(["W","A","S","D"]);

function AnimatedKeyboard() {
  const [active, setActive] = useState<string | null>(null);
  const sequence = ["W","D","S","A","W","D"];
  const seqRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive(sequence[seqRef.current % sequence.length]);
      seqRef.current++;
    }, 600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-1.5 items-center" aria-hidden="true">
      {KB_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {row.map(k => {
            const isHL = HIGHLIGHT_KEYS.has(k);
            const isActive = active === k;
            return (
              <motion.div
                key={k}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold border select-none ${
                  isActive
                    ? "bg-primary text-[rgb(var(--nav-bg))] border-primary shadow-lg shadow-primary/40"
                    : isHL
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "bg-white/5 border-white/10 text-white/30"
                }`}
                animate={isActive ? { scale: [1, 0.88, 1.05, 1] } : { scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                {k}
              </motion.div>
            );
          })}
        </div>
      ))}
      <p className="text-[10px] text-white/30 mt-2 tracking-widest uppercase">WASD navigation</p>
    </div>
  );
}

// ── Chat bubbles ──────────────────────────────────────────────────────────────
const CHAT = [
  { role: "user", text: "I don't understand photosynthesis" },
  { role: "ai",   text: "What do plants need to make food?" },
  { role: "user", text: "Sunlight, water, and CO₂?" },
  { role: "ai",   text: "Exactly — that's the core of it ✓" },
];

function ChatBubbles() {
  const [visible, setVisible] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref as any, { once: true });

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setVisible(v => {
      if (v >= CHAT.length) { clearInterval(id); return v; }
      return v + 1;
    }), 700);
    return () => clearInterval(id);
  }, [inView]);

  return (
    <div ref={ref} className="flex flex-col gap-3 w-full max-w-xs" aria-hidden="true">
      {CHAT.map((m, i) => (
        <AnimatePresence key={i}>
          {i < visible && (
            <motion.div
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] as any }}
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
          )}
        </AnimatePresence>
      ))}
      {/* Typing indicator */}
      <AnimatePresence>
        {visible > 0 && visible < CHAT.length && (
          <motion.div
            className="flex justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3 flex gap-1">
              {[0,1,2].map(i => (
                <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-white/40"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Scroll progress bar ───────────────────────────────────────────────────────
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-primary z-[100] origin-left"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}

// ── CSS-only marquee ──────────────────────────────────────────────────────────
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
          <span key={i} className="text-[11px] font-bold tracking-widest uppercase text-white/25 flex items-center gap-4 px-4">
            <span className="w-1 h-1 rounded-full bg-primary/50 inline-block flex-shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

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

// ── App mockup ────────────────────────────────────────────────────────────────
function AppMockup() {
  return (
    <div className="w-full max-w-3xl mx-auto" aria-hidden="true">
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
      <div className="bg-[#111] border-x border-b border-white/10 rounded-b-2xl overflow-hidden">
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
        <div className="p-6 grid grid-cols-3 gap-4">
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
function FeatureSection({ visual, title, subtitle, points, reverse = false }: {
  visual: React.ReactNode; title: string; subtitle: string; points: string[]; reverse?: boolean;
}) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}>
      <motion.div
        className={reverse ? "lg:order-2" : ""}
        initial={{ opacity: 0, x: reverse ? 50 : -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] as any }}
      >
        <div className="bg-white/4 border border-white/8 rounded-3xl p-10 flex items-center justify-center min-h-[280px] hover:border-primary/20 transition-colors">
          {visual}
        </div>
      </motion.div>
      <motion.div
        className={`space-y-5 ${reverse ? "lg:order-1" : ""}`}
        initial={{ opacity: 0, x: reverse ? -50 : 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] as any }}
      >
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h3>
        <p className="text-white/50 text-base leading-relaxed">{subtitle}</p>
        <ul className="space-y-2.5">
          {points.map((p, i) => (
            <motion.li key={i}
              className="flex items-start gap-3 text-sm text-white/65"
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.08 }}>
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
              {p}
            </motion.li>
          ))}
        </ul>
      </motion.div>
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

  // Scroll-driven mockup parallax
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const mockupY = useTransform(scrollYProgress, [0, 1], ["40px", "-60px"]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1]);
  const mockupOpacity = useTransform(scrollYProgress, [0, 0.2, 0.9], [0.3, 1, 0.5]);

  return (
    <div className="min-h-screen bg-[rgb(var(--nav-bg))] text-white overflow-x-hidden" dir={dir}>
      <GlowOrb />
      <ScrollProgressBar />

      {/* ── Sticky nav ────────────────────────────────────────────────── */}
      <nav className="w-full border-b border-white/8 flex items-center justify-between px-6 py-3 sticky top-0 z-50 bg-[rgb(var(--nav-bg))]/90 backdrop-blur-md">
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src={ICON_URL} alt="" className="w-7 h-7 rounded-xl"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <span className="font-bold text-sm text-white/90 tracking-tight">Hikma — حكمة</span>
        </motion.div>
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
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
        </motion.div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden pt-16"
        aria-label={t("Hikma — adaptive learning platform", "حكمة — منصة التعلم التكيفي")}
      >
        {/* Particle canvas */}
        <div className="absolute inset-0">
          <ParticleCanvas />
        </div>

        {/* Radial glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[90vw] h-[90vw] max-w-[1000px] bg-primary/8 rounded-full blur-[180px]" />
          <div className="absolute bottom-[5%] right-[5%] w-[40vw] h-[40vw] bg-[rgb(var(--clay))]/6 rounded-full blur-[120px]" />
        </div>

        {/* Content */}
        <div className="container max-w-4xl relative z-10 text-center space-y-8 py-20">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-primary/80 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              {t("AI-powered · IGCSE Edexcel + Qatar MoEHE", "مدعوم بالذكاء الاصطناعي · إيدكسيل + وزارة التعليم القطرية")}
            </span>
          </motion.div>

          {/* Headline */}
          <div>
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] as any }}
            >
              <span className="block text-white">{t("Learning that", "تعلّم")}</span>
              <span className="block h-[1.1em] overflow-hidden">
                <MorphingWord />
              </span>
              <span className="block text-white/50">{t("where you are.", "أينما كنت.")}</span>
            </motion.h1>
          </div>

          {/* Sub */}
          <motion.p
            className="text-white/50 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {t(
              "The adaptive companion built for blind, dyslexic, and ADHD learners. Voice-first. Keyboard-first. Curiosity-first.",
              "رفيق التعلم التكيفي للمكفوفين وذوي عسر القراءة واضطراب ADHD. الصوت أولاً. لوحة المفاتيح أولاً. الفضول أولاً."
            )}
          </motion.p>

          {/* CTA */}
          <motion.div
            className="flex flex-wrap gap-3 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            {isAuthenticated ? (
              <Link href="/onboarding" asChild>
                <MagneticButton
                  className="inline-flex items-center gap-2 bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-10 h-14 rounded-2xl shadow-2xl shadow-white/10 transition-colors"
                  aria-label={t("Personalise and start learning", "تخصيص وبدء التعلم")}
                >
                  {t("Personalise & Start", "تخصيص وبدء")}
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </MagneticButton>
              </Link>
            ) : (
              <>
                <MagneticButton
                  className="inline-flex items-center gap-2 bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-10 h-14 rounded-2xl shadow-2xl shadow-white/10 transition-colors"
                  onClick={() => navigate("/signup")}
                  aria-label={t("Create a free account", "إنشاء حساب مجاني")}
                >
                  {t("Create Free Account", "إنشاء حساب مجاني")}
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </MagneticButton>
                <button
                  onClick={() => navigate("/signin")}
                  className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/8 font-medium text-base px-8 h-14 rounded-2xl transition-colors"
                  aria-label={t("Sign in", "تسجيل الدخول")}
                >
                  {t("Sign In", "تسجيل الدخول")}
                </button>
              </>
            )}
          </motion.div>

          {/* Trust */}
          <motion.p className="text-white/25 text-xs"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            {t("Built to MADA Qatar & WCAG 2.2 AA · Free to use", "مبني وفق معايير مادا قطر و WCAG 2.2 AA · مجاني")}
          </motion.p>
        </div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={prefersReducedMotion ? {} : { y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        >
          <ChevronDown className="w-5 h-5 text-white/20" />
        </motion.div>
      </section>

      {/* ── App mockup — scroll parallax ──────────────────────────────── */}
      <section className="relative py-8 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vw] bg-primary/8 rounded-full blur-[100px] pointer-events-none" />

        {/* Floating accent cards */}
        <div className="absolute top-[10%] left-[5%] float-a z-10 hidden lg:block">
          <div className="bg-white/8 border border-white/15 rounded-2xl px-4 py-3 backdrop-blur-sm flex items-center gap-2.5 shadow-xl">
            <Headphones className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-white/80">Reading aloud</p>
              <p className="text-[9px] text-white/40">Section 2 of 5</p>
            </div>
          </div>
        </div>
        <div className="absolute top-[25%] right-[4%] float-b z-10 hidden lg:block">
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl px-4 py-3 backdrop-blur-sm flex items-center gap-2.5 shadow-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-emerald-300">Correct!</p>
              <p className="text-[9px] text-emerald-400/60">+10 points</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-[15%] left-[10%] float-c z-10 hidden lg:block">
          <div className="bg-primary/15 border border-primary/30 rounded-2xl px-4 py-3 backdrop-blur-sm shadow-xl">
            <p className="text-[10px] font-bold text-primary">Focus mode ON</p>
            <p className="text-[9px] text-primary/60">25 min timer</p>
          </div>
        </div>

        <motion.div
          className="container max-w-4xl relative z-[5]"
          style={prefersReducedMotion ? {} : { y: mockupY, scale: mockupScale, opacity: mockupOpacity }}
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] as any }}
        >
          <AppMockup />
        </motion.div>
      </section>

      {/* ── Marquee ───────────────────────────────────────────────────── */}
      <Marquee />

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="py-16 border-b border-white/8">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: 9, suffix: "", label: t("ECC skill areas", "مجالات مهارية") },
              { value: 100, suffix: "%", label: t("Free to use", "مجاني تماماً") },
              { value: 5, suffix: "", label: t("Accessibility profiles", "ملفات إمكانية الوصول") },
              { value: 2, suffix: "", label: t("Supported curricula", "المناهج المدعومة") },
            ].map((s, i) => (
              <motion.div key={s.label} className="space-y-1"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}>
                <p className="text-4xl font-black text-white tabular-nums">
                  <AnimatedCounter to={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs text-white/35 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature sections ──────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container max-w-5xl space-y-28">
          <FeatureSection
            visual={<AnimatedWaveform />}
            title={t("Voice-first narration", "السرد الصوتي أولاً")}
            subtitle={t("Every lesson is read aloud with word-by-word highlighting. No reading required.", "كل درس يُقرأ بصوت عالٍ مع تمييز كلمة بكلمة. لا حاجة للقراءة.")}
            points={[
              t("ElevenLabs AI voice — warm and natural", "صوت ElevenLabs AI — دافئ وطبيعي"),
              t("Word-by-word highlight follows the audio", "تمييز كلمة بكلمة يتبع الصوت"),
              t("Adjustable speed: 0.5× to 2×", "سرعة قابلة للضبط: 0.5× إلى 2×"),
            ]}
          />
          <FeatureSection
            visual={<AnimatedKeyboard />}
            title={t("Full keyboard navigation", "التنقل الكامل بلوحة المفاتيح")}
            subtitle={t("Navigate every part of Hikma without a mouse. WASD or arrow keys move between sections.", "تنقل في كل جزء من حكمة بدون فأرة. WASD أو مفاتيح الأسهم للتنقل.")}
            points={[
              t("WASD + arrow keys for spatial navigation", "WASD + مفاتيح الأسهم للتنقل المكاني"),
              t("Voice commands: 'next section', 'focus mode'", "أوامر صوتية: 'القسم التالي'، 'وضع التركيز'"),
              t("Full screen reader support (NVDA, JAWS, VoiceOver)", "دعم كامل لقارئ الشاشة"),
            ]}
            reverse
          />
          <FeatureSection
            visual={<ChatBubbles />}
            title={t("Socratic AI tutor", "المعلم الذكاء الاصطناعي السقراطي")}
            subtitle={t("Hikma AI never just gives you the answer. It asks questions and guides your thinking.", "حكمة AI لا يعطيك الإجابة مباشرة. يطرح أسئلة ويوجه تفكيرك.")}
            points={[
              t("Asks guiding questions, never lectures", "يطرح أسئلة توجيهية، لا يلقي محاضرات"),
              t("Stays on topic — no jailbreaks", "يبقى في الموضوع — لا اختراقات"),
              t("Available in Arabic and English", "متاح بالعربية والإنجليزية"),
            ]}
          />
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 border-t border-white/8">
        <div className="container max-w-5xl">
          <motion.div className="text-center mb-16 space-y-3"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="text-[11px] font-bold tracking-widest uppercase text-primary/60">{t("How it works", "كيف يعمل")}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t("Four steps to your best learning", "أربع خطوات لأفضل تعلم")}</h2>
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
                  className="relative bg-white/4 border border-white/8 rounded-3xl p-8 overflow-hidden hover:border-primary/30 hover:bg-white/6 transition-all duration-300 group"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] as any }}
                  whileHover={{ y: -4 }}
                >
                  <div className="absolute top-4 right-6 text-6xl font-black text-white/4 select-none group-hover:text-white/6 transition-colors" aria-hidden="true">{step.step}</div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${step.colour}`}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">{t(step.titleEn, step.titleAr)}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{t(step.descEn, step.descAr)}</p>
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
                  className="flex items-start gap-3 p-5 bg-white/4 rounded-2xl border border-white/8 hover:border-primary/20 transition-colors"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}>
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${item.colour}`} aria-hidden="true" />
                  <div>
                    <p className="font-bold text-sm text-white">{t(item.titleEn, item.titleAr)}</p>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{t(item.descEn, item.descAr)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden border-t border-white/8">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] bg-primary/10 rounded-full blur-[150px]" />
        </div>
        <div className="container max-w-3xl text-center relative z-10">
          <motion.div className="space-y-8"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
              {t("Ready to learn your way?", "هل أنت مستعد للتعلم بطريقتك؟")}
            </h2>
            <p className="text-white/45 text-lg">{t("Free. Accessible. Built for Qatar.", "مجاني. متاح للجميع. مبني لقطر.")}</p>
            <div className="flex justify-center flex-wrap gap-3">
              {isAuthenticated ? (
                <Link href="/onboarding" asChild>
                  <MagneticButton
                    className="inline-flex items-center gap-2 bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-14 h-14 rounded-2xl shadow-2xl shadow-white/10 transition-colors"
                    aria-label={t("Personalise and start learning", "تخصيص وبدء التعلم")}
                  >
                    {t("Personalise & Start", "تخصيص وبدء")}
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </MagneticButton>
                </Link>
              ) : (
                <>
                  <MagneticButton
                    className="inline-flex items-center gap-2 bg-white text-[rgb(var(--nav-bg))] hover:bg-white/90 font-bold text-base px-14 h-14 rounded-2xl shadow-2xl shadow-white/10 transition-colors"
                    onClick={() => navigate("/signup")}
                    aria-label={t("Create a free account", "إنشاء حساب مجاني")}
                  >
                    {t("Create Free Account", "إنشاء حساب مجاني")}
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </MagneticButton>
                  <button onClick={() => navigate("/signin")}
                    className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/8 font-medium text-base px-8 h-14 rounded-2xl transition-colors">
                    {t("Sign In", "تسجيل الدخول")}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/8 py-8">
        <div className="container max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-white/25 text-xs">
          <div className="flex items-center gap-2">
            <img src={ICON_URL} alt="" className="w-5 h-5 rounded-lg" aria-hidden="true"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <span className="font-semibold text-white/45">Hikma — حكمة</span>
          </div>
          <p>{t("Built to MADA Qatar & WCAG 2.2 AA standards", "مبني وفق معايير مادا قطر و WCAG 2.2 AA")}</p>
        </div>
      </footer>
    </div>
  );
}
