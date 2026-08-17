import { useProfile } from "@/contexts/ProfileContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { Eye, Keyboard, Navigation, Dot, Users, Brain, Activity, BookOpen, Lightbulb } from "lucide-react";

const ECC_ICONS: Record<number, any> = {
  1: Eye, 2: Keyboard, 3: Navigation, 4: Dot, 5: Users,
  6: Brain, 7: Activity, 8: BookOpen, 9: Lightbulb,
};

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  rehearsed: "bg-blue-100 text-blue-800",
  practised: "bg-yellow-100 text-yellow-800",
  mastered: "bg-green-100 text-green-800",
};

export default function ECCPage() {
  const { locale } = useProfile();
  const [, navigate] = useLocation();
  const { data: areas, isLoading } = trpc.ecc.areas.useQuery();
  const { data: myProgress } = trpc.ecc.myProgress.useQuery();
  const { data: allUnits } = trpc.ecc.units.useQuery({ areaId: 0 }, { enabled: false });

  const t = {
    title: locale === "ar" ? "المنهج الأساسي الموسّع" : "Expanded Core Curriculum (ECC)",
    subtitle: locale === "ar" ? "المهارات التسع الأساسية للمتعلمين ذوي الإعاقة البصرية" : "The nine foundational skill areas for blind and low-vision learners",
    noAreas: locale === "ar" ? "لا توجد مجالات ECC بعد." : "No ECC areas yet.",
  };

  // Progress is tracked per unit — we can't compute per-area without unit data here,
  // so show 0% until the user visits the area (area page computes it correctly).
  const progressPercent = (_areaId: number) => {
    if (!myProgress) return 0;
    // We don't have unit-to-area mapping here, so return overall mastered count ratio
    const mastered = myProgress.filter(p => p.status === "mastered").length;
    return myProgress.length > 0 ? Math.round((mastered / myProgress.length) * 100) : 0;
  };

  return (
    <div className="container py-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">{t.subtitle}</p>
      </div>

      {isLoading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading ECC areas, please wait">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : areas?.length === 0 ? (
        <p className="text-muted-foreground">{t.noAreas}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {areas?.map(area => {
            const Icon = ECC_ICONS[area.number] ?? BookOpen;
            const pct = progressPercent(area.id);
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => navigate(`/ecc/${area.id}`)}
                aria-label={locale === "ar" ? area.nameAr : area.nameEn}
                className="block w-full rounded-xl bg-transparent p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
              <Card className="hover:border-primary transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {locale === "ar" ? `المجال ${area.number}` : `Area ${area.number}`}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm leading-snug">
                        {locale === "ar" ? area.nameAr : area.nameEn}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(locale === "ar" ? area.descriptionAr : area.descriptionEn) && (
                    <p className="text-xs text-muted-foreground">
                      {locale === "ar" ? area.descriptionAr : area.descriptionEn}
                    </p>
                  )}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{locale === "ar" ? "التقدم" : "Progress"}</span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={(e) => { e.stopPropagation(); navigate(`/ecc/${area.id}`); }}
                    aria-label={locale === "ar" ? `عرض وحدات ${area.nameAr}` : `View units for ${area.nameEn}`}
                  >
                    {locale === "ar" ? "عرض الوحدات" : "View Units"}
                  </Button>
                </CardContent>
              </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
