import { useState, useEffect, useCallback, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useProfile } from "@/contexts/ProfileContext";
import { useTTS } from "@/hooks/useTTS";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ArrowRight, Mic, MicOff, Volume2, Loader2, RotateCcw, Trophy } from "lucide-react";
import { useSounds } from "@/hooks/useSounds";

interface Question {
  id: string;
  type: "mcq" | "short" | "true_false";
  question: string;
  questionAr?: string;
  options?: string[];
  optionsAr?: string[];
  correct: string | number;
  explanation: string;
  explanationAr?: string;
  commandWord?: string;
  marks: number;
}

// Generates questions dynamically from lesson sections using the AI tutor
async function generateQuestions(lessonTitle: string, sections: any[], locale: string): Promise<Question[]> {
  try {
    const sectionSummary = sections.slice(0, 5).map((s: any) =>
      `${s.title ?? ""}: ${(s.body ?? "").slice(0, 200)}`
    ).join("\n\n");

    const prompt = locale === "ar"
      ? `بناءً على الدرس التالي، اصنع 5 أسئلة اختبار: 3 اختيار من متعدد و2 صح/خطأ. أجب بـ JSON فقط بالشكل التالي:\n[{"id":"q1","type":"mcq","question":"...","questionAr":"...","options":["أ","ب","ج","د"],"optionsAr":["أ","ب","ج","د"],"correct":0,"explanation":"...","explanationAr":"...","marks":2}]\n\nالدرس:\n${sectionSummary}`
      : `Based on the following lesson, create 5 quiz questions: 3 multiple choice and 2 true/false. Reply with JSON only in this format:\n[{"id":"q1","type":"mcq","question":"...","questionAr":"...","options":["A","B","C","D"],"optionsAr":["أ","ب","ج","د"],"correct":0,"explanation":"...","explanationAr":"...","marks":2}]\n\nLesson:\n${sectionSummary}`;

    const res = await fetch("/api/tutor/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: prompt,
        sessionId: `quiz-${Date.now()}`,
        profile: { mode: "reading", chunkSize: "standard", readingLevel: 5, locale, curriculum: "igcse_edexcel", tier: "core", tashkeel: false, numerals: false },
        conversationHistory: [],
      }),
    });

    if (!res.ok) throw new Error("Stream failed");
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No reader");
    const decoder = new TextDecoder();
    let full = ""; let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (t === "data: [DONE]") break;
        if (t.startsWith("data: ")) {
          try { const p = JSON.parse(t.slice(6)); if (p.delta) full += p.delta; } catch { /* skip */ }
        }
      }
    }
    // Extract JSON array from response
    const match = full.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON found");
    return JSON.parse(match[0]) as Question[];
  } catch {
    return [];
  }
}

