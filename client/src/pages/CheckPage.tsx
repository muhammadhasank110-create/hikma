/**
 * CheckPage — slim orchestrator.
 * All state logic lives in useCheckState (client/src/hooks/useCheckState.ts).
 */
import { useEffect } from "react";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnimatedProgress } from "@/components/PageTransition";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Volume2, Mic, MicOff, Trophy, RotateCcw, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { useCheckState } from "@/hooks/useCheckState";

export default function CheckPage() {
  const [, params] = useRoute("/check/:lessonId");
  const lessonId = parseInt(params?.lessonId ?? "0");
  const s = useCheckState(lessonId);
  const { t, locale, navigate } = s;

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

  if (s.isGenerating) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
      <p className="text-muted-foreground">{t("Generating questions from lesson content...", "جاري إنشاء الأسئلة...")}</p>
    </div>
  );

  if (s.generationFailed) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
        <span className="text-2xl" aria-hidden="true">⚠</span>
      </div>
      <h1 className="text-xl font-bold">{t("Couldn't generate questions", "تعذّر إنشاء الأسئلة")}</h1>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
        {t(
          "Hikma AI couldn't create questions for this lesson right now. This is usually a temporary issue.",
          "تعذّر على حكمة AI إنشاء أسئلة لهذا الدرس الآن. هذه عادةً مشكلة مؤقتة."
        )}
      </p>
      <div className="flex gap-3 justify-center">
        <Button onClick={() => window.location.reload()} variant="default">
          <RotateCcw className="w-4 h-4 mr-2" />{t("Try Again", "حاول مجدداً")}
        </Button>
        <Button onClick={() => window.history.back()} variant="outline">
          {t("Back to Lesson", "العودة للدرس")}
        </Button>
      </div>
    </div>
  );

  if (s.isComplete) {
    const pct = s.totalMarks > 0 ? Math.round((s.score / s.totalMarks) * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center">
          <CardContent className="p-8 space-y-6">
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto" aria-hidden="true" />
            <h1 className="text-2xl font-bold font-display">{t("Check Complete!", "اكتمل الاختبار!")}</h1>
            <div className="text-5xl font-bold text-primary">{pct}%</div>
            <p className="text-muted-foreground">{t(`You scored ${s.score} out of ${s.totalMarks} marks`, `حصلت على ${s.score} من ${s.totalMarks} درجة`)}</p>
            <Progress value={pct} className="h-3" />
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={() => { window.location.reload(); }}>
                <RotateCcw className="w-4 h-4 mr-2" />{t("Try Again", "حاول مجدداً")}
              </Button>
              <Button variant="outline" onClick={() => navigate(`/lesson/${lessonId}`)}>{t("Back to Lesson", "العودة للدرس")}</Button>
              <Button variant="outline" onClick={() => navigate("/tutor")}>{t("Ask Tutor", "اسأل المعلم")}</Button>
            </div>
          </CardContent>
        </Card>
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
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{t(`Question ${s.currentIndex + 1} of ${s.questions.length}`, `سؤال ${s.currentIndex + 1} من ${s.questions.length}`)}</Badge>
          <Badge variant="secondary">{t(`${s.score}/${s.totalMarks} marks`, `${s.score}/${s.totalMarks} درجة`)}</Badge>
        </div>
        <AnimatedProgress value={s.progressPct} className="h-2" aria-label={t("Quiz progress", "تقدم الاختبار")} />
      </div>

      {/* Question card */}
      <Card>
        <CardContent className="p-6 space-y-6">
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

          {/* MCQ / True-False */}
          {(s.currentQ.type === "mcq" || s.currentQ.type === "true_false") && displayOptions && (
            <div className="space-y-2" role="radiogroup" aria-label={t("Answer options", "خيارات الإجابة")}>
              {displayOptions.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                const isThisCorrect = String(idx) === String(s.currentQ!.correct);
                let cls = "w-full text-left p-3 rounded-lg border transition-colors text-sm ";
                if (!isSubmitted) {
                  cls += isSelected ? "border-primary bg-primary/10 font-medium" : "border-border hover:border-primary/50 hover:bg-muted";
                } else {
                  if (isThisCorrect) cls += "border-green-500 bg-green-50 text-green-800 font-medium answer-correct";
                  else if (isSelected && !isThisCorrect) cls += "border-amber-400 bg-amber-50 text-amber-800 answer-incorrect";
                  else cls += "border-border text-muted-foreground";
                }
                return (
                  <button key={idx} role="radio" aria-checked={isSelected} disabled={isSubmitted}
                    onClick={() => !isSubmitted && s.setAnswers(prev => ({ ...prev, [s.currentQ!.id]: idx }))}
                    className={cls}>
                    <span className="font-mono text-xs mr-2 opacity-60">{idx + 1}.</span>
                    {opt}
                    {isSubmitted && isThisCorrect && <CheckCircle2 className="w-4 h-4 inline ml-2 text-green-600" />}
                    {isSubmitted && isSelected && !isThisCorrect && <XCircle className="w-4 h-4 inline ml-2 text-red-500" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Short answer */}
          {s.currentQ.type === "short" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Textarea value={s.textAnswer} onChange={e => s.setTextAnswer(e.target.value)}
                  placeholder={t("Type your answer here...", "اكتب إجابتك هنا...")}
                  rows={3} disabled={isSubmitted} className="flex-1 resize-none"
                  aria-label={t("Your answer", "إجابتك")} />
                <Button variant="ghost" size="icon" onClick={s.isRecording ? s.stopRecording : s.startRecording}
                  disabled={isSubmitted}
                  aria-label={s.isRecording ? t("Stop recording", "إيقاف التسجيل") : t("Record answer", "تسجيل الإجابة")}
                  className={s.isRecording ? "text-destructive animate-pulse" : ""}>
                  {s.isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Explanation */}
          {isSubmitted && (
            <div className={`p-4 rounded-lg border ${isCorrect ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-amber-600" />}
                <span className={`text-sm font-semibold ${isCorrect ? "text-green-800" : "text-amber-800"}`}>
                  {isCorrect ? t("Correct!", "صحيح!") : t("Not quite — here's why:", "ليس تماماً — إليك السبب:")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? (s.currentQ.explanationAr ?? s.currentQ.explanation) : s.currentQ.explanation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={() => navigate(`/lesson/${lessonId}`)}>{t("Back to Lesson", "العودة للدرس")}</Button>
        {!isSubmitted ? (
          <Button onClick={s.submitAnswer} disabled={selectedAnswer === undefined && s.textAnswer === ""}>{t("Submit Answer", "تقديم الإجابة")}</Button>
        ) : (
          <Button onClick={s.nextQuestion}>
            {s.currentIndex < s.questions.length - 1
              ? <>{t("Next Question", "السؤال التالي")} <ArrowRight className="w-4 h-4 ml-2" /></>
              : t("See Results", "عرض النتائج")}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {t("Press 1–4 to select · Enter to submit · R to read aloud", "اضغط 1–4 للاختيار · Enter للتقديم · R للقراءة")}
      </p>
    </div>
  );
}
