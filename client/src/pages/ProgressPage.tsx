import { PageTransition } from "@/components/PageTransition";
import { useProfile } from "@/contexts/ProfileContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Star, BookOpen, Target } from "lucide-react";
import { useLocation } from "wouter";

export default function ProgressPage() {
  const { locale } = useProfile();
  const [, navigate] = useLocation();
  const { data: mastery = [] } = trpc.progress.masteryDetails.useQuery();
  const { data: learnerSummary } = trpc.progress.learnerSummary.useQuery();

  const t = {
    title: locale === "ar" ? "تقدمي" : "My Progress",
    subtitle: locale === "ar" ? "كل خطوة تقربك من الفهم" : "Every step brings you closer to understanding",
    mastery: locale === "ar" ? "الإتقان" : "Mastery",
    concepts: locale === "ar" ? "المفاهيم" : "Concepts",
    streak: locale === "ar" ? "السلسلة" : "Streak",
    noProgress: locale === "ar" ? "لم تبدأ رحلتك بعد — ابدأ درسًا لترى تقدمك هنا." : "Your journey hasn't started yet — begin a lesson and your progress will arrive here.",
  };

  const masteredCount = learnerSummary?.stats.masteredConcepts ?? mastery.filter(m => m.level >= 4).length;
  const inProgressCount = learnerSummary?.stats.inProgressLessons ?? mastery.filter(m => m.level > 0 && m.level < 4).length;
  const totalConcepts = learnerSummary?.stats.completedLessons ?? mastery.length;

  return (
    <div className="container py-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground mt-1">{t.subtitle}</p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Star, label: locale === "ar" ? "مُتقَن" : "Mastered", value: masteredCount, color: "text-yellow-600" },
          { icon: TrendingUp, label: locale === "ar" ? "قيد التعلم" : "In Progress", value: inProgressCount, color: "text-blue-600" },
          { icon: BookOpen, label: locale === "ar" ? "إجمالي المفاهيم" : "Total Concepts", value: totalConcepts, color: "text-green-600" },
          { icon: Target, label: locale === "ar" ? "الدروس المكتملة" : "Lessons complete", value: learnerSummary?.stats.totalLessons ? `${learnerSummary.stats.completedLessons}/${learnerSummary.stats.totalLessons}` : "—", color: "text-maroon" },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-5 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold" style={{ fontVariantNumeric: "normal", fontFeatureSettings: '"zero" 0', fontFamily: "system-ui, sans-serif" }}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(() => {
        const continueLesson = learnerSummary?.continueLesson;
        return continueLesson ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{locale === "ar" ? "خطوتك التالية" : "Your next step"}</p>
                <p className="mt-1 font-semibold">{locale === "ar" ? continueLesson.titleAr : continueLesson.titleEn}</p>
                <p className="text-sm text-muted-foreground">{locale === "ar" ? continueLesson.topicAr : continueLesson.topicEn}</p>
              </div>
              <button onClick={() => navigate(`/lesson/${continueLesson.lessonId}`)} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                {locale === "ar" ? "متابعة الدرس" : "Continue lesson"}
              </button>
            </CardContent>
          </Card>
        ) : null;
      })()}

      {/* Mastery list */}
      <Card>
        <CardHeader><CardTitle>{t.mastery}</CardTitle></CardHeader>
        <CardContent>
          {mastery.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">{t.noProgress}</p>
          ) : (
            <div className="space-y-4">
              {mastery.map(m => (
                <div key={m.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span><span className="block">{locale === "ar" ? m.conceptAr : m.conceptEn}</span>{(locale === "ar" ? m.topicAr : m.topicEn) ? <span className="text-xs text-muted-foreground">{locale === "ar" ? m.topicAr : m.topicEn}</span> : null}</span>
                    <Badge variant={m.level >= 4 ? "default" : "secondary"}>
                      {locale === "ar" ? `المستوى ${m.level}` : `Level ${m.level}`}
                    </Badge>
                  </div>
                  <Progress value={(m.level / 5) * 100} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {learnerSummary?.weakAreas.length ? (
        <Card>
          <CardHeader><CardTitle>{locale === "ar" ? "مراجعة موصى بها" : "Recommended review"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {learnerSummary.weakAreas.map(area => <div key={area.topicId} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3"><div><p className="font-medium">{locale === "ar" ? area.titleAr : area.titleEn}</p><p className="text-xs text-muted-foreground">{locale === "ar" ? `${area.completed} من ${area.total} دروس مكتملة` : `${area.completed} of ${area.total} lessons complete`}</p></div><Badge variant="secondary">{area.coveragePct}%</Badge></div>)}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
