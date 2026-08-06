import { useProfile } from "@/contexts/ProfileContext";
import { useSounds } from "@/hooks/useSounds";
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
    AlignLeft, Maximize2, Minimize2, ParkingSquare, Timer, Map, X,
    AlertTriangle, Shuffle, UserCheck, BookOpen, HelpCircle, Send
  } from "lucide-react";
import { useTTS } from "@/hooks/useTTS";

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
      <ellipse cx={cx} cy={cy} rx={90} ry={24} fill="var(--color-primary)" />
      <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
        {lessonTitle.slice(0, 28)}
      </text>
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

// ── Word Definition Popup ────────────────────────────────────────────────────
function WordDefinitionPopup({ word, locale, onClose }: { word: string; locale: string; onClose: () => void }) {
  const [definition, setDefinition] = useState("");
  const [loading, setLoading] = useState(true);
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  useEffect(() => {
    if (!word) return;
    setLoading(true);
    setDefinition("");
    const prompt = locale === "ar"
      ? `عرّف الكلمة "${word}" بجملة واحدة بسيطة مناسبة لطالب في المرحلة الثانوية.`
      : `Define the word "${word}" in one simple sentence suitable for a secondary school student. Be concise.`;
    fetch("/api/tutor/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: prompt,
        sessionId: `def-${word}`,
        profile: { mode: "reading", locale },
        conversationHistory: [],
      }),
    }).then(async res => {
      if (!res.ok) { setDefinition(t("Definition unavailable.", "التعريف غير متاح.")); setLoading(false); return; }
      const reader = res.body?.getReader();
      if (!reader) { setLoading(false); return; }
      const decoder = new TextDecoder();
      let full = ""; let buf = "";
      setLoading(false);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === "data: [DONE]") break;
          if (trimmed.startsWith("data: ")) {
            try { const p = JSON.parse(trimmed.slice(6)); if (p.delta) { full += p.delta; setDefinition(full); } } catch { /* skip */ }
          }
        }
      }
    }).catch(() => { setDefinition(t("Definition unavailable.", "التعريف غير متاح.")); setLoading(false); });
  }, [word, locale]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(`Definition of ${word}`, `تعريف ${word}`)}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <Card className="relative z-10 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("Definition", "تعريف")}</p>
              <h3 className="text-lg font-bold font-display">{word}</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label={t("Close", "إغلاق")} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <p className="text-sm leading-relaxed">{definition}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Body Double Companion ────────────────────────────────────────────────────
