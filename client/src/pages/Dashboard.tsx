import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useEffect } from "react";
import { Bot, TrendingUp, Layers, BookOpen, ChevronRight, Zap, Star, Activity } from "lucide-react";

const ICON_URL = "/img/hikma-icon-dark.png";

function AnimCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref as any, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18 });
  const display = useTransform(spring, v => `${Math.round(v)}${suffix}`);
  useEffect(() => { if (inView) mv.set(to); }, [inView, to, mv]);
  return <motion.span ref={ref}>{display}</motion.span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, locale } = useProfile();
  const [, navigate] = useLocation();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  const { data: curricula, isLoading } = trpc.curriculum.list.useQuery();

  const hour = new Date().getHours();
  const greeting = hour < 12
    ? t("Good morning", "صباح الخير")
    : hour < 17 ? t("Good afternoon", "مساء الخير") : t("Good evening", "مساء النور");

  const profileMode = (profile as any)?.accessibilityProfile ?? (profile as any)?.profile ?? "standard";
  const modeLabel: Record<string, string> = {
    blind: t("Audio-First Mode", "وضع الصوت الأول"),
    dyslexia: t("Dyslexia Mode", "وضع عسر القراءة"),
    adhd: t("ADHD Mode", "وضع ADHD"),
    lowVision: t("Low Vision Mode", "وضع ضعف البصر"),
    standard: t("Standard Mode", "الوضع القياسي"),
  };

  const stats = [
    { icon: Star, label: t("Mastered", "تم إتقانه"), value: 0, suffix: "", color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-400" },
    { icon: Activity, label: t("In Progress", "قيد التقدم"), value: 0, suffix: "", color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-400" },
    { icon: BookOpen, label: t("Total Concepts", "إجمالي المفاهيم"), value: 0, suffix: "", color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-400" },
    { icon: Zap, label: t("Daily Goal", "الهدف اليومي"), value: profile?.dailyGoalMinutes ?? 20, suffix: "m", color: "from-purple-500/20 to-purple-500/5", iconColor: "text-purple-400" },
  ];

  const quickActions = [
    { icon: Bot, title: t("Hikma AI", "حكمة AI"), desc: t("Ask anything. Get guided, not told.", "اسأل أي شيء. احصل على توجيه."), href: "/tutor", color: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/20", iconColor: "text-emerald-300" },
    { icon: TrendingUp, title: t("My Progress", "تقدمي"), desc: t("Track your mastery journey.", "تتبع رحلة إتقانك."), href: "/progress", color: "from-blue-500/15 to-blue-500/5", iconBg: "bg-blue-500/20", iconColor: "text-blue-300" },
    { icon: Layers, title: t("ECC", "المنهج الموسّع"), desc: t("9 foundational life skills.", "9 مهارات حياتية أساسية."), href: "/ecc", color: "from-purple-500/15 to-purple-500/5", iconBg: "bg-purple-500/20", iconColor: "text-purple-300" },
  ];

  return (
    <main id="main-content" className="min-h-screen p-6 sm:p-8 max-w-5xl mx-auto space-y-10" tabIndex={-1}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">{greeting}</p>
            <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">{user?.name?.split(" ")[0]}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {profile?.curriculum && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
                  <BookOpen className="w-3 h-3" aria-hidden="true" />
                  {profile.curriculum === "igcse_edexcel" ? "IGCSE Edexcel" : "Qatar MoEHE"}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-border text-foreground/50 bg-muted/30">
                {modeLabel[profileMode]}
              </span>
            </div>
          </div>
          <img src={ICON_URL} alt="" className="w-12 h-12 object-contain" aria-hidden="true" />
        </div>
      </motion.div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label}
              className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${s.color} border border-border`}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              whileHover={{ y: -3, scale: 1.02 }}>
              <div className={`w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mb-4 ${s.iconColor}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
              <p className="text-3xl font-black text-foreground tabular-nums">
                <AnimCounter to={s.value} suffix={s.suffix} />
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Quick access ───────────────────────────────────────────────── */}
      <div>
        <motion.h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          {t("Quick Access", "وصول سريع")}
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.button key={a.href}
                className={`text-left p-5 rounded-2xl bg-gradient-to-br ${a.color} border border-border hover:border-border/60 transition-all group`}
                onClick={() => navigate(a.href)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.07 }}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${a.iconBg} flex items-center justify-center ${a.iconColor} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground/60 transition-colors mt-1" aria-hidden="true" />
                </div>
                <p className="font-bold text-foreground text-base mb-1">{a.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Subjects ───────────────────────────────────────────────────── */}
      <div>
        <motion.h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {t("Subjects", "المواد")}
        </motion.h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : !curricula?.length ? (
          <motion.div className="text-center py-16 rounded-2xl border border-dashed border-border"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
            <p className="text-muted-foreground font-medium mb-2">{t("No subjects yet", "لا توجد مواد بعد")}</p>
            <p className="text-muted-foreground text-sm mb-5">{t("Complete onboarding to set up your curriculum.", "أكمل الإعداد لتفعيل منهجك الدراسي.")}</p>
            <button onClick={() => navigate("/onboarding")}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl text-foreground"
              style={{ background: "rgba(45,100,55,0.4)", border: "1px solid rgba(45,100,55,0.5)" }}>
              {t("Set up my subjects →", "إعداد موادي ←")}
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {curricula.map((c, i) => (
              <motion.button key={c.id}
                className="w-full text-left flex items-center gap-4 p-5 rounded-2xl border border-border bg-white/[0.03] hover:bg-white/[0.06] hover:border-border/60 transition-all group"
                onClick={() => navigate(`/subjects/${c.id}`)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.07 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.99 }}>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-emerald-400" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-base">{c.titleEn}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.board} · {c.family}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground/60 transition-colors flex-shrink-0" aria-hidden="true" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
