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
export type StudySource = { id: string; title: string; authors: string; year: number | null; venue: string; url: string };
const TUTOR_SESSION_STORAGE_KEY = "hikma:tutor-session:v1";
const TUTOR_SESSION_ID_STORAGE_KEY = "hikma:tutor-session-id:v1";

function restoreSessionId() {
  try {
    const existing = window.sessionStorage.getItem(TUTOR_SESSION_ID_STORAGE_KEY);
    if (existing) return existing;
    const next = nanoid();
    window.sessionStorage.setItem(TUTOR_SESSION_ID_STORAGE_KEY, next);
    return next;
  } catch {
    return nanoid();
  }
}

function restoreMessages(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(TUTOR_SESSION_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((message): message is Message =>
      (message?.role === "user" || message?.role === "assistant") &&
      typeof message?.content === "string" &&
      typeof message?.timestamp === "number"
    ).slice(-30);
  } catch {
    return [];
  }
}

export function useTutorState() {
  const { isAuthenticated } = useAuth() as any;
  const { profile, locale } = useProfile();
  const [, params] = useRoute("/tutor/:lessonId");
  const sounds = useSounds();

  const [sessionId] = useState(restoreSessionId);
  const [messages, setMessages] = useState<Message[]>(restoreMessages);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(profile.autoNarrate);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [modality, setModality] = useState<TutorModality>("read");
  const [socraticQuestion, setSocraticQuestion] = useState<string | null>(null);
  const [sources, setSources] = useState<StudySource[]>([]);
  const [isSocraticLoading, setIsSocraticLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
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

  // Preserve this browser-session's conversation through profile-driven
  // rerenders and any safe remounts caused by theme or focus changes.
  useEffect(() => {
    try {
      if (messages.length) window.sessionStorage.setItem(TUTOR_SESSION_STORAGE_KEY, JSON.stringify(messages.slice(-30)));
      else window.sessionStorage.removeItem(TUTOR_SESSION_STORAGE_KEY);
    } catch {
      // Storage is optional; the in-memory conversation still remains usable.
    }
  }, [messages]);

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

  const sendMessage = useCallback((overrideText?: string) => {
    const text = overrideText ?? input;
    if (!text.trim() || isStreaming) return;
    if (!isAuthenticated) { window.location.href = '/signin'; return; }
    const userMsg: Message = { role: "user", content: text.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = text.trim();
    if (!overrideText) setInput("");
    setIsStreaming(true);
    setStreamingContent("");
    setSocraticQuestion(null);
    setSources([]);
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
            conversationHistory: currentMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
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
                if (Array.isArray(parsed.sources)) setSources(parsed.sources as StudySource[]);
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
  }, [input, isStreaming, isAuthenticated, messages, sessionId, profile, locale, ttsEnabled, modality, triggerSocraticCheck, speakText, sounds]);

  const startRecording = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(locale === "ar" ? "يتطلب الإدخال الصوتي متصفح Chrome أو Edge" : "Voice input requires Chrome or Edge.");
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
      recognition.onresult = (event: any) => setInput(event.results[0]?.[0]?.transcript ?? "");
      recognition.onerror = (event: any) => {
        if (event.error !== "aborted") toast.error(locale === "ar" ? "تعذّر سماع رسالتك. حاول مرة أخرى." : "Could not hear your message. Try again.");
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch { toast.error(locale === "ar" ? "الميكروفون غير متاح" : "Microphone not available"); }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop?.();
    setIsRecording(false);
  };

  useEffect(() => () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    recognitionRef.current?.abort?.();
    recognitionRef.current = null;
    tts.stop();
  }, [tts.stop]);

  const clearConversation = () => {
    setMessages([]);
    setSocraticQuestion(null);
    tts.stop();
  };

  return {
    isAuthenticated, profile, locale, params,
    sessionId, messages, setMessages, input, setInput,
    isRecording, ttsEnabled, setTtsEnabled,
    isStreaming, streamingContent,
    modality, setModality,
    socraticQuestion, setSocraticQuestion, isSocraticLoading,
    sources,
    messagesEndRef, textareaRef,
    isSpeaking, tts,
    sendMessage, startRecording, stopRecording, clearConversation, speakText,
    sounds,
  };
}
