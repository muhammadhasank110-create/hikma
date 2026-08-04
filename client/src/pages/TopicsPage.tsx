import { useProfile } from "@/contexts/ProfileContext";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation, Link } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, ChevronDown, BookOpen, Clock, Play, CheckCircle2, Circle } from "lucide-react";

export default function TopicsPage() {
  const [, params] = useRoute("/subjects/:curriculumId/topics/:subjectId");
  const [, navigate] = useLocation();
  const { locale } = useProfile();
  const subjectId = parseInt(params?.subjectId ?? "0");
  const curriculumId = parseInt(params?.curriculumId ?? "0");
  const [openTopics, setOpenTopics] = useState<Set<number>>(new Set([1]));

  const { data: topics, isLoading: loadingTopics } = trpc.curriculum.topics.useQuery(
    { subjectId },
    { enabled: subjectId > 0 }
  );

  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  const toggleTopic = (id: number) => {
    setOpenTopics(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loadingTopics) return (
    <div className="container py-8 max-w-3xl space-y-4">
      {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
    </div>
  );

  return (
    <div className="container py-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/subjects/${curriculumId}`} className="hover:text-foreground transition-colors">
          {t("Subjects", "المواد")}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{t("Topics", "الموضوعات")}</span>
      </div>

      <h1 className="text-2xl font-bold">{t("Topics", "الموضوعات")}</h1>

      {topics?.length === 0 && (
        <p className="text-muted-foreground">{t("No topics available yet.", "لا توجد موضوعات بعد.")}</p>
      )}

      <div className="space-y-3">
        {topics?.map((topic, topicIdx) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            topicIdx={topicIdx}
            isOpen={openTopics.has(topic.id)}
            onToggle={() => toggleTopic(topic.id)}
            locale={locale}
            onNavigate={(lessonId) => navigate(`/lesson/${lessonId}`)}
          />
        ))}
      </div>
    </div>
  );
}

function TopicCard({ topic, topicIdx, isOpen, onToggle, locale, onNavigate }: {
  topic: any;
  topicIdx: number;
  isOpen: boolean;
  onToggle: () => void;
  locale: string;
  onNavigate: (lessonId: number) => void;
}) {
  const { data: lessons, isLoading } = trpc.curriculum.lessonsByTopic.useQuery(
    { topicId: topic.id },
    { enabled: isOpen }
  );

  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:border-primary transition-all group" tabIndex={0}>
          <CardHeader className="py-4 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {topicIdx + 1}
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {locale === "ar" ? topic.titleAr : topic.titleEn}
                  </CardTitle>
                  {(locale === "ar" ? topic.descriptionAr : topic.descriptionEn) && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {locale === "ar" ? topic.descriptionAr : topic.descriptionEn}
                    </p>
                  )}
                </div>
              </div>
              {isOpen
                ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                : <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              }
            </div>
          </CardHeader>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-primary/20 pl-4">
          {isLoading && (
            <div className="space-y-2 py-2">
              {[1,2].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          )}
          {lessons?.map((lesson: any, lessonIdx: number) => (
            <button
              key={lesson.id}
              onClick={() => onNavigate(lesson.id)}
              className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group/lesson"
              aria-label={`${t("Open lesson", "افتح الدرس")}: ${locale === "ar" ? lesson.titleAr : lesson.titleEn}`}
            >
              <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {locale === "ar" ? lesson.titleAr : lesson.titleEn}
                </p>
                {lesson.estimatedMinutes && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {lesson.estimatedMinutes} {t("min", "دقيقة")}
                  </p>
                )}
              </div>
              <Play className="w-3.5 h-3.5 text-muted-foreground group-hover/lesson:text-primary transition-colors flex-shrink-0" />
            </button>
          ))}
          {lessons?.length === 0 && !isLoading && (
            <p className="text-xs text-muted-foreground py-2">{t("No lessons yet.", "لا توجد دروس بعد.")}</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
