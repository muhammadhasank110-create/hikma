import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { HikmaLogo } from "@/components/HikmaLogo";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useEffect } from "react";
import { Bot, TrendingUp, BookOpen, ChevronRight, Zap, Star, Activity } from "lucide-react";
import { useSpeech } from "@/contexts/SpeechContext";
import { useHikmaMotion } from "@/hooks/useHikmaMotion";
import { StatusSkeleton } from "@/components/StatusSkeleton";
import { formatHikmaNumber } from "@/lib/formatNumber";

// ICON_URL removed — use HikmaLogo component

function AnimCounter({ to, suffix = "", reduceMotion, format }: { to: number; suffix?: string; reduceMotion: boolean; format: (value: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref as any, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18 });
  const display = useTransform(spring, v => `${format(Math.round(v))}${suffix}`);
  useEffect(() => {
    mv.set(reduceMotion || inView ? to : 0);
  }, [inView, mv, reduceMotion, to]);
  return <motion.span ref={ref}>{display}</motion.span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, locale } = useProfile();
  const [, navigate] = useLocation();
  const speech = useSpeech();
  const motionConfig = useHikmaMotion();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const formatNumber = (value: number) => formatHikmaNumber(value, locale, profile.numerals);

  const { data: curricula, isLoading } = trpc.curriculum.list.useQuery();
  const { data: learnerSummary, isLoading: isSummaryLoading } = trpc.progress.learnerSummary.useQuery();

  const hour = new Date().getHours();
  const greeting = hour < 12
    ? t("Good morning", "صباح الخير")
    : hour < 17 ? t("Good afternoon", "مساء الخير") : t("Good evening", "مساء النور");

  // Welcome narration on load for blind/audio-first users (autoNarrate=true)
  useEffect(() => {
    if (!profile.autoNarrate) return;
    const name = user?.name?.split(" ")[0] ?? "";
    const msg = locale === "ar"
      ? `${greeting}${name ? ` ${name}` : ""}. مرحباً بك في حكمة. ${learnerSummary?.continueLesson ? `يمكنك متابعة ${learnerSummary.continueLesson.titleAr}.` : "اختر مادة للبدء."}`
      : `${greeting}${name ? `, ${name}` : ""}. Welcome to Hikma. ${learnerSummary?.continueLesson ? `You can continue ${learnerSummary.continueLesson.titleEn}.` : "Choose a subject to start learning."}`;
    const timer = setTimeout(() => speech.speak(msg, { priority: "polite" }), 900);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.autoNarrate, locale, learnerSummary?.continueLesson?.lessonId]);

  const profileMode = (profile as any)?.accessibilityProfile ?? (profile as any)?.profile ?? "standard";
  const modeLabel: Record<string, string> = {
    blind: t("Audio-First Mode", "وضع الصوت الأول"),
    dyslexia: t("Dyslexia Mode", "وضع عسر القراءة"),
    adhd: t("ADHD Mode", "وضع ADHD"),
    lowVision: t("Low Vision Mode", "وضع ضعف البصر"),
    standard: t("Standard Mode", "الوضع القياسي"),
  };
  const recommendationNote = learnerSummary?.recommendationSource === "priority_subject"
    ? t("Recommended from the subjects you chose to prioritise.", "موصى به من المواد التي اخترت إعطاءها أولوية.")
    : learnerSummary?.recommendationSource === "continue"
      ? t("Continue where you last left off.", "تابع من حيث توقفت آخر مرة.")
      : t("A clear next step to help you get started.", "خطوة تالية واضحة لمساعدتك على البدء.");

  const stats = [
    { icon: Star, label: t("Mastered", "تم إتقانه"), value: learnerSummary?.stats.masteredConcepts ?? 0, suffix: "", color: "from-amber-100 to-amber-50 dark:from-amber-500/20 dark:to-amber-500/5", iconColor: "text-amber-600 dark:text-amber-400" },
    { icon: Activity, label: t("In Progress", "قيد التقدم"), value: learnerSummary?.stats.inProgressLessons ?? 0, suffix: "", color: "from-blue-100 to-blue-50 dark:from-blue-500/20 dark:to-blue-500/5", iconColor: "text-blue-600 dark:text-blue-400" },
    { icon: BookOpen, label: t("Lessons complete", "دروس مكتملة"), value: learnerSummary?.stats.completedLessons ?? 0, suffix: learnerSummary?.stats.totalLessons ? `/${formatNumber(learnerSummary.stats.totalLessons)}` : "", color: "from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-500/5", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { icon: Zap, label: t("Daily Goal", "الهدف اليومي"), value: profile?.dailyGoalMinutes ?? 20, suffix: "m", color: "from-purple-100 to-purple-50 dark:from-purple-500/20 dark:to-purple-500/5", iconColor: "text-purple-600 dark:text-purple-400" },
  ];

  const quickActions = [
    { icon: Bot, title: t("Hikma AI", "حكمة AI"), desc: t("Ask anything. Get guided, not told.", "اسأل أي شيء. احصل على توجيه."), href: "/tutor", color: "from-emerald-100 to-emerald-50 dark:from-emerald-500/15 dark:to-emerald-500/5", iconBg: "bg-emerald-500/20", iconColor: "text-emerald-700 dark:text-emerald-300" },
    { icon: TrendingUp, title: t("My Progress", "تقدمي"), desc: t("Track your mastery journey.", "تتبع رحلة إتقانك."), href: "/progress", color: "from-blue-100 to-blue-50 dark:from-blue-500/15 dark:to-blue-500/5", iconBg: "bg-blue-500/20", iconColor: "text-blue-700 dark:text-blue-300" },
  ];

  return (
    <div className="relative min-h-screen max-w-6xl mx-auto space-y-8 px-4 pb-28 pt-5 sm:space-y-10 sm:p-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={motionConfig.page.initial}
        animate={motionConfig.page.animate}
        transition={motionConfig.enterTransition}
      >
        <div className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-[linear-gradient(135deg,rgb(var(--nav-bg)),rgb(var(--primary)))] p-6 text-primary-foreground shadow-[0_22px_55px_rgba(17,55,32,0.16)] sm:p-8">
          <div aria-hidden="true" className="absolute -right-20 -top-24 size-72 rounded-full bg-white/8 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/65 font-medium mb-1">{greeting}</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">{user?.name?.split(" ")[0]}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {profile?.curriculum && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 text-white bg-white/10">
                  <BookOpen className="w-3 h-3" aria-hidden="true" />
                  {profile.curriculum === "igcse_edexcel" ? "IGCSE Edexcel" : "Qatar MoEHE"}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/15 text-white/70 bg-white/8">
                {modeLabel[profileMode]}
              </span>
            </div>
            <button type="button" onClick={() => navigate(learnerSummary?.continueLesson ? `/lesson/${learnerSummary.continueLesson.lessonId}` : "/subjects/1")} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-emerald-950 transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <BookOpen className="size-4" aria-hidden="true" />{learnerSummary?.continueLesson ? t(`Continue ${learnerSummary.continueLesson.titleEn}`, `تابع ${learnerSummary.continueLesson.titleAr}`) : t("Choose a subject", "اختر مادة")}
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-white/70">{recommendationNote}</p>
          </div>
          <div className="grid size-16 place-items-center rounded-2xl border border-white/15 bg-white/8"><HikmaLogo surface="dark" size={46} decorative imageClassName="h-11 w-auto" /></div>
          </div>
        </div>
      </motion.div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label}
              className="relative overflow-hidden rounded-[1.5rem] border border-border bg-card/85 p-4 text-card-foreground shadow-[0_12px_28px_rgba(21,47,30,0.05)] backdrop-blur-sm sm:p-5"
              initial={motionConfig.item.initial}
              animate={motionConfig.item.animate}
              transition={{ ...motionConfig.transition, delay: motionConfig.reduceMotion ? 0 : i * 0.06 }}
              whileHover={motionConfig.hover}
            >
              <div className={`mb-3 flex size-10 items-center justify-center rounded-xl bg-muted/50 sm:mb-4 ${s.iconColor}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
              <p
                className="text-3xl font-black text-foreground tabular-nums"
                style={{ fontVariantNumeric: "lining-nums tabular-nums", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
              >
                <AnimCounter to={s.value} suffix={s.suffix} reduceMotion={motionConfig.reduceMotion} format={formatNumber} />
              </p>
            </motion.div>
          );
        })}
      </div>

      {!isSummaryLoading && (learnerSummary?.recentLessons.length || learnerSummary?.weakAreas.length) ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1.5rem] border border-border bg-card/85 p-5 shadow-[0_12px_28px_rgba(21,47,30,0.05)]" aria-labelledby="recent-learning-heading">
            <h2 id="recent-learning-heading" className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("Recent learning", "التعلّم الأخير")}</h2>
            {learnerSummary?.recentLessons.length ? <div className="space-y-2">{learnerSummary.recentLessons.map(lesson => (
              <button key={lesson.lessonId} onClick={() => navigate(`/lesson/${lesson.lessonId}`)} className="flex w-full items-center justify-between rounded-xl bg-muted/45 px-3 py-3 text-left transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                <span><span className="block text-sm font-semibold text-foreground">{locale === "ar" ? lesson.titleAr : lesson.titleEn}</span><span className="text-xs text-muted-foreground">{locale === "ar" ? lesson.topicAr : lesson.topicEn}</span></span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </button>
            ))}</div> : <p className="text-sm text-muted-foreground">{t("Your completed and in-progress lessons will appear here.", "ستظهر هنا الدروس المكتملة وقيد التقدّم.")}</p>}
          </section>
          <section className="rounded-[1.5rem] border border-border bg-card/85 p-5 shadow-[0_12px_28px_rgba(21,47,30,0.05)]" aria-labelledby="review-heading">
            <h2 id="review-heading" className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("Recommended review", "مراجعة مقترحة")}</h2>
            {learnerSummary?.weakAreas.length ? <div className="space-y-2">{learnerSummary.weakAreas.map(topic => (
              <div key={topic.topicId} className="rounded-xl border border-primary/15 bg-primary/5 px-3 py-3"><p className="text-sm font-semibold text-foreground">{locale === "ar" ? topic.titleAr : topic.titleEn}</p><p className="mt-1 text-xs text-muted-foreground">{t(`${formatNumber(topic.completed)} of ${formatNumber(topic.total)} lessons complete`, `${formatNumber(topic.completed)} من ${formatNumber(topic.total)} دروس مكتملة`)}</p></div>
            ))}</div> : <p className="text-sm text-muted-foreground">{t("Complete a lesson to receive a focused review recommendation.", "أكمل درساً لتتلقى توصية مراجعة مركزة.")}</p>}
          </section>
        </div>
      ) : null}

      {/* ── Quick access ───────────────────────────────────────────────── */}
      <div>
        <motion.h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4"
          initial={motionConfig.reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={motionConfig.transition}>
          {t("Quick Access", "وصول سريع")}
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.button key={a.href}
              className="group rounded-[1.5rem] border border-border bg-card/85 p-5 text-left text-card-foreground shadow-[0_12px_28px_rgba(21,47,30,0.05)] transition-all hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
                onClick={() => navigate(a.href)}
                initial={motionConfig.item.initial}
                animate={motionConfig.item.animate}
                transition={{ ...motionConfig.transition, delay: motionConfig.reduceMotion ? 0 : 0.12 + i * 0.06 }}
                whileHover={motionConfig.hover}
                whileTap={motionConfig.press}
              >
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
          initial={motionConfig.reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={motionConfig.transition}>
          {t("Subjects", "المواد")}
        </motion.h2>
        {isLoading ? (
          <div className="space-y-3" role="status" aria-live="polite" aria-label={t("Loading subjects", "جارٍ تحميل المواد")}>
            <span className="sr-only">{t("Loading subjects", "جارٍ تحميل المواد")}</span>
            {[1, 2].map(i => (
              <StatusSkeleton key={i} className="h-20" />
            ))}
          </div>
        ) : !curricula?.length ? (
          <motion.div className="text-center py-16 rounded-2xl border border-dashed border-border"
            initial={motionConfig.reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={motionConfig.transition}>
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
                className="w-full text-left flex items-center gap-4 p-5 rounded-[1.5rem] border border-border bg-card/85 hover:-translate-y-0.5 hover:bg-muted/50 hover:border-primary/30 transition-all group shadow-[0_10px_24px_rgba(21,47,30,0.04)]"
                onClick={() => navigate(`/subjects/${c.id}`)}
                initial={motionConfig.item.initial}
                animate={motionConfig.item.animate}
                transition={{ ...motionConfig.transition, delay: motionConfig.reduceMotion ? 0 : i * 0.06 }}
                whileHover={motionConfig.hover}
                whileTap={motionConfig.press}
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
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
    </div>
  );
}
