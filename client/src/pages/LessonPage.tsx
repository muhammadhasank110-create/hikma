/**
 * LessonPage — slim orchestrator.
 * All state logic lives in useLessonState (client/src/hooks/useLessonState.ts).
 * Sub-components: ConceptMapSVG, WordDefinitionPopup, BodyDoublePanel (below).
 */
import { useProfile } from "@/contexts/ProfileContext";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  AlertTriangle, UserCheck, BookOpen, HelpCircle, Send, MoreVertical
} from "lucide-react";
import { normaliseSimplifiedMarkdown, useLessonState } from "@/hooks/useLessonState";
import ConceptMapSVG from "@/components/lesson/ConceptMapSVG";
import WordDefinitionPopup from "@/components/lesson/WordDefinitionPopup";
import BodyDoublePanel from "@/components/lesson/BodyDoublePanel";
import { getNarrationHighlightState } from "@/lib/narrationHighlight";

export default function LessonPage() {
  const [, params] = useRoute("/lesson/:lessonId");
  const [, navigate] = useLocation();
  const { locale, profile, updateProfile } = useProfile();
  const lessonId = parseInt(params?.lessonId ?? "0");
  const [showInlineTutor, setShowInlineTutor] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  // Detect touch device using pointer media query — NOT screen width
  const isTouchDevice = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  const s = useLessonState(lessonId);
  const setLessonFocusMode = useCallback((active: boolean) => {
    s.setIsFocused(active);
    if (active) {
      s.sounds.focus?.();
      updateProfile({ mode: "focus", hideDecorative: true, reduceMotion: true, chunkSize: "micro" });
    } else {
      updateProfile({ mode: "reading", hideDecorative: false, reduceMotion: false, chunkSize: "standard" });
    }
  }, [s.setIsFocused, s.sounds, updateProfile]);
  const prevSectionRef = useRef(s.sectionIndex);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const prefersReducedMotion = useReducedMotion();
  useEffect(() => {
    if (s.sectionIndex !== prevSectionRef.current) {
      setSlideDir(s.sectionIndex > prevSectionRef.current ? 1 : -1);
      prevSectionRef.current = s.sectionIndex;
    }
  }, [s.sectionIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Arrow-key section navigation fires ONLY when focus is on the lesson body or document.body.
      // When focus is inside a toolbar, card grid, or nav bar, useGridNavigation handles the event
      // and calls stopPropagation() — so we never see it here.
      // WASD is disabled on LessonPage because 's' is already bound to simplify-section.
      const focusOnBody = !e.target || e.target === document.body;
      const focusOnLessonContent = e.target instanceof HTMLElement &&
        (e.target.closest('[data-lesson-content]') !== null || e.target === document.body);
      const allowSectionNav = focusOnBody || focusOnLessonContent;
      if (allowSectionNav) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") s.nextSection();
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") s.prevSection();
      }
      if (e.key === "Enter") {
        if (s.showTopicQuestion && s.topicAnswer.trim()) { s.advanceSection(); return; }
        if (!s.showTopicQuestion) { s.nextSection(); return; }
      }
      if (e.key === " ") { e.preventDefault(); s.readAloud(); }
      if (e.key === "r" || e.key === "R") s.readAloud();
      if (e.key === "f" || e.key === "F") setLessonFocusMode(!s.isFocused);
      if (e.key === "s" || e.key === "S") s.simplifySection();
      if (e.key === "m" || e.key === "M") s.setShowConceptMap(v => !v);
      if (e.key === "t" || e.key === "T") s.setPomodoroActive(v => !v);
      if (e.key === "b" || e.key === "B") s.setShowBodyDouble(v => !v);
      if (e.key === "p" && e.ctrlKey) { e.preventDefault(); s.announcePosition(); }
      if (e.key === "Escape") { setLessonFocusMode(false); s.setShowOverwhelmEscape(false); s.setSelectedWord(null); s.setShowConceptMap(false); s.setShowBodyDouble(false); if (s.showTopicQuestion) { s.setShowTopicQuestion(false); } }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [s.nextSection, s.prevSection, s.readAloud, s.simplifySection, s.announcePosition, s.isFocused, setLessonFocusMode]);

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


  // ── DOM-based word highlighting ──────────────────────────────────────────
  // When TTS is narrating, highlight the current word by wrapping it in a
  // <mark> element inside the rendered content. Works with Streamdown markdown.
  const contentElRef = useRef<HTMLDivElement | null>(null);
  const domWordListRef = useRef<{ node: Text; start: number; end: number }[]>([]);
  const activeMarkRef = useRef<HTMLElement | null>(null);

  // Build a flat word list from the current rendered DOM. It must be rebuilt
  // after each mark removal because Range.surroundContents splits text nodes.
  const buildDomWordList = useCallback(() => {
    domWordListRef.current = [];
    const root = contentElRef.current;
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (["script", "style", "mark"].includes(tag)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const wordRegex = /\S+/g;
    const words: { node: Text; start: number; end: number }[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const text = node.textContent ?? "";
      let match: RegExpExecArray | null;
      wordRegex.lastIndex = 0;
      while ((match = wordRegex.exec(text)) !== null) {
        words.push({ node, start: match.index, end: match.index + match[0].length });
      }
    }
    domWordListRef.current = words;
  }, []);

  const clearNarrationMarks = useCallback(() => {
    const root = contentElRef.current;
    const marks = root?.querySelectorAll<HTMLElement>('mark[data-current-spoken-word="true"]') ?? [];
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    });
    activeMarkRef.current = null;
  }, []);

  useEffect(() => {
    activeMarkRef.current = null;
    buildDomWordList();
  }, [buildDomWordList, s.sectionIndex, s.isNarrating, s.simplifiedView, locale]);

  // Apply/remove the highlight mark when highlightIndex changes
  useEffect(() => {
    // Remove previous mark
    clearNarrationMarks();
    const highlightState = getNarrationHighlightState({
      isNarrating: s.isNarrating,
      isFocused: s.isFocused,
      highlightIndex: s.highlightIndex,
      reduceMotion: profile.reduceMotion || Boolean(prefersReducedMotion),
    });
    if (!highlightState.shouldHighlight) return;
    buildDomWordList();
    const wordEntry = domWordListRef.current[s.highlightIndex];
    if (!wordEntry) return;
    try {
      const { node, start, end } = wordEntry;
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);
      const mark = document.createElement("mark");
      mark.className = highlightState.className;
      mark.setAttribute("data-narration-word", "true");
      mark.setAttribute("data-current-spoken-word", "true");
      range.surroundContents(mark);
      activeMarkRef.current = mark;
      mark.scrollIntoView({ block: "nearest", behavior: highlightState.scrollBehavior });
    } catch {
      // surroundContents can fail if range crosses element boundaries — ignore
    }
  }, [buildDomWordList, clearNarrationMarks, profile.reduceMotion, prefersReducedMotion, s.highlightIndex, s.isNarrating, s.isFocused]);

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
    <div className={`min-h-screen ${s.isFocused ? "bg-[#F5F7F5]" : "bg-background"} transition-colors duration-300`}>
      {s.selectedWord && <WordDefinitionPopup word={s.selectedWord} locale={locale} onClose={() => s.setSelectedWord(null)} sectionText={locale === "ar" ? (s.currentSection?.bodyAr ?? s.currentSection?.bodyEn ?? "") : (s.currentSection?.bodyEn ?? "")} />}
      {s.showBodyDouble && <BodyDoublePanel locale={locale} lessonTitle={s.lessonTitle} />}

      <div className="container py-6 max-w-3xl relative">
        {/* Header */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">Lesson</Badge>
            {s.lesson.estimatedMinutes && <Badge variant="outline" className="text-xs">{s.lesson.estimatedMinutes} min</Badge>}
          </div>
          <h1 className={`font-bold ${s.isFocused ? "text-2xl text-[#111411]" : "text-xl text-foreground"}`}>{s.lessonTitle}</h1>
          <div className="flex items-center gap-3">
            <Progress value={s.progressPct} className="h-1.5 flex-1" />
            <span className={`text-xs tabular-nums font-medium ${s.isFocused ? "text-[#111411]/70 bg-[#111411]/10 px-2 py-0.5 rounded-full" : "text-muted-foreground bg-muted px-2 py-0.5 rounded-full"}`} aria-live="polite" aria-label={t(`Section ${s.sectionIndex + 1} of ${s.totalSections}`, `قسم ${s.sectionIndex + 1} من ${s.totalSections}`)}>{s.sectionIndex + 1}/{s.totalSections}</span>
          </div>
        </div>

        {/* Toolbar — simplified: Read Aloud + Focus + More (dropdown for secondary tools) */}
        <div className="flex items-center gap-2 mb-4 flex-wrap relative">
          {/* Pomodoro timer — only shown when focus mode is active */}
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
          {/* Primary: Read Aloud */}
          <Button variant={s.isNarrating ? "default" : "outline"} size="sm" onClick={() => { if (s.isNarrating) s.stopNarration(); else s.readAloud(); }} aria-label={s.isNarrating ? t("Stop narration", "إيقاف السرد") : t("Read aloud", "قراءة بصوت")} aria-pressed={s.isNarrating}>
            {s.isNarrating ? <VolumeX className="w-3.5 h-3.5 mr-1.5" /> : <Volume2 className="w-3.5 h-3.5 mr-1.5" />}
            {s.isNarrating ? t("Stop", "إيقاف") : t("Listen", "استمع")}
          </Button>
          {/* Primary: Focus mode toggle */}
          <Button variant={s.isFocused ? "default" : "outline"} size="sm" onClick={() => setLessonFocusMode(!s.isFocused)} aria-label={t("Toggle focus mode", "وضع التركيز")} aria-pressed={s.isFocused}>
            {s.isFocused ? <Minimize2 className="w-3.5 h-3.5 mr-1.5" /> : <Maximize2 className="w-3.5 h-3.5 mr-1.5" />}
            {t("Focus", "تركيز")}
          </Button>
          {/* More menu — secondary tools in a dropdown to reduce clutter */}
          {!s.isFocused && (
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setShowMoreMenu(v => !v)} aria-label={t("More options", "المزيد من الخيارات")} aria-expanded={showMoreMenu}>
                <MoreVertical className="w-3.5 h-3.5" />
                <span className="hidden sm:inline ml-1">{t("More", "المزيد")}</span>
              </Button>
              {showMoreMenu && (
                <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 p-2 flex flex-col gap-1 min-w-[160px]" role="menu">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-left" onClick={() => { s.simplifySection(); setShowMoreMenu(false); }} role="menuitem">
                    <AlignLeft className="w-4 h-4 flex-shrink-0" />{s.isSimplifying ? "..." : t("Simplify", "تبسيط")}
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-left" onClick={() => { s.setShowConceptMap(v => !v); setShowMoreMenu(false); }} role="menuitem">
                    <Map className="w-4 h-4 flex-shrink-0" />{t("Concept map", "خريطة المفاهيم")}
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-left" onClick={() => { s.setShowBodyDouble(v => !v); setShowMoreMenu(false); }} role="menuitem">
                    <UserCheck className="w-4 h-4 flex-shrink-0" />{t("Companion", "رفيق")}
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-left" onClick={() => { setShowInlineTutor(v => !v); setShowMoreMenu(false); }} role="menuitem">
                    <Bot className="w-4 h-4 flex-shrink-0" />{t("Ask AI", "اسأل AI")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Concept map */}
        {s.showConceptMap && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">{t("Concept Map", "خريطة المفاهيم")}</p>
                <Button variant="ghost" size="icon" onClick={() => s.setShowConceptMap(false)} aria-label={t("Close map", "إغلاق الخريطة")}><X className="w-4 h-4" /></Button>
              </div>
              <ConceptMapSVG lessonTitle={s.lessonTitle} sections={s.sections} locale={locale} defaultList={profile.fontFamily === "opendyslexic"} />
            </CardContent>
          </Card>
        )}

        {/* Section content — slide transition between sections */}
        <AnimatePresence mode="wait" custom={slideDir}>
        <motion.div
          key={s.sectionIndex}
          custom={slideDir}
          variants={{
            enter: (dir: number) => ({ x: prefersReducedMotion ? 0 : dir * 60, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (dir: number) => ({ x: prefersReducedMotion ? 0 : dir * -60, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
        <Card className={s.isFocused ? "border-0 bg-white shadow-xl" : ""} ref={s.contentRef as any}>
          <CardContent className={s.isFocused ? "p-8 sm:p-12" : "p-6"}>
            {s.currentSection ? (
              <div className="space-y-4">
                <h2 className={`font-bold font-display ${s.isFocused ? "text-2xl text-[#111411] mb-5" : "text-lg"}`}>
                  {locale === "ar" ? (s.currentSection.titleAr ?? s.currentSection.titleEn ?? "") : (s.currentSection.titleEn ?? "")}
                </h2>
                {/* Unified render path: Streamdown always (fixes bold/markdown), word-click via DOM text extraction */}
                <div
                  data-lesson-content
                  ref={contentElRef}
                  data-narration-active={s.isNarrating || undefined}
                  data-narration-sync={s.tts.syncSource}
                  className={`max-w-none relative ${s.isFocused ? "text-[1.125rem] leading-[1.95] tracking-[0.01em] text-[#111411] [&_p]:mb-4 [&_p]:text-[1.125rem] [&_p]:leading-[1.95] [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#111411] [&_strong]:font-bold [&_strong]:text-[#111411] [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:text-[1.125rem] [&_li]:leading-[1.9]" : "prose prose-sm"} ${s.simplifiedView ? "text-base leading-relaxed" : ""}`}
                  onClick={(e: React.MouseEvent) => {
                    // Extract word from DOM text node at click point — works with Streamdown markdown
                    const range = document.caretRangeFromPoint
                      ? document.caretRangeFromPoint(e.clientX, e.clientY)
                      : null;
                    if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
                      const text = range.startContainer.textContent ?? "";
                      const offset = range.startOffset;
                      // Walk backwards to start of word
                      let start = offset;
                      while (start > 0 && !/\s/.test(text[start - 1])) start--;
                      // Walk forwards to end of word
                      let end = offset;
                      while (end < text.length && !/\s/.test(text[end])) end++;
                      const word = text.slice(start, end).replace(/[.,!?;:'"()[\]{}*#_`~]/g, "").trim();
                      if (word.length > 1) {
                        s.setSelectedWord(word);
                        return;
                      }
                    }
                    // Fallback: data-word attribute (for any spans that still have it)
                    const target = e.target as HTMLElement;
                    const wordEl = target.closest("[data-word]") as HTMLElement | null;
                    if (wordEl?.dataset.word) s.setSelectedWord(wordEl.dataset.word);
                  }}
                >
                  <Streamdown>
                    {s.simplifiedView && s.simplifiedContent[s.sectionIndex]
                      ? normaliseSimplifiedMarkdown(s.simplifiedContent[s.sectionIndex])
                      : (locale === "ar" ? (s.currentSection.bodyAr ?? s.currentSection.bodyEn ?? "") : (s.currentSection.bodyEn ?? ""))}
                  </Streamdown>
                  {/* Highlight overlay — shown during TTS narration */}
                  {/* Word highlighting is now handled by DOM-based mark element injection in the useEffect above */}
                  {/* Tip: only show when word-click actually works (always now) */}
                  <p className={`text-xs mt-3 italic ${s.isFocused ? "text-[#111411]/50" : "text-muted-foreground"}`}>{t("Tip: click any word for its definition.", "نصيحة: انقر على أي كلمة لتعريفها.")}</p>
                </div>
                {s.currentSection.keyTerms?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className={`text-xs font-semibold mb-2 ${s.isFocused ? "text-[#111411]/60" : "text-muted-foreground"}`}>{t("Key Terms", "المصطلحات الرئيسية")}</p>
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

        </motion.div>
        </AnimatePresence>

        {/* Park a thought — icon-only on mobile, expands on tap */}
        <ParkAThought s={s} t={t} />

        {/* Topic question */}
        {s.showTopicQuestion && s.topicQuestion && (
          <div className="mt-6 p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 space-y-3 animate-arrive">
            <div className="flex items-center gap-2 text-primary text-sm font-semibold">
              <HelpCircle className="w-4 h-4 flex-shrink-0" />
              <span>{t("Hikma AI asks:", "حكمة AI يسأل:")}</span>
            </div>
            <p className="text-sm leading-relaxed font-medium">{s.topicQuestion}</p>

            {/* Answer input — hidden once verdict is shown */}
            {!s.answerVerdict && (
              <>
                <div className="flex gap-2">
                  <input type="text" value={s.topicAnswer} onChange={e => s.setTopicAnswer(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && s.topicAnswer.trim() && !s.isEvaluating) s.submitTopicAnswer(); }}
                    placeholder={t("Type your answer or thinking…", "اكتب إجابتك أو تفكيرك…")}
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label={t("Your answer", "إجابتك")}
                    disabled={s.isEvaluating} />
                  <Button size="sm" onClick={s.submitTopicAnswer} className="rounded-xl" disabled={!s.topicAnswer.trim() || s.isEvaluating}
                    aria-label={t("Submit answer for feedback", "أرسل الإجابة للتقييم")}>
                    {s.isEvaluating
                      ? <span className="w-3.5 h-3.5 border-2 border-border-strong border-t-white rounded-full animate-spin" />
                      : <><Send className="w-3.5 h-3.5 mr-1" />{t("Submit", "أرسل")}</>}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t("Have a go — a wrong answer here tells us what to explain next.", "جرّب — الإجابة الخاطئة تخبرنا ماذا نشرح بعد ذلك.")}</p>
              </>
            )}

            {/* Verdict card — shown after evaluation */}
            {s.answerVerdict && (
              <div
                role="region"
                aria-live="polite"
                aria-label={t("Answer feedback", "تغذية راجعة للإجابة")}
                className={[
                  "rounded-xl p-3 space-y-1.5 border animate-arrive",
                  s.answerVerdict === "correct"
                    ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                    : s.answerVerdict === "partially_correct"
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
                ].join(" ")}
              >
                <div className={["flex items-center gap-2 text-sm font-semibold",
                  s.answerVerdict === "correct" ? "text-green-700 dark:text-green-300"
                  : s.answerVerdict === "partially_correct" ? "text-amber-700 dark:text-amber-300"
                  : "text-red-700 dark:text-red-300"].join(" ")}>
                  {s.answerVerdict === "correct"
                    ? <>{t("✓ Correct!", "✓ صحيح!")}</>
                    : s.answerVerdict === "partially_correct"
                    ? <>{t("◑ Partially correct", "◑ صحيح جزئياً")}</>
                    : <>{t("✗ Not quite", "✗ ليس تماماً")}</>}
                </div>
                {s.answerExplanation && <p className="text-xs leading-relaxed">{s.answerExplanation}</p>}
                {s.answerPointer && (
                  <p className="text-xs text-muted-foreground italic">
                    {t("Tip:", "تلميح:")} {s.answerPointer}
                  </p>
                )}
                <Button size="sm" variant="outline" onClick={s.advanceSection} className="w-full mt-2 rounded-xl"
                  aria-label={t("Continue to next section", "تابع إلى القسم التالي")}>
                  {t("Continue", "تابع")} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
        {s.generateQuestion.isPending && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <HelpCircle className="w-4 h-4 animate-pulse text-primary" />
            <span>{t("Hikma AI is preparing a question…", "حكمة AI يجهّز سؤالاً…")}</span>
          </div>
        )}

        {/* Inline tutor panel */}
        <AnimatePresence>
        {showInlineTutor && (
          <motion.div
            className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-primary/10">
              <span className="text-sm font-semibold text-primary flex items-center gap-1.5">
                <Bot className="w-4 h-4" />{t("Hikma AI", "حكمة AI")}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowInlineTutor(false)} aria-label={t("Close tutor", "إغلاق المساعد")}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="p-3">
              <iframe
                src="/tutor"
                title={t("Hikma AI Tutor", "مساعد حكمة AI")}
                className="w-full rounded-xl border-0"
                style={{ height: "360px" }}
                aria-label={t("Hikma AI Tutor panel", "لوحة مساعد حكمة AI")}
              />
            </div>
          </motion.div>
        )}
        </AnimatePresence>
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
          <Button onClick={() => { if (s.showTopicQuestion && s.topicAnswer.trim() === "") { toast.info(t("Please answer the question or press Continue to skip.", "الرجاء الإجابة على السؤال أو اضغط تابع للتخطي.")); return; } s.nextSection(); }} aria-label={s.sectionIndex < s.totalSections - 1 ? t("Next section", "القسم التالي") : t("Complete lesson", "إكمال الدرس")}>
            {s.sectionIndex < s.totalSections - 1 ? t("Next", "التالي") : t("Complete", "إكمال")}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Keyboard hints — hidden on touch devices, only shown on pointer-fine */}
        <div className="mt-4 text-xs text-muted-foreground text-center space-x-3 hidden [@media(pointer:fine)]:flex flex-wrap justify-center gap-x-3">
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

// ── ParkAThought — collapses to icon on mobile, expands on tap ──────────────
function ParkAThought({ s, t }: { s: any; t: (en: string, ar: string) => string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-4">
      {/* Mobile: icon button that expands */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2 rounded-lg border border-dashed border-border/60 hover:border-border"
          aria-expanded={expanded}
          aria-label={t("Park a thought", "احفظ فكرة")}
        >
          <ParkingSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("Park a thought", "احفظ فكرة")}</span>
          {s.parkedThoughts.length > 0 && (
            <span className="ml-1 text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5">{s.parkedThoughts.length}</span>
          )}
        </button>
      </div>
      {expanded && (
        <div className="mt-2 p-3 rounded-xl border border-dashed border-border bg-muted/30 animate-arrive">
          <div className="flex gap-2">
            <input
              type="text"
              value={s.parkInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => s.setParkInput(e.target.value)}
              placeholder={t("Type a thought…", "اكتب فكرة…")}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring min-h-[44px]"
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter" && s.parkInput.trim()) { s.setParkedThoughts((prev: string[]) => [...prev, s.parkInput.trim()]); s.setParkInput(""); } }}
              aria-label={t("Park a thought", "احفظ فكرة")}
            />
            <Button
              size="sm"
              variant="outline"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => { if (s.parkInput.trim()) { s.setParkedThoughts((prev: string[]) => [...prev, s.parkInput.trim()]); s.setParkInput(""); } }}
              aria-label={t("Save thought", "حفظ الفكرة")}
            >
              <ParkingSquare className="w-3.5 h-3.5" />
            </Button>
          </div>
          {s.parkedThoughts.length > 0 && (
            <div className="mt-2 space-y-1">
              {s.parkedThoughts.map((thought: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ParkingSquare className="w-3 h-3" /><span>{thought}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
