import { useProfile } from "@/contexts/ProfileContext";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, BookOpen, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubjectPage() {
  const [, params] = useRoute("/subjects/:curriculumId");
  const [, navigate] = useLocation();
  const { locale } = useProfile();
  const curriculumId = parseInt(params?.curriculumId ?? "0");

  const { data: subjects, isLoading } = trpc.curriculum.subjects.useQuery(
    { curriculumId },
    { enabled: curriculumId > 0 }
  );

  if (isLoading) return (
    <div className="container py-8 space-y-4" aria-busy="true" aria-label="Loading subjects, please wait">
      {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
    </div>
  );

  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-2xl font-bold">{locale === "ar" ? "المواد الدراسية" : "Subjects"}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects?.map(subject => (
          <button
            key={subject.id}
            type="button"
            onClick={() => navigate(`/subjects/${curriculumId}/topics/${subject.id}`)}
            aria-label={locale === "ar" ? subject.titleAr : subject.titleEn}
            className="group block w-full rounded-xl bg-transparent p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Card className="hover:border-primary transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/15">
                    <BookOpen className="w-5 h-5 text-primary" style={{ strokeWidth: 2.5 }} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="text-base mt-2">
                  {locale === "ar" ? subject.titleAr : subject.titleEn}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subject.code && <Badge variant="secondary" className="text-xs">{subject.code}</Badge>}
              </CardContent>
            </Card>
          </button>
        ))}
        {subjects?.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-12">
            {locale === "ar" ? "لا توجد مواد بعد." : "No subjects yet."}
          </p>
        )}
      </div>
    </div>
  );
}
