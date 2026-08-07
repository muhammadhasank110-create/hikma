/**
 * CheckPage — premium animated quiz experience.
 * Duolingo-inspired card flip, spring-in options, burst feedback, confetti result.
 */
import { useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedProgress } from "@/components/PageTransition";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Volume2, Mic, MicOff, Trophy, RotateCcw, ArrowRight, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { useCheckState } from "@/hooks/useCheckState";

// ── Confetti burst (CSS-only, 12 particles) ───────────────────────────────────
function ConfettiBurst() {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;
  const COLOURS = ["#86efac","#fbbf24","#f87171","#60a5fa","#c084fc","#34d399"];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * 360;
        const dist = 80 + Math.random() * 80;
        const colour = COLOURS[i % COLOURS.length];
        const size = 6 + Math.random() * 6;
        return (
          <motion.div key={i}
            className="absolute rounded-sm"
            style={{ width: size, height: size, background: colour, top: "50%", left: "50%", originX: "50%", originY: "50%" }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * dist,
              y: Math.sin((angle * Math.PI) / 180) * dist - 40,
              opacity: 0,
              rotate: angle * 2,
              scale: 0,
            }}
            transition={{ duration: 0.8, delay: i * 0.02, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

// ── Ripple on button click ────────────────────────────────────────────────────
function RippleButton({ children, onClick, className, disabled, role, "aria-checked": ariaChecked }: {
  children: React.ReactNode; onClick?: () => void; className?: string; disabled?: boolean;
  role?: string; "aria-checked"?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const handleClick = (e: React.MouseEvent) => {
    if (!ref.current || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `position:absolute;border-radius:50%;background:rgba(255,255,255,0.25);width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;animation:ripple-expand 0.5s ease-out forwards;pointer-events:none;`;
    ref.current.style.position = "relative";
    ref.current.style.overflow = "hidden";
    ref.current.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
    onClick?.();
  };
  return (
    <button ref={ref} className={className} onClick={handleClick} disabled={disabled} role={role} aria-checked={ariaChecked}>
      {children}
    </button>
  );
}

export default function CheckPage() {
  const [, params] = useRoute("/check/:lessonId");
  const lessonId = parseInt(params?.lessonId ?? "0");
  const s = useCheckState(lessonId);
  const { t, locale, navigate } = s;
  const prefersReducedMotion = useReducedMotion();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "1") { if (s.currentQ?.options) s.setAnswers(prev => ({ ...prev, [s.currentQ!.id]: 0 })); }
      if (e.key === "2") { if (s.currentQ?.options?.[1] !== undefined) s.setAnswers(prev => ({ ...prev, [s.currentQ!.id]: 1 })); }
      if (e.key === "3") { if (s.currentQ?.options?.[2] !== undefined) s.setAnswers(prev => ({ ...prev, [s.currentQ!.id]: 2 })); }
      if (e.key === "4") { if (s.currentQ?.options?.[3] !== undefined) s.setAnswers(prev => ({ ...prev, [s.currentQ!.id]: 3 })); }
      if (e.key === "Enter" && !s.submitted[s.currentQ?.id ?? ""]) s.submitAnswer();
      if (e.key === "Enter" && s.submitted[s.currentQ?.id ?? ""]) s.nextQuestion();
      if (e.key === "r" || e.key === "R") s.readQuestion();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [s.currentQ, s.submitted, s.submitAnswer, s.nextQuestion, s.readQuestion]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (s.isGenerating) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
        <Loader2 className="w-8 h-8 text-primary mx-auto" />
      </motion.div>
      <motion.p className="text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        {t("Generating questions from lesson content...", "جاري إنشاء الأسئلة...")}
      </motion.p>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────────
  if (s.generationFailed) return (
    <motion.div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
        <span className="text-2xl" aria-hidden="true">⚠</span>
      </div>
      <h1 className="text-xl font-bold">{t("Couldn't generate questions", "تعذّر إنشاء الأسئلة")}</h1>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
        {t("Hikma AI couldn't create questions for this lesson right now. This is usually a temporary issue.", "تعذّر على حكمة AI إنشاء أسئلة لهذا الدرس الآن.")}
      </p>
      <div className="flex gap-3 justify-center">
        <Button onClick={() => window.location.reload()} variant="default">
          <RotateCcw className="w-4 h-4 mr-2" />{t("Try Again", "حاول مجدداً")}
        </Button>
        <Button onClick={() => window.history.back()} variant="outline">
          {t("Back to Lesson", "العودة للدرس")}
        </Button>
      </div>
    </motion.div>
  );

  // ── Complete screen ──────────────────────────────────────────────────────────
  if (s.isComplete) {
    const pct = s.totalMarks > 0 ? Math.round((s.score / s.totalMarks) * 100) : 0;
    const grade = pct >= 80 ? "excellent" : pct >= 60 ? "good" : "keep-going";
    const gradeConfig = {
      excellent: { emoji: "🏆", label: t("Excellent!", "ممتاز!"), colour: "text-yellow-500", bg: "bg-yellow-500/10" },
      good:      { emoji: "⭐", label: t("Well done!", "أحسنت!"), colour: "text-blue-500", bg: "bg-blue-500/10" },
      "keep-going": { emoji: "💪", label: t("Keep going!", "استمر!"), colour: "text-primary", bg: "bg-primary/10" },
    }[grade];
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 relative">
        <motion.div
          className="rounded-3xl border border-border bg-card p-10 text-center space-y-6 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] as any }}
        >
          {pct >= 60 && <ConfettiBurst />}
          <motion.div
            className={`w-20 h-20 rounded-full ${gradeConfig.bg} flex items-center justify-center mx-auto text-4xl`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
          >
            {gradeConfig.emoji}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className={`text-3xl font-black ${gradeConfig.colour}`}>{gradeConfig.label}</h1>
          </motion.div>
          <motion.div
            className="text-7xl font-black text-foreground tabular-nums"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.4 }}
          >
            {pct}%
          </motion.div>
          <motion.p className="text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            {t(`You scored ${s.score} out of ${s.totalMarks} marks`, `حصلت على ${s.score} من ${s.totalMarks} درجة`)}
          </motion.p>
          <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.6, duration: 0.6 }} style={{ originX: 0 }}>
            <AnimatedProgress value={pct} className="h-3 rounded-full" />
          </motion.div>
          <motion.div className="flex gap-3 justify-center flex-wrap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Button onClick={() => window.location.reload()}>
              <RotateCcw className="w-4 h-4 mr-2" />{t("Try Again", "حاول مجدداً")}
            </Button>
            <Button variant="outline" onClick={() => navigate(`/lesson/${lessonId}`)}>{t("Back to Lesson", "العودة للدرس")}</Button>
            <Button variant="outline" onClick={() => navigate("/tutor")}>{t("Ask Tutor", "اسأل المعلم")}</Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (!s.currentQ) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-muted-foreground">{t("No questions available.", "لا توجد أسئلة.")}</p>
      <Button className="mt-4" onClick={() => navigate(`/lesson/${lessonId}`)}>{t("Back to Lesson", "العودة للدرس")}</Button>
    </div>
  );

  const isSubmitted = s.submitted[s.currentQ.id];
  const selectedAnswer = s.answers[s.currentQ.id];
  const isCorrect = isSubmitted && String(selectedAnswer) === String(s.currentQ.correct);
  const displayOptions = locale === "ar" ? (s.currentQ.optionsAr ?? s.currentQ.options) : s.currentQ.options;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <motion.div className="space-y-2" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <Badge variant="outline">{t(`Question ${s.currentIndex + 1} of ${s.questions.length}`, `سؤال ${s.currentIndex + 1} من ${s.questions.length}`)}</Badge>
          <Badge variant="secondary">{t(`${s.score}/${s.totalMarks} marks`, `${s.score}/${s.totalMarks} درجة`)}</Badge>
        </div>
        <AnimatedProgress value={s.progressPct} className="h-2" aria-label={t("Quiz progress", "تقدم الاختبار")} />
      </motion.div>

      {/* Question card — AnimatePresence for flip transition between questions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={s.currentQ.id}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 60, rotateY: 8 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -60, rotateY: -8 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] as any }}
          style={{ perspective: 800 }}
        >
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-6 space-y-6">
              {/* Question text */}
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-lg font-medium leading-relaxed">
                    {locale === "ar" ? (s.currentQ.questionAr ?? s.currentQ.question) : s.currentQ.question}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{s.currentQ.marks} {t("mark(s)", "درجة")}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={s.readQuestion} aria-label={t("Read question aloud", "اقرأ السؤال بصوت")}>
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>

              {/* MCQ / True-False — spring-in stagger */}
              {(s.currentQ.type === "mcq" || s.currentQ.type === "true_false") && displayOptions && (
                <div className="space-y-2.5" role="radiogroup" aria-label={t("Answer options", "خيارات الإجابة")}>
                  {displayOptions.map((opt, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isThisCorrect = String(idx) === String(s.currentQ!.correct);
                    let cls = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 text-sm font-medium relative overflow-hidden ";
                    if (!isSubmitted) {
                      cls += isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20"
                        : "border-border hover:border-primary/40 hover:bg-muted/60 hover:shadow-sm";
                    } else {
                      if (isThisCorrect) cls += "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 answer-correct";
                      else if (isSelected && !isThisCorrect) cls += "border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 answer-incorrect";
                      else cls += "border-border/50 text-muted-foreground opacity-60";
                    }
                    return (
                      <motion.div
                        key={idx}
                        initial={prefersReducedMotion ? {} : { opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.07, ease: "easeOut" }}
                      >
                        <RippleButton
                          role="radio"
                          aria-checked={isSelected}
                          disabled={isSubmitted}
                          onClick={() => !isSubmitted && s.setAnswers(prev => ({ ...prev, [s.currentQ!.id]: idx }))}
                          className={cls}
                        >
                          <span className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${isSelected && !isSubmitted ? "border-primary bg-primary text-white" : "border-border"}`}>
                              {idx + 1}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isSubmitted && isThisCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />}
                            {isSubmitted && isSelected && !isThisCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                          </span>
                        </RippleButton>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Short answer */}
              {s.currentQ.type === "short" && (
                <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                  <div className="flex gap-2">
                    <Textarea value={s.textAnswer} onChange={e => s.setTextAnswer(e.target.value)}
                      placeholder={t("Type your answer here...", "اكتب إجابتك هنا...")}
                      rows={3} disabled={isSubmitted} className="flex-1 resize-none rounded-xl"
                      aria-label={t("Your answer", "إجابتك")} />
                    <Button variant="ghost" size="icon" onClick={s.isRecording ? s.stopRecording : s.startRecording}
                      disabled={isSubmitted}
                      aria-label={s.isRecording ? t("Stop recording", "إيقاف التسجيل") : t("Record answer", "تسجيل الإجابة")}
                      className={s.isRecording ? "text-destructive animate-pulse" : ""}>
                      {s.isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Explanation — spring in after submit */}
              <AnimatePresence>
                {isSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] as any }}
                    className={`p-4 rounded-xl border-2 ${isCorrect ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700" : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700"}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect
                        ? <><CheckCircle2 className="w-5 h-5 text-green-600" /><span className="text-sm font-bold text-green-800 dark:text-green-300">{t("Correct!", "صحيح!")}</span></>
                        : <><XCircle className="w-5 h-5 text-amber-600" /><span className="text-sm font-bold text-amber-800 dark:text-amber-300">{t("Not quite — here's why:", "ليس تماماً — إليك السبب:")}</span></>
                      }
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {locale === "ar" ? (s.currentQ.explanationAr ?? s.currentQ.explanation) : s.currentQ.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <motion.div className="flex gap-3 justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Button variant="outline" onClick={() => navigate(`/lesson/${lessonId}`)}>{t("Back to Lesson", "العودة للدرس")}</Button>
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div key="submit" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <Button onClick={s.submitAnswer} disabled={selectedAnswer === undefined && s.textAnswer === ""}
                className="min-w-[140px]">
                {t("Submit Answer", "تقديم الإجابة")}
              </Button>
            </motion.div>
          ) : (
            <motion.div key="next" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <Button onClick={s.nextQuestion} className="min-w-[140px] gap-2">
                {s.currentIndex < s.questions.length - 1
                  ? <>{t("Next Question", "السؤال التالي")} <ArrowRight className="w-4 h-4" /></>
                  : <><Sparkles className="w-4 h-4" />{t("See Results", "عرض النتائج")}</>
                }
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <p className="text-xs text-muted-foreground text-center">
        {t("Press 1–4 to select · Enter to submit · R to read aloud", "اضغط 1–4 للاختيار · Enter للتقديم · R للقراءة")}
      </p>
    </div>
  );
}
