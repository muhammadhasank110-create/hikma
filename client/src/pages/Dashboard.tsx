/**
 * Dashboard — professional, accessibility-first home screen.
 *
 * Design principles:
 * - Large tap targets (min 48px)
 * - High contrast text on all backgrounds
 * - Clear visual hierarchy: greeting → quick actions → subjects
 * - Keyboard navigable: Tab moves through all cards, Enter activates
 * - Screen reader: all cards have aria-label with full context
 * - No decorative icons without aria-hidden
 */
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
// startLogin removed
import {
  Bot, TrendingUp, Layers, ChevronRight,
  GraduationCap, Star, BookOpen, Zap
} from "lucide-react";

const CURRICULUM_LABEL: Record<string, string> = {
  igcse_edexcel: "IGCSE Edexcel",
  qatar_moehe: "Qatar MoEHE",
  igcse_caie: "IGCSE Cambridge",
  gcse: "GCSE (UK)",
  ib: "IB",
  a_level: "A Level",
  none: "",
};

const MODE_LABEL: Record<string, string> = {
  audio_first: "Audio-First",
  focus: "Focus",
  reading: "Reading",
  custom: "Custom",
};

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { profile, locale } = useProfile();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  useScrollReveal();

  const { data: curricula, isLoading: loadingCurricula } = trpc.curriculum.list.useQuery();
  const { data: mastery } = trpc.progress.getMastery.useQuery(undefined, { enabled: isAuthenticated });

  const masteredCount = mastery?.filter(m => m.level >= 4).length ?? 0;
  const totalConcepts = mastery?.length ?? 0;
  const inProgressCount = mastery?.filter(m => m.level > 0 && m.level < 4).length ?? 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t("Good morning", "صباح الخير");
    if (h < 17) return t("Good afternoon", "مساء الخير");
    return t("Good evening", "مساء النور");
  };

  const currLabel = CURRICULUM_LABEL[profile.curriculum ?? ""] || "";
  const modeLabel = MODE_LABEL[profile.mode ?? "reading"] || "Reading";

  // Filter curricula to only show the user's selected curriculum (Issue #16)
  const displayCurricula = curricula?.filter(curr => {
    if (!profile.curriculum || profile.curriculum === "none") return true;
    const profKey = profile.curriculum.toLowerCase();
    const titleLower = curr.titleEn.toLowerCase();
    const boardLower = (curr.board ?? "").toLowerCase();
    return titleLower.includes(profKey.split("_")[0]) ||
           boardLower.includes(profKey.split("_")[0]) ||
           profKey.includes(titleLower.split(" ")[0]);
  }) ?? curricula;

  return (
    <PageTransition>
    <main className="container py-8 space-y-10 max-w-4xl" aria-label={t("Dashboard", "لوحة التحكم")}>

      {/* ── Greeting ──────────────────────────────────────────────────── */}
      <section aria-label={t("Welcome", "مرحباً")}>
        <p className="text-sm text-muted-foreground font-medium" aria-hidden="true">{greeting()}</p>
        <h1 className="text-3xl font-bold mt-1 tracking-tight">
          {isAuthenticated ? user?.name : t("Welcome to Hikma", "أهلاً بك في حكمة")}
        </h1>
        {(currLabel || modeLabel) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap" aria-label={t("Your profile", "ملفك الشخصي")}>
            {currLabel && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                <GraduationCap className="w-3 h-3" aria-hidden="true" />
                {currLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
              {modeLabel} {t("Mode", "وضع")}
            </span>
          </div>
        )}
        {!isAuthenticated && (
          <Button
            onClick={() => { window.location.href = '/signin'; }}
            className="mt-4"
            aria-label={t("Sign in to save your progress and personalise Hikma", "سجّل الدخول لحفظ تقدمك وتخصيص حكمة")}
          >
            {t("Sign in to save progress", "سجّل الدخول لحفظ تقدمك")}
          </Button>
        )}
      </section>

      {/* ── Stats row (authenticated only) ────────────────────────────── */}
      {isAuthenticated && (
        <section aria-label={t("Your learning stats", "إحصائيات تعلمك")}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: t("Mastered", "أتقنت"),
                value: masteredCount,
                icon: Star,
                colour: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
                desc: t(`${masteredCount} concepts fully mastered`, `${masteredCount} مفهوم مُتقَن بالكامل`),
              },
              {
                label: t("In Progress", "قيد التعلم"),
                value: inProgressCount,
                icon: TrendingUp,
                colour: "text-green-700 bg-green-50 dark:bg-green-950/30",
                desc: t(`${inProgressCount} concepts in progress`, `${inProgressCount} مفهوم قيد التعلم`),
              },
              {
                label: t("Total Concepts", "إجمالي المفاهيم"),
                value: totalConcepts,
                icon: BookOpen,
                colour: "text-blue-700 bg-blue-50 dark:bg-blue-950/30",
                desc: t(`${totalConcepts} total concepts`, `${totalConcepts} مفهوم إجمالاً`),
              },
              {
                label: t("Daily Goal", "الهدف اليومي"),
                value: `${profile.dailyGoalMinutes}m`,
                icon: Zap,
                colour: "text-orange-600 bg-orange-50 dark:bg-orange-950/30",
                desc: t(`Daily study goal: ${profile.dailyGoalMinutes} minutes`, `الهدف اليومي: ${profile.dailyGoalMinutes} دقيقة`),
              },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-card border border-border rounded-2xl p-4 space-y-2 reveal"
                  aria-label={stat.desc}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.colour}`}>
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold leading-none" style={{ fontVariantNumeric: "normal", fontFeatureSettings: '"zero" 0', fontFamily: "system-ui, sans-serif" }}>{stat.value}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Quick actions ──────────────────────────────────────────────── */}
      <section aria-label={t("Quick actions", "الإجراءات السريعة")}>
        <h2 className="text-base font-semibold text-muted-foreground mb-3 uppercase tracking-wide text-xs">
          {t("Quick access", "وصول سريع")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              href: "/tutor",
              icon: Bot,
              iconBg: "bg-primary/10 text-primary",
              title: t("Hikma AI", "حكمة AI"),
              desc: t("Ask anything. Get guided, not told.", "اسأل أي شيء. احصل على توجيه، لا إجابات."),
              ariaLabel: t("Open Hikma AI — your Socratic learning companion", "افتح حكمة AI — رفيقك في التعلم السقراطي"),
            },
            {
              href: "/progress",
              icon: TrendingUp,
              iconBg: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
              title: t("My Progress", "تقدمي"),
              desc: t("Track your mastery journey.", "تتبع رحلة إتقانك."),
              ariaLabel: t("View my learning progress and mastery", "عرض تقدمي في التعلم والإتقان"),
            },
            {
              href: "/ecc",
              icon: Layers,
              iconBg: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
              title: t("ECC", "المنهج الموسّع"),
              desc: t("9 foundational life skills.", "9 مهارات حياتية أساسية."),
              ariaLabel: t("Open Expanded Core Curriculum — 9 foundational skill areas", "افتح المنهج الأساسي الموسّع — 9 مجالات مهارية أساسية"),
            },
          ].map(action => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <div
                  role="link"
                  tabIndex={0}
                  aria-label={action.ariaLabel}
                  className="group bg-card border border-border rounded-2xl p-5 flex items-start gap-4 cursor-pointer hover:border-primary hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary reveal"
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (e.currentTarget as HTMLElement).click(); }}}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${action.iconBg}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{action.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{action.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-primary transition-colors" aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Subjects / Curricula ───────────────────────────────────────── */}
      <section aria-label={t("Your subjects", "موادك الدراسية")}>
        <h2 className="text-base font-semibold text-muted-foreground mb-3 uppercase tracking-wide text-xs">
          {t("Subjects", "المواد الدراسية")}
        </h2>
        {loadingCurricula ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayCurricula?.map(curr => (
              <Link key={curr.id} href={`/subjects/${curr.id}`}>
                <div
                  role="link"
                  tabIndex={0}
                  aria-label={t(
                    `${curr.titleEn} — ${curr.board} curriculum. Click to view subjects.`,
                    `${curr.titleAr} — منهج ${curr.board}. انقر لعرض المواد.`
                  )}
                  className="group bg-card border border-border rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-primary hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (e.currentTarget as HTMLElement).click(); }}}
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{locale === "ar" ? curr.titleAr : curr.titleEn}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{curr.board}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" aria-hidden="true" />
                </div>
              </Link>
            ))}
            {displayCurricula?.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">{t("No subjects yet", "لا توجد مواد بعد")}</p>
                <p className="text-sm text-muted-foreground max-w-xs">{t("Complete your personalisation to load your curriculum subjects.", "أكمل التخصيص لتحميل مواد منهجك الدراسي.")}</p>
                <Link href="/onboarding" className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  {t("Set up my subjects", "إعداد موادي")}
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

    </main>
    </PageTransition>
  );
}
import { useScrollReveal } from "@/hooks/useScrollReveal";
