import { useState } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, CheckCircle, Circle, ChevronDown, ChevronRight } from "lucide-react";

export default function CurriculumPage() {
  const { locale } = useProfile();
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  const { data: curricula, isLoading } = trpc.curriculum.list.useQuery();

  const [selectedCurriculum, setSelectedCurriculum] = useState<number | null>(null);
  const { data: subjects, isLoading: subjectsLoading } = trpc.curriculum.subjects.useQuery(
    { curriculumId: selectedCurriculum! },
    { enabled: !!selectedCurriculum }
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">{t("Curriculum Coverage", "تغطية المنهج")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("Track your progress across all specification points.", "تتبع تقدمك عبر جميع نقاط المواصفات.")}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {curricula?.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCurriculum(c.id)}
              aria-pressed={selectedCurriculum === c.id}
              className="block w-full rounded-xl bg-transparent p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Card className={`transition-colors ${selectedCurriculum === c.id ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{locale === "ar" ? c.titleAr : c.titleEn}</p>
                      <p className="text-xs text-muted-foreground">{c.board}</p>
                    </div>
                  </div>
                  {selectedCurriculum === c.id && <CheckCircle className="w-5 h-5 text-primary" />}
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {selectedCurriculum && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t("Subjects", "المواد")}</h2>
          {subjectsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : subjects && subjects.length > 0 ? (
            <div className="space-y-3">
              {subjects.map(subject => (
                <Card key={subject.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
                    aria-expanded={expandedSubject === subject.id}
                    aria-controls={`subject-topics-${subject.id}`}
                    className="block w-full rounded-xl bg-transparent p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-base">{locale === "ar" ? subject.titleAr : subject.titleEn}</CardTitle>
                          <Badge variant="outline" className="text-xs">{subject.code}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:block w-32">
                            <SubjectCoverage subjectId={subject.id} />
                          </div>
                          {expandedSubject === subject.id
                            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          }
                        </div>
                      </div>
                      <Progress value={0} className="h-1.5 mt-2" />
                    </CardHeader>
                  </button>
                  {expandedSubject === subject.id && (
                    <CardContent id={`subject-topics-${subject.id}`} className="pt-0">
                      <SubjectTopics subjectId={subject.id} locale={locale} t={t} />
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Circle className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p>{t("No subjects found for this curriculum.", "لا توجد مواد لهذا المنهج.")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function SubjectCoverage({ subjectId }: { subjectId: number }) {
  const { data } = trpc.progress.subjectCoverage.useQuery({ subjectId });
  const pct = data?.coveragePct ?? 0;
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
        <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono w-8 text-right">{pct}%</span>
    </div>
  );
}

function SubjectTopics({ subjectId, locale, t }: { subjectId: number; locale: string; t: (en: string, ar: string) => string }) {
  const { data: topics, isLoading } = trpc.curriculum.topics.useQuery({ subjectId });

  if (isLoading) return <div className="space-y-2 py-2">{[1,2].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>;
  if (!topics || topics.length === 0) return <p className="text-sm text-muted-foreground py-2">{t("No topics yet.", "لا توجد موضوعات بعد.")}</p>;

  return (
    <div className="space-y-2 pt-2">
      {topics.map(topic => (
        <div key={topic.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
          <div className="flex items-center gap-2">
            <Circle className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm">{locale === "ar" ? topic.titleAr : topic.titleEn}</span>
          </div>
          <Badge variant="secondary" className="text-xs">{t("Topic", "موضوع")}</Badge>
        </div>
      ))}
    </div>
  );
}