function BodyDoublePanel({ locale, lessonTitle }: { locale: string; lessonTitle: string }) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const messages = locale === "ar" ? [
    "أنا هنا معك. خطوة واحدة في كل مرة.",
    "أنت تتقدم. استمر.",
    "لا بأس بالتوقف للتنفس.",
    "كل قسم تكمله هو إنجاز.",
    "أنا أراقب معك. أنت لست وحدك.",
  ] : [
    "I'm here with you. One step at a time.",
    "You're making progress. Keep going.",
    "It's okay to pause and breathe.",
    "Every section you finish is an achievement.",
    "I'm working alongside you. You're not alone.",
  ];
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setMsgIndex(i => (i + 1) % messages.length), 45000);
    return () => clearInterval(timer);
  }, [messages.length]);
  return (
    <div className="fixed bottom-20 right-4 z-[100] max-w-xs">
      <Card className="border-primary/30 bg-card/95 backdrop-blur-sm shadow-lg">
        <CardContent className="p-3 flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <UserCheck className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-primary mb-0.5">{t("Hikma is with you", "حكمة معك")}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{messages[msgIndex]}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LessonPage() {
  const [, params] = useRoute("/lesson/:lessonId");
  const [, navigate] = useLocation();
  const { profile, locale, setMode } = useProfile();
  const lessonId = parseInt(params?.lessonId ?? "0");
  const [sectionIndex, setSectionIndex] = useState(0);
  // Keep a ref to the clean text being spoken so boundary charIndex → word index
  const speakingTextRef = useRef<string>("");
  const tts = useTTS({
    rate: profile.speechRate,
    lang: locale === "ar" ? "ar-SA" : "en-GB",
    voiceHint: profile.voice,
    onBoundary: (charIndex: number, cleanedText: string) => {
      // cleanedText is the exact string passed to the utterance
      if (!cleanedText) return;
      const upToChar = cleanedText.slice(0, charIndex + 1);
      const wordIdx = upToChar.trim().split(/\s+/).length - 1;
      setHighlightIndex(wordIdx);
    },
  });
  const isNarrating = tts.isSpeaking;
  const [isFocused, setIsFocused] = useState(profile.mode === "focus");
  const sounds = useSounds();
  const [simplifiedView, setSimplifiedView] = useState(false);
  const [simplifiedContent, setSimplifiedContent] = useState<Record<number, string>>({});
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [parkedThoughts, setParkedThoughts] = useState<string[]>([]);
  const [parkInput, setParkInput] = useState("");
  const [showConceptMap, setShowConceptMap] = useState(false);
  const [showBodyDouble, setShowBodyDouble] = useState(false);
  const [showOverwhelmEscape, setShowOverwhelmEscape] = useState(false);
  // Per-topic question
  const [topicQuestion, setTopicQuestion] = useState<string | null>(null);
  const [topicAnswer, setTopicAnswer] = useState("");
  const [showTopicQuestion, setShowTopicQuestion] = useState(false);
  const [questionSectionIndex, setQuestionSectionIndex] = useState(-1);
  const generateQuestion = trpc.tutor.generateTopicQuestion.useMutation({
    onSuccess: (data) => {
      if (data.question) {
        setTopicQuestion(data.question);
        setShowTopicQuestion(true);
        setTopicAnswer("");
        sounds.questionAppear();
      } else {
        // No question generated — just advance
        advanceSection();
      }
    },
    onError: () => {
      // If question generation fails, just advance without blocking
      advanceSection();
    },
  });
  // Tap-any-word definition
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  // Pomodoro
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroPhase, setPomodoroPhase] = useState<"work" | "break">("work");
  const pomodoroRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Word-by-word highlighting
  const [highlightedWords, setHighlightedWords] = useState<string[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const contentRef = useRef<HTMLDivElement>(null);
  const { data: lesson, isLoading } = trpc.curriculum.lesson.useQuery(
    { lessonId },
    { enabled: lessonId > 0 }
  );
  const saveProgress = trpc.progress.updateProgress.useMutation();

  const stopWordHighlight = useCallback(() => {
    setHighlightIndex(-1);
    setHighlightedWords([]);
    speakingTextRef.current = "";
  }, []);

  const startWordHighlight = useCallback((text: string) => {
    const clean = text.replace(/[#*`_~[\]()]/g, " ").replace(/\s+/g, " ").trim();
    const words = clean.split(/\s+/).filter(Boolean);
    speakingTextRef.current = clean;
    setHighlightedWords(words);
    setHighlightIndex(0);
  }, []);

  const sections = (lesson?.sections as any[]) ?? [];
  const currentSection = sections[sectionIndex];
  const totalSections = sections.length;
  const progressPct = totalSections > 0 ? Math.round(((sectionIndex + 1) / totalSections) * 100) : 0;

  const readAloud = useCallback(() => {
    if (!currentSection) return;
    if (isNarrating) {
      tts.stop();
      stopWordHighlight();
      return;
    }
    const text = locale === "ar"
      ? (currentSection.bodyAr ?? currentSection.bodyEn ?? currentSection.titleAr ?? "")
      : (currentSection.bodyEn ?? currentSection.titleEn ?? "");
    startWordHighlight(text);
    tts.speak(text);
  }, [currentSection, isNarrating, tts, locale, startWordHighlight, stopWordHighlight]);

  const advanceSection = useCallback(() => {
    if (sectionIndex < totalSections - 1) {
      setSectionIndex(i => i + 1);
      saveProgress.mutate({ lessonId, sectionId: sectionIndex + 1, cursorOffset: 0, status: "in_progress" });
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      saveProgress.mutate({ lessonId, sectionId: sectionIndex, cursorOffset: 0, status: "complete" });
      sounds.complete();
      toast.success(locale === "ar" ? "أحسنت! أكملت الدرس. جاري تحميل الاختبار…" : "Well done! Lesson complete. Loading quiz…");
      setTimeout(() => navigate(`/check/${lessonId}`), 1200);
    }
    setShowTopicQuestion(false);
    setTopicQuestion(null);
    setTopicAnswer("");
  }, [sectionIndex, totalSections, lessonId, locale]);

  const nextSection = useCallback(() => {
    sounds.navigate();
    // Show a topic question before advancing (only once per section)
    if (currentSection && questionSectionIndex !== sectionIndex && !showTopicQuestion) {
      const body = locale === "ar"
        ? (currentSection.bodyAr ?? currentSection.bodyEn ?? "")
        : (currentSection.bodyEn ?? "");
      const title = locale === "ar"
        ? (currentSection.titleAr ?? currentSection.titleEn ?? "")
        : (currentSection.titleEn ?? "");
      if (body.trim().length > 20) {
        setQuestionSectionIndex(sectionIndex);
        generateQuestion.mutate({
          topicTitle: title,
          topicBody: body,
          locale: locale as "ar" | "en",
          curriculum: profile.curriculum,
          tier: profile.tier,
          readingLevel: profile.readingLevel,
        });
        return; // Wait for question to load, then user clicks Next again
      }
    }
    advanceSection();
  }, [currentSection, sectionIndex, questionSectionIndex, showTopicQuestion, locale, profile, generateQuestion, advanceSection]);

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

  // Position awareness (Ctrl+P)
  const announcePosition = useCallback(() => {
    if (!lesson) return;
    const lessonTitle = locale === "ar" ? (lesson.titleAr ?? lesson.titleEn ?? "") : (lesson.titleEn ?? "");
    const secTitle = locale === "ar"
      ? (currentSection?.titleAr ?? currentSection?.titleEn ?? "")
      : (currentSection?.titleEn ?? "");
    const msg = locale === "ar"
      ? `أنت في الدرس: ${lessonTitle}. القسم ${sectionIndex + 1} من ${totalSections}: ${secTitle}`
      : `You are in lesson: ${lessonTitle}. Section ${sectionIndex + 1} of ${totalSections}: ${secTitle}`;
    tts.speak(msg);
    toast.info(msg, { duration: 4000 });
  }, [lesson, locale, sectionIndex, totalSections, currentSection]);

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
      // Enter = next section / submit answer (primary advance key)
      if (e.key === "Enter") {
        if (showTopicQuestion && topicAnswer.trim()) { advanceSection(); return; }
        if (!showTopicQuestion) { nextSection(); return; }
      }
      if (e.key === " ") { e.preventDefault(); readAloud(); }
      if (e.key === "r" || e.key === "R") readAloud();
      if (e.key === "f" || e.key === "F") { setIsFocused(v => { if (!v) sounds.focus(); return !v; }); }
      if (e.key === "s" || e.key === "S") simplifySection();
      if (e.key === "m" || e.key === "M") setShowConceptMap(v => !v);
      if (e.key === "t" || e.key === "T") setPomodoroActive(v => !v);
      if (e.key === "b" || e.key === "B") setShowBodyDouble(v => !v);
      if (e.key === "p" && e.ctrlKey) { e.preventDefault(); announcePosition(); }
      if (e.key === "Escape") { setIsFocused(false); setShowOverwhelmEscape(false); setSelectedWord(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [nextSection, prevSection, readAloud, simplifySection, announcePosition]);

  // Voice command events dispatched by VoiceCommandOverlay
  useEffect(() => {
    const onRead = () => readAloud();
    const onNext = () => nextSection();
    const onPrev = () => prevSection();
    window.addEventListener("hikma:read_aloud", onRead);
    window.addEventListener("hikma:next_section", onNext);
    window.addEventListener("hikma:prev_section", onPrev);
    return () => {
      window.removeEventListener("hikma:read_aloud", onRead);
      window.removeEventListener("hikma:next_section", onNext);
      window.removeEventListener("hikma:prev_section", onPrev);
    };
  }, [readAloud, nextSection, prevSection]);


  // Auto-narrate on section change if enabled
  useEffect(() => {
    if (profile.autoNarrate && currentSection && !isNarrating) {
      const timer = setTimeout(() => readAloud(), 600);
      return () => clearTimeout(timer);
    }
  }, [sectionIndex, profile.autoNarrate]);

  // Handle word click for definition
  const handleWordClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "SPAN" && target.dataset.word) {
      setSelectedWord(target.dataset.word);
    }
  }, []);

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

  const lessonTitle = locale === "ar" ? (lesson.titleAr ?? lesson.titleEn ?? "") : (lesson.titleEn ?? "");

  // Overwhelm escape hatch overlay
  if (showOverwhelmEscape) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-primary" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-2xl font-bold font-display">{t("Take a breath.", "خذ نفساً.")}</h2>
        <p className="text-muted-foreground">
          {t("You've saved your progress. Come back when you're ready — Hikma will be here.",
             "لقد حُفظ تقدمك. عد عندما تكون مستعداً — حكمة ستكون هنا.")}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => setShowOverwhelmEscape(false)}>
          {t("Continue lesson", "متابعة الدرس")}
        </Button>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          {t("Go to dashboard", "الصفحة الرئيسية")}
        </Button>
        <Button variant="outline" onClick={() => navigate("/tutor")}>
          <Bot className="w-4 h-4 mr-2" />
          {t("Talk to tutor", "تحدث مع المعلم")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("Press Escape to return to the lesson.", "اضغط Escape للعودة إلى الدرس.")}
      </p>
    </div>
  );

  return (
    <div className={`min-h-screen ${isFocused ? "bg-black/95" : "bg-background"} transition-colors duration-300`}>

      {/* Word definition popup */}
      {selectedWord && (
        <WordDefinitionPopup
          word={selectedWord}
          locale={locale}
          onClose={() => setSelectedWord(null)}
        />
      )}

      {/* Body double companion */}
      {showBodyDouble && <BodyDoublePanel locale={locale} lessonTitle={lessonTitle} />}

      <div className="container py-6 max-w-3xl relative">
        {/* Lesson header */}
        <div className={`space-y-2 mb-6 ${isFocused ? "opacity-100" : ""}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">Lesson</Badge>
            <Badge variant="outline" className="text-xs">{lesson.estimatedMinutes ? `${lesson.estimatedMinutes} min` : ""}</Badge>
          </div>
          <h1 className={`text-xl font-bold ${isFocused ? "text-white" : "text-foreground"}`}>
            {lessonTitle}
          </h1>
          <div className="flex items-center gap-3">
            <Progress value={progressPct} className="h-1.5 flex-1" />
            <span className={`text-xs tabular-nums ${isFocused ? "text-white/60" : "text-muted-foreground"}`}>
              {sectionIndex + 1}/{totalSections}
            </span>
          </div>
        </div>

        {/* Mode toolbar */}
        <div className={`flex items-center gap-2 mb-4 flex-wrap ${isFocused ? "opacity-100" : ""}`}>
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
          {/* Modality switch */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const modes: ("reading" | "audio_first" | "focus")[] = ["reading", "audio_first", "focus"];
              const current = modes.indexOf(profile.mode as any);
              const next = modes[(current + 1) % modes.length];
              setMode(next);
              toast.info(t(`Switched to ${next.replace("_", " ")} mode`, `تم التبديل إلى وضع ${next === "reading" ? "القراءة" : next === "audio_first" ? "الصوت أولاً" : "التركيز"}`));
            }}
            aria-label={t("Switch learning mode", "تبديل وضع التعلم")}
          >
            <Shuffle className="w-3.5 h-3.5 mr-1.5" />
            {t("Mode", "الوضع")}
          </Button>
          {/* Body double toggle */}
          <Button
            variant={showBodyDouble ? "default" : "outline"}
            size="sm"
            onClick={() => setShowBodyDouble(v => !v)}
            aria-label={t("Toggle body double companion", "رفيق العمل")}
            aria-pressed={showBodyDouble}
          >
            <UserCheck className="w-3.5 h-3.5 mr-1.5" />
            {t("Companion", "رفيق")}
          </Button>
        </div>

        {/* Concept map */}
        {showConceptMap && sections.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">{t("Concept Map", "خريطة المفاهيم")}</p>
                <Button variant="ghost" size="icon" onClick={() => setShowConceptMap(false)} aria-label={t("Close map", "إغلاق الخريطة")}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ConceptMapSVG lessonTitle={lessonTitle} sections={sections} locale={locale} />
            </CardContent>
          </Card>
        )}

        {/* Section content */}
        <Card className={isFocused ? "border-white/10 bg-[#0a1a0a] shadow-2xl ring-1 ring-white/10" : ""} ref={contentRef as any}>
          <CardContent className="p-6">
            {currentSection ? (
              <div className="space-y-4">
                <h2 className={`text-lg font-bold font-display ${isFocused ? "text-white" : ""}`}>
                  {locale === "ar" ? (currentSection.titleAr ?? currentSection.titleEn ?? "") : (currentSection.titleEn ?? "")}
                </h2>
                <div
                  className={`prose max-w-none ${isFocused ? "prose-invert text-base leading-[1.9] tracking-wide" : "prose-sm"} ${simplifiedView ? "text-base leading-relaxed" : ""}`}
                  onClick={handleWordClick}
                >
                  {highlightedWords.length > 0 && highlightIndex >= 0 ? (
                    <p className="leading-relaxed">
                      {highlightedWords.map((word, i) => (
                        <span
                          key={i}
                          data-word={word}
                          className={`cursor-pointer transition-colors duration-100 hover:underline hover:text-primary ${i === highlightIndex ? (isFocused ? "bg-yellow-400/60 text-black rounded px-0.5 font-bold" : "bg-primary/30 rounded px-0.5 font-semibold") : ""}`}
                        >
                          {word}{" "}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <div>
                      <Streamdown>
                        {simplifiedView && simplifiedContent[sectionIndex]
                          ? simplifiedContent[sectionIndex]
                          : (locale === "ar"
                              ? (currentSection.bodyAr ?? currentSection.bodyEn ?? "")
                              : (currentSection.bodyEn ?? ""))}
                      </Streamdown>
                      <p className="text-xs text-muted-foreground mt-3 italic">
                        {t("Tip: click any word for its definition.", "نصيحة: انقر على أي كلمة لتعريفها.")}
                      </p>
                    </div>
                  )}
                </div>
                {currentSection.keyTerms && currentSection.keyTerms.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className={`text-xs font-semibold mb-2 ${isFocused ? "text-white/60" : "text-muted-foreground"}`}>
                      {t("Key Terms", "المصطلحات الرئيسية")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentSection.keyTerms.map((term: string) => (
                        <Badge key={term} variant="secondary" className="text-xs cursor-pointer hover:bg-primary/20"
                          onClick={() => setSelectedWord(term)}>
                          {term}
                        </Badge>
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
        <div className={`mt-4 ${isFocused ? "opacity-100" : ""}`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={parkInput}
              onChange={e => setParkInput(e.target.value)}
              placeholder={t("Park a thought… (P key)", "احفظ فكرة… (مفتاح P)")}
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

        {/* Per-topic question */}
        {(showTopicQuestion && topicQuestion) && (
          <div className="mt-6 p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 space-y-3 animate-arrive">
            <div className="flex items-center gap-2 text-primary text-sm font-semibold">
              <HelpCircle className="w-4 h-4 flex-shrink-0" />
              <span>{t("Hikma AI asks:", "حكمة AI يسأل:")}</span>
            </div>
            <p className="text-sm leading-relaxed font-medium">{topicQuestion}</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={topicAnswer}
                onChange={e => setTopicAnswer(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && topicAnswer.trim()) advanceSection(); }}
                placeholder={t("Type your answer or thinking…", "اكتب إجابتك أو تفكيرك…")}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={t("Your answer", "إجابتك")}
              />
              <Button
                size="sm"
                onClick={advanceSection}
                className="rounded-xl"
                aria-label={t("Submit and continue", "أرسل وتابع")}
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                {t("Continue", "تابع")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("Share your thinking — there's no wrong answer here. Press Continue when ready.", "شارك تفكيرك — لا توجد إجابة خاطئة هنا. اضغط تابع عندما تكون مستعداً.")}</p>
          </div>
        )}
        {generateQuestion.isPending && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <HelpCircle className="w-4 h-4 animate-pulse text-primary" />
            <span>{t("Hikma AI is preparing a question…", "حكمة AI يجهّز سؤالاً…")}</span>
          </div>
        )}
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {t("Enter / ← → to navigate", "Enter / الأسهم للتنقل")}
            </span>
            {/* Overwhelm escape hatch */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                saveProgress.mutate({ lessonId, sectionId: sectionIndex, cursorOffset: 0, status: "in_progress" });
                setShowOverwhelmEscape(true);
              }}
              aria-label={t("I need a break", "أحتاج استراحة")}
              className="text-muted-foreground hover:text-destructive"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {t("Break", "استراحة")}
            </Button>
          </div>
          <Button
            onClick={nextSection}
            aria-label={sectionIndex < totalSections - 1 ? t("Next section", "القسم التالي") : t("Complete lesson", "إكمال الدرس")}
          >
            {sectionIndex < totalSections - 1 ? t("Next", "التالي") : t("Complete", "إكمال")}
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
