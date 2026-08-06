import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import {
  Send, Mic, MicOff, Volume2, Bot, User, Loader2, RefreshCw,
  Headphones, BookOpen, Map, HelpCircle
} from "lucide-react";
import { nanoid } from "nanoid";
import { useProfile } from "@/contexts/ProfileContext";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

type TutorModality = "read" | "listen" | "map";

export default function TutorPage() {
  const { isAuthenticated, startLogin } = useAuth() as any;
  const { profile, locale } = useProfile();
  const [, params] = useRoute("/tutor/:lessonId");

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
    const plain = text.replace(/[#*_`~\[\]]/g, "").slice(0, 1000);
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
          ? "مرحباً! أنا حكمة، معلمك الذكي. كيف يمكنني مساعدتك اليوم؟ يمكنك أن تسألني أي سؤال عن دروسك."
          : "Hello — I'm Hikma, your learning companion. This is a quiet space to ask anything, go at your own pace, and arrive at understanding. What would you like to explore today?",
        timestamp: Date.now(),
      };
      setMessages([greeting]);
    }
  }, []);

  // Socratic check: ask one comprehension question after each assistant reply
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
            profile: {
              mode: profile.mode,
              chunkSize: profile.chunkSize,
              readingLevel: profile.readingLevel,
              locale,
              curriculum: profile.curriculum,
              tier: profile.tier,
              tashkeel: profile.tashkeel,
              numerals: profile.numerals,
            },
            conversationHistory: currentMessages.map(m => ({ role: m.role, content: m.content })),
          }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream body");

        const decoder = new TextDecoder();
        let fullContent = "";
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
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
          if (ttsEnabled || modality === "listen") speakText(fullContent);
          // Trigger Socratic check after each reply
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
  }, [input, isStreaming, isAuthenticated, messages, sessionId, profile, locale, ttsEnabled, modality, triggerSocraticCheck]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Voice commands wired into TutorPage
  // When user says "Hikma, ask a question" or speaks into the tutor
  const handleVoiceAction = useCallback((action: any) => {
    switch (action.type) {
      case "stop_speech": tts.stop(); break;
      case "read_aloud":
        // Read the last assistant message
        const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
        if (lastAssistant) speakText(lastAssistant.content);
        break;
      case "go_home": window.location.href = "/dashboard"; break;
      case "navigate": window.location.href = action.path; break;
      default: break;
    }
  }, [messages, speakText, tts]);

  useVoiceCommands({
    lang: locale === "ar" ? "ar-QA" : "en-GB",
    locale,
    context: "tutor",
    onAction: handleVoiceAction,
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.lang = locale === "ar" ? "ar-QA" : "en-GB";
          recognition.onresult = (event: any) => setInput(event.results[0][0].transcript);
          recognition.onerror = () => toast.error(locale === "ar" ? "فشل التعرف على الصوت" : "Speech recognition failed");
          recognition.start();
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error(locale === "ar" ? "تعذر الوصول إلى الميكروفون" : "Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const t = {
    title: locale === "ar" ? "حكمة AI" : "Hikma AI",
    placeholder: locale === "ar" ? "اسأل سؤالاً… (Enter للإرسال، Shift+Enter لسطر جديد)" : "Ask a question… (Enter to send, Shift+Enter for new line)",
    send: locale === "ar" ? "إرسال" : "Send",
    tts: locale === "ar" ? "قراءة الردود" : "Read replies aloud",
    clear: locale === "ar" ? "محادثة جديدة" : "New conversation",
  };

  const modalityConfig: Record<TutorModality, { en: string; ar: string; icon: React.ReactNode }> = {
    read: { en: "Read", ar: "قراءة", icon: <BookOpen className="w-3.5 h-3.5" /> },
    listen: { en: "Listen", ar: "استمع", icon: <Headphones className="w-3.5 h-3.5" /> },
    map: { en: "Map", ar: "خريطة", icon: <Map className="w-3.5 h-3.5" /> },
  };

  return (
    <div id="ai-tutor" tabIndex={-1} className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">{t.title}</p>
            <p className="text-xs text-muted-foreground">
              {profile.curriculum !== "none" ? profile.curriculum.replace("_", " ").toUpperCase() : locale === "ar" ? "عام" : "General"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="tts-toggle" className="text-xs text-muted-foreground">{t.tts}</Label>
            <Switch id="tts-toggle" checked={ttsEnabled} onCheckedChange={setTtsEnabled} aria-label={t.tts} />
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setMessages([]); setSocraticQuestion(null); }} aria-label={t.clear}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Modality switcher */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/30" role="tablist" aria-label={locale === "ar" ? "طريقة عرض الردود" : "Response display mode"}>
        {(["read", "listen", "map"] as TutorModality[]).map(m => (
          <button
            key={m}
            role="tab"
            aria-selected={modality === m}
            onClick={() => { setModality(m); if (m === "listen") setTtsEnabled(true); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${modality === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            {modalityConfig[m].icon}
            {locale === "ar" ? modalityConfig[m].ar : modalityConfig[m].en}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
          {locale === "ar" ? "اختر طريقة عرض الردود" : "Choose how replies appear"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-label={locale === "ar" ? "محادثة حكمة AI" : "Hikma AI conversation"} aria-live="polite">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 animate-arrive ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
            }`}>
              {msg.role === "assistant" ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === "assistant"
                ? "bg-card border border-border text-card-foreground rounded-tl-sm"
                : "bg-primary text-primary-foreground rounded-tr-sm"
            }`}>
              {msg.role === "assistant" ? (
                <>
                  {modality === "map" ? (
                    // Map mode: show key points as a simple list
                    <ul className="space-y-1.5 text-sm list-none">
                      {msg.content.split(/\n+/).filter(Boolean).map((line, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span>{line.replace(/^[-*•]\s*/, "")}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="prose-hikma prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2">
                      <Streamdown>{msg.content}</Streamdown>
                    </div>
                  )}
                  {(ttsEnabled || modality === "listen") && (
                    <button
                      onClick={() => speakText(msg.content)}
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      aria-label={locale === "ar" ? "قراءة هذا الرد" : "Read this reply"}
                    >
                      <Volume2 className="w-3 h-3" />
                      {locale === "ar" ? "استمع" : "Listen"}
                    </button>
                  )}
                </>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Socratic question bubble */}
        {socraticQuestion && !isStreaming && (
          <div className="flex gap-3 animate-arrive">
            <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                {locale === "ar" ? "سؤال للتحقق من الفهم" : "Comprehension check"}
              </p>
              <p className="text-sm text-amber-900 dark:text-amber-200">{socraticQuestion}</p>
              <button
                className="mt-2 text-xs text-amber-600 hover:text-amber-800 underline"
                onClick={() => { setInput(socraticQuestion); setSocraticQuestion(null); textareaRef.current?.focus(); }}
              >
                {locale === "ar" ? "أجب على هذا السؤال" : "Answer this question"}
              </button>
            </div>
          </div>
        )}
        {isSocraticLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center">
              <HelpCircle className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
            </div>
          </div>
        )}

        {isStreaming && streamingContent && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
              <Streamdown>{streamingContent}</Streamdown>
            </div>
          </div>
        )}
        {isStreaming && !streamingContent && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5 text-muted-foreground" aria-label={locale === "ar" ? "حكمة AI يفكر" : "Hikma AI is thinking"} role="status">
                <span className="typing-dot" aria-hidden="true" />
                <span className="typing-dot" aria-hidden="true" />
                <span className="typing-dot" aria-hidden="true" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            rows={1}
            className="flex-1 resize-none min-h-[2.5rem] max-h-32"
            aria-label={locale === "ar" ? "رسالتك لحكمة AI" : "Your message to Hikma AI"}
            disabled={isStreaming}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            aria-label={isRecording ? (locale === "ar" ? "إيقاف التسجيل" : "Stop recording") : (locale === "ar" ? "بدء التسجيل الصوتي" : "Start voice recording")}
            className={isRecording ? "text-destructive animate-pulse" : "text-muted-foreground"}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Button onClick={sendMessage} disabled={!input.trim() || isStreaming} aria-label={t.send} size="icon">
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {locale === "ar" ? "حكمة تتعلم معك — ليست بديلاً عن المعلم" : "Hikma learns with you — not a replacement for your teacher"}
        </p>
      </div>
    </div>
  );
}
import { useTTS } from "@/hooks/useTTS";
