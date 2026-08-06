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
      ? `بناءً على الدرس التالي، أنشئ بالضبط 5 أسئلة اختبار: 3 اختيار متعدد و2 صح/خطأ. يجب أن تغطي الأسئلة أجزاء مختلفة من الدرس. أجب بـ JSON فقط بهذا التنسيق:\n[{"id":"q1","type":"mcq","question":"...","questionAr":"...","options":["أ","ب","ج","د"],"optionsAr":["أ","ب","ج","د"],"correct":0,"explanation":"...","explanationAr":"...","marks":2},{"id":"q2","type":"true_false","question":"...","questionAr":"...","options":["True","False"],"optionsAr":["صحيح","خطأ"],"correct":0,"explanation":"...","explanationAr":"...","marks":1}]\n\nمهم: أعطِ بالضبط 5 أسئلة.\n\nالدرس:\n${sectionSummary}`
      : `Based on the following lesson, create EXACTLY 5 quiz questions: 3 multiple choice (MCQ) and 2 true/false. Questions must cover different parts of the lesson. Reply with JSON ONLY in this format:\n[{"id":"q1","type":"mcq","question":"...","questionAr":"...","options":["A","B","C","D"],"optionsAr":["أ","ب","ج","د"],"correct":0,"explanation":"...","explanationAr":"...","marks":2},{"id":"q2","type":"true_false","question":"...","questionAr":"...","options":["True","False"],"optionsAr":["صحيح","خطأ"],"correct":0,"explanation":"...","explanationAr":"...","marks":1}]\n\nIMPORTANT: Return exactly 5 questions.\n\nLesson:\n${sectionSummary}`;
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
    if (parsed.length >= 5) return parsed;
    const fallbacks: Question[] = [
      { id: "fb1", type: "true_false", question: `The lesson "${lessonTitle}" covers important academic concepts.`, questionAr: `درس "${lessonTitle}" يغطي مفاهيم أكاديمية مهمة.`, options: ["True", "False"], optionsAr: ["صحيح", "خطأ"], correct: 0, explanation: "This lesson covers key curriculum concepts.", explanationAr: "يغطي هذا الدرس مفاهيم منهجية رئيسية.", marks: 1 },
      { id: "fb2", type: "true_false", question: "Understanding this topic helps with related exam questions.", questionAr: "فهم هذا الموضوع يساعد في الأسئلة الامتحانية ذات الصلة.", options: ["True", "False"], optionsAr: ["صحيح", "خطأ"], correct: 0, explanation: "Understanding topics always helps with exams.", explanationAr: "فهم المواضيع يساعد دائماً في الامتحانات.", marks: 1 },
      { id: "fb3", type: "mcq", question: "Which best describes the main purpose of studying this topic?", questionAr: "ما الذي يصف بشكل أفضل الغرض الرئيسي من دراسة هذا الموضوع؟", options: ["To memorise facts", "To understand and apply concepts", "To copy notes", "To skip other topics"], optionsAr: ["لحفظ الحقائق", "لفهم المفاهيم وتطبيقها", "لنسخ الملاحظات", "لتخطي المواضيع الأخرى"], correct: 1, explanation: "The goal is to understand and apply, not just memorise.", explanationAr: "الهدف هو الفهم والتطبيق، وليس الحفظ فقط.", marks: 2 },
    ];
    const needed = 5 - parsed.length;
    return [...parsed, ...fallbacks.slice(0, needed)];
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
  const [textAnswer, setTextAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { data: lesson } = trpc.curriculum.lesson.useQuery({ lessonId }, { enabled: lessonId > 0 });
  const saveProgress = trpc.progress.updateProgress.useMutation();

  useEffect(() => {
    if (!lesson) return;
    const sections = (lesson.sections as any[]) ?? [];
    generateQuestions(lesson.titleEn ?? "", sections, locale).then(qs => {
      if (qs.length > 0) {
        setQuestions(qs);
      } else {
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

  const readQuestion = useCallback(() => {
    if (!currentQ) return;
    const text = locale === "ar" ? (currentQ.questionAr ?? currentQ.question) : currentQ.question;
    tts.speak(text);
  }, [currentQ, locale, tts]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = e => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
          const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SR();
          recognition.lang = locale === "ar" ? "ar-QA" : "en-GB";
          recognition.onresult = (e: any) => { setTextAnswer(e.results[0][0].transcript); };
          recognition.start();
        }
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

  return {
    questions, isGenerating, currentIndex, currentQ,
    answers, setAnswers, submitted,
    textAnswer, setTextAnswer,
    isRecording, isComplete,
    progressPct, score, totalMarks,
    submitAnswer, nextQuestion, readQuestion,
    startRecording, stopRecording,
    lesson, navigate, t, locale,
  };
}

export { generateQuestions };
