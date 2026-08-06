/**
 * useTutorState — all state and callbacks for TutorPage.
 * Extracted to keep TutorPage under 300 lines.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useRoute } from "wouter";
import { nanoid } from "nanoid";
import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { useSounds } from "@/hooks/useSounds";
import { useTTS } from "@/hooks/useTTS";
import { toast } from "sonner";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}
export type TutorModality = "read" | "listen" | "map";

export function useTutorState() {
  const { isAuthenticated, startLogin } = useAuth() as any;
  const { profile, locale } = useProfile();
  const [, params] = useRoute("/tutor/:lessonId");
  const sounds = useSounds();

  const [sessionId] = useState(() => nanoid());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(profile.autoNarrate);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [modality, setModality] = useState<TutorModality>("read");
  const [socraticQuestion, setSocraticQuestion] = useState<string | null>(null);
  const [isSocraticLoading, setIsSocraticLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const tts = useTTS({
    rate: profile.speechRate,
    lang: locale === "ar" ? "ar-SA" : "en-GB",
    voiceHint: profile.voice,
  });
  const isSpeaking = tts.isSpeaking;

  const speakText = useCallback((text: string) => {
    const plain = text.replace(/[#*_`~[\]]/g, "").slice(0, 1000);
    tts.speak(plain);
  }, [tts]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, socraticQuestion]);

  // Greeting on mount
  useEffect(() => {
    if (messages.length === 0) {
      const greeting: Message = {
        role: "assistant",
        content: locale === "ar"
          ? "مرحباً! أنا حكمة، معلمك الذكي. كيف يمكنني مساعدتك اليوم؟"
          : "Hello — I'm Hikma, your learning companion. This is a quiet space to ask anything, go at your own pace, and arrive at understanding. What would you like to explore today?",
        timestamp: Date.now(),
      };
      setMessages([greeting]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerSocraticCheck = useCallback(async (assistantReply: string) => {
    setIsSocraticLoading(true);
    setSocraticQuestion(null);
    try {
      const prompt = locale === "ar"
        ? `بناءً على ردك السابق، اطرح سؤالاً واحداً قصيراً للتحقق من الفهم. السؤال فقط، بدون مقدمة.`
        : `Based on your previous reply, ask ONE short comprehension check question to the student. Return only the question, no preamble.`;
      const res = await fetch("/api/tutor/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          sessionId: `socratic-${Date.now()}`,
          profile: { mode: profile.mode, locale, curriculum: profile.curriculum, tier: profile.tier },
          conversationHistory: [{ role: "assistant", content: assistantReply }],
        }),
      });
      if (!res.ok) return;
      const reader = res.body?.getReader();
      if (!reader) return;
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
            try { const p = JSON.parse(trimmed.slice(6)); if (p.delta) full += p.delta; } catch { /* skip */ }
          }
        }
      }
      if (full.trim()) setSocraticQuestion(full.trim());
    } catch { /* silent */ } finally { setIsSocraticLoading(false); }
  }, [locale, profile]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    if (!isAuthenticated) { startLogin?.(); return; }
    const userMsg: Message = { role: "user", content: input.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");
    setSocraticQuestion(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentMessages = messages;
    (async () => {
      try {
        const res = await fetch("/api/tutor/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: currentInput,
            sessionId,
            profile: { mode: profile.mode, chunkSize: profile.chunkSize, readingLevel: profile.readingLevel, locale, curriculum: profile.curriculum, tier: profile.tier, tashkeel: profile.tashkeel, numerals: profile.numerals },
            conversationHistory: currentMessages.map(m => ({ role: m.role, content: m.content })),
          }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream body");
        const decoder = new TextDecoder();
        let fullContent = ""; let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed === "data: [DONE]") break;
            if (trimmed.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                if (parsed.delta) { fullContent += parsed.delta; setStreamingContent(fullContent); }
                if (parsed.error) toast.error(locale === "ar" ? "خطأ في حكمة AI" : "Hikma AI error: " + parsed.error);
              } catch { /* skip */ }
            }
          }
        }
        if (fullContent) {
          const assistantMsg: Message = { role: "assistant", content: fullContent, timestamp: Date.now() };
          setMessages(prev => [...prev, assistantMsg]);
          sounds.questionAppear();
          if (ttsEnabled || modality === "listen") speakText(fullContent);
          triggerSocraticCheck(fullContent);
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          toast.error(locale === "ar" ? "خطأ في حكمة AI" : "Hikma AI error: " + (err?.message ?? "Unknown error"));
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        abortControllerRef.current = null;
      }
    })();
  }, [input, isStreaming, isAuthenticated, messages, sessionId, profile, locale, ttsEnabled, modality, triggerSocraticCheck, speakText, sounds, startLogin]);

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
          recognition.onresult = (e: any) => { setInput(e.results[0][0].transcript); };
          recognition.start();
        }
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch { toast.error(locale === "ar" ? "الميكروفون غير متاح" : "Microphone not available"); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const clearConversation = () => {
    setMessages([]);
    setSocraticQuestion(null);
    tts.stop();
  };

  return {
    isAuthenticated, startLogin, profile, locale, params,
    sessionId, messages, setMessages, input, setInput,
    isRecording, ttsEnabled, setTtsEnabled,
    isStreaming, streamingContent,
    modality, setModality,
    socraticQuestion, setSocraticQuestion, isSocraticLoading,
    messagesEndRef, textareaRef,
    isSpeaking, tts,
    sendMessage, startRecording, stopRecording, clearConversation, speakText,
    sounds,
  };
}
