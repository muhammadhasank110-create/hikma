import { useProfile } from "@/contexts/ProfileContext";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Volume2, VolumeX, ChevronRight, ChevronLeft, Bot, BookOpen,
  Brain, Headphones, AlignLeft, Maximize2, Minimize2, ParkingSquare
} from "lucide-react";

export default function LessonPage() {
  const [, params] = useRoute("/lesson/:lessonId");
  const [, navigate] = useLocation();
  const { profile, locale } = useProfile();
  const lessonId = parseInt(params?.lessonId ?? "0");

  const [sectionIndex, setSectionIndex] = useState(0);
  const [isNarrating, setIsNarrating] = useState(false);
  const [isFocused, setIsFocused] = useState(profile.mode === "focus");
  const [simplifiedView, setSimplifiedView] = useState(false);
  const [simplifiedContent, setSimplifiedContent] = useState<Record<number, string>>({});
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [parkedThoughts, setParkedThoughts] = useState<string[]>([]);
  const [parkInput, setParkInput] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: lesson, isLoading } = trpc.curriculum.lesson.useQuery(
    { lessonId },
    { enabled: lessonId > 0 }
  );

  const saveProgress = trpc.progress.updateProgress.useMutation();
  const ttsMutation = trpc.tts.synthesize.useMutation({
    onSuccess: (data) => {
      const audio = new Audio(`data:${data.mimeType};base64,${data.audioBase64}`);
      audioRef.current = audio;
      setIsNarrating(true);
      audio.onended = () => setIsNarrating(false);
      audio.play().catch(() => {
        setIsNarrating(false);
        // Browser TTS fallback
        if ("speechSynthesis" in window && lesson) {
          const sections = lesson.sections as any[];
          const text = sections[sectionIndex]?.body ?? "";
          const utt = new SpeechSynthesisUtterance(text);
          utt.lang = locale === "ar" ? "ar-QA" : "en-GB";
          utt.rate = profile.speechRate;
          utt.onend = () => setIsNarrating(false);
          window.speechSynthesis.speak(utt);
          setIsNarrating(true);
        }
      });
    },
  });

  const sections = (lesson?.sections as any[]) ?? [];
  const currentSection = sections[sectionIndex];
  const totalSections = sections.length;
  const progressPct = totalSections > 0 ? Math.round(((sectionIndex + 1) / totalSections) * 100) : 0;

  const readAloud = useCallback(() => {
    if (!currentSection) return;
    if (isNarrating) {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      setIsNarrating(false);
      return;
    }
    const text = currentSection.body ?? currentSection.title ?? "";
    ttsMutation.mutate({
      text: text.slice(0, 1500),
      voice: profile.voice as any,
      speed: profile.speechRate,
      locale: locale as "ar" | "en",
    });
  }, [currentSection, isNarrating, profile, locale]);

  const nextSection = useCallback(() => {
    if (sectionIndex < totalSections - 1) {
      setSectionIndex(i => i + 1);
      saveProgress.mutate({ lessonId, sectionId: sectionIndex + 1, cursorOffset: 0, status: "in_progress" });
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      saveProgress.mutate({ lessonId, sectionId: sectionIndex, cursorOffset: 0, status: "complete" });
      toast.success(locale === "ar" ? "أحسنت! أكملت الدرس." : "Well done! Lesson complete.");
    }
  }, [sectionIndex, totalSections, lessonId, locale]);

  const prevSection = useCallback(() => {
    if (sectionIndex > 0) setSectionIndex(i => i - 1);
  }, [sectionIndex]);

  const simplifySection = useCallback(async () => {
    if (!lesson) return;
    const sections = (lesson.sections as any[]) ?? [];
    const sec = sections[sectionIndex];
    if (!sec) return;
    const key = sectionIndex;
    if (simplifiedContent[key]) { setSimplifiedView(v => !v); return; }
    const originalText = locale === "ar" ? (sec.bodyAr ?? sec.body ?? "") : (sec.body ?? "");
    if (!originalText.trim()) return;
    setIsSimplifying(true);
    setSimplifiedView(true);
    try {
      const res = await fetch("/api/tutor/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: locale === "ar"
            ? `أعد كتابة النص التالي بلغة بسيطة جداً، جمل قصيرة، كلمات شائعة. النص:\n\n${originalText}`
            : `Rewrite the following text in very simple language: short sentences, common words, no jargon, reading level 1. Keep all key facts. Text:\n\n${originalText}`,
          sessionId: `simplify-${lessonId}-${sectionIndex}`,
          profile: { mode: profile.mode, chunkSize: "micro", readingLevel: 1, locale, curriculum: profile.curriculum, tier: profile.tier, tashkeel: profile.tashkeel, numerals: profile.numerals },
          conversationHistory: [],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let full = ""; let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === "data: [DONE]") break;
          if (trimmed.startsWith("data: ")) {
            try { const p = JSON.parse(trimmed.slice(6)); if (p.delta) { full += p.delta; setSimplifiedContent(prev => ({ ...prev, [key]: full })); } } catch { /* skip */ }
          }
        }
      }
    } catch (err: any) {
      toast.error(locale === "ar" ? "فشل التبسيط" : "Simplification failed");
      setSimplifiedView(false);
    } finally { setIsSimplifying(false); }
  }, [lesson, sectionIndex, locale, profile, lessonId, simplifiedContent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") nextSection();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prevSection();
      if (e.key === " ") { e.preventDefault(); readAloud(); }
      if (e.key === "r" || e.key === "R") readAloud();
      if (e.key === "f" || e.key === "F") setIsFocused(v => !v);
      if (e.key === "s" || e.key === "S") simplifySection();
      if (e.key === "Escape") setIsFocused(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [nextSection, prevSection, readAloud]);

  // Auto-narrate on section change if enabled
  useEffect(() => {
    if (profile.autoNarrate && currentSection && !isNarrating) {
      const timer = setTimeout(() => readAloud(), 600);
      return () => clearTimeout(timer);
    }
  }, [sectionIndex, profile.autoNarrate]);

  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  if (isLoading) return (
    <div className="container py-8 max-w-3xl space-y-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );

  if (!lesson) return (
    <div className="container py-8 text-center">
      <p className="text-muted-foreground">{t("Lesson not found.", "الدرس غير موجود.")}</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate(-1 as any)}>{t("Go back", "رجوع")}</Button>
    </div>
  );

  return (
    <div className={`min-h-screen ${isFocused ? "bg-black/95" : "bg-background"} transition-colors duration-300`}>
      {isFocused && <div className="focus-dim" aria-hidden="true" />}

      <div className="container py-6 max-w-3xl relative z-51">
        {/* Lesson header */}
        <div className={`space-y-2 mb-6 ${isFocused ? "opacity-30" : ""}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{"Lesson"}</Badge>
            <Badge variant="outline" className="text-xs">{lesson.estimatedMinutes ? `${lesson.estimatedMinutes} min` : ""}</Badge>
          </div>
          <h1 className={`text-xl font-bold ${isFocused ? "text-white" : "text-foreground"}`}>
            {locale === "ar" ? lesson.titleAr : lesson.titleEn}
          </h1>
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <Progress value={progressPct} className="h-1.5 flex-1" />
            <span className={`text-xs ${isFocused ? "text-white/60" : "text-muted-foreground"}`}>
              {sectionIndex + 1}/{totalSections}
            </span>
          </div>
        </div>

        {/* Mode toolbar */}
        <div className={`flex items-center gap-2 mb-4 flex-wrap ${isFocused ? "opacity-50" : ""}`}>
          <Button
            variant={isNarrating ? "default" : "outline"}
            size="sm"
            onClick={readAloud}
            aria-label={isNarrating ? t("Stop narration", "إيقاف السرد") : t("Read aloud", "قراءة بصوت عالٍ")}
            aria-pressed={isNarrating}
          >
            {isNarrating ? <VolumeX className="w-3.5 h-3.5 mr-1.5" /> : <Volume2 className="w-3.5 h-3.5 mr-1.5" />}
            {isNarrating ? t("Stop", "إيقاف") : t("Read Aloud", "استمع")}
          </Button>
          <Button
            variant={simplifiedView ? "default" : "outline"}
            size="sm"
            onClick={simplifySection}
            disabled={isSimplifying}
            aria-label={t("Simplify text", "تبسيط النص")}
            aria-pressed={simplifiedView}
          >
            <AlignLeft className="w-3.5 h-3.5 mr-1.5" />
            {isSimplifying ? "..." : t("Simplify", "تبسيط")}
          </Button>
          <Button
            variant={isFocused ? "default" : "outline"}
            size="sm"
            onClick={() => setIsFocused(v => !v)}
            aria-label={isFocused ? t("Exit focus mode", "الخروج من وضع التركيز") : t("Enter focus mode", "وضع التركيز")}
            aria-pressed={isFocused}
          >
            {isFocused ? <Minimize2 className="w-3.5 h-3.5 mr-1.5" /> : <Maximize2 className="w-3.5 h-3.5 mr-1.5" />}
            {t("Focus", "تركيز")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/tutor/${lessonId}`)}
            aria-label={t("Ask AI tutor", "اسأل المعلم الذكي")}
          >
            <Bot className="w-3.5 h-3.5 mr-1.5" />
            {t("Ask Tutor", "اسأل المعلم")}
          </Button>
        </div>

        {/* Section content */}
        <Card className={`focus-dim-active ${isFocused ? "border-white/20 bg-gray-900" : ""}`}>
          <CardContent className="p-6 md:p-8" ref={contentRef}>
            {currentSection ? (
              <div className="space-y-4">
                {currentSection.type === "heading" && (
                  <h2 className={`text-lg font-bold ${isFocused ? "text-white" : ""}`}>
                    {locale === "ar" ? currentSection.titleAr : currentSection.title}
                  </h2>
                )}
                <div className={`prose-hikma prose prose-sm max-w-none ${isFocused ? "prose-invert" : ""} ${simplifiedView ? "text-base leading-relaxed" : ""}`}>
                  <Streamdown>
                    {simplifiedView && simplifiedContent[sectionIndex]
                      ? simplifiedContent[sectionIndex]
                      : (locale === "ar"
                          ? (currentSection.bodyAr ?? currentSection.body ?? "")
                          : (currentSection.body ?? ""))}
                  </Streamdown>
                </div>
                {currentSection.keyTerms && currentSection.keyTerms.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className={`text-xs font-semibold mb-2 ${isFocused ? "text-white/60" : "text-muted-foreground"}`}>
                      {t("Key Terms", "المصطلحات الرئيسية")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentSection.keyTerms.map((term: string) => (
                        <Badge key={term} variant="secondary" className="text-xs">{term}</Badge>
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
        <div className={`mt-4 ${isFocused ? "opacity-50" : ""}`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={parkInput}
              onChange={e => setParkInput(e.target.value)}
              placeholder={t("Park a thought… (P)", "احفظ فكرة… (P)")}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
              onKeyDown={e => {
                if (e.key === "Enter" && parkInput.trim()) {
                  setParkedThoughts(prev => [...prev, parkInput.trim()]);
                  setParkInput("");
                  toast.success(t("Thought parked!", "تم حفظ الفكرة!"));
                }
              }}
              aria-label={t("Park a thought", "احفظ فكرة")}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (parkInput.trim()) {
                  setParkedThoughts(prev => [...prev, parkInput.trim()]);
                  setParkInput("");
                  toast.success(t("Thought parked!", "تم حفظ الفكرة!"));
                }
              }}
              aria-label={t("Park thought", "احفظ الفكرة")}
            >
              <ParkingSquare className="w-3.5 h-3.5" />
            </Button>
          </div>
          {parkedThoughts.length > 0 && (
            <div className="mt-2 space-y-1">
              {parkedThoughts.map((thought, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ParkingSquare className="w-3 h-3" />
                  <span>{thought}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevSection}
            disabled={sectionIndex === 0}
            aria-label={t("Previous section", "القسم السابق")}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t("Previous", "السابق")}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("Use ← → arrow keys to navigate", "استخدم مفاتيح الأسهم للتنقل")}
          </span>
          <Button
            onClick={nextSection}
            aria-label={sectionIndex < totalSections - 1 ? t("Next section", "القسم التالي") : t("Complete lesson", "إكمال الدرس")}
          >
            {sectionIndex < totalSections - 1 ? t("Next", "التالي") : t("Complete", "إكمال")}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
