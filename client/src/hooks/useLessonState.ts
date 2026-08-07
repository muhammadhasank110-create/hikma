/**
 * useLessonState — all state and callbacks for LessonPage.
 * Extracted to keep LessonPage under 300 lines.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useProfile } from "@/contexts/ProfileContext";
import { useSounds } from "@/hooks/useSounds";
import { useTTS, cleanText, buildWordOffsets } from "@/hooks/useTTS";
import { toast } from "sonner";

export function useLessonState(lessonId: number) {
  const [, navigate] = useLocation();
  const { profile, locale } = useProfile();
  const sounds = useSounds();

  const [highlightOffsets, setHighlightOffsets] = useState<number[]>([]);
  const highlightOffsetsRef = useRef<number[]>([]);
  useEffect(() => { highlightOffsetsRef.current = highlightOffsets; }, [highlightOffsets]);
  // Called by useTTS on every word boundary (browser) or animation frame
  // (ElevenLabs). charIndex is an index into the cleaned string, so we walk
  // the precomputed word offsets to find which word is being spoken.
  const handleBoundary = useCallback((charIndex: number) => {
    const offsets = highlightOffsetsRef.current;
    if (!offsets.length) return;
    let lo = 0;
    let hi = offsets.length - 1;
    let found = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (offsets[mid] <= charIndex) { found = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    setHighlightIndex(found);
  }, []);
  const tts = useTTS({
    rate: profile.speechRate,
    lang: locale === "ar" ? "ar-SA" : "en-GB",
    voiceHint: profile.voice,
    onBoundary: handleBoundary,
  });
  const isNarrating = tts.isSpeaking;
  const speakingTextRef = useRef<string>("");

  const [sectionIndex, setSectionIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(profile.mode === "focus");
  const [simplifiedView, setSimplifiedView] = useState(false);
  const [simplifiedContent, setSimplifiedContent] = useState<Record<number, string>>({});
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [parkedThoughts, setParkedThoughts] = useState<string[]>([]);
  const [parkInput, setParkInput] = useState("");
  const [showConceptMap, setShowConceptMap] = useState(false);
  const [showBodyDouble, setShowBodyDouble] = useState(false);
  const [showOverwhelmEscape, setShowOverwhelmEscape] = useState(false);
  const [topicQuestion, setTopicQuestion] = useState<string | null>(null);
  const [topicAnswer, setTopicAnswer] = useState("");
  const [showTopicQuestion, setShowTopicQuestion] = useState(false);
  const [questionSectionIndex, setQuestionSectionIndex] = useState(-1);
  // ── Task 3: Inline answer grading ─────────────────────────────────────────
  const [answerVerdict, setAnswerVerdict] = useState<"correct" | "partially_correct" | "incorrect" | null>(null);
  const [answerExplanation, setAnswerExplanation] = useState("");
  const [answerPointer, setAnswerPointer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroPhase, setPomodoroPhase] = useState<"work" | "break">("work");
  const pomodoroRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [highlightedWords, setHighlightedWords] = useState<string[]>([]);
  // Tutor conversation history for the simplify/explain feature — reset when lesson changes
  const [tutorHistory, setTutorHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: lesson, isLoading } = trpc.curriculum.lesson.useQuery(
    { lessonId },
    { enabled: lessonId > 0 }
  );
  const saveProgress = trpc.progress.updateProgress.useMutation();
  const generateQuestion = trpc.tutor.generateTopicQuestion.useMutation({
    onSuccess: (data) => {
      if (data.question) {
        setTopicQuestion(data.question);
        setShowTopicQuestion(true);
        setTopicAnswer("");
        sounds.questionAppear();
      } else {
        advanceSection();
      }
    },
    onError: () => { advanceSection(); },
  });

  // Reset tutor history when lesson changes
  useEffect(() => { setTutorHistory([]); }, [lessonId]);
  const sections = (lesson?.sections as any[]) ?? [];
  const currentSection = sections[sectionIndex];
  const evaluateAnswer = trpc.tutor.evaluateInlineAnswer.useMutation({
    onSuccess: (data) => {
      setAnswerVerdict(data.verdict);
      setAnswerExplanation(data.explanation);
      setAnswerPointer(data.pointer);
      setIsEvaluating(false);
      if (data.verdict === "correct") sounds.correct();
      else if (data.verdict === "partially_correct") sounds.partiallyCorrect();
      else sounds.incorrect();
    },
    onError: () => {
      setIsEvaluating(false);
      setAnswerVerdict("incorrect");
      setAnswerExplanation(locale === "ar" ? "تعذّر التقييم. تابع." : "Could not evaluate. You may continue.");
      setAnswerPointer("");
    },
  });

  const submitTopicAnswer = useCallback(() => {
    if (!topicQuestion || !currentSection) return;
    if (!topicAnswer.trim()) return;
    setIsEvaluating(true);
    const body = locale === "ar"
      ? (currentSection.bodyAr ?? currentSection.bodyEn ?? "")
      : (currentSection.bodyEn ?? "");
    evaluateAnswer.mutate({
      question: topicQuestion,
      answer: topicAnswer,
      sectionBody: body,
      locale: locale as "ar" | "en",
    });
  }, [topicQuestion, topicAnswer, currentSection, locale, evaluateAnswer]);

  const totalSections = sections.length;
  const progressPct = totalSections > 0 ? Math.round(((sectionIndex + 1) / totalSections) * 100) : 0;
  const lessonTitle = locale === "ar" ? (lesson?.titleAr ?? lesson?.titleEn ?? "") : (lesson?.titleEn ?? "");

  const stopWordHighlight = useCallback(() => {
    setHighlightIndex(-1);
    setHighlightedWords([]);
    setHighlightOffsets([]);
    speakingTextRef.current = "";
  }, []);
  const startWordHighlight = useCallback((text: string) => {
    // MUST match what useTTS speaks — it strips #*_`~[] and collapses
    // whitespace, and does NOT touch parentheses.
    const clean = cleanText(text);
    const { words, offsets } = buildWordOffsets(clean);
    speakingTextRef.current = clean;
    setHighlightedWords(words);
    setHighlightOffsets(offsets);
    setHighlightIndex(0);
  }, []);
  // Clear the highlight when speech finishes on its own.
  useEffect(() => {
    if (!tts.isSpeaking) setHighlightIndex(-1);
  }, [tts.isSpeaking]);
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
    setAnswerVerdict(null);
    setAnswerExplanation("");
    setAnswerPointer("");
  }, [sectionIndex, totalSections, lessonId, locale, navigate, saveProgress, sounds]);

  const nextSection = useCallback(() => {
    sounds.navigate();
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
        return;
      }
    }
    advanceSection();
  }, [currentSection, sectionIndex, questionSectionIndex, showTopicQuestion, locale, profile, generateQuestion, advanceSection, sounds]);

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
    try {
      const prompt = locale === "ar"
        ? `بسّط النص التالي لطالب في المرحلة الثانوية. استخدم جملاً قصيرة وكلمات بسيطة. لا تحذف المعلومات المهمة:\n\n${originalText}`
        : `Simplify the following text for a secondary school student. Use short sentences and simple words. Keep all important information:\n\n${originalText}`;
      const res = await fetch("/api/tutor/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          sessionId: `simplify-${lessonId}-${sectionIndex}`,
          profile: { mode: "reading", chunkSize: "micro", readingLevel: 1, locale, curriculum: profile.curriculum, tier: profile.tier },
          conversationHistory: tutorHistory.slice(-10),
        }),
      });
      if (!res.ok) throw new Error("Stream failed");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let full = ""; let buf = "";
      setSimplifiedView(true);
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
      // Append to history so follow-ups like "explain that more simply" have context
      setTutorHistory(prev => [
        ...prev,
        { role: "user" as const, content: prompt },
        { role: "assistant" as const, content: full },
      ].slice(-10));
    } catch {
      toast.error(locale === "ar" ? "فشل التبسيط" : "Simplification failed");
      setSimplifiedView(false);
    } finally { setIsSimplifying(false); }
  }, [lesson, sectionIndex, locale, profile, lessonId, simplifiedContent, tutorHistory]);

  const announcePosition = useCallback(() => {
    if (!lesson) return;
    const lt = locale === "ar" ? (lesson.titleAr ?? lesson.titleEn ?? "") : (lesson.titleEn ?? "");
    const secTitle = locale === "ar"
      ? (currentSection?.titleAr ?? currentSection?.titleEn ?? "")
      : (currentSection?.titleEn ?? "");
    const msg = locale === "ar"
      ? `أنت في الدرس: ${lt}. القسم ${sectionIndex + 1} من ${totalSections}: ${secTitle}`
      : `You are in lesson: ${lt}. Section ${sectionIndex + 1} of ${totalSections}: ${secTitle}`;
    tts.speak(msg);
    toast.info(msg, { duration: 4000 });
  }, [lesson, locale, sectionIndex, totalSections, currentSection, tts]);

  const handleWordClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "SPAN" && target.dataset.word) {
      setSelectedWord(target.dataset.word);
    }
  }, []);

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

  // Auto-narrate on section change
  useEffect(() => {
    if (profile.autoNarrate && currentSection && !isNarrating) {
      const timer = setTimeout(() => readAloud(), 600);
      return () => clearTimeout(timer);
    }
  }, [sectionIndex, profile.autoNarrate]); // eslint-disable-line react-hooks/exhaustive-deps

  const pomodoroDisplay = `${String(Math.floor(pomodoroSeconds / 60)).padStart(2, "0")}:${String(pomodoroSeconds % 60).padStart(2, "0")}`;

  return {
    // Data
    lesson, isLoading, sections, currentSection, totalSections, progressPct, lessonTitle,
    // Section navigation
    sectionIndex, nextSection, prevSection, advanceSection,
    // UI state
    isFocused, setIsFocused,
    simplifiedView, simplifiedContent, isSimplifying, simplifySection,
    parkedThoughts, setParkedThoughts, parkInput, setParkInput,
    showConceptMap, setShowConceptMap,
    showBodyDouble, setShowBodyDouble,
    showOverwhelmEscape, setShowOverwhelmEscape,
    // Topic question
    topicQuestion, topicAnswer, setTopicAnswer, showTopicQuestion, setShowTopicQuestion,
    generateQuestion,
    // Inline answer grading (Task 3)
    answerVerdict, answerExplanation, answerPointer, isEvaluating, submitTopicAnswer,
    // Word highlight & definition
    highlightedWords, highlightIndex, selectedWord, setSelectedWord,
    handleWordClick, contentRef,
    // TTS
    isNarrating, readAloud, tts,
    // Pomodoro
    pomodoroActive, setPomodoroActive, pomodoroDisplay, pomodoroPhase,
    // Utilities
    announcePosition, saveProgress, sounds,
  };
}
