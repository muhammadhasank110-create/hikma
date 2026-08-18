import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { useProfile } from "@/contexts/ProfileContext";

export default function ECCAreaPage() {
  const { areaId } = useParams<{ areaId: string }>();
  const [, navigate] = useLocation();
  const { locale } = useProfile();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  // ── All tRPC hooks ─────────────────────────────────────────────────────────
  const { data: areas } = trpc.ecc.areas.useQuery();
  const { data: units, isLoading } = trpc.ecc.units.useQuery({ areaId: Number(areaId) });
  const { data: myProgress } = trpc.ecc.myProgress.useQuery();
  const updateProgress = trpc.ecc.updateProgress.useMutation();

  // ── All useState hooks ─────────────────────────────────────────────────────
  const [currentUnit, setCurrentUnit] = useState(0);
  const unitTabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // ── All useCallback hooks ──────────────────────────────────────────────────
  // Keyboard: Left/Right arrows navigate between units
  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, i: number) => {
    let nextUnit = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextUnit = Math.min((units?.length ?? 1) - 1, i + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextUnit = Math.max(0, i - 1);
    } else {
      return;
    }
    setCurrentUnit(nextUnit);
    requestAnimationFrame(() => unitTabRefs.current[nextUnit]?.focus());
  }, [units?.length]);

  // ── Early returns AFTER all hooks ─────────────────────────────────────────
  const area = areas?.find(a => a.id === Number(areaId));

  if (isLoading) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center text-muted-foreground">
      {t("Loading units…", "جارٍ التحميل…")}
    </div>
  );

  if (!area) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <p className="text-muted-foreground">{t("Area not found.", "المجال غير موجود.")}</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate("/ecc")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> {t("Back to ECC", "العودة")}
      </Button>
    </div>
  );

  // ── Derived state ──────────────────────────────────────────────────────────
  const unit = units?.[currentUnit];
  const areaProgress = myProgress ?? [];
  const areaUnitIds = new Set((units ?? []).map(u => u.id));
  const completedUnits = areaProgress.filter(p => p.status === 'mastered' && areaUnitIds.has(p.unitId)).length;
  const totalUnits = units?.length ?? 0;
  const coveragePct = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

  const markComplete = () => {
    if (!unit) return;
    updateProgress.mutate({ unitId: unit.id, status: 'mastered' });
    if (currentUnit < (units?.length ?? 0) - 1) {
      setCurrentUnit(i => i + 1);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/ecc")} aria-label={t("Back to ECC areas", "العودة إلى مجالات ECC")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("Back", "رجوع")}
      </Button>

      {/* Area header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold font-display">
          {locale === "ar" ? area.nameAr : area.nameEn}
        </h1>
        <p className="text-muted-foreground text-sm">
          {locale === "ar" ? area.descriptionAr : area.descriptionEn}
        </p>
        {totalUnits > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t(`${completedUnits} of ${totalUnits} units complete`, `${completedUnits} من ${totalUnits} وحدة مكتملة`)}</span>
              <span>{coveragePct}%</span>
            </div>
            <Progress value={coveragePct} className="h-1.5" aria-label={t("Area progress", "تقدم المجال")} />
          </div>
        )}
      </div>

      {/* Units */}
      {!units || units.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p>{t("No units available yet for this area.", "لا توجد وحدات متاحة لهذا المجال بعد.")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Unit navigation pills */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("Units", "الوحدات")}>
            {units.map((u, i) => {
              const done = areaProgress.some(p => p.unitId === u.id && p.status === 'mastered');
              return (
                <button
                  key={u.id}
                  ref={(element) => { unitTabRefs.current[i] = element; }}
                  role="tab"
                  aria-selected={i === currentUnit}
                  tabIndex={i === currentUnit ? 0 : -1}
                  aria-label={`${locale === "ar" ? u.titleAr : u.titleEn}${done ? (locale === "ar" ? " — مكتمل" : " — completed") : ""}`}
                  onClick={() => setCurrentUnit(i)}
                  onKeyDown={(e) => handleTabKeyDown(e, i)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5
                    ${i === currentUnit
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                  {done && <CheckCircle className="w-3 h-3" />}
                  {locale === "ar" ? u.titleAr : u.titleEn}
                </button>
              );
            })}
          </div>

          {/* Current unit card */}
          {unit && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg font-display">
                    {locale === "ar" ? unit.titleAr : unit.titleEn}
                  </CardTitle>
                  {areaProgress.some(p => p.unitId === unit.id && p.status === 'mastered') && (
                    <Badge variant="default" className="flex-shrink-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {t("Done", "مكتمل")}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* In-person practice note */}
                {unit.requiresInPersonPractice && (
                  <div className="flex gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{locale === "ar" ? unit.inPersonNoteAr : unit.inPersonNoteEn}</p>
                  </div>
                )}
                {/* If unit has a linked lesson, navigate to it */}
                {unit.lessonId ? (
                  <Button className="w-full" onClick={() => navigate(`/lesson/${unit.lessonId}`)}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t("Open Lesson", "افتح الدرس")}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {t("This unit is practised in person with a Teacher of the Visually Impaired (TVI).",
                       "تُمارَس هذه الوحدة حضورياً مع معلم ذوي الإعاقة البصرية.")}
                  </p>
                )}
                {/* Mark complete button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={markComplete}
                  disabled={updateProgress.isPending || areaProgress.some(p => p.unitId === unit.id && p.status === 'mastered')}
                  aria-label={t("Mark unit as complete", "وضع علامة مكتمل على الوحدة")}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t("Mark as complete", "وضع علامة مكتمل")}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t("Press Enter to advance · ← → to navigate units", "اضغط Enter للتقدم · ← → للتنقل بين الوحدات")}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Prev / Next navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentUnit(i => Math.max(0, i - 1))}
              disabled={currentUnit === 0}
              aria-label={t("Previous unit", "الوحدة السابقة")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Previous", "السابق")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentUnit(i => Math.min((units?.length ?? 1) - 1, i + 1))}
              disabled={currentUnit === (units?.length ?? 1) - 1}
              aria-label={t("Next unit", "الوحدة التالية")}
            >
              {t("Next", "التالي")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
