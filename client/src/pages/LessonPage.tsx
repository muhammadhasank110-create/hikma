/**
 * LessonPage — slim orchestrator.
 * All state logic lives in useLessonState (client/src/hooks/useLessonState.ts).
 * Sub-components: ConceptMapSVG, WordDefinitionPopup, BodyDoublePanel (below).
 */
import { useProfile } from "@/contexts/ProfileContext";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Volume2, VolumeX, ChevronRight, ChevronLeft, Bot,
  AlignLeft, Maximize2, Minimize2, ParkingSquare, Timer, Map, X,
  AlertTriangle, UserCheck, BookOpen, HelpCircle, Send
} from "lucide-react";
import { useLessonState } from "@/hooks/useLessonState";
import ConceptMapSVG from "@/components/lesson/ConceptMapSVG";
import WordDefinitionPopup from "@/components/lesson/WordDefinitionPopup";
import BodyDoublePanel from "@/components/lesson/BodyDoublePanel";

export default function LessonPage() {
  const [, params] = useRoute("/lesson/:lessonId");
  const [, navigate] = useLocation();
  const { locale } = useProfile();
  const lessonId = parseInt(params?.lessonId ?? "0");
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  const s = useLessonState(lessonId);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") s.nextSection();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") s.prevSection();
      if (e.key === "Enter") {
        if (s.showTopicQuestion && s.topicAnswer.trim()) { s.advanceSection(); return; }
        if (!s.showTopicQuestion) { s.nextSection(); return; }
      }
      if (e.key === " ") { e.preventDefault(); s.readAloud(); }
      if (e.key === "r" || e.key === "R") s.readAloud();
      if (e.key === "f" || e.key === "F") { s.setIsFocused(v => { if (!v) s.sounds.focus?.(); return !v; }); }
      if (e.key === "s" || e.key === "S") s.simplifySection();
      if (e.key === "m" || e.key === "M") s.setShowConceptMap(v => !v);
      if (e.key === "t" || e.key === "T") s.setPomodoroActive(v => !v);
      if (e.key === "b" || e.key === "B") s.setShowBodyDouble(v => !v);
      if (e.key === "p" && e.ctrlKey) { e.preventDefault(); s.announcePosition(); }
      if (e.key === "Escape") { s.setIsFocused(false); s.setShowOverwhelmEscape(false); s.setSelectedWord(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [s.nextSection, s.prevSection, s.readAloud, s.simplifySection, s.announcePosition]);

  // Voice command events
  useEffect(() => {
    const onRead = () => s.readAloud();
    const onNext = () => s.nextSection();
    const onPrev = () => s.prevSection();
    window.addEventListener("hikma:read_aloud", onRead);
    window.addEventListener("hikma:next_section", onNext);
    window.addEventListener("hikma:prev_section", onPrev);
    return () => {
      window.removeEventListener("hikma:read_aloud", onRead);
      window.removeEventListener("hikma:next_section", onNext);
      window.removeEventListener("hikma:prev_section", onPrev);
    };
  }, [s.readAloud, s.nextSection, s.prevSection]);

  if (!lessonId) return <div className="container py-16 text-center text-muted-foreground">{t("Invalid lesson.", "درس غير صالح.")}</div>;

  if (s.isLoading) return (
    <div className="container py-8 max-w-3xl space-y-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (!s.lesson) return (
    <div className="container py-16 text-center space-y-4">
      <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
      <p className="text-muted-foreground">{t("Lesson not found.", "الدرس غير موجود.")}</p>
      <Button onClick={() => navigate(-1 as any)}>{t("Go back", "العودة")}</Button>
    </div>
  );

  if (s.showOverwhelmEscape) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-primary" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-2xl font-bold font-display">{t("Take a breath.", "خذ نفساً.")}</h2>
        <p className="text-muted-foreground">{t("You've saved your progress. Come back when you're ready.", "لقد حُفظ تقدمك. عد عندما تكون مستعداً.")}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => s.setShowOverwhelmEscape(false)}>{t("Continue lesson", "متابعة الدرس")}</Button>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>{t("Go to dashboard", "الصفحة الرئيسية")}</Button>
        <Button variant="outline" onClick={() => navigate("/tutor")}><Bot className="w-4 h-4 mr-2" />{t("Talk to tutor", "تحدث مع المعلم")}</Button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${s.isFocused ? "bg-black/95" : "bg-background"} transition-colors duration-300`}>
      {s.selectedWord && <WordDefinitionPopup word={s.selectedWord} locale={locale} onClose={() => s.setSelectedWord(null)} />}
      {s.showBodyDouble && <BodyDoublePanel locale={locale} lessonTitle={s.lessonTitle} />}

      <div className="container py-6 max-w-3xl relative">
        {/* Header */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">Lesson</Badge>
            {s.lesson.estimatedMinutes && <Badge variant="outline" className="text-xs">{s.lesson.estimatedMinutes} min</Badge>}
          </div>
          <h1 className={`text-xl font-bold ${s.isFocused ? "text-white" : "text-foreground"}`}>{s.lessonTitle}</h1>
          <div className="flex items-center gap-3">
            <Progress value={s.progressPct} className="h-1.5 flex-1" />
            <span className={`text-xs tabular-nums ${s.isFocused ? "text-white/60" : "text-muted-foreground"}`}>{s.sectionIndex + 1}/{s.totalSections}</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {s.isFocused && (
            <div className="flex items-center gap-1.5">
              <Button variant={s.pomodoroActive ? "default" : "outline"} size="sm" onClick={() => s.setPomodoroActive(v => !v)} aria-label={s.pomodoroActive ? t("Pause Pomodoro", "إيقاف مؤقت") : t("Start Pomodoro", "ابدأ البومودورو")} className="gap-1.5">
                <Timer className="w-3.5 h-3.5" />
                <span className="tabular-nums font-mono text-xs">{s.pomodoroDisplay}</span>
              </Button>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${s.pomodoroPhase === "work" ? "bg-primary/10 text-primary" : "bg-green-100 text-green-700"}`}>
                {s.pomodoroPhase === "work" ? t("Focus", "تركيز") : t("Break", "استراحة")}
              </span>
            </div>
          )}
          <Button variant={s.isNarrating ? "default" : "outline"} size="sm" onClick={s.readAloud} aria-label={s.isNarrating ? t("Stop narration", "إيقاف السرد") : t("Read aloud", "قراءة بصوت")} aria-pressed={s.isNarrating}>
            {s.isNarrating ? <VolumeX className="w-3.5 h-3.5 mr-1.5" /> : <Volume2 className="w-3.5 h-3.5 mr-1.5" />}
            {s.isNarrating ? t("Stop", "إيقاف") : t("Read Aloud", "استمع")}
          </Button>
          <Button variant={s.simplifiedView ? "default" : "outline"} size="sm" onClick={s.simplifySection} disabled={s.isSimplifying} aria-label={t("Simplify text", "تبسيط النص")} aria-pressed={s.simplifiedView}>
            <AlignLeft className="w-3.5 h-3.5 mr-1.5" />
            {s.isSimplifying ? "..." : t("Simplify", "تبسيط")}
          </Button>
          <Button variant={s.isFocused ? "default" : "outline"} size="sm" onClick={() => s.setIsFocused(v => !v)} aria-label={t("Toggle focus mode", "وضع التركيز")} aria-pressed={s.isFocused}>
            {s.isFocused ? <Minimize2 className="w-3.5 h-3.5 mr-1.5" /> : <Maximize2 className="w-3.5 h-3.5 mr-1.5" />}
            {t("Focus", "تركيز")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => s.setShowConceptMap(v => !v)} aria-label={t("Concept map", "خريطة المفاهيم")} aria-pressed={s.showConceptMap}>
            <Map className="w-3.5 h-3.5 mr-1.5" />{t("Map", "خريطة")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => s.setShowBodyDouble(v => !v)} aria-label={t("Body double companion", "رفيق")} aria-pressed={s.showBodyDouble}>
            <UserCheck className="w-3.5 h-3.5 mr-1.5" />{t("Companion", "رفيق")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/tutor")} aria-label={t("Ask Hikma AI", "اسأل حكمة AI")}>
            <Bot className="w-3.5 h-3.5 mr-1.5" />{t("Ask AI", "اسأل AI")}
          </Button>
        </div>

        {/* Concept map */}
        {s.showConceptMap && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">{t("Concept Map", "خريطة المفاهيم")}</p>
                <Button variant="ghost" size="icon" onClick={() => s.setShowConceptMap(false)} aria-label={t("Close map", "إغلاق الخريطة")}><X className="w-4 h-4" /></Button>
              </div>
              <ConceptMapSVG lessonTitle={s.lessonTitle} sections={s.sections} locale={locale} />
            </CardContent>
          </Card>
        )}

        {/* Section content */}
        <Card className={s.isFocused ? "border-white/10 bg-[#0a1a0a] shadow-2xl ring-1 ring-white/10" : ""} ref={s.contentRef as any}>
          <CardContent className="p-6">
            {s.currentSection ? (
              <div className="space-y-4">
                <h2 className={`text-lg font-bold font-display ${s.isFocused ? "text-white" : ""}`}>
                  {locale === "ar" ? (s.currentSection.titleAr ?? s.currentSection.titleEn ?? "") : (s.currentSection.titleEn ?? "")}
                </h2>
                <div className={`prose max-w-none ${s.isFocused ? "prose-invert text-base leading-[1.9] tracking-wide" : "prose-sm"} ${s.simplifiedView ? "text-base leading-relaxed" : ""}`} onClick={s.handleWordClick}>
                  {s.highlightedWords.length > 0 && s.highlightIndex >= 0 ? (
                    <p className="leading-relaxed">
                      {s.highlightedWords.map((word, i) => (
                        <span key={i} data-word={word} className={`cursor-pointer transition-colors duration-100 hover:underline hover:text-primary ${i === s.highlightIndex ? (s.isFocused ? "bg-yellow-400/60 text-black rounded px-0.5 font-bold" : "bg-primary/30 rounded px-0.5 font-semibold") : ""}`}>
                          {word}{" "}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <div>
                      <Streamdown>
                        {s.simplifiedView && s.simplifiedContent[s.sectionIndex]
                          ? s.simplifiedContent[s.sectionIndex]
                          : (locale === "ar" ? (s.currentSection.bodyAr ?? s.currentSection.bodyEn ?? "") : (s.currentSection.bodyEn ?? ""))}
                      </Streamdown>
                      <p className="text-xs text-muted-foreground mt-3 italic">{t("Tip: click any word for its definition.", "نصيحة: انقر على أي كلمة لتعريفها.")}</p>
                    </div>
                  )}
                </div>
                {s.currentSection.keyTerms?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className={`text-xs font-semibold mb-2 ${s.isFocused ? "text-white/60" : "text-muted-foreground"}`}>{t("Key Terms", "المصطلحات الرئيسية")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {s.currentSection.keyTerms.map((term: string) => (
                        <Badge key={term} variant="secondary" className="text-xs cursor-pointer hover:bg-primary/20" onClick={() => s.setSelectedWord(term)}>{term}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t("No content available.", "لا يوجد محتوى.")}</p>
            )}
          </CardContent>
        </Card>

        {/* Park a thought */}
        <div className="mt-4">
          <div className="flex gap-2">
            <input type="text" value={s.parkInput} onChange={e => s.setParkInput(e.target.value)}
              placeholder={t("Park a thought… (P key)", "احفظ فكرة…")}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
              onKeyDown={e => { if (e.key === "Enter" && s.parkInput.trim()) { s.setParkedThoughts(prev => [...prev, s.parkInput.trim()]); s.setParkInput(""); toast.success(t("Thought parked!", "تم حفظ الفكرة!")); }}}
              aria-label={t("Park a thought", "احفظ فكرة")} />
            <Button size="sm" variant="outline" onClick={() => { if (s.parkInput.trim()) { s.setParkedThoughts(prev => [...prev, s.parkInput.trim()]); s.setParkInput(""); toast.success(t("Thought parked!", "تم حفظ الفكرة!")); }}} aria-label={t("Save thought", "حفظ الفكرة")}>
              <ParkingSquare className="w-3.5 h-3.5" />
            </Button>
          </div>
          {s.parkedThoughts.length > 0 && (
            <div className="mt-2 space-y-1">
              {s.parkedThoughts.map((thought, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ParkingSquare className="w-3 h-3" /><span>{thought}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Topic question */}
        {s.showTopicQuestion && s.topicQuestion && (
          <div className="mt-6 p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 space-y-3 animate-arrive">
            <div className="flex items-center gap-2 text-primary text-sm font-semibold">
              <HelpCircle className="w-4 h-4 flex-shrink-0" />
              <span>{t("Hikma AI asks:", "حكمة AI يسأل:")}</span>
            </div>
            <p className="text-sm leading-relaxed font-medium">{s.topicQuestion}</p>
            <div className="flex gap-2">
              <input type="text" value={s.topicAnswer} onChange={e => s.setTopicAnswer(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && s.topicAnswer.trim()) s.advanceSection(); }}
                placeholder={t("Type your answer or thinking…", "اكتب إجابتك أو تفكيرك…")}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={t("Your answer", "إجابتك")} />
              <Button size="sm" onClick={s.advanceSection} className="rounded-xl" aria-label={t("Submit and continue", "أرسل وتابع")}>
                <Send className="w-3.5 h-3.5 mr-1" />{t("Continue", "تابع")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("Share your thinking — there's no wrong answer here.", "شارك تفكيرك — لا توجد إجابة خاطئة هنا.")}</p>
          </div>
        )}
        {s.generateQuestion.isPending && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <HelpCircle className="w-4 h-4 animate-pulse text-primary" />
            <span>{t("Hikma AI is preparing a question…", "حكمة AI يجهّز سؤالاً…")}</span>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" onClick={s.prevSection} disabled={s.sectionIndex === 0} aria-label={t("Previous section", "القسم السابق")}>
            <ChevronLeft className="w-4 h-4 mr-1" />{t("Previous", "السابق")}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">{t("Enter / ← → to navigate", "Enter / الأسهم للتنقل")}</span>
            <Button variant="ghost" size="sm" onClick={() => { s.saveProgress.mutate({ lessonId, sectionId: s.sectionIndex, cursorOffset: 0, status: "in_progress" }); s.setShowOverwhelmEscape(true); }} aria-label={t("I need a break", "أحتاج استراحة")} className="text-muted-foreground hover:text-destructive">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />{t("Break", "استراحة")}
            </Button>
          </div>
          <Button onClick={s.nextSection} aria-label={s.sectionIndex < s.totalSections - 1 ? t("Next section", "القسم التالي") : t("Complete lesson", "إكمال الدرس")}>
            {s.sectionIndex < s.totalSections - 1 ? t("Next", "التالي") : t("Complete", "إكمال")}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Keyboard hints */}
        <div className="mt-4 text-xs text-muted-foreground text-center space-x-3">
          <span>Space/{t("R", "R")}: {t("read aloud", "استمع")}</span>
          <span>S: {t("simplify", "تبسيط")}</span>
          <span>F: {t("focus", "تركيز")}</span>
          <span>M: {t("map", "خريطة")}</span>
          <span>T: {t("timer", "مؤقت")}</span>
          <span>B: {t("companion", "رفيق")}</span>
          <span>Ctrl+P: {t("position", "الموضع")}</span>
        </div>
      </div>
    </div>
  );
}
