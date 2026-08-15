/**
 * useCheckState — all state and callbacks for CheckPage.
 * Extracted to keep CheckPage under 300 lines.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSounds } from "@/hooks/useSounds";
import { useTTS } from "@/hooks/useTTS";
import { toast } from "sonner";

export interface Question {
  id: string;
  type: "mcq" | "true_false" | "short";
  question: string;
  questionAr?: string;
  options?: string[];
  optionsAr?: string[];
  correct?: number;
  explanation?: string;
  explanationAr?: string;
  hints?: string[];
  hintsAr?: string[];
  marks: number;
}

async function generateQuestions(lessonTitle: string, sections: any[], locale: string): Promise<Question[]> {
  try {
    const sectionSummary = sections
      .slice(0, 5)
      .map((s: any) => locale === "ar"
        ? `${s.titleAr ?? s.titleEn ?? ""}: ${(s.bodyAr ?? s.bodyEn ?? "").slice(0, 300)}`
        : `${s.titleEn ?? ""}: ${(s.bodyEn ?? "").slice(0, 300)}`)
      .join("\n\n");
    const prompt = locale === "ar"
      ? `بناءً على الدرس التالي، أنشئ بالضبط 5 أسئلة اختبار: 3 اختيار متعدد و2 صح/خطأ. يجب أن تغطي الأسئلة أجزاء مختلفة من الدرس. أجب بـ JSON فقط بهذا التنسيق:\n[{"id":"q1","type":"mcq","question":"...","questionAr":"...","options":["أ","ب","ج","د"],"optionsAr":["أ","ب","ج","د"],"correct":0,"explanation":"...","explanationAr":"...","hints":["تلميح صغير","تلميح أوضح","خطوة إرشادية"],"hintsAr":["تلميح صغير","تلميح أوضح","خطوة إرشادية"],"marks":2}]\n\nالمهم: أعطِ تلميحات تدريجية لا تكشف الإجابة، وأعطِ بالضبط 5 أسئلة.\n\nالدرس:\n${sectionSummary}`
      : `Based on the following lesson, create EXACTLY 5 quiz questions: 3 multiple choice (MCQ) and 2 true/false. Questions must cover different parts of the lesson. Reply with JSON ONLY in this format:\n[{"id":"q1","type":"mcq","question":"...","questionAr":"...","options":["A","B","C","D"],"optionsAr":["أ","ب","ج","د"],"correct":0,"explanation":"...","explanationAr":"...","hints":["Small clue","Stronger clue","Guiding step"],"hintsAr":["تلميح صغير","تلميح أوضح","خطوة إرشادية"],"marks":2}]\n\nIMPORTANT: Include three progressive hints that do not reveal the answer and return exactly 5 questions.\n\nLesson:\n${sectionSummary}`;
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
    const match = full.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON found");
    const parsed = JSON.parse(match[0]) as Question[];
    // Task 3: Return whatever the AI generated (even if < 5) — no filler questions.
    // If the AI returned nothing, throw so the caller shows the error state.
    if (parsed.length === 0) throw new Error("AI returned no questions");
    return parsed;
  } catch {
    return [];
  }
}

export function useCheckState(lessonId: number) {
  const [, navigate] = useLocation();
  const { profile, locale } = useProfile();
  const { isAuthenticated } = useAuth() as any;
  const sounds = useSounds();
  const tts = useTTS({ rate: profile.speechRate, lang: locale === "ar" ? "ar-SA" : "en-GB", voiceHint: profile.voice });
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [hintLevels, setHintLevels] = useState<Record<string, number>>({});
  const [textAnswer, setTextAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [generationFailed, setGenerationFailed] = useState(false);
  const recognitionRef = useRef<any>(null);

  const { data: lesson, isError: lessonLoadFailed } = trpc.curriculum.lesson.useQuery({ lessonId }, { enabled: lessonId > 0 });
  const saveProgress = trpc.progress.updateProgress.useMutation();

  useEffect(() => {
    let cancelled = false;
    if (!lesson) {
      if (lessonLoadFailed) {
        setGenerationFailed(true);
        setIsGenerating(false);
      }
      return () => { cancelled = true; };
    }
    setIsGenerating(true);
    setGenerationFailed(false);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setSubmitted({});
    setHintLevels({});
    setTextAnswer("");
    setIsComplete(false);
    const sections = (lesson.sections as any[]) ?? [];
    generateQuestions(lesson.titleEn ?? "", sections, locale).then(qs => {
      if (cancelled) return;
      if (qs.length > 0) {
        setQuestions(qs);
        setGenerationFailed(false);
      } else {
        // Task 3: Show honest error state instead of filler questions
        setGenerationFailed(true);
      }
      setIsGenerating(false);
    }).catch(() => {
      if (cancelled) return;
      setGenerationFailed(true);
      setIsGenerating(false);
    });
    return () => { cancelled = true; };
  }, [lesson, lessonId, locale, lessonLoadFailed]);

  const currentQ = questions[currentIndex];
  const progressPct = questions.length > 0 ? Math.round(((currentIndex + (submitted[currentQ?.id ?? ""] ? 1 : 0)) / questions.length) * 100) : 0;
  const score = Object.entries(submitted).reduce((acc, [qId, isSubmitted]) => {
    if (!isSubmitted) return acc;
    const q = questions.find(q => q.id === qId);
    if (!q) return acc;
    const ans = answers[qId];
    return acc + (String(ans) === String(q.correct) ? q.marks : 0);
  }, 0);
  const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0);

  const submitAnswer = useCallback(() => {
    if (!currentQ) return;
    const ans = currentQ.type === "short" ? textAnswer : answers[currentQ.id];
    if (ans === undefined || ans === "") return;
    setSubmitted(prev => ({ ...prev, [currentQ.id]: true }));
    if (currentQ.type === "short") setAnswers(prev => ({ ...prev, [currentQ.id]: textAnswer }));
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
  }, [currentIndex, questions.length, isAuthenticated, lessonId, sounds, saveProgress]);

  const requestHint = useCallback(() => {
    if (!currentQ || submitted[currentQ.id]) return;
    setHintLevels(previous => ({ ...previous, [currentQ.id]: Math.min((previous[currentQ.id] ?? 0) + 1, 3) }));
  }, [currentQ, submitted]);

  const retryQuestion = useCallback(() => {
    if (!currentQ) return;
    setSubmitted(previous => {
      const next = { ...previous };
      delete next[currentQ.id];
      return next;
    });
    if (currentQ.type === "short") setTextAnswer("");
  }, [currentQ]);

  const currentHintLevel = currentQ ? hintLevels[currentQ.id] ?? 0 : 0;
  const currentHint = currentQ && currentHintLevel > 0
    ? (locale === "ar" ? (currentQ.hintsAr ?? currentQ.hints) : currentQ.hints)?.[currentHintLevel - 1]
    : undefined;

  const readQuestion = useCallback(() => {
    if (!currentQ) return;
    const text = locale === "ar" ? (currentQ.questionAr ?? currentQ.question) : currentQ.question;
    tts.speak(text);
  }, [currentQ, locale, tts]);

  // Auto-narrate question when it changes (for blind/audio-first users with autoNarrate=true)
  useEffect(() => {
    if (!profile.autoNarrate || !currentQ) return;
    const timer = setTimeout(() => {
      const text = locale === "ar" ? (currentQ.questionAr ?? currentQ.question) : currentQ.question;
      tts.speak(text);
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentQ?.id, profile.autoNarrate]);

  const startRecording = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(t("Voice answers require Chrome or Edge", "تتطلب الإجابات الصوتية متصفح Chrome أو Edge"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      recognitionRef.current?.abort?.();
      const recognition = new SpeechRecognition();
      recognition.lang = locale === "ar" ? "ar-QA" : "en-GB";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event: any) => setTextAnswer(event.results[0]?.[0]?.transcript ?? "");
      recognition.onerror = (event: any) => {
        if (event.error !== "aborted") toast.error(t("Could not hear an answer. Try again.", "تعذّر سماع الإجابة. حاول مرة أخرى."));
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch { toast.error(t("Microphone not available", "الميكروفون غير متاح")); }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop?.();
    setIsRecording(false);
  };

  useEffect(() => () => {
    recognitionRef.current?.abort?.();
    recognitionRef.current = null;
  }, []);

  return {
    questions, isGenerating, generationFailed, currentIndex, currentQ,
    answers, setAnswers, submitted,
    textAnswer, setTextAnswer,
    isRecording, isComplete,
    progressPct, score, totalMarks,
    submitAnswer, nextQuestion, readQuestion,
    requestHint, retryQuestion, currentHint, currentHintLevel,
    startRecording, stopRecording,
    lesson, navigate, t, locale,
  };
}

export { generateQuestions };
