import { useProfile } from "@/contexts/ProfileContext";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Volume2, VolumeX, ChevronRight, ChevronLeft, Bot,
  AlignLeft, Maximize2, Minimize2, ParkingSquare, Timer, Map, X
} from "lucide-react";

// ── Concept Map SVG ──────────────────────────────────────────────────────────
function ConceptMapSVG({ lessonTitle, sections, locale }: {
  lessonTitle: string;
  sections: any[];
  locale: string;
}) {
  const W = 560; const H = 280;
  const cx = W / 2; const cy = 60;
  const r = 110;
  const nodes = sections.slice(0, 6).map((s, i) => {
    const angle = (Math.PI / (sections.length + 1)) * (i + 1);
    return {
      x: cx + r * Math.cos(angle - Math.PI / 2),
      y: cy + r * Math.sin(angle - Math.PI / 2) + 60,
      label: locale === "ar" ? (s.titleAr ?? s.titleEn ?? "") : (s.titleEn ?? ""),
    };
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label={`Concept map for ${lessonTitle}`} role="img">
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="var(--color-primary)" />
        </marker>
      </defs>
      {/* Central node */}
      <ellipse cx={cx} cy={cy} rx={90} ry={24} fill="var(--color-primary)" />
      <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
        {lessonTitle.slice(0, 28)}
      </text>
      {/* Branch nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <line x1={cx} y1={cy + 24} x2={n.x} y2={n.y - 18}
            stroke="var(--color-primary)" strokeWidth="1.5" strokeDasharray="4 2"
            markerEnd="url(#arrow)" />
          <rect x={n.x - 70} y={n.y - 18} width={140} height={36}
            rx={8} fill="var(--color-muted)" stroke="var(--color-border)" strokeWidth="1" />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="10" fill="var(--color-foreground)">
            {n.label.slice(0, 22)}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
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
  const [showConceptMap, setShowConceptMap] = useState(false);

  // Pomodoro
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroPhase, setPomodoroPhase] = useState<"work" | "break">("work");
  const pomodoroRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Word-by-word highlighting
  const [highlightedWords, setHighlightedWords] = useState<string[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const highlightTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: lesson, isLoading } = trpc.curriculum.lesson.useQuery(
    { lessonId },
    { enabled: lessonId > 0 }
  );

  const saveProgress = trpc.progress.updateProgress.useMutation();

  const stopWordHighlight = useCallback(() => {
    if (highlightTimerRef.current) clearInterval(highlightTimerRef.current);
    setHighlightIndex(-1);
    setHighlightedWords([]);
  }, []);

  const startWordHighlight = useCallback((text: string) => {
    if (highlightTimerRef.current) clearInterval(highlightTimerRef.current);
    const words = text.replace(/[#*`_~[\]()]/g, "").split(/\s+/).filter(Boolean);
    setHighlightedWords(words);
    setHighlightIndex(0);
    let idx = 0;
    const avgWordMs = Math.max(180, Math.round(60000 / (profile.speechRate * 130)));
    highlightTimerRef.current = setInterval(() => {
      idx++;
      if (idx >= words.length) {
        clearInterval(highlightTimerRef.current!);
        setHighlightIndex(-1);
        setHighlightedWords([]);
      } else {
        setHighlightIndex(idx);
      }
    }, avgWordMs);
  }, [profile.speechRate]);

  useEffect(() => {
    return () => { if (highlightTimerRef.current) clearInterval(highlightTimerRef.current); };
  }, []);

  const ttsMutation = trpc.tts.synthesize.useMutation({
    onSuccess: (data) => {
      const audio = new Audio(`data:${data.mimeType};base64,${data.audioBase64}`);
      audioRef.current = audio;
      setIsNarrating(true);
      audio.onended = () => { setIsNarrating(false); stopWordHighlight(); };
      audio.play().catch(() => {
        setIsNarrating(false);
        stopWordHighlight();
        if ("speechSynthesis" in window && lesson) {
          const secs = lesson.sections as any[];
          const text = locale === "ar"
            ? (secs[sectionIndex]?.bodyAr ?? secs[sectionIndex]?.bodyEn ?? "")
            : (secs[sectionIndex]?.bodyEn ?? "");
          const utt = new SpeechSynthesisUtterance(text);
          utt.lang = locale === "ar" ? "ar-QA" : "en-GB";
          utt.rate = profile.speechRate;
          utt.onend = () => { setIsNarrating(false); stopWordHighlight(); };
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
      stopWordHighlight();
      return;
    }
    const text = locale === "ar"
      ? (currentSection.bodyAr ?? currentSection.bodyEn ?? currentSection.titleAr ?? "")
      : (currentSection.bodyEn ?? currentSection.titleEn ?? "");
    startWordHighlight(text);
    ttsMutation.mutate({
      text: text.slice(0, 1500),
      voice: profile.voice as any,
      speed: profile.speechRate,
      locale: locale as "ar" | "en",
    });
  }, [currentSection, isNarrating, profile, locale, startWordHighlight, stopWordHighlight]);

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
    const secs = (lesson.sections as any[]) ?? [];
    const sec = secs[sectionIndex];
    if (!sec) return;
    const key = sectionIndex;
    if (simplifiedContent[key]) { setSimplifiedView(v => !v); return; }
    const originalText = locale === "ar" ? (sec.bodyAr ?? sec.bodyEn ?? "") : (sec.bodyEn ?? "");
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
    } catch {
      toast.error(locale === "ar" ? "فشل التبسيط" : "Simplification failed");
      setSimplifiedView(false);
    } finally { setIsSimplifying(false); }
  }, [lesson, sectionIndex, locale, profile, lessonId, simplifiedContent]);

  // Pomodoro timer
  useEffect(() => {
    if (pomodoroActive) {
      pomodoroRef.current = setInterval(() => {
        setPomodoroSeconds(s => {
          if (s <= 1) {
            const nextPhase = pomodoroPhase === "work" ? "break" : "work";
            setPomodoroPhase(nextPhase);
            toast.success(pomodoroPhase === "work"
              ? (locale === "ar" ? "وقت الاستراحة! 5 دقائق." : "Break time! 5 minutes.")
              : (locale === "ar" ? "عودة للعمل! 25 دقيقة." : "Back to work! 25 minutes."));
            return pomodoroPhase === "work" ? 5 * 60 : 25 * 60;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (pomodoroRef.current) clearInterval(pomodoroRef.current);
    }
    return () => { if (pomodoroRef.current) clearInterval(pomodoroRef.current); };
  }, [pomodoroActive, pomodoroPhase, locale]);

  const pomodoroDisplay = `${String(Math.floor(pomodoroSeconds / 60)).padStart(2, "0")}:${String(pomodoroSeconds % 60).padStart(2, "0")}`;

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
      if (e.key === "m" || e.key === "M") setShowConceptMap(v => !v);
      if (e.key === "t" || e.key === "T") setPomodoroActive(v => !v);
      if (e.key === "Escape") setIsFocused(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [nextSection, prevSection, readAloud, simplifySection]);

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

      <div className="container py-6 max-w-3xl relative z-[51]">
        {/* Lesson header */}
        <div className={`space-y-2 mb-6 ${isFocused ? "opacity-30" : ""}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">Lesson</Badge>
            <Badge variant="outline" className="text-xs">{lesson.estimatedMinutes ? `${lesson.estimatedMinutes} min` : ""}</Badge>
          </div>
          <h1 className={`text-xl font-bold ${isFocused ? "text-white" : "text-foreground"}`}>
            {locale === "ar" ? lesson.titleAr : lesson.titleEn}
          </h1>
          <div className="flex items-center gap-3">
            <Progress value={progressPct} className="h-1.5 flex-1" />
            <span className={`text-xs tabular-nums ${isFocused ? "text-white/60" : "text-muted-foreground"}`}>
              {sectionIndex + 1}/{totalSections}
            </span>
          </div>
        </div>

        {/* Mode toolbar */}
        <div className={`flex items-center gap-2 mb-4 flex-wrap ${isFocused ? "opacity-50" : ""}`}>
          {/* Pomodoro — visible in focus mode */}
          {isFocused && (
            <div className="flex items-center gap-1.5">
              <Button
                variant={pomodoroActive ? "default" : "outline"}
                size="sm"
                onClick={() => setPomodoroActive(v => !v)}
                aria-label={pomodoroActive ? t("Pause Pomodoro", "إيقاف مؤقت") : t("Start Pomodoro timer", "ابدأ البومودورو")}
                className="gap-1.5"
              >
                <Timer className="w-3.5 h-3.5" />
                <span className="tabular-nums font-mono text-xs">{pomodoroDisplay}</span>
              </Button>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${pomodoroPhase === "work" ? "bg-primary/10 text-primary" : "bg-green-100 text-green-700"}`}>
                {pomodoroPhase === "work" ? t("Focus", "تركيز") : t("Break", "استراحة")}
              </span>
            </div>
          )}
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
          <Button
            variant={showConceptMap ? "default" : "outline"}
            size="sm"
            onClick={() => setShowConceptMap(v => !v)}
            aria-label={t("Toggle concept map", "خريطة المفاهيم")}
            aria-pressed={showConceptMap}
          >
            <Map className="w-3.5 h-3.5 mr-1.5" />
            {t("Map", "خريطة")}
          </Button>
        </div>

        {/* Concept Map */}
        {showConceptMap && lesson && (
          <Card className="mb-4 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">{t("Concept Map", "خريطة المفاهيم")}</p>
                <Button variant="ghost" size="sm" onClick={() => setShowConceptMap(false)} aria-label={t("Close map", "إغلاق")}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              <ConceptMapSVG
                lessonTitle={locale === "ar" ? (lesson.titleAr ?? lesson.titleEn ?? "") : (lesson.titleEn ?? "")}
                sections={(lesson.sections as any[]) ?? []}
                locale={locale}
              />
            </CardContent>
          </Card>
        )}

        {/* Section content */}
        <Card className={`focus-dim-active ${isFocused ? "border-white/20 bg-gray-900" : ""}`}>
          <CardContent className="p-6 md:p-8" ref={contentRef}>
            {currentSection ? (
              <div className="space-y-4">
                {currentSection.type === "heading" && (
                  <h2 className={`text-lg font-bold ${isFocused ? "text-white" : ""}`}>
                    {locale === "ar" ? currentSection.titleAr : currentSection.titleEn}
                  </h2>
                )}
                <div className={`prose-hikma prose prose-sm max-w-none ${isFocused ? "prose-invert" : ""} ${simplifiedView ? "text-base leading-relaxed" : ""}`}>
                  {highlightedWords.length > 0 && highlightIndex >= 0 ? (
                    <p className="leading-relaxed">
                      {highlightedWords.map((word, i) => (
                        <span
                          key={i}
                          className={`transition-colors duration-100 ${i === highlightIndex ? "bg-primary/30 rounded px-0.5 font-semibold" : ""}`}
                        >
                          {word}{" "}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <Streamdown>
                      {simplifiedView && simplifiedContent[sectionIndex]
                        ? simplifiedContent[sectionIndex]
                        : (locale === "ar"
                            ? (currentSection.bodyAr ?? currentSection.bodyEn ?? "")
                            : (currentSection.bodyEn ?? ""))}
                    </Streamdown>
                  )}
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
