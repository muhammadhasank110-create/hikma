import { PageTransition } from "@/components/PageTransition";
import { useProfile } from "@/contexts/ProfileContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Star, BookOpen, Target } from "lucide-react";

export default function ProgressPage() {
  const { locale } = useProfile();
  const { data: mastery } = trpc.progress.getMastery.useQuery();

  const t = {
    title: locale === "ar" ? "تقدمي" : "My Progress",
    subtitle: locale === "ar" ? "كل خطوة تقربك من الفهم" : "Every step brings you closer to understanding",
    mastery: locale === "ar" ? "الإتقان" : "Mastery",
    concepts: locale === "ar" ? "المفاهيم" : "Concepts",
    streak: locale === "ar" ? "السلسلة" : "Streak",
    noProgress: locale === "ar" ? "لم تبدأ رحلتك بعد — ابدأ درسًا لترى تقدمك هنا." : "Your journey hasn't started yet — begin a lesson and your progress will arrive here.",
  };

  const masteredCount = mastery?.filter(m => m.level >= 4).length ?? 0;
  const inProgressCount = mastery?.filter(m => m.level > 0 && m.level < 4).length ?? 0;
  const totalConcepts = mastery?.length ?? 0;

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
          { icon: Target, label: locale === "ar" ? "الهدف اليومي" : "Daily Goal", value: "—", color: "text-maroon" },
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

      {/* Mastery list */}
      <Card>
        <CardHeader><CardTitle>{t.mastery}</CardTitle></CardHeader>
        <CardContent>
          {!mastery || mastery.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">{t.noProgress}</p>
          ) : (
            <div className="space-y-4">
              {mastery.map(m => (
                <div key={m.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Concept #{m.conceptId}</span>
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
    </div>
  );
}