export default function CheckPage() {
  const [, params] = useRoute("/check/:lessonId");
  const [, navigate] = useLocation();
  const { profile, locale } = useProfile();
  const { isAuthenticated } = useAuth() as any;
  const lessonId = parseInt(params?.lessonId ?? "0");
  const sounds = useSounds();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [textAnswer, setTextAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { data: lesson } = trpc.curriculum.lesson.useQuery({ lessonId }, { enabled: lessonId > 0 });
  const saveProgress = trpc.progress.updateProgress.useMutation();
  const tts = useTTS({ lang: locale === "ar" ? "ar-SA" : "en-GB" });

  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  // Generate questions when lesson loads
  useEffect(() => {
    if (!lesson) return;
    setIsGenerating(true);
    const sections = (lesson.sections as any[]) ?? [];
    generateQuestions(lesson.titleEn ?? "", sections, locale).then(qs => {
      if (qs.length > 0) {
        setQuestions(qs);
      } else {
        // Fallback static questions if AI fails
        setQuestions([
          { id: "q1", type: "true_false", question: `The lesson "${lesson.titleEn}" covers important concepts.`, questionAr: `درس "${lesson.titleAr ?? lesson.titleEn}" يغطي مفاهيم مهمة.`, options: ["True", "False"], optionsAr: ["صحيح", "خطأ"], correct: 0, explanation: "This is a general comprehension check.", explanationAr: "هذا فحص عام للفهم.", marks: 1 },
        ]);
      }
      setIsGenerating(false);
    });
  }, [lesson, locale]);

  const currentQ = questions[currentIndex];
  const progressPct = questions.length > 0 ? Math.round(((currentIndex + (submitted[currentQ?.id ?? ""] ? 1 : 0)) / questions.length) * 100) : 0;

  const score = Object.entries(submitted).reduce((acc, [qId, isSubmitted]) => {
    if (!isSubmitted) return acc;
    const q = questions.find(q => q.id === qId);
    if (!q) return acc;
    const ans = answers[qId];
    const isCorrect = String(ans) === String(q.correct);
    return acc + (isCorrect ? q.marks : 0);
  }, 0);

  const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0);

  const submitAnswer = useCallback(() => {
    if (!currentQ) return;
    const ans = currentQ.type === "short" ? textAnswer : answers[currentQ.id];
    if (ans === undefined || ans === "") return;

    setSubmitted(prev => ({ ...prev, [currentQ.id]: true }));
    if (currentQ.type === "short") {
      setAnswers(prev => ({ ...prev, [currentQ.id]: textAnswer }));
    }
    // Sound feedback for MCQ/TF
    if (currentQ.type !== "short") {
      const isCorrect = String(ans) === String(currentQ.correct);
      if (isCorrect) sounds.correct();
      else sounds.incorrect();
    }
  }, [currentQ, textAnswer, answers, sounds]);

  const nextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setTextAnswer("");
      sounds.questionAppear();
    } else {
      setIsComplete(true);
      sounds.complete();
      if (isAuthenticated) {
        saveProgress.mutate({ lessonId, sectionId: 0, cursorOffset: 0, status: "complete" });
      }
    }
  }, [currentIndex, questions.length, isAuthenticated, lessonId, sounds]);

  const readQuestion = useCallback(() => {
    if (!currentQ) return;
    const text = locale === "ar" ? (currentQ.questionAr ?? currentQ.question) : currentQ.question;
    tts.speak(text);
  }, [currentQ, locale, profile]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = e => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          try {
            // Use browser STT as fallback
            if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
              const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
              const recognition = new SR();
              recognition.lang = locale === "ar" ? "ar-QA" : "en-GB";
              recognition.onresult = (e: any) => {
                setTextAnswer(e.results[0][0].transcript);
              };
              recognition.start();
            }
          } catch { /* skip */ }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch { toast.error(t("Microphone not available", "الميكروفون غير متاح")); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "1") { if (currentQ?.options) setAnswers(prev => ({ ...prev, [currentQ.id]: 0 })); }
      if (e.key === "2") { if (currentQ?.options?.[1] !== undefined) setAnswers(prev => ({ ...prev, [currentQ.id]: 1 })); }
      if (e.key === "3") { if (currentQ?.options?.[2] !== undefined) setAnswers(prev => ({ ...prev, [currentQ.id]: 2 })); }
      if (e.key === "4") { if (currentQ?.options?.[3] !== undefined) setAnswers(prev => ({ ...prev, [currentQ.id]: 3 })); }
      if (e.key === "Enter" && !submitted[currentQ?.id ?? ""]) submitAnswer();
      if (e.key === "Enter" && submitted[currentQ?.id ?? ""]) nextQuestion();
      if (e.key === "r" || e.key === "R") readQuestion();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentQ, submitted, submitAnswer, nextQuestion, readQuestion]);

  if (isGenerating) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">{t("Generating questions from lesson content...", "جاري إنشاء الأسئلة من محتوى الدرس...")}</p>
      </div>
    );
  }

  if (isComplete) {
    const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center">
          <CardContent className="p-8 space-y-6">
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto" aria-hidden="true" />
            <h1 className="text-2xl font-bold font-display">{t("Check Complete!", "اكتمل الاختبار!")}</h1>
            <div className="text-5xl font-bold text-primary">{pct}%</div>
            <p className="text-muted-foreground">
              {t(`You scored ${score} out of ${totalMarks} marks`, `حصلت على ${score} من ${totalMarks} درجة`)}
            </p>
            <Progress value={pct} className="h-3" />
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={() => { setCurrentIndex(0); setAnswers({}); setSubmitted({}); setIsComplete(false); setTextAnswer(""); }}>
                <RotateCcw className="w-4 h-4 mr-2" />
                {t("Try Again", "حاول مجدداً")}
              </Button>
              <Button variant="outline" onClick={() => navigate(`/lesson/${lessonId}`)}>
                {t("Back to Lesson", "العودة للدرس")}
              </Button>
              <Button variant="outline" onClick={() => navigate("/tutor")}>
                {t("Ask Tutor", "اسأل المعلم")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("No questions available.", "لا توجد أسئلة.")}</p>
        <Button className="mt-4" onClick={() => navigate(`/lesson/${lessonId}`)}>{t("Back to Lesson", "العودة للدرس")}</Button>
      </div>
    );
  }

  const isSubmitted = submitted[currentQ.id];
  const selectedAnswer = answers[currentQ.id];
  const isCorrect = isSubmitted && String(selectedAnswer) === String(currentQ.correct);
  const displayOptions = locale === "ar" ? (currentQ.optionsAr ?? currentQ.options) : currentQ.options;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{t(`Question ${currentIndex + 1} of ${questions.length}`, `سؤال ${currentIndex + 1} من ${questions.length}`)}</Badge>
          <Badge variant="secondary">{t(`${score}/${totalMarks} marks`, `${score}/${totalMarks} درجة`)}</Badge>
        </div>
        <Progress value={progressPct} className="h-2" aria-label={t("Quiz progress", "تقدم الاختبار")} />
      </div>

      {/* Question card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Command word badge */}
          {currentQ.commandWord && (
            <Badge className="bg-clay text-white text-xs">{currentQ.commandWord}</Badge>
          )}

          {/* Question text */}
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-lg font-medium leading-relaxed">
                {locale === "ar" ? (currentQ.questionAr ?? currentQ.question) : currentQ.question}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{currentQ.marks} {t("mark(s)", "درجة")}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={readQuestion}
              aria-label={t("Read question aloud", "اقرأ السؤال بصوت عالٍ")}
              className="shrink-0"
            >
              <Volume2 className="w-4 h-4" />
            </Button>
          </div>

          {/* MCQ / True-False options */}
          {(currentQ.type === "mcq" || currentQ.type === "true_false") && displayOptions && (
            <div className="space-y-2" role="radiogroup" aria-label={t("Answer options", "خيارات الإجابة")}>
              {displayOptions.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                const isThisCorrect = String(idx) === String(currentQ.correct);
                let cls = "w-full text-left p-3 rounded-lg border transition-colors text-sm ";
                if (!isSubmitted) {
                  cls += isSelected ? "border-primary bg-primary/10 font-medium" : "border-border hover:border-primary/50 hover:bg-muted";
                } else {
                  if (isThisCorrect) cls += "border-green-500 bg-green-50 text-green-800 font-medium answer-correct";
                  else if (isSelected && !isThisCorrect) cls += "border-amber-400 bg-amber-50 text-amber-800 answer-incorrect";
                  else cls += "border-border text-muted-foreground";
                }
                return (
                  <button
                    key={idx}
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isSubmitted}
                    onClick={() => !isSubmitted && setAnswers(prev => ({ ...prev, [currentQ.id]: idx }))}
                    className={cls}
                  >
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
          {currentQ.type === "short" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Textarea
                  value={textAnswer}
                  onChange={e => setTextAnswer(e.target.value)}
                  placeholder={t("Type your answer here...", "اكتب إجابتك هنا...")}
                  rows={3}
                  disabled={isSubmitted}
                  className="flex-1 resize-none"
                  aria-label={t("Your answer", "إجابتك")}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isSubmitted}
                  aria-label={isRecording ? t("Stop recording", "إيقاف التسجيل") : t("Record answer", "تسجيل الإجابة")}
                  className={isRecording ? "text-destructive animate-pulse" : ""}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Explanation (shown after submit) */}
          {isSubmitted && (
            <div className={`p-4 rounded-lg border ${isCorrect ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                {isCorrect
                  ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                  : <XCircle className="w-4 h-4 text-amber-600" />}
                <span className={`text-sm font-semibold ${isCorrect ? "text-green-800" : "text-amber-800"}`}>
                  {isCorrect ? t("Correct!", "صحيح!") : t("Not quite — here's why:", "ليس تماماً — إليك السبب:")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? (currentQ.explanationAr ?? currentQ.explanation) : currentQ.explanation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={() => navigate(`/lesson/${lessonId}`)}>
          {t("Back to Lesson", "العودة للدرس")}
        </Button>
        {!isSubmitted ? (
          <Button
            onClick={submitAnswer}
            disabled={selectedAnswer === undefined && textAnswer === ""}
          >
            {t("Submit Answer", "تقديم الإجابة")}
          </Button>
        ) : (
          <Button onClick={nextQuestion}>
            {currentIndex < questions.length - 1
              ? <>{t("Next Question", "السؤال التالي")} <ArrowRight className="w-4 h-4 ml-2" /></>
              : t("See Results", "عرض النتائج")}
          </Button>
        )}
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-muted-foreground text-center">
        {t("Press 1–4 to select · Enter to submit · R to read aloud", "اضغط 1–4 للاختيار · Enter للتقديم · R للقراءة بصوت عالٍ")}
      </p>
    </div>
  );
}
